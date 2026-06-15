import { httpError } from '../lib/errors'
import { db } from '@streamyolo/db'
import { normalizeLimit } from '../lib/pagination'

type ModerateUserInput = {
  targetUserId: string
  reason?: string
  durationSeconds?: number
}

type RewardUserInput = {
  targetUserId: string
  type: 'SHOUTOUT' | 'VIP' | 'UNVIP'
  note?: string
  durationSeconds?: number
}

export class ModerationService {
  async listActions(actorUserId: string, roomId: string, limit?: number) {
    const { room } = await this.assertCreatorOwnsRoom(actorUserId, roomId)
    const actions = await db.roomModerationAction.findMany({
      where: { roomId: room.id },
      orderBy: { createdAt: 'desc' },
      take: normalizeLimit(limit, 100, 50),
    })
    return actions.map(formatModerationAction)
  }

  async listBans(actorUserId: string) {
    const creator = await this.getCreator(actorUserId)
    const bans = await db.creatorUserBan.findMany({
      where: { creatorId: creator.id },
      orderBy: { createdAt: 'desc' },
    })
    return bans.map(formatCreatorUserBan)
  }

  async mute(actorUserId: string, roomId: string, input: ModerateUserInput) {
    const { room, creator } = await this.assertCreatorOwnsRoom(actorUserId, roomId)
    await this.assertTargetUser(input.targetUserId)
    const expiresAt = input.durationSeconds ? new Date(Date.now() + input.durationSeconds * 1000) : null
    return this.createAction({
      roomId: room.id,
      creatorId: creator.id,
      actorUserId,
      targetUserId: input.targetUserId,
      type: 'MUTE',
      reason: input.reason,
      durationSeconds: input.durationSeconds,
      expiresAt,
    })
  }

  async unmute(actorUserId: string, roomId: string, input: ModerateUserInput) {
    const { room, creator } = await this.assertCreatorOwnsRoom(actorUserId, roomId)
    await this.assertTargetUser(input.targetUserId)
    return this.createAction({
      roomId: room.id,
      creatorId: creator.id,
      actorUserId,
      targetUserId: input.targetUserId,
      type: 'UNMUTE',
      reason: input.reason,
    })
  }

  async kick(actorUserId: string, roomId: string, input: ModerateUserInput) {
    const { room, creator } = await this.assertCreatorOwnsRoom(actorUserId, roomId)
    await this.assertTargetUser(input.targetUserId)
    return this.createAction({
      roomId: room.id,
      creatorId: creator.id,
      actorUserId,
      targetUserId: input.targetUserId,
      type: 'KICK',
      reason: input.reason,
    })
  }

  async ban(actorUserId: string, roomId: string, input: ModerateUserInput) {
    const { room, creator } = await this.assertCreatorOwnsRoom(actorUserId, roomId)
    await this.assertTargetUser(input.targetUserId)
    const expiresAt = input.durationSeconds ? new Date(Date.now() + input.durationSeconds * 1000) : null

    const [ban, action] = await db.$transaction(async (tx: any) => {
      const ban = await tx.creatorUserBan.upsert({
        where: { creatorId_userId: { creatorId: creator.id, userId: input.targetUserId } },
        create: {
          creatorId: creator.id,
          userId: input.targetUserId,
          createdById: actorUserId,
          reason: input.reason,
          expiresAt,
        },
        update: {
          createdById: actorUserId,
          reason: input.reason,
          expiresAt,
        },
      })
      const action = await tx.roomModerationAction.create({
        data: {
          roomId: room.id,
          creatorId: creator.id,
          actorUserId,
          targetUserId: input.targetUserId,
          type: 'BAN',
          reason: input.reason,
          durationSeconds: input.durationSeconds,
          expiresAt,
        },
      })
      return [ban, action]
    })

    return { ban: formatCreatorUserBan(ban), action: formatModerationAction(action) }
  }

  async unban(actorUserId: string, roomId: string, input: ModerateUserInput) {
    const { room, creator } = await this.assertCreatorOwnsRoom(actorUserId, roomId)
    await db.creatorUserBan.deleteMany({ where: { creatorId: creator.id, userId: input.targetUserId } })
    const action = await this.createAction({
      roomId: room.id,
      creatorId: creator.id,
      actorUserId,
      targetUserId: input.targetUserId,
      type: 'UNBAN',
      reason: input.reason,
    })
    return action
  }

  async reward(actorUserId: string, roomId: string, input: RewardUserInput) {
    const { room, creator } = await this.assertCreatorOwnsRoom(actorUserId, roomId)
    await this.assertTargetUser(input.targetUserId)
    const expiresAt = input.durationSeconds ? new Date(Date.now() + input.durationSeconds * 1000) : null

    const [reward, action] = await db.$transaction(async (tx: any) => {
      const reward = await tx.creatorUserReward.create({
        data: {
          creatorId: creator.id,
          userId: input.targetUserId,
          createdById: actorUserId,
          type: input.type,
          note: input.note,
          expiresAt,
        },
      })
      const action = await tx.roomModerationAction.create({
        data: {
          roomId: room.id,
          creatorId: creator.id,
          actorUserId,
          targetUserId: input.targetUserId,
          type: 'REWARD',
          durationSeconds: input.durationSeconds,
          expiresAt,
          metadataJson: { rewardType: input.type, note: input.note },
        },
      })
      return [reward, action]
    })

    return { reward: formatCreatorUserReward(reward), action: formatModerationAction(action) }
  }

  async deleteMessage(actorUserId: string, roomId: string, messageId: string) {
    const { room, creator } = await this.assertCreatorOwnsRoom(actorUserId, roomId)
    const message = await db.chatMessage.findFirst({ where: { id: messageId, roomId } })
    if (!message) throw httpError(404, 'Message not found')

    const [updated, action] = await db.$transaction(async (tx: any) => {
      const updated = await tx.chatMessage.update({
        where: { id: messageId },
        data: { deletedAt: new Date() },
        include: { user: { select: { id: true, displayName: true, role: true, status: true, createdAt: true } } },
      })
      const action = await tx.roomModerationAction.create({
        data: {
          roomId: room.id,
          creatorId: creator.id,
          actorUserId,
          targetUserId: message.userId,
          targetMessageId: message.id,
          type: 'DELETE_MESSAGE',
        },
      })
      return [updated, action]
    })

    return { message: formatChatMessage(updated), action: formatModerationAction(action) }
  }

  async pinMessage(actorUserId: string, roomId: string, messageId: string) {
    const { room, creator } = await this.assertCreatorOwnsRoom(actorUserId, roomId)
    const message = await db.chatMessage.findFirst({ where: { id: messageId, roomId, deletedAt: null } })
    if (!message) throw httpError(404, 'Message not found')

    const [settings, action] = await db.$transaction(async (tx: any) => {
      const settings = await tx.roomChatSettings.upsert({
        where: { roomId: room.id },
        create: { roomId: room.id, pinnedMessageId: message.id },
        update: { pinnedMessageId: message.id },
        include: { pinnedMessage: { include: { user: { select: { id: true, displayName: true, role: true, status: true, createdAt: true } } } } },
      })
      const action = await tx.roomModerationAction.create({
        data: {
          roomId: room.id,
          creatorId: creator.id,
          actorUserId,
          targetUserId: message.userId,
          targetMessageId: message.id,
          type: 'PIN_MESSAGE',
        },
      })
      return [settings, action]
    })

    return { settings: formatRoomChatSettings(settings), action: formatModerationAction(action) }
  }

  async updateChatSettings(actorUserId: string, roomId: string, data: { slowModeSeconds?: number }) {
    const { room, creator } = await this.assertCreatorOwnsRoom(actorUserId, roomId)
    const [settings, action] = await db.$transaction(async (tx: any) => {
      const settings = await tx.roomChatSettings.upsert({
        where: { roomId: room.id },
        create: { roomId: room.id, slowModeSeconds: data.slowModeSeconds ?? 0 },
        update: { ...(data.slowModeSeconds !== undefined ? { slowModeSeconds: data.slowModeSeconds } : {}) },
        include: { pinnedMessage: { include: { user: { select: { id: true, displayName: true, role: true, status: true, createdAt: true } } } } },
      })
      const action = await tx.roomModerationAction.create({
        data: {
          roomId: room.id,
          creatorId: creator.id,
          actorUserId,
          type: 'SLOW_MODE',
          metadataJson: { slowModeSeconds: settings.slowModeSeconds },
        },
      })
      return [settings, action]
    })

    return { settings: formatRoomChatSettings(settings), action: formatModerationAction(action) }
  }

  async canJoinRoom(userId: string, roomId: string) {
    const room = await db.room.findUnique({ where: { id: roomId }, include: { creator: true } })
    if (!room) throw httpError(404, 'Room not found')
    if (room.creator.userId === userId) return { ok: true }

    const ban = await db.creatorUserBan.findFirst({
      where: {
        creatorId: room.creatorId,
        userId,
        OR: [{ expiresAt: null }, { expiresAt: { gt: new Date() } }],
      },
    })
    return ban ? { ok: false, error: 'You are banned from this creator' } : { ok: true }
  }

  async canSendChat(userId: string, roomId: string) {
    const join = await this.canJoinRoom(userId, roomId)
    if (!join.ok) return join

    const latest = await db.roomModerationAction.findFirst({
      where: {
        roomId,
        targetUserId: userId,
        type: { in: ['MUTE', 'UNMUTE'] },
      },
      orderBy: { createdAt: 'desc' },
    })
    if (latest?.type === 'MUTE' && (!latest.expiresAt || latest.expiresAt > new Date())) {
      return { ok: false, error: 'You are muted in this room' }
    }

    const settings = await db.roomChatSettings.findUnique({ where: { roomId } })
    if (settings?.slowModeSeconds && settings.slowModeSeconds > 0) {
      const latestMessage = await db.chatMessage.findFirst({
        where: { roomId, userId, deletedAt: null },
        orderBy: { createdAt: 'desc' },
      })
      if (latestMessage) {
        const remainingMs = settings.slowModeSeconds * 1000 - (Date.now() - latestMessage.createdAt.getTime())
        if (remainingMs > 0) {
          return { ok: false, error: `Slow mode is active. Try again in ${Math.ceil(remainingMs / 1000)}s` }
        }
      }
    }
    return { ok: true }
  }

  private async createAction(data: any) {
    const action = await db.roomModerationAction.create({ data })
    return formatModerationAction(action)
  }

  private async getCreator(userId: string) {
    const creator = await db.creatorProfile.findUnique({ where: { userId } })
    if (!creator) throw httpError(403, 'Creator profile required')
    return creator
  }

  private async assertCreatorOwnsRoom(userId: string, roomId: string) {
    const creator = await this.getCreator(userId)
    const room = await db.room.findUnique({ where: { id: roomId } })
    if (!room) throw httpError(404, 'Room not found')
    if (room.creatorId !== creator.id) throw httpError(403, 'Forbidden')
    return { room, creator }
  }

  private async assertTargetUser(userId: string) {
    const user = await db.user.findUnique({ where: { id: userId } })
    if (!user) throw httpError(404, 'Target user not found')
    return user
  }
}

export function formatModerationAction(action: any) {
  return {
    id: action.id,
    roomId: action.roomId,
    creatorId: action.creatorId,
    actorUserId: action.actorUserId,
    targetUserId: action.targetUserId ?? null,
    targetMessageId: action.targetMessageId ?? null,
    type: action.type,
    reason: action.reason ?? null,
    durationSeconds: action.durationSeconds ?? null,
    expiresAt: action.expiresAt?.toISOString() ?? null,
    metadata: action.metadataJson ?? null,
    createdAt: action.createdAt.toISOString(),
  }
}

export function formatCreatorUserBan(ban: any) {
  return {
    id: ban.id,
    creatorId: ban.creatorId,
    userId: ban.userId,
    createdById: ban.createdById,
    reason: ban.reason ?? null,
    expiresAt: ban.expiresAt?.toISOString() ?? null,
    createdAt: ban.createdAt.toISOString(),
  }
}

export function formatCreatorUserReward(reward: any) {
  return {
    id: reward.id,
    creatorId: reward.creatorId,
    userId: reward.userId,
    createdById: reward.createdById,
    type: reward.type,
    note: reward.note ?? null,
    expiresAt: reward.expiresAt?.toISOString() ?? null,
    createdAt: reward.createdAt.toISOString(),
  }
}

export function formatRoomChatSettings(settings: any) {
  return {
    roomId: settings.roomId,
    slowModeSeconds: settings.slowModeSeconds,
    pinnedMessage: settings.pinnedMessage ? formatChatMessage(settings.pinnedMessage) : null,
  }
}

export function formatChatMessage(message: any) {
  return {
    id: message.id,
    roomId: message.roomId,
    user: message.user
      ? {
          id: message.user.id,
          displayName: message.user.displayName,
          role: message.user.role,
          status: message.user.status,
          createdAt: message.user.createdAt.toISOString(),
        }
      : null,
    type: message.type,
    body: message.body,
    metadata: message.metadataJson ?? null,
    createdAt: message.createdAt.toISOString(),
    deletedAt: message.deletedAt?.toISOString() ?? null,
  }
}
