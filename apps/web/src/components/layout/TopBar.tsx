import { Link } from 'react-router-dom'
import { Radio } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { AuthWidget } from './AuthWidget'

import { cn } from '@/lib/utils'

export function TopBar({ wide = false }: { wide?: boolean }) {
  return (
    <header className="sticky top-0 z-20 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80">
      <div className={cn('mx-auto px-4 h-14 flex items-center justify-between gap-3', wide ? 'max-w-7xl' : 'max-w-3xl')}>
        <Link to="/rooms" className="font-bold text-base tracking-tight shrink-0">
          StreamYolo
        </Link>
        <div className="flex items-center gap-2">
          <Button asChild size="sm">
            <Link to="/rooms">
              <Radio className="h-4 w-4 mr-1.5" />
              Live
            </Link>
          </Button>
          <AuthWidget />
        </div>
      </div>
    </header>
  )
}
