import { useState } from 'react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'

export function ChatComposer({
  canChat,
  connected,
  sending,
  onSend,
}: {
  canChat: boolean
  connected: boolean
  sending: boolean
  onSend: (body: string) => Promise<void>
}) {
  const [draft, setDraft] = useState('')

  const disabled = !canChat || !connected || sending
  const placeholder = !canChat
    ? 'Chat is unavailable'
    : !connected
      ? 'Connecting to chat...'
      : 'Send a message...'

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault()
    const body = draft.trim()
    if (!body || disabled) return

    try {
      await onSend(body)
      setDraft('')
    } catch (error) {
      toast.error((error as Error).message || 'Failed to send message')
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex gap-2">
      <Input
        value={draft}
        onChange={(event) => setDraft(event.target.value)}
        placeholder={placeholder}
        disabled={disabled}
        voice
        maxLength={500}
        className="flex-1"
        aria-label="Chat message"
      />
      <Button type="submit" size="sm" disabled={disabled || !draft.trim()} loading={sending}>
        Send
      </Button>
    </form>
  )
}
