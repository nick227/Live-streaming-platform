import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { useWallet, useCreateTip, useCreateReport } from '@streamyolo/sdk'
import { useQueryClient } from '@tanstack/react-query'
import { Coins, Flag, Lock, Star, ChevronRight } from 'lucide-react'
import { toast } from 'sonner'
import type { components } from '@streamyolo/sdk'
import type { PrivateRequestStatus } from '@/components/chat/socket/types'
import { TokenPurchaseModal } from '@/components/tokens/TokenPurchaseModal'
import { cn } from '@/lib/utils'

type RoomDetail = components['schemas']['RoomDetail']
type ViewerRoomState = components['schemas']['ViewerRoomState']
type ReportReason = 'SPAM' | 'HARASSMENT' | 'ILLEGAL_CONTENT' | 'UNDERAGE' | 'OTHER'

const REPORT_REASONS: { value: ReportReason; label: string }[] = [
  { value: 'SPAM', label: 'Spam' },
  { value: 'HARASSMENT', label: 'Harassment' },
  { value: 'ILLEGAL_CONTENT', label: 'Illegal content' },
  { value: 'UNDERAGE', label: 'Suspected underage' },
  { value: 'OTHER', label: 'Other' },
]
const MAX_TIP_TOKENS = 100_000

function getErrorMessage(error: unknown, fallback: string) {
  return error instanceof Error && error.message ? error.message : fallback
}

function parsePositiveInteger(value: string) {
  const trimmed = value.trim()
  if (!/^[1-9]\d*$/.test(trimmed)) return null
  const amount = Number(trimmed)
  return Number.isSafeInteger(amount) && amount <= MAX_TIP_TOKENS ? amount : null
}

export function ViewerParticipationPanel({
  room,
  viewerState,
  menuItems,
  privateRequestStatus,
  className,
}: {
  room: RoomDetail
  viewerState: ViewerRoomState | undefined
  menuItems: { id: string; label: string; tokenAmount: number }[]
  privateRequestStatus: PrivateRequestStatus
  className?: string
}) {
  const qc = useQueryClient()
  const { data: walletData } = useWallet()
  const balance = walletData?.data?.wallet.tokenBalance ?? 0

  const { mutateAsync: createTip, isPending: isTipping } = useCreateTip()

  const { mutateAsync: createReport, isPending: isReporting } = useCreateReport()
  const [customTip, setCustomTip] = useState('')
  const [showReport, setShowReport] = useState(false)
  const [reportReason, setReportReason] = useState<ReportReason | ''>('')
  const [showTokenPurchase, setShowTokenPurchase] = useState(false)

  const handleTip = async (amount: number, type: 'GENERAL' | 'MENU_ITEM' | 'CUSTOM', menuItemId?: string) => {
    if (balance < amount) {
      toast.error('Insufficient token balance')
      return false
    }
    try {
      await createTip({
        roomId: room.id,
        amountTokens: amount,
        requestType: type,
        menuItemId,
      })
      toast.success(`Tipped ${amount} tokens!`)
      qc.invalidateQueries({ queryKey: ['wallet'] })
      return true
    } catch (err) {
      toast.error(getErrorMessage(err, 'Failed to send tip'))
      return false
    }
  }

  const canTip = viewerState?.canTip ?? true
  const canRequestPrivate = viewerState?.canRequestPrivate ?? true
  const viewerHasActivePrivateSession = viewerState?.hasActivePrivateSession ?? false
  const viewerCanJoinPrivateSession = viewerHasActivePrivateSession || privateRequestStatus === 'ACTIVE'
  const roomHasActivePrivateSession = Boolean(room.activePrivateSessionId)
  const privateRate = room.privateRateTokensPerMinute ?? 0
  const parsedCustomTip = parsePositiveInteger(customTip)
  const customTipExceedsBalance = parsedCustomTip !== null && balance < parsedCustomTip

  return (
    <div className={cn('flex flex-col gap-2', className)}>
      <TokenPurchaseModal open={showTokenPurchase} onOpenChange={setShowTokenPurchase} />

      {menuItems.length > 0 && (
        menuItems.map((item) => (
          <div
            key={item.id}
            className="flex min-h-12 items-center justify-between gap-3 rounded-xl border border-border bg-card px-4 py-2"
          >
            <div className="flex min-w-0 items-center gap-2">
              <Star className="h-4 w-4 shrink-0 text-amber-500" />
              <span className="truncate text-sm font-medium">{item.label}</span>
            </div>
            <Button
              size="sm"
              variant="outline"
              className="shrink-0 hover:border-amber-500/30 hover:bg-amber-500/10 hover:text-amber-600"
              disabled={!canTip || isTipping || balance < item.tokenAmount}
              onClick={() => handleTip(item.tokenAmount, 'MENU_ITEM', item.id)}
            >
              {item.tokenAmount}
              <Coins className="h-3 w-3" />
            </Button>
          </div>
        ))
      )}

      <div className="flex min-h-12 items-center justify-between gap-3 rounded-xl border border-border bg-card px-4 py-2">
        <button
          type="button"
          onClick={() => setShowTokenPurchase(true)}
          className="flex min-w-0 items-center gap-2 rounded px-1 py-1 text-left transition-colors hover:bg-amber-500/10 hover:text-amber-600"
        >
          <Coins className="h-4 w-4 shrink-0 text-amber-500" />
          <span className="text-sm font-semibold tabular-nums">{balance}</span>
          <span className="truncate text-xs font-medium uppercase tracking-wide text-muted-foreground">Tokens</span>
        </button>
        <div className="flex gap-2">
          <Input
            type="text"
            inputMode="numeric"
            placeholder="Amount"
            value={customTip}
            onChange={(e) => setCustomTip(e.target.value)}
            className="h-8 w-24 shrink-0"
          />
          <Button
            size="sm"
            className="shrink-0"
            disabled={!canTip || isTipping || parsedCustomTip === null || customTipExceedsBalance}
            onClick={async () => {
              if (parsedCustomTip === null) {
                toast.error(`Enter a whole number from 1 to ${MAX_TIP_TOKENS.toLocaleString()}`)
                return
              }
              const sent = await handleTip(parsedCustomTip, 'CUSTOM')
              if (sent) setCustomTip('')
            }}
          >
            Tip
          </Button>
        </div>
      </div>

      {privateRate > 0 && (
        <div className="flex min-h-12 items-center justify-between gap-3 rounded-xl border border-border bg-card px-4 py-2">
          <div className="flex min-w-0 items-center gap-2">
            <Lock className="h-4 w-4 shrink-0 text-muted-foreground" />
            <span className="truncate text-sm font-medium">Private Session</span>
            <span className="hidden shrink-0 items-center gap-1 text-xs text-muted-foreground sm:flex">
              {privateRate} <Coins className="h-3 w-3" /> / min
            </span>
            {privateRequestStatus === 'DECLINED' && (
              <span className="shrink-0 text-xs font-medium text-destructive">Declined</span>
            )}
          </div>

          {viewerCanJoinPrivateSession ? (
            <Button asChild size="sm" className="shrink-0" variant="default">
              <Link to={`/rooms/${room.id}/private-sessions/active`}>
                Go Private <ChevronRight className="h-4 w-4" />
              </Link>
            </Button>
          ) : privateRequestStatus === 'PENDING' ? (
            <Button disabled size="sm" className="shrink-0">
              Pending
            </Button>
          ) : privateRequestStatus === 'ACCEPTED' ? (
            <Button asChild size="sm" className="shrink-0 bg-green-600 text-white hover:bg-green-700">
              <Link to={`/rooms/${room.id}/private-sessions/active`}>
                Join <ChevronRight className="h-4 w-4" />
              </Link>
            </Button>
          ) : roomHasActivePrivateSession ? (
            <Button disabled size="sm" className="shrink-0">
              Busy
            </Button>
          ) : canRequestPrivate ? (
            <Button asChild size="sm" className="shrink-0">
              <Link to={`/rooms/${room.id}/private-sessions/request`}>
                <Lock className="h-4 w-4" /> Request
              </Link>
            </Button>
          ) : (
            <Button disabled size="sm" className="shrink-0">
              Unavailable
            </Button>
          )}
        </div>
      )}

      {!showReport ? (
        <button
          type="button"
          onClick={() => setShowReport(true)}
          className="flex min-h-10 items-center gap-2 rounded-xl px-4 py-2 text-left text-xs"
        >
          <Flag className="h-3.5 w-3.5 shrink-0" />
          Report room
        </button>
      ) : (
        <div className="flex min-h-12 flex-wrap items-center gap-2 rounded-xl border border-border bg-card px-4 py-2">
          <Flag className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
          <select
            className="h-8 min-w-40 flex-1 rounded border border-input bg-background px-2 text-xs"
            value={reportReason}
            onChange={(e) => setReportReason(e.target.value as ReportReason | '')}
          >
            <option value="">Select a reason...</option>
            {REPORT_REASONS.map((reason) => (
              <option key={reason.value} value={reason.value}>{reason.label}</option>
            ))}
          </select>
          <Button
            size="sm"
            variant="destructive"
            disabled={!reportReason || isReporting}
            loading={isReporting}
            onClick={async () => {
              try {
                await createReport({ targetType: 'ROOM', targetRoomId: room.id, reason: reportReason })
                toast.success('Report submitted')
                setShowReport(false)
                setReportReason('')
              } catch (err) {
                toast.error(getErrorMessage(err, 'Failed to submit report'))
              }
            }}
          >
            Submit
          </Button>
          <Button size="sm" variant="ghost" onClick={() => setShowReport(false)}>
            Cancel
          </Button>
        </div>
      )}
    </div>
  )
}
