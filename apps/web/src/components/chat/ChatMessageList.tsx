import { useEffect, useRef } from 'react'
import { Card, CardContent } from '@/components/ui/Card'
import { ChatMessageRow } from './ChatMessageRow'
import type { ChatMessageDto } from './types'

export function ChatMessageList({ messages }: { messages: ChatMessageDto[] }) {
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages.length, messages[messages.length - 1]?.id])

  return (
    <Card className="flex-1 min-h-0 overflow-hidden">
      <CardContent
        className="h-72 overflow-y-auto py-3 space-y-2"
        aria-live="polite"
        aria-relevant="additions"
      >
        {messages.length === 0 ? (
          <p className="text-xs text-muted-foreground text-center pt-8">No messages yet. Say hello!</p>
        ) : (
          messages.map((message) => <ChatMessageRow key={message.id} message={message} showTimestamp />)
        )}
        <div ref={bottomRef} />
      </CardContent>
    </Card>
  )
}
