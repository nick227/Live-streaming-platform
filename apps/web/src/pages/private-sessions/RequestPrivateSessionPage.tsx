import { useLocation, useNavigate, useParams } from 'react-router-dom'
import { useRequestPrivateSession, useRoom, useWallet } from '@streamyolo/sdk'
import { Button } from '@/components/ui/Button'
import { Skeleton } from '@/components/ui/Skeleton'
import { Card, CardContent } from '@/components/ui/Card'
import { Coins, Camera, Monitor, Clock } from 'lucide-react'
import { toast } from 'sonner'
import { useState } from 'react'

export function RequestPrivateSessionPage() {
  const navigate = useNavigate()
  const location = useLocation()
  const { roomId } = useParams<{ roomId: string }>()
  const { data: roomData, isLoading: roomLoading } = useRoom(roomId!)
  const { data: walletData } = useWallet()
  const mutation = useRequestPrivateSession()
  const [message, setMessage] = useState('')
  const returnRoute = { pathname: location.pathname, search: location.search, hash: location.hash }

  if (roomLoading) return (
    <div className="space-y-4">
      <Skeleton className="h-6 w-48" />
      <Skeleton className="h-40 w-full rounded-xl" />
      <Skeleton className="h-24 w-full rounded-xl" />
    </div>
  )

  const room = (roomData as any)?.data
  if (!room) return <p className="text-muted-foreground">Room not found.</p>

  const rate: number = room.privateRateTokensPerMinute ?? 0
  const minMinutes: number = room.minPrivateMinutes ?? 1
  const minCost = rate * minMinutes
  const tokenBalance: number = (walletData as any)?.data?.wallet?.tokenBalance ?? 0
  const canAfford = tokenBalance >= minCost

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    try {
      await mutation.mutateAsync({ roomId: roomId!, ...(message ? { note: message } : {}) })
      toast.success('Session requested — waiting for creator to accept')
      navigate(-1)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to request session')
    }
  }

  return (
    <div className="space-y-6 max-w-md mx-auto">
      <div>
        <button onClick={() => navigate(-1)} className="text-sm text-muted-foreground hover:text-foreground transition-colors">
          ← Back
        </button>
        <h1 className="text-xl font-semibold mt-2">Request Private Session Media Space</h1>
        <p className="text-sm text-muted-foreground">with {room.creator?.displayName ?? 'Creator'}</p>
      </div>

      <Card>
        <CardContent className="py-4 space-y-3">
          <div className="flex items-center gap-2 text-sm">
            <Coins className="h-4 w-4 text-primary shrink-0" />
            <span><strong>{rate.toLocaleString()}</strong> tokens/min</span>
          </div>
          <div className="flex items-center gap-2 text-sm">
            <Clock className="h-4 w-4 text-muted-foreground shrink-0" />
            <span>Minimum <strong>{minMinutes}</strong> minute{minMinutes !== 1 ? 's' : ''} · <strong>{minCost.toLocaleString()}</strong> tokens minimum</span>
          </div>
          {room.privateViewerCamMode === 'REQUIRED' && (
            <div className="flex items-center gap-2 text-sm text-amber-600 dark:text-amber-400">
              <Camera className="h-4 w-4 shrink-0" />
              <span>Your camera is required for this private session</span>
            </div>
          )}
          {room.privateScreenShareAllowed && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Monitor className="h-4 w-4 shrink-0" />
              <span>Creator screen sharing allowed</span>
            </div>
          )}
          {room.privateRulesText && (
            <div className="pt-2 border-t text-sm text-muted-foreground whitespace-pre-wrap">
              {room.privateRulesText}
            </div>
          )}
        </CardContent>
      </Card>

      <div className="flex items-center justify-between text-sm">
        <span className="text-muted-foreground">Your balance</span>
        <span className={`font-medium flex items-center gap-1 ${canAfford ? '' : 'text-destructive'}`}>
          <Coins className="h-3.5 w-3.5" />
          {tokenBalance.toLocaleString()}
          {!canAfford && <span className="text-xs ml-1">(need {minCost.toLocaleString()})</span>}
        </span>
      </div>

      {!canAfford && (
        <p className="text-sm text-destructive">
          You need at least {minCost.toLocaleString()} tokens for the minimum session.{' '}
          <button onClick={() => navigate('/token-packs', { state: { from: returnRoute } })} className="underline">Buy tokens</button>
        </p>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-1">
          <label className="text-sm font-medium">Message to creator <span className="text-muted-foreground">(optional)</span></label>
          <textarea
            className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring resize-none"
            rows={3}
            maxLength={300}
            value={message}
            onChange={e => setMessage(e.target.value)}
            placeholder="Let the creator know what you'd like..."
          />
        </div>
        <Button type="submit" loading={mutation.isPending} disabled={!canAfford}>
          Request Session
        </Button>
      </form>
    </div>
  )
}
