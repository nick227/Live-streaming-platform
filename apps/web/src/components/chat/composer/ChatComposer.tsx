import { useRef, useState } from 'react'
import { toast } from 'sonner'
import { Send } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { cn } from '@/lib/utils'
import { useSlowModeCooldown } from '../hooks/useSlowModeCooldown'
import { EmotePicker } from './EmotePicker'

const MAX_LENGTH = 500

export function ChatComposer({
  canChat,
  connected,
  sending,
  slowModeSeconds = 0,
  customEmotes = [],
  onSend,
}: {
  canChat: boolean
  connected: boolean
  sending: boolean
  slowModeSeconds?: number
  customEmotes?: string[]
  onSend: (body: string) => Promise<void>
}) {
  const [draft, setDraft] = useState('')
  const [lastSentAt, setLastSentAt] = useState<number | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const { cooldownSeconds, isOnCooldown } = useSlowModeCooldown(slowModeSeconds, lastSentAt)

  const disabled = !canChat || !connected || sending || isOnCooldown
  const placeholder = !canChat
    ? 'Chat is unavailable'
    : !connected
      ? 'Connecting to chat…'
      : isOnCooldown
        ? `Slow mode · wait ${cooldownSeconds}s`
        : 'Send a message…'

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault()
    const body = draft.trim()
    if (!body || disabled) return

    try {
      await onSend(body)
      setDraft('')
      setLastSentAt(Date.now())
    } catch (error) {
      toast.error((error as Error).message || 'Failed to send message')
    }
  }

  function insertEmote(emote: string) {
    setDraft((current) => {
      const next = `${current}${emote}`
      return next.length > MAX_LENGTH ? next.slice(0, MAX_LENGTH) : next
    })
    inputRef.current?.focus()
  }

  const showCounter = draft.length > 0
  const nearLimit = draft.length > MAX_LENGTH * 0.85

  return (
    <form
      onSubmit={handleSubmit}
      className="shrink-0 rounded-lg border border-border bg-muted/20 p-2 space-y-1.5"
    >
      <div className="flex gap-2">
        <EmotePicker disabled={disabled} customEmotes={customEmotes} onSelect={insertEmote} />
        <Input
          ref={inputRef}
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
