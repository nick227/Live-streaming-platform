import { NavLink, Outlet, useNavigate, useLocation } from 'react-router-dom'
import { Radio, Wallet, User, ShieldCheck, LogOut, Sun, Moon, type LucideIcon } from 'lucide-react'
import { useLogout } from '@streamyolo/sdk'
import { cn } from '@/lib/utils'
import { toggleTheme } from '@/lib/theme'
import { ErrorBoundary } from '@/lib/ErrorBoundary'

type NavItem = { to: string; label: string; icon: LucideIcon; end?: boolean }

const navItems: NavItem[] = [
  { to: '/', label: 'Live', icon: Radio, end: true },
  { to: '/wallet', label: 'Wallet', icon: Wallet },
  { to: '/creator/profile', label: 'Creator', icon: User },
  { to: '/admin', label: 'Admin', icon: ShieldCheck },
]

export function Shell() {
  const logout = useLogout()
  const navigate = useNavigate()
  const { pathname } = useLocation()

  async function handleLogout() {
    await logout.mutateAsync(undefined)
    navigate('/login', { replace: true })
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Desktop sidebar */}
      <aside className="hidden md:flex fixed left-0 top-0 h-full w-56 flex-col border-r px-3 py-6 gap-1">
        <div className="px-3 pb-4 mb-2 border-b">
          <span className="font-bold text-base tracking-tight">StreamYolo</span>
        </div>
        <div className="flex-1 space-y-1">
          {navItems.map(item => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              className={({ isActive }) =>
                cn(
                  'flex items-center gap-3 px-3 py-2 rounded text-sm font-medium transition-colors',
                  isActive
                    ? 'bg-accent text-accent-foreground'
                    : 'text-muted-foreground hover:text-foreground hover:bg-accent/50'
                )
              }
            >
              <item.icon size={18} />
              {item.label}
            </NavLink>
          ))}
        </div>
        <div className="space-y-1">
          <button
            type="button"
            onClick={toggleTheme}
            className="flex w-full items-center gap-3 px-3 py-2 rounded text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-accent/50 transition-colors"
          >
            <Sun size={18} className="dark:hidden" />
            <Moon size={18} className="hidden dark:block" />
            Toggle theme
          </button>
          <button
            type="button"
            onClick={handleLogout}
            className="flex w-full items-center gap-3 px-3 py-2 rounded text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-accent/50 transition-colors"
          >
            <LogOut size={18} />
            Log out
          </button>
        </div>
      </aside>

      {/* Main content */}
      <main className="md:ml-56 pb-20 md:pb-0 min-h-screen">
        <div className="max-w-xl mx-auto px-4 py-4">
          <ErrorBoundary key={pathname}>
            <Outlet />
          </ErrorBoundary>
        </div>
      </main>

      {/* Mobile bottom nav */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 border-t bg-background flex justify-around px-2 py-2 z-10">
        {navItems.map(item => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.end}
            className={({ isActive }) =>
              cn(
                'flex flex-col items-center gap-0.5 px-4 py-1 rounded text-xs',
                isActive ? 'text-foreground' : 'text-muted-foreground'
              )
            }
          >
            <item.icon size={20} />
            <span>{item.label}</span>
          </NavLink>
        ))}
      </nav>
    </div>
  )
}
