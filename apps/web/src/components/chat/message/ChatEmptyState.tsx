import { MessageSquare } from 'lucide-react'
import { cn } from '@/lib/utils'

export function ChatEmptyState({
  message,
  variant = 'viewer',
}: {
  message: string
  variant?: 'viewer' | 'studio'
}) {
  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center text-center text-muted-foreground',
        variant === 'studio' ? 'py-8 gap-2' : 'pt-10 pb-6 gap-2',
      )}
    >
      <MessageSquare className={cn('opacity-30', variant === 'studio' ? 'h-8 w-8' : 'h-6 w-6')} />
      <p className={cn(variant === 'studio' ? 'text-sm italic' : 'text-xs')}>{message}</p>
    </div>
  )
}
