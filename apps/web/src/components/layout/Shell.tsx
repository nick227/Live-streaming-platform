import { Outlet, useLocation } from 'react-router-dom'
import { ErrorBoundary } from '@/lib/ErrorBoundary'
import { TopBar } from './TopBar'

function isWideRoute(pathname: string) {
  return pathname === '/studio' || (pathname.includes('/creator/rooms/') && pathname.endsWith('/go-live'))
}

export function Shell() {
  const { pathname } = useLocation()
  const wide = isWideRoute(pathname)

  return (
    <div className="min-h-screen bg-background">
      <TopBar wide={wide} />
      <main className="min-h-[calc(100vh-3.5rem)]">
        {wide ? (
          <ErrorBoundary key={pathname}>
            <Outlet />
          </ErrorBoundary>
        ) : (
          <div className="mx-auto max-w-3xl px-4 py-6">
            <ErrorBoundary key={pathname}>
              <Outlet />
            </ErrorBoundary>
          </div>
        )}
      </main>
    </div>
  )
}
