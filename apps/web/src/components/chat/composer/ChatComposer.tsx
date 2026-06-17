import { useRef, useState } from 'react'
import { toast } from 'sonner'
import { Send } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { cn } from '@/lib/utils'
import { useSlowModeCooldown } from '../hooks/useSlowModeCooldown'
import { EmotePicker } from './EmotePicker'

const MAX_LENGTH = 500

type QuickChatMessage = { label: string; body: string }
type BuiltInGif = { token: string; label: string }

export function ChatComposer({
  canChat,
  connected,
  sending,
  slowModeSeconds = 0,
  customEmotes = [],
  quickMessages = [],
  builtInGifs = [],
  onSend,
}: {
  canChat: boolean
  connected: boolean
  sending: boolean
  slowModeSeconds?: number
  customEmotes?: string[]
  quickMessages?: QuickChatMessage[]
  builtInGifs?: BuiltInGif[]
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
    insertText(emote)
  }

  function insertText(text: string) {
    setDraft((current) => {
      const spacer = current && !current.endsWith(' ') ? ' ' : ''
      const next = `${current}${spacer}${text}`
      return next.length > MAX_LENGTH ? next.slice(0, MAX_LENGTH) : next
    })
    inputRef.current?.focus()
  }

  const showCounter = draft.length > 0
  const nearLimit = draft.length > MAX_LENGTH * 0.85
  const hasBuiltIns = quickMessages.length > 0 || builtInGifs.length > 0

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
        </p>
      )}
      {hasBuiltIns && (
        <div className="flex gap-1 flex-wrap pb-0.5">
          {quickMessages.map((message) => (
            <button
              key={`${message.label}-${message.body}`}
              type="button"
              disabled={disabled}
              className="shrink-0 rounded-full border border-border bg-background px-2.5 py-1 text-[10px] font-medium text-muted-foreground transition-colors hover:bg-accent hover:text-foreground disabled:pointer-events-none disabled:opacity-50"
              onClick={() => insertText(message.body)}
            >
              {message.label}
            </button>
          ))}
          {builtInGifs.map((gif) => (
            <button
              key={gif.token}
              type="button"
              disabled={disabled}
              className="shrink-0 rounded-full border border-amber-500/25 bg-amber-500/10 px-2.5 py-1 text-[10px] font-bold text-amber-700 transition-colors hover:bg-amber-500/20 disabled:pointer-events-none disabled:opacity-50 dark:text-amber-300"
              onClick={() => insertText(gif.token)}
            >
              {gif.label}
            </button>
          ))}
        </div>
      )}
    </form>
  )
}
