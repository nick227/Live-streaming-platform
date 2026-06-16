import { useEffect, useState } from 'react'

export function useSlowModeCooldown(slowModeSeconds: number, lastSentAt: number | null) {
  const [now, setNow] = useState(Date.now())

  useEffect(() => {
    if (!slowModeSeconds || !lastSentAt) return
    const interval = window.setInterval(() => setNow(Date.now()), 250)
    return () => window.clearInterval(interval)
  }, [slowModeSeconds, lastSentAt])

  if (!slowModeSeconds || !lastSentAt) {
    return { cooldownSeconds: 0, isOnCooldown: false }
  }

  const remainingMs = slowModeSeconds * 1000 - (now - lastSentAt)
  const cooldownSeconds = Math.max(0, Math.ceil(remainingMs / 1000))

  return {
    cooldownSeconds,
    isOnCooldown: cooldownSeconds > 0,
  }
}
