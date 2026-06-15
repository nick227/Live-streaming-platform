import { ModerationService } from '../services/ModerationService'
import { db } from '@streamyolo/db'

const moderationService = new ModerationService()

export async function listRoomModerationActions(request: any, reply: any) {
  const actions = await moderationService.listActions(request.user.id, request.params.roomId, request.query?.limit)
  return reply.send({ data: actions })
}

export async function listCreatorBans(request: any, reply: any) {
  const bans = await moderationService.listBans(request.user.id)
  return reply.send({ data: bans })
}

export async function muteRoomUser(request: any, reply: any) {
  const action = await moderationService.mute(request.user.id, request.params.roomId, request.body)
  emit(request, request.params.roomId, 'room:user_muted', { action })
  return reply.send({ data: { action } })
}

export async function unmuteRoomUser(request: any, reply: any) {
  const action = await moderationService.unmute(request.user.id, request.params.roomId, request.body)
  emit(request, request.params.roomId, 'room:user_unmuted', { action })
  return reply.send({ data: { action } })
}

export async function kickRoomUser(request: any, reply: any) {
  const action = await moderationService.kick(request.user.id, request.params.roomId, request.body)
  emit(request, request.params.roomId, 'room:user_kicked', { action })
  kickTargetSockets(request, request.params.roomId, request.body?.targetUserId)
  return reply.send({ data: { action } })
}

export async function banCreatorUser(request: any, reply: any) {
  const result = await moderationService.ban(request.user.id, request.params.roomId, request.body)
  emit(request, request.params.roomId, 'room:user_banned', result)
  kickTargetSockets(request, request.params.roomId, request.body?.targetUserId)
  return reply.send({ data: result })
}

export async function unbanCreatorUser(request: any, reply: any) {
  const action = await moderationService.unban(request.user.id, request.params.roomId, request.body)
  emit(request, request.params.roomId, 'room:user_unbanned', { action })
  return reply.send({ data: { action } })
}

export async function rewardRoomUser(request: any, reply: any) {
  const result = await moderationService.reward(request.user.id, request.params.roomId, request.body)
  emit(request, request.params.roomId, 'room:user_rewarded', result)
  const targetName = await getUserDisplayName(request.body?.targetUserId)
  const rewardType = request.body?.type
  const text =
    rewardType === 'VIP'
      ? `${targetName} is now VIP`
      : rewardType === 'UNVIP'
        ? `${targetName} is no longer VIP`
        : `${targetName} got a shoutout`
  await emitRoomEvent(request, request.params.roomId, text, { moderationActionId: result.action.id, rewardType })
  return reply.send({ data: result })
}

export async function deleteRoomMessage(request: any, reply: any) {
  const result = await moderationService.deleteMessage(request.user.id, request.params.roomId, request.params.messageId)
  emit(request, request.params.roomId, 'room:message_deleted', result)
  await emitRoomEvent(request, request.params.roomId, 'Message removed by creator', {
    moderationActionId: result.action.id,
    messageId: request.params.messageId,
  })
  return reply.send({ data: result })
}

export async function pinRoomMessage(request: any, reply: any) {
  const result = await moderationService.pinMessage(request.user.id, request.params.roomId, request.params.messageId)
  emit(request, request.params.roomId, 'room:message_pinned', result)
  await emitRoomEvent(request, request.params.roomId, 'Creator pinned a message', {
    moderationActionId: result.action.id,
    messageId: request.params.messageId,
  })
  return reply.send({ data: result })
}

export async function updateRoomChatSettings(request: any, reply: any) {
  const result = await moderationService.updateChatSettings(request.user.id, request.params.roomId, request.body ?? {})
  emit(request, request.params.roomId, 'room:chat_settings_updated', result)
  const slowModeSeconds = result.settings.slowModeSeconds
  await emitRoomEvent(
    request,
    request.params.roomId,
    slowModeSeconds > 0 ? `Chat is now in ${slowModeSeconds}s slow mode` : 'Chat slow mode is off',
    { moderationActionId: result.action.id, slowModeSeconds },
  )
  return reply.send({ data: result })
}

function emit(request: any, roomId: string, event: string, payload: unknown) {
  const io = request.server?.io
  if (io) io.to(`room:${roomId}`).emit(event, payload)
}

async function emitRoomEvent(request: any, roomId: string, body: string, metadata: Record<string, unknown>) {
  const message = await db.chatMessage.create({
    data: {
      roomId,
      type: 'MODERATION_EVENT',
      body,
      metadataJson: metadata as any,
    },
  })
  emit(request, roomId, 'chat:message', {
    message: {
      id: message.id,
      roomId: message.roomId,
      type: message.type,
      body: message.body,
      metadata: message.metadataJson ?? undefined,
      createdAt: message.createdAt.toISOString(),
    },
  })
}

async function getUserDisplayName(userId?: string) {
  if (!userId) return 'Viewer'
  const user = await db.user.findUnique({
    where: { id: userId },
    select: { displayName: true },
  })
  return user?.displayName ?? 'Viewer'
}

async function kickTargetSockets(request: any, roomId: string, targetUserId?: string) {
  if (!targetUserId) return
  const io = request.server?.io
  if (!io) return

  const sockets = await io.in(`room:${roomId}`).fetchSockets()
  for (const socket of sockets) {
    if ((socket as any).data?.userId === targetUserId || (socket as any).userId === targetUserId) {
      socket.leave(`room:${roomId}`)
      socket.emit('room:removed', { roomId })
    }
  }
}
