import { Outlet, useLocation } from 'react-router-dom'
import { ErrorBoundary } from '@/lib/ErrorBoundary'
import { TopBar } from './TopBar'

export function Shell() {
  const { pathname } = useLocation()

  return (
    <div className="min-h-screen bg-background">
      <TopBar />
      <main className="min-h-[calc(100vh-3.5rem)]">
        <div className="max-w-3xl mx-auto px-4 py-4">
          <ErrorBoundary key={pathname}>
            <Outlet />
          </ErrorBoundary>
        </div>
      </main>
    </div>
  )
}
