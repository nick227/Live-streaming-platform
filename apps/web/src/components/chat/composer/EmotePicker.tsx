import { useEffect, useRef, useState } from 'react'
import { Smile } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/Button'
import { CHAT_EMOTES } from './emotes'

export function EmotePicker({
  disabled,
  onSelect,
}: {
  disabled?: boolean
  onSelect: (emote: string) => void
}) {
  const [open, setOpen] = useState(false)
  const rootRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    const handlePointerDown = (event: MouseEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handlePointerDown)
    return () => document.removeEventListener('mousedown', handlePointerDown)
  }, [open])

  return (
    <div ref={rootRef} className="relative shrink-0">
      <Button
        type="button"
        size="sm"
        variant="outline"
        disabled={disabled}
        className="h-9 w-9 p-0"
        aria-label="Insert emote"
        aria-expanded={open}
        onClick={() => setOpen((value) => !value)}
      >
        <Smile className="h-4 w-4" />
      </Button>
      {open && (
        <div
          className={cn(
            'absolute bottom-full left-0 mb-2 z-20 w-52 rounded-lg border border-border',
            'bg-popover p-2 shadow-lg grid grid-cols-5 gap-1',
          )}
        >
          {CHAT_EMOTES.map((emote) => (
            <button
              key={emote}
              type="button"
              className="h-8 w-8 rounded hover:bg-muted text-lg leading-none transition-colors"
              onClick={() => {
                onSelect(emote)
                setOpen(false)
              }}
            >
              {emote}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
