import { NavLink, Outlet, Navigate } from 'react-router-dom'
import { useCurrentUser } from '@streamyolo/sdk'
import {
  LayoutDashboard,
  LayoutGrid,
  Users,
  Star,
  CreditCard,
  Lock,
  Image,
  Flag,
  Tag,
  Coins,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { TopBar } from './TopBar'

const NAV = [
  { to: '/admin/overview',          label: 'Overview',        icon: LayoutDashboard },
  { to: '/admin/rooms',             label: 'Rooms',           icon: LayoutGrid },
  { to: '/admin/users',             label: 'Users',           icon: Users },
  { to: '/admin/creators',          label: 'Creators',        icon: Star },
  { to: '/admin/payments',          label: 'Payments',        icon: CreditCard },
  { to: '/admin/private-sessions',  label: 'Sessions',        icon: Lock },
  { to: '/admin/media',             label: 'Media',           icon: Image },
  { to: '/admin/reports',           label: 'Reports',         icon: Flag },
  { to: '/admin/tags',              label: 'Tags',            icon: Tag },
  { to: '/admin/token-grants',      label: 'Token Grants',    icon: Coins },
  { to: '/admin/token-packs',       label: 'Token Packs',     icon: Coins },
  { to: '/admin/settings',          label: 'Settings',        icon: LayoutDashboard },
]

function NavItem({ to, label, icon: Icon }: { to: string; label: string; icon: React.ElementType }) {
  return (
    <NavLink
      to={to}
      className={({ isActive }) =>
        cn(
          'flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm transition-colors',
          isActive
            ? 'bg-primary/10 text-primary font-medium'
            : 'text-muted-foreground hover:text-foreground hover:bg-accent',
        )
      }
    >
      <Icon className="h-4 w-4 shrink-0" />
      {label}
    </NavLink>
  )
}

export function AdminShell() {
  const { data } = useCurrentUser()
  const user = (data as any)?.data?.user

  if (user && user.role !== 'ADMIN') {
    return <Navigate to="/rooms" replace />
  }

  return (
    <div className="min-h-screen bg-background">
      <TopBar />
      <div className="flex">
        {/* Sidebar — desktop */}
        <aside className="hidden lg:flex flex-col w-56 shrink-0 border-r min-h-[calc(100vh-3.5rem)] sticky top-14 self-start">
          <nav className="flex flex-col gap-1 p-3">
            {NAV.map((item) => (
              <NavItem key={item.to} {...item} />
            ))}
          </nav>
        </aside>

        <div className="flex-1 min-w-0">
          {/* Top tabs — mobile */}
          <div className="lg:hidden border-b overflow-x-auto">
            <nav className="flex gap-1 p-2 min-w-max">
              {NAV.map((item) => (
                <NavLink
                  key={item.to}
                  to={item.to}
                  className={({ isActive }) =>
                    cn(
                      'flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs whitespace-nowrap transition-colors',
                      isActive
                        ? 'bg-primary/10 text-primary font-medium'
                        : 'text-muted-foreground hover:text-foreground hover:bg-accent',
                    )
                  }
                >
                  <item.icon className="h-3.5 w-3.5 shrink-0" />
                  {item.label}
                </NavLink>
              ))}
            </nav>
          </div>

          <main className="p-6 max-w-5xl mx-auto">
            <Outlet />
          </main>
        </div>
      </div>
    </div>
  )
}
