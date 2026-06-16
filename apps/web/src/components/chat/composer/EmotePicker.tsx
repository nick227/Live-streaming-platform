import { useEffect, useRef, useState } from 'react'
import { Smile } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/Button'
import { CHAT_EMOTES } from './emotes'
import { LOUNGE_EMOTES } from '../model/emotes'

export function EmotePicker({
  disabled,
  customEmotes = [],
  onSelect,
}: {
  disabled?: boolean
  customEmotes?: string[]
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

  const sections = [
    { label: 'Quick', emotes: [...CHAT_EMOTES] },
    { label: 'Lounge', emotes: [...LOUNGE_EMOTES] },
    ...(customEmotes.length > 0 ? [{ label: 'Creator', emotes: customEmotes }] : []),
  ]

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
            'absolute bottom-full left-0 mb-2 z-20 w-56 rounded-lg border border-border',
            'bg-card p-2 shadow-lg space-y-2',
          )}
        >
          {sections.map((section) => (
            <div key={section.label}>
              <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground px-1 mb-1">
                {section.label}
              </p>
              <div className="grid grid-cols-5 gap-1">
                {section.emotes.map((emote) => (
                  <button
                    key={`${section.label}-${emote}`}
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
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
