import { db } from '@streamyolo/db'
import { nanoid } from 'nanoid'
import { LiveKitService } from './LiveKitService'

const liveKit = new LiveKitService()

export class PrivateSessionService {
  async request(viewerId: string, roomId: string, _data?: { message?: string }) {
    const room = await db.room.findUnique({
      where: { id: roomId },
      include: { creator: true },
    })
    if (!room) throw { statusCode: 404, message: 'Room not found' }
    if (room.status !== 'LIVE') throw { statusCode: 400, message: 'Room is not live' }

    const creator = room.creator
    const ratePerMin = creator.privateRateTokensPerMinute
    const minMinutes = creator.minPrivateMinutes
    const minCost = ratePerMin * minMinutes

    const wallet = await db.wallet.findUnique({ where: { userId: viewerId } })
    if (!wallet) throw { statusCode: 400, message: 'Wallet not found' }
    if (wallet.tokenBalance < minCost) {
      throw { statusCode: 400, message: `Insufficient tokens — minimum cost is ${minCost}` }
    }

    // Check no active session already
    const activeSession = await db.privateSession.findFirst({
      where: {
        viewerId,
        status: { in: ['REQUESTED', 'ACCEPTED', 'ACTIVE'] },
      },
    })
    if (activeSession) throw { statusCode: 400, message: 'You already have an active private session' }

    const [session, viewerWallet] = await db.$transaction(async (tx: any) => {
      const session = await tx.privateSession.create({
        data: {
          creatorId: creator.id,
          viewerId,
          publicRoomId: roomId,
          status: 'REQUESTED',
          rateTokensPerMinute: ratePerMin,
          minMinutes,
          viewerCamRequired: creator.privateViewerCamRequired,
          screenShareAllowed: creator.privateScreenShareAllowed,
          rulesText: creator.privateRulesText,
          reservedTokens: minCost,
        },
      })

      const updatedWallet = await tx.wallet.update({
        where: { userId: viewerId },
        data: {
          tokenBalance: { decrement: minCost },
          reservedTokenBalance: { increment: minCost },
        },
      })

      await tx.ledgerEntry.create({
        data: {
          walletId: wallet.id,
          userId: viewerId,
          type: 'PRIVATE_SESSION_HOLD',
          amountTokens: -minCost,
          balanceAfter: updatedWallet.tokenBalance,
          privateSessionId: session.id,
          description: 'Private session hold',
        },
      })

      return [session, updatedWallet]
    })

    return {
      privateSession: formatSession(session),
      wallet: {
        tokenBalance: viewerWallet.tokenBalance,
        reservedTokenBalance: viewerWallet.reservedTokenBalance,
        lifetimePurchasedTokens: viewerWallet.lifetimePurchasedTokens,
        lifetimeSpentTokens: viewerWallet.lifetimeSpentTokens,
      },
    }
  }

  async accept(creatorUserId: string, sessionId: string) {
    const session = await this._assertCreatorOwnsSession(creatorUserId, sessionId)
    if (session.status !== 'REQUESTED') {
      throw { statusCode: 400, message: 'Session is not in REQUESTED state' }
    }

    const updated = await db.privateSession.update({
      where: { id: sessionId },
      data: { status: 'ACCEPTED', acceptedAt: new Date() },
    })

    return formatSession(updated)
  }

  async decline(creatorUserId: string, sessionId: string, data?: { reason?: string }) {
    const session = await this._assertCreatorOwnsSession(creatorUserId, sessionId)

    const viewerWallet = await db.wallet.findUniqueOrThrow({ where: { userId: session.viewerId } })

    const updated = await db.$transaction(async (tx: any) => {
      const s = await tx.privateSession.update({
        where: { id: sessionId },
        data: { status: 'DECLINED', declineReason: data?.reason },
      })

      // Release hold
      const newWallet = await tx.wallet.update({
        where: { userId: session.viewerId },
        data: {
          tokenBalance: { increment: session.reservedTokens },
          reservedTokenBalance: { decrement: session.reservedTokens },
        },
      })

      await tx.ledgerEntry.create({
        data: {
          walletId: viewerWallet.id,
          userId: session.viewerId,
          type: 'PRIVATE_SESSION_RELEASE',
          amountTokens: session.reservedTokens,
          balanceAfter: newWallet.tokenBalance,
          privateSessionId: sessionId,
          description: 'Private session hold released (declined)',
        },
      })

      return s
    })

    return formatSession(updated)
  }

  async start(userId: string, sessionId: string) {
    const session = await db.privateSession.findUnique({
      where: { id: sessionId },
      include: { creator: true },
    })
    if (!session) throw { statusCode: 404, message: 'Session not found' }
    if (session.status !== 'ACCEPTED') {
      throw { statusCode: 400, message: 'Session must be ACCEPTED before starting' }
    }

    const isCreator = session.creator.userId === userId
    const isViewer = session.viewerId === userId
    if (!isCreator && !isViewer) throw { statusCode: 403, message: 'Forbidden' }

    const livekitRoomName = `private-${nanoid(16)}`
    try {
      await liveKit.createRoom(livekitRoomName)
    } catch (err) {
      throw { statusCode: 502, message: 'Failed to create video room — please try again' }
    }

    let updated
    try {
      updated = await db.privateSession.update({
        where: { id: sessionId },
        data: { status: 'ACTIVE', startedAt: new Date(), livekitRoomName },
      })
    } catch (err) {
      await liveKit.deleteRoom(livekitRoomName)
      throw err
    }

    const at = await liveKit.getToken(userId, {
      appRoomType: 'PRIVATE_SESSION',
      appRoomId: sessionId,
    })

    return {
      privateSession: formatSession(updated),
      livekitToken: at.token,
      livekitUrl: at.livekitUrl,
    }
  }

  async end(userId: string, sessionId: string) {
    const session = await db.privateSession.findUnique({
      where: { id: sessionId },
      include: { creator: true },
    })
    if (!session) throw { statusCode: 404, message: 'Session not found' }

    const isCreator = session.creator.userId === userId
    const isViewer = session.viewerId === userId
    if (!isCreator && !isViewer) throw { statusCode: 403, message: 'Forbidden' }

    if (!session.startedAt) throw { statusCode: 400, message: 'Session not started' }

    const elapsedMs = Date.now() - session.startedAt.getTime()
    const elapsedMinutes = Math.ceil(elapsedMs / 60000)
    const actualMinutes = Math.max(elapsedMinutes, session.minMinutes)
    const capturedTokens = actualMinutes * session.rateTokensPerMinute
    const capped = Math.min(capturedTokens, session.reservedTokens)
    const released = session.reservedTokens - capped

    const viewerWallet = await db.wallet.findUniqueOrThrow({ where: { userId: session.viewerId } })
    const creatorWallet = await db.wallet.upsert({
      where: { userId: session.creator.userId },
      create: { userId: session.creator.userId },
      update: {},
    })

    const [updated, finalViewerWallet] = await db.$transaction(async (tx: any) => {
      const s = await tx.privateSession.update({
        where: { id: sessionId },
        data: {
          status: 'ENDED',
          endedAt: new Date(),
          capturedTokens: capped,
          releasedTokens: released,
        },
      })

      const newViewerWallet = await tx.wallet.update({
        where: { userId: session.viewerId },
        data: {
          reservedTokenBalance: { decrement: session.reservedTokens },
          tokenBalance: { increment: released },
          lifetimeSpentTokens: { increment: capped },
        },
      })

      if (capped > 0) {
        await tx.ledgerEntry.create({
          data: {
            walletId: viewerWallet.id,
            userId: session.viewerId,
            type: 'PRIVATE_SESSION_CAPTURE',
            amountTokens: -capped,
            balanceAfter: newViewerWallet.tokenBalance,
            privateSessionId: sessionId,
            description: `Private session — ${actualMinutes} min captured`,
          },
        })
      }

      if (released > 0) {
        await tx.ledgerEntry.create({
          data: {
            walletId: viewerWallet.id,
            userId: session.viewerId,
            type: 'PRIVATE_SESSION_RELEASE',
            amountTokens: released,
            balanceAfter: newViewerWallet.tokenBalance,
            privateSessionId: sessionId,
            description: 'Private session hold released (partial)',
          },
        })
      }

      if (capped > 0) {
        const newCreatorBalance = creatorWallet.tokenBalance + capped
        await tx.wallet.update({
          where: { userId: session.creator.userId },
          data: { tokenBalance: { increment: capped } },
        })

        await tx.ledgerEntry.create({
          data: {
            walletId: creatorWallet.id,
            userId: session.creator.userId,
            type: 'PRIVATE_SESSION_CAPTURE',
            amountTokens: capped,
            balanceAfter: newCreatorBalance,
            privateSessionId: sessionId,
            description: 'Private session earnings',
          },
        })
      }

      return [s, newViewerWallet]
    })

    if (session.livekitRoomName) {
      await liveKit.deleteRoom(session.livekitRoomName)
    }

    return {
      privateSession: formatSession(updated),
      wallet: {
        tokenBalance: finalViewerWallet.tokenBalance,
        reservedTokenBalance: finalViewerWallet.reservedTokenBalance,
        lifetimePurchasedTokens: finalViewerWallet.lifetimePurchasedTokens,
        lifetimeSpentTokens: finalViewerWallet.lifetimeSpentTokens,
      },
    }
  }

  static async expireStaleRequested(ttlMs = 5 * 60 * 1000) {
    const cutoff = new Date(Date.now() - ttlMs)
    const stale = await db.privateSession.findMany({
      where: { status: 'REQUESTED', requestedAt: { lt: cutoff } },
      include: { viewer: { select: { wallet: true } } },
    })

    for (const session of stale) {
      const viewerWallet = session.viewer.wallet
      if (!viewerWallet || session.reservedTokens <= 0) continue

      try {
        await db.$transaction(async (tx: any) => {
          await tx.privateSession.update({
            where: { id: session.id },
            data: { status: 'EXPIRED' },
          })

          const newWallet = await tx.wallet.update({
            where: { userId: session.viewerId },
            data: {
              tokenBalance: { increment: session.reservedTokens },
              reservedTokenBalance: { decrement: session.reservedTokens },
            },
          })

          await tx.ledgerEntry.create({
            data: {
              walletId: viewerWallet.id,
              userId: session.viewerId,
              type: 'PRIVATE_SESSION_RELEASE',
              amountTokens: session.reservedTokens,
              balanceAfter: newWallet.tokenBalance,
              privateSessionId: session.id,
              description: 'Private session hold released (expired)',
            },
          })
        })
      } catch (err) {
        console.error(`[PrivateSessionService] Failed to expire session ${session.id}:`, err)
      }
    }
  }

  private async _assertCreatorOwnsSession(creatorUserId: string, sessionId: string) {
    const session = await db.privateSession.findUnique({
      where: { id: sessionId },
      include: { creator: true },
    })
    if (!session) throw { statusCode: 404, message: 'Session not found' }
    if (session.creator.userId !== creatorUserId) throw { statusCode: 403, message: 'Forbidden' }
    return session
  }
}

export function formatSession(session: any) {
  return {
    id: session.id,
    creatorId: session.creatorId,
    viewerId: session.viewerId,
    publicRoomId: session.publicRoomId,
    status: session.status,
    rateTokensPerMinute: session.rateTokensPerMinute,
    minMinutes: session.minMinutes,
    viewerCamRequired: session.viewerCamRequired,
    screenShareAllowed: session.screenShareAllowed,
    rulesText: session.rulesText ?? null,
    reservedTokens: session.reservedTokens,
    capturedTokens: session.capturedTokens,
    releasedTokens: session.releasedTokens,
    livekitRoomName: session.livekitRoomName ?? null,
    requestedAt: session.requestedAt.toISOString(),
    acceptedAt: session.acceptedAt?.toISOString() ?? null,
    startedAt: session.startedAt?.toISOString() ?? null,
    endedAt: session.endedAt?.toISOString() ?? null,
    declineReason: session.declineReason ?? null,
    createdAt: session.createdAt.toISOString(),
    updatedAt: session.updatedAt.toISOString(),
  }
}
