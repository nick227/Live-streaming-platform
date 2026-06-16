import { useState, useEffect } from 'react'
import { cn } from '@/lib/utils'

interface AvatarProps {
  src?: string | null
  name?: string
  size?: 'sm' | 'md' | 'lg' | 'xl'
  className?: string
}

const sizes = {
  sm: 'h-7 w-7 text-xs',
  md: 'h-9 w-9 text-sm',
  lg: 'h-12 w-12 text-base',
  xl: 'h-20 w-20 text-xl',
}

export function Avatar({ src, name, size = 'md', className }: AvatarProps) {
  const [imgError, setImgError] = useState(false)

  useEffect(() => {
    setImgError(false)
  }, [src])

  const initials = name
    ?.split(' ')
    .map(w => w[0])
    .join('')
    .slice(0, 2)
    .toUpperCase() ?? '?'

  return (
    <div
      className={cn(
        'rounded-full bg-muted flex items-center justify-center overflow-hidden shrink-0 font-medium',
        sizes[size],
        className
      )}
    >
      {src && !imgError
        ? <img src={src} alt={name ?? ''} className="h-full w-full object-cover" onError={() => setImgError(true)} />
        : <span className="text-muted-foreground">{initials}</span>
      }
    </div>
  )
}
