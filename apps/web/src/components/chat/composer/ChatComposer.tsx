import { useState } from 'react'
import { toast } from 'sonner'
import { Send } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { cn } from '@/lib/utils'

const MAX_LENGTH = 500

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
      ? 'Connecting to chat…'
      : 'Send a message…'

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

  const showCounter = draft.length > 0
  const nearLimit = draft.length > MAX_LENGTH * 0.85

  return (
    <form
      onSubmit={handleSubmit}
      className="shrink-0 rounded-lg border border-border bg-muted/20 p-2 space-y-1.5"
    >
      <div className="flex gap-2">
        <Input
          value={draft}
          onChange={(event) => setDraft(event.target.value)}
          placeholder={placeholder}
          disabled={disabled}
          voice
          maxLength={MAX_LENGTH}
          className="flex-1 bg-background"
          aria-label="Chat message"
        />
        <Button
          type="submit"
          size="sm"
          disabled={disabled || !draft.trim()}
          loading={sending}
          className="shrink-0 gap-1"
        >
          <Send className="h-3.5 w-3.5" />
          Send
        </Button>
      </div>
      {showCounter && (
        <p
          className={cn(
            'text-[10px] text-right tabular-nums',
            nearLimit ? 'text-amber-600 dark:text-amber-400' : 'text-muted-foreground',
          )}
        >
          {draft.length}/{MAX_LENGTH}
        </p>
      )}
    </form>
  )
}
