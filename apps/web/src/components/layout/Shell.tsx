import { Outlet, useLocation } from 'react-router-dom'
import { ErrorBoundary } from '@/lib/ErrorBoundary'
import { TopBar } from './TopBar'
import { cn } from '@/lib/utils'

function isWideRoute(pathname: string) {
  return pathname.includes('/creator/rooms/') && pathname.endsWith('/go-live')
}

export function Shell() {
  const { pathname } = useLocation()
  const wide = isWideRoute(pathname)

  return (
    <div className="min-h-screen bg-background">
      <TopBar wide={wide} />
      <main className="min-h-[calc(100vh-3.5rem)]">
        <div className={cn('mx-auto px-4', wide ? 'max-w-7xl py-4' : 'max-w-3xl py-6')}>
          <ErrorBoundary key={pathname}>
            <Outlet />
          </ErrorBoundary>
        </div>
      </main>
    </div>
  )
}
