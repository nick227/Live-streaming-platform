import { useCallback, useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { toast } from 'sonner'
import { io, type Socket } from 'socket.io-client'
import { mergeMessages, upsertMessage, toRoomEvent } from '../model/mergeMessages'
import type { ChatMessageDto, RoomEvent } from '../model/types'

const SERVER_URL = import.meta.env.VITE_SERVER_URL || import.meta.env.VITE_SOCKET_URL || 'http://localhost:3001'

type RoomGoal = {
  id: string
  title: string
  targetTokens: number
  currentTokens: number
}

export type RoomSocketCallbacks = {
  onTipCreated?: (payload: { tip: { amountTokens: number }; message: ChatMessageDto }) => void
  onUserRewarded?: (payload: { reward: { type: string } }) => void
  onGoalUpdated?: (payload: { roomId: string; goal: RoomGoal }) => void
  onPrivateRequestCreated?: (payload: unknown) => void
  onPrivateRequestStatusChanged?: (payload: { status: 'ACCEPTED' | 'DECLINED'; privateSessionId?: string }) => void
  onRoomEnded?: (payload: { roomId: string; reason?: string }) => void
  onMessagePinned?: (payload: { pinnedMessage?: ChatMessageDto | null }) => void
}

export function useRoomSocket(
  roomId: string | undefined,
  initialMessages: ChatMessageDto[],
  callbacks?: RoomSocketCallbacks,
) {
  const navigate = useNavigate()
  const [messages, setMessages] = useState<RoomEvent[]>([])
  const [viewerCount, setViewerCount] = useState<number | null>(null)
  const [pinnedMessage, setPinnedMessage] = useState<ChatMessageDto | null>(null)
  const [privateRequestStatus, setPrivateRequestStatus] = useState<'IDLE' | 'PENDING' | 'ACCEPTED' | 'DECLINED' | 'ACTIVE'>('IDLE')
  const [connected, setConnected] = useState(false)
  const [sending, setSending] = useState(false)
  const socketRef = useRef<Socket | null>(null)
  const callbacksRef = useRef(callbacks)
  callbacksRef.current = callbacks

  useEffect(() => {
    if (initialMessages.length === 0) return
    setMessages((prev) => mergeMessages(prev, initialMessages.map((m) => toRoomEvent(m))))
  }, [initialMessages])

  useEffect(() => {
    if (!roomId) return

    const socket = io(SERVER_URL, { withCredentials: true })
    socketRef.current = socket

    const onConnect = () => setConnected(true)
    const onDisconnect = () => setConnected(false)
    const onViewerCount = (data: { viewerCount: number }) => setViewerCount(data.viewerCount)
    const onChatMessage = (payload: { message: ChatMessageDto }) => {
      setMessages((prev) => upsertMessage(prev, toRoomEvent(payload.message)))
    }
    const onTipCreated = (payload: { tip: { amountTokens: number }; message: ChatMessageDto }) => {
      setMessages((prev) => upsertMessage(prev, toRoomEvent(payload.message, payload.tip.amountTokens)))
      callbacksRef.current?.onTipCreated?.(payload)
    }
    const onMessageDeleted = (payload: { message: ChatMessageDto }) => {
      const deletedAt = payload.message.deletedAt ?? new Date().toISOString()
      setMessages((prev) =>
        prev.map((event) =>
          event.message.id === payload.message.id
            ? { ...event, message: { ...event.message, deletedAt } }
            : event,
        ),
      )
      setPinnedMessage((prev) =>
        prev?.id === payload.message.id ? { ...prev, deletedAt } : prev,
      )
    }
    const onMessagePinned = (payload: { pinnedMessage?: ChatMessageDto | null }) => {
      setPinnedMessage(payload.pinnedMessage ?? null)
      callbacksRef.current?.onMessagePinned?.(payload)
    }
    const onUserRewarded = (payload: { reward: { type: string } }) => {
      callbacksRef.current?.onUserRewarded?.(payload)
    }
    const onGoalUpdated = (payload: { roomId: string; goal: RoomGoal }) => {
      callbacksRef.current?.onGoalUpdated?.(payload)
    }
    const onPrivateRequestCreated = (payload: unknown) => {
      callbacksRef.current?.onPrivateRequestCreated?.(payload)
    }
    const onPrivateRequestAccepted = (payload: { privateSession: { id: string } }) => {
      setPrivateRequestStatus('ACCEPTED')
      callbacksRef.current?.onPrivateRequestStatusChanged?.({ status: 'ACCEPTED', privateSessionId: payload.privateSession.id })
    }
    const onPrivateRequestDeclined = (payload: { privateSession?: { id: string } }) => {
      setPrivateRequestStatus('DECLINED')
      callbacksRef.current?.onPrivateRequestStatusChanged?.({ status: 'DECLINED', privateSessionId: payload.privateSession?.id })
    }
    const onPrivateSessionStarted = (payload: { privateSession: { id: string } }) => {
      setPrivateRequestStatus('ACTIVE')
      navigate(`/private-sessions/${payload.privateSession.id}/active`)
    }
    const onRoomEnded = (payload: { roomId: string; reason?: string }) => {
      callbacksRef.current?.onRoomEnded?.(payload)
    }
    const onUserKicked = () => {
      toast.error('You were removed from the room.')
      navigate('/')
    }
    const onUserBanned = () => {
      toast.error('You can no longer access this creator’s rooms.')
      navigate('/')
    }
    const onUserMuted = () => {
      toast.error('You have been muted.')
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
  }, [roomId, navigate])

  const sendMessage = useCallback(
    (body: string) =>
      new Promise<void>((resolve, reject) => {
        const trimmed = body.trim()
        if (!trimmed) {
          reject(new Error('Message cannot be empty'))
          return
        }
        if (!roomId || !socketRef.current) {
          reject(new Error('Not connected to room'))
          return
        }

        setSending(true)
        socketRef.current.emit(
          'chat:send',
          { roomId, body: trimmed },
          (result: { ok: boolean; message?: ChatMessageDto; error?: string }) => {
            setSending(false)
            if (result?.ok) {
              if (result.message) {
                setMessages((prev) => upsertMessage(prev, toRoomEvent(result.message!)))
              }
              resolve()
              return
            }
            reject(new Error(result?.error ?? 'Failed to send message'))
          },
        )
      }),
    [roomId],
  )

  const markMessageDeleted = useCallback((messageId: string) => {
    const deletedAt = new Date().toISOString()
    setMessages((prev) =>
      prev.map((event) =>
        event.message.id === messageId
          ? { ...event, message: { ...event.message, deletedAt } }
          : event,
      ),
    )
  }, [])

  return {
    messages,
    viewerCount,
    pinnedMessage,
    connected,
    sending,
    privateRequestStatus,
    setPrivateRequestStatus,
    sendMessage,
    markMessageDeleted,
  }
}
