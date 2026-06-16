import { Link } from 'react-router-dom'
import { Moon, Radio, Settings, Sun } from 'lucide-react'
import { useCreatorProfile, useCurrentUser } from '@streamyolo/sdk'
import { Button } from '@/components/ui/Button'
import { AuthWidget } from './AuthWidget'
import { toggleTheme } from '@/lib/theme'
import { useState, useEffect } from 'react'

const goLiveButtonClass = 'bg-black hover:bg-black/90 text-white'
const liveRecordingButtonClass = 'bg-red-600 text-white disabled:bg-red-600 disabled:text-white disabled:opacity-100'

function GoLiveButton() {
  const { data: profileData } = useCreatorProfile()
  const profile = profileData?.data

  if (profile?.isLive && profile.currentRoomId) {
    return (
      <Button
        size="sm"
        className={liveRecordingButtonClass}
        disabled
        title="You are already broadcasting"
      >
        <Radio className="h-4 w-4 mr-1.5" />
        Broadcasting
      </Button>
    )
  }

  return (
    <Button asChild size="sm" className={goLiveButtonClass}>
      <Link to="/studio">
        <Radio className="h-4 w-4 mr-1.5" />
        Studio
      </Link>
    </Button>
  )
}

function AdminButton() {
  const { data: meData } = useCurrentUser()
  if (meData?.data?.user?.role !== 'ADMIN') return null
  return (
    <Link
      to="/admin"
      aria-label="Admin dashboard"
      className="h-8 w-8 flex items-center justify-center rounded text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
    >
      <Settings className="h-4 w-4" />
    </Link>
  )
}

function ThemeToggle() {
  const [dark, setDark] = useState(() => document.documentElement.classList.contains('dark'))
  useEffect(() => {
    const obs = new MutationObserver(() =>
      setDark(document.documentElement.classList.contains('dark')),
    )
    obs.observe(document.documentElement, { attributeFilter: ['class'] })
    return () => obs.disconnect()
  }, [])
  return (
    <button
      onClick={toggleTheme}
      aria-label="Toggle theme"
      className="h-8 w-8 flex items-center justify-center rounded text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
    >
      {dark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
    </button>
  )
}

export function TopBar({ wide = false }: { wide?: boolean }) {
  return (
    <header className="sticky top-0 z-20 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80">
      <div className='mx-auto px-4 h-14 flex items-center justify-between gap-3 max-w-3xl'>
        <Link
          to="/rooms"
          className="font-bold text-sm tracking-widest uppercase shrink-0 text-foreground/90 hover:text-foreground transition-colors"
        >
          StreamYolo
        </Link>
        <div className="flex items-center gap-1.5">
          <AdminButton />
          <ThemeToggle />
          <GoLiveButton />
          <AuthWidget />
        </div>
      </div>
    </header>
  )
}
