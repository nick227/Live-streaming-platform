import { db } from '@streamyolo/db'

export class TipService {
  async createTip(
    viewerId: string,
    roomId: string,
    data: {
      amountTokens: number
      requestType: 'GENERAL' | 'MENU_ITEM' | 'CUSTOM' | 'GOAL'
      menuItemId?: string
      roomMenuItemId?: string
      requestText?: string
    },
  ) {
    const room = await db.room.findUnique({
      where: { id: roomId },
      include: { creator: true },
    })
    if (!room) throw { statusCode: 404, message: 'Room not found' }
    if (room.status !== 'LIVE') throw { statusCode: 400, message: 'Room is not live' }

    const [tip, viewerWallet] = await db.$transaction(async (tx: any) => {
      const wallet = await tx.wallet.findUnique({ where: { userId: viewerId } })
      if (!wallet) throw { statusCode: 400, message: 'Wallet not found' }
      if (wallet.tokenBalance < data.amountTokens) {
        throw { statusCode: 400, message: 'Insufficient tokens' }
      }

      const tip = await tx.tip.create({
        data: {
          roomId,
          fromUserId: viewerId,
          toCreatorId: room.creator.id,
          amountTokens: data.amountTokens,
          requestType: data.requestType,
          menuItemId: data.menuItemId,
          roomMenuItemId: data.roomMenuItemId,
          requestText: data.requestText,
          status: 'SENT',
        },
      })

      const newViewerBalance = wallet.tokenBalance - data.amountTokens
      const updatedWallet = await tx.wallet.update({
        where: { userId: viewerId },
        data: {
          tokenBalance: { decrement: data.amountTokens },
          lifetimeSpentTokens: { increment: data.amountTokens },
        },
      })

      await tx.ledgerEntry.create({
        data: {
          walletId: wallet.id,
          userId: viewerId,
          type: 'TIP_SENT',
          amountTokens: -data.amountTokens,
          balanceAfter: newViewerBalance,
          roomId,
          tipId: tip.id,
          description: `Tip sent in room ${roomId}`,
        },
      })

      const creatorWallet = await tx.wallet.upsert({
        where: { userId: room.creator.userId },
        create: { userId: room.creator.userId },
        update: { tokenBalance: { increment: data.amountTokens } },
      })

      await tx.ledgerEntry.create({
        data: {
          walletId: creatorWallet.id,
          userId: room.creator.userId,
          type: 'TIP_RECEIVED',
          amountTokens: data.amountTokens,
          balanceAfter: creatorWallet.tokenBalance + data.amountTokens,
          roomId,
          tipId: tip.id,
          description: `Tip received in room ${roomId}`,
        },
      })

      // Credit goal if applicable
      await tx.roomGoal.updateMany({
        where: { roomId },
        data: { currentTokens: { increment: data.amountTokens } },
      })

      return [tip, updatedWallet]
    })

    return {
      tip: formatTip(tip),
      wallet: {
        tokenBalance: viewerWallet.tokenBalance,
        reservedTokenBalance: viewerWallet.reservedTokenBalance,
        lifetimePurchasedTokens: viewerWallet.lifetimePurchasedTokens,
        lifetimeSpentTokens: viewerWallet.lifetimeSpentTokens,
      },
    }
  }

  async acknowledgeTip(creatorUserId: string, tipId: string) {
    const tip = await db.tip.findUnique({ where: { id: tipId }, include: { toCreator: true } })
    if (!tip) throw { statusCode: 404, message: 'Tip not found' }
    if (tip.toCreator.userId !== creatorUserId) throw { statusCode: 403, message: 'Forbidden' }

    const updated = await db.tip.update({
      where: { id: tipId },
      data: { status: 'ACKNOWLEDGED' },
    })
    return formatTip(updated)
  }

  async completeTip(creatorUserId: string, tipId: string) {
    const tip = await db.tip.findUnique({ where: { id: tipId }, include: { toCreator: true } })
    if (!tip) throw { statusCode: 404, message: 'Tip not found' }
    if (tip.toCreator.userId !== creatorUserId) throw { statusCode: 403, message: 'Forbidden' }

    const updated = await db.tip.update({
      where: { id: tipId },
      data: { status: 'COMPLETED' },
    })
    return formatTip(updated)
  }
}

export function formatTip(tip: any) {
  return {
    id: tip.id,
    roomId: tip.roomId,
    fromUserId: tip.fromUserId,
    toCreatorId: tip.toCreatorId,
    amountTokens: tip.amountTokens,
    requestType: tip.requestType,
    menuItemId: tip.menuItemId ?? null,
    roomMenuItemId: tip.roomMenuItemId ?? null,
    requestText: tip.requestText ?? null,
    status: tip.status,
    createdAt: tip.createdAt.toISOString(),
    updatedAt: tip.updatedAt.toISOString(),
  }
}
