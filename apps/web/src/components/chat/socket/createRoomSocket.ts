import { io, type Socket } from 'socket.io-client'
import type { ChatMessageDto } from '../model/types'
import type { RoomGoal, RoomSocketActions } from './types'

const SERVER_URL = import.meta.env.VITE_SERVER_URL || import.meta.env.VITE_SOCKET_URL || 'http://localhost:3001'

export function attachRoomSocket(
  roomId: string,
  socketRef: { current: Socket | null },
  actions: RoomSocketActions,
): () => void {
  const socket = io(SERVER_URL, { withCredentials: true })
  socketRef.current = socket

  const onConnect = () => actions.setConnected(true)
  const onDisconnect = () => actions.setConnected(false)
  const onViewerCount = (data: { viewerCount: number }) => actions.setViewerCount(data.viewerCount)
  const onChatMessage = (payload: { message: ChatMessageDto }) => {
    actions.upsertMessage(payload.message)
  }
  const onTipCreated = (payload: { tip: { amountTokens: number }; message: ChatMessageDto }) => {
    actions.upsertMessage(payload.message, payload.tip.amountTokens)
    actions.getCallbacks()?.onTipCreated?.(payload)
  }
  const onMessageDeleted = (payload: { message: ChatMessageDto }) => {
    const deletedAt = payload.message.deletedAt ?? new Date().toISOString()
    actions.markMessageDeleted(payload.message.id, deletedAt)
  }
  const onMessagePinned = (payload: { pinnedMessage?: ChatMessageDto | null }) => {
    actions.setPinnedMessage(payload.pinnedMessage ?? null)
    actions.getCallbacks()?.onMessagePinned?.(payload)
  }
  const onUserRewarded = (payload: { reward: { type: string } }) => {
    actions.getCallbacks()?.onUserRewarded?.(payload)
  }
  const onGoalUpdated = (payload: { roomId: string; goal: RoomGoal }) => {
    actions.getCallbacks()?.onGoalUpdated?.(payload)
  }
  const onPrivateRequestCreated = (payload: unknown) => {
    actions.getCallbacks()?.onPrivateRequestCreated?.(payload)
  }
  const onPrivateRequestAccepted = (payload: { privateSession: { id: string } }) => {
    actions.setPrivateRequestStatus('ACCEPTED')
    actions.getCallbacks()?.onPrivateRequestStatusChanged?.({
      status: 'ACCEPTED',
      privateSessionId: payload.privateSession.id,
    })
  }
  const onPrivateRequestDeclined = (payload: { privateSession?: { id: string } }) => {
    actions.setPrivateRequestStatus('DECLINED')
    actions.getCallbacks()?.onPrivateRequestStatusChanged?.({
      status: 'DECLINED',
      privateSessionId: payload.privateSession?.id,
    })
  }
  const onPrivateSessionStarted = (payload: { privateSession: { id: string } }) => {
    actions.setPrivateRequestStatus('ACTIVE')
    actions.navigate(`/private-sessions/${payload.privateSession.id}/active`)
  }
  const onRoomEnded = (payload: { roomId: string; reason?: string }) => {
    actions.getCallbacks()?.onRoomEnded?.(payload)
  }
  const onUserKicked = () => {
    actions.toastError('You were removed from the room.')
    actions.navigate('/')
  }
  const onUserBanned = () => {
    actions.toastError('You can no longer access this creator’s rooms.')
    actions.navigate('/')
  }
  const onUserMuted = () => {
    actions.toastError('You have been muted.')
  }

  socket.on('connect', onConnect)
  socket.on('disconnect', onDisconnect)
  socket.emit('room:join', { roomId })
  socket.on('room:viewer_count', onViewerCount)
  socket.on('chat:message', onChatMessage)
  socket.on('tip:created', onTipCreated)
  socket.on('room:message_deleted', onMessageDeleted)
  socket.on('room:message_pinned', onMessagePinned)
  socket.on('room:user_rewarded', onUserRewarded)
  socket.on('goal:updated', onGoalUpdated)
  socket.on('private:request_created', onPrivateRequestCreated)
  socket.on('private:request_accepted', onPrivateRequestAccepted)
  socket.on('private:request_declined', onPrivateRequestDeclined)
  socket.on('private:session_started', onPrivateSessionStarted)
  socket.on('room:ended', onRoomEnded)
  socket.on('room:user_kicked', onUserKicked)
  socket.on('room:user_banned', onUserBanned)
  socket.on('room:user_muted', onUserMuted)

  return () => {
    socket.emit('room:leave', { roomId })
    socket.off('connect', onConnect)
    socket.off('disconnect', onDisconnect)
    socket.off('room:viewer_count', onViewerCount)
    socket.off('chat:message', onChatMessage)
    socket.off('tip:created', onTipCreated)
    socket.off('room:message_deleted', onMessageDeleted)
    socket.off('room:message_pinned', onMessagePinned)
    socket.off('room:user_rewarded', onUserRewarded)
    socket.off('goal:updated', onGoalUpdated)
    socket.off('private:request_created', onPrivateRequestCreated)
    socket.off('private:request_accepted', onPrivateRequestAccepted)
    socket.off('private:request_declined', onPrivateRequestDeclined)
    socket.off('private:session_started', onPrivateSessionStarted)
    socket.off('room:ended', onRoomEnded)
    socket.off('room:user_kicked', onUserKicked)
    socket.off('room:user_banned', onUserBanned)
    socket.off('room:user_muted', onUserMuted)
    socket.disconnect()
    socketRef.current = null
  }
}

export function emitChatMessage(
  socket: Socket,
  roomId: string,
  body: string,
  onResult: (result: { ok: boolean; message?: ChatMessageDto; error?: string }) => void,
) {
  socket.emit('chat:send', { roomId, body }, onResult)
}
