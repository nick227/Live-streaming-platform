import { useCallback, useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { toast } from 'sonner'
import type { Socket } from 'socket.io-client'
import { mergeMessages, upsertMessage, toRoomEvent } from '../model/mergeMessages'
import type { ChatMessageDto, RoomEvent } from '../model/types'
import { attachRoomSocket, emitChatMessage } from '../socket/createRoomSocket'
import type { PrivateRequestStatus, RoomSocketCallbacks } from '../socket/types'

export type { RoomSocketCallbacks } from '../socket/types'

function applyVipReward(prev: Set<string>, reward: { type: string; userId: string }) {
  const next = new Set(prev)
  if (reward.type === 'VIP') next.add(reward.userId)
  else if (reward.type === 'UNVIP') next.delete(reward.userId)
  return next
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
  const [vipUserIds, setVipUserIds] = useState<Set<string>>(() => new Set())
  const [privateRequestStatus, setPrivateRequestStatus] = useState<PrivateRequestStatus>('IDLE')
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

    return attachRoomSocket(roomId, socketRef, {
      setConnected,
      setViewerCount,
      setPinnedMessage,
      setPrivateRequestStatus,
      upsertMessage: (message, amountTokens) => {
        setMessages((prev) => upsertMessage(prev, toRoomEvent(message, amountTokens)))
      },
      markMessageDeleted: (messageId, deletedAt) => {
        setMessages((prev) =>
          prev.map((event) =>
            event.message.id === messageId
              ? { ...event, message: { ...event.message, deletedAt } }
              : event,
          ),
        )
        setPinnedMessage((prev) =>
          prev?.id === messageId ? { ...prev, deletedAt } : prev,
        )
      },
      onUserRewarded: (payload) => {
        setVipUserIds((prev) => applyVipReward(prev, payload.reward))
      },
      navigate,
      toastError: (message) => toast.error(message),
      getCallbacks: () => callbacksRef.current,
    })
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
        emitChatMessage(socketRef.current, roomId, trimmed, (result) => {
          setSending(false)
          if (result?.ok) {
            if (result.message) {
              setMessages((prev) => upsertMessage(prev, toRoomEvent(result.message!)))
            }
            resolve()
            return
          }
          reject(new Error(result?.error ?? 'Failed to send message'))
        })
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
    vipUserIds,
    connected,
    sending,
    privateRequestStatus,
    setPrivateRequestStatus,
    sendMessage,
    markMessageDeleted,
  }
}
