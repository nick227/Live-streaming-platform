import type { ReactNode } from 'react'
import { cn } from '@/lib/utils'

export function LiveRoomHeader({
  media,
  title,
  link,
  status,
}: {
  media: ReactNode
  title: ReactNode
  link?: ReactNode
  status: ReactNode
}) {
  return (
    <div className="flex flex-col gap-3 rounded-xl border border-border bg-card px-4 py-3">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex min-w-0 items-center gap-4">
          {media}
          <div className="min-w-0">
            {title}
            {link && <div>{link}</div>}
            <p className="mt-1 text-xs text-muted-foreground">{status}</p>
          </div>
        </div>
      </div>
    </div>
  )
}

export function LiveRoomHeaderMedia({
  src,
  alt,
  onClick,
}: {
  src?: string | null
  alt: string
  onClick?: () => void
}) {
  return (
    <div
      onClick={onClick}
      className={cn(
        'h-16 w-16 shrink-0 overflow-hidden rounded-lg bg-muted-foreground',
        onClick && 'cursor-pointer',
      )}
    >
      {src && <img src={src} alt={alt} className="h-16 w-16 object-cover" />}
    </div>
  )
}

export const liveRoomTitleClassName =
  'w-full truncate border-none bg-transparent p-0 text-lg font-bold leading-tight outline-none transition-colors placeholder-muted-foreground/50 hover:bg-blue-20 hover:border-blue-300 focus:ring-0'

export const liveRoomLinkClassName =
  'inline-block text-xs text-muted-foreground transition-colors hover:text-primary hover:underline'
