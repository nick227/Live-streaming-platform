import { useCallback, useEffect, useRef, useState } from 'react'
import { io, type Socket } from 'socket.io-client'
import { mergeMessages, upsertMessage } from './mergeMessages'
import type { ChatMessageDto } from './types'

const SERVER_URL = import.meta.env.VITE_SERVER_URL || import.meta.env.VITE_SOCKET_URL || 'http://localhost:3001'

export type RoomSocketCallbacks = {
  onTipCreated?: (payload: { tip: { amountTokens: number }; message: ChatMessageDto }) => void
  onUserRewarded?: (payload: { reward: { type: string } }) => void
}

export function useRoomSocket(
  roomId: string | undefined,
  initialMessages: ChatMessageDto[],
  callbacks?: RoomSocketCallbacks,
) {
  const [messages, setMessages] = useState<ChatMessageDto[]>([])
  const [viewerCount, setViewerCount] = useState<number | null>(null)
  const [connected, setConnected] = useState(false)
  const [sending, setSending] = useState(false)
  const socketRef = useRef<Socket | null>(null)
  const callbacksRef = useRef(callbacks)
  callbacksRef.current = callbacks

  useEffect(() => {
    if (initialMessages.length === 0) return
    setMessages((prev) => mergeMessages(prev, initialMessages))
  }, [initialMessages])

  useEffect(() => {
    if (!roomId) return

    const socket = io(SERVER_URL, { withCredentials: true })
    socketRef.current = socket

    const onConnect = () => setConnected(true)
    const onDisconnect = () => setConnected(false)
    const onViewerCount = (data: { viewerCount: number }) => setViewerCount(data.viewerCount)
    const onChatMessage = (payload: { message: ChatMessageDto }) => {
      setMessages((prev) => upsertMessage(prev, payload.message))
    }
    const onTipCreated = (payload: { tip: { amountTokens: number }; message: ChatMessageDto }) => {
      setMessages((prev) => upsertMessage(prev, payload.message))
      callbacksRef.current?.onTipCreated?.(payload)
    }
    const onMessageDeleted = (payload: { message: ChatMessageDto }) => {
      const deletedAt = payload.message.deletedAt ?? new Date().toISOString()
      setMessages((prev) => upsertMessage(prev, { ...payload.message, deletedAt }))
    }
    const onUserRewarded = (payload: { reward: { type: string } }) => {
      callbacksRef.current?.onUserRewarded?.(payload)
    }

    socket.on('connect', onConnect)
    socket.on('disconnect', onDisconnect)
    socket.emit('room:join', { roomId })
    socket.on('room:viewer_count', onViewerCount)
    socket.on('chat:message', onChatMessage)
    socket.on('tip:created', onTipCreated)
    socket.on('room:message_deleted', onMessageDeleted)
    socket.on('room:user_rewarded', onUserRewarded)

    return () => {
      socket.emit('room:leave', { roomId })
      socket.off('connect', onConnect)
      socket.off('disconnect', onDisconnect)
      socket.off('room:viewer_count', onViewerCount)
      socket.off('chat:message', onChatMessage)
      socket.off('tip:created', onTipCreated)
      socket.off('room:message_deleted', onMessageDeleted)
      socket.off('room:user_rewarded', onUserRewarded)
      socket.disconnect()
      socketRef.current = null
    }
  }, [roomId])

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
                setMessages((prev) => upsertMessage(prev, result.message!))
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
      prev.map((message) => (message.id === messageId ? { ...message, deletedAt } : message)),
    )
  }, [])

  return { messages, viewerCount, connected, sending, sendMessage, markMessageDeleted }
}
