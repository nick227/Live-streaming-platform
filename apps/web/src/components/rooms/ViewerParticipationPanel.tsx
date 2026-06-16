import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { useWallet, useCreateTip, useRequestPrivateSession, useCreateReport } from '@streamyolo/sdk'
import { useQueryClient } from '@tanstack/react-query'
import { Coins, Flag, Lock, Star, ChevronRight } from 'lucide-react'
import { toast } from 'sonner'
import type { components } from '@streamyolo/sdk'

type RoomDetail = components['schemas']['RoomDetail']
type ViewerRoomState = components['schemas']['ViewerRoomState']

export function ViewerParticipationPanel({
  room,
  viewerState,
  menuItems,
  privateRequestStatus,
  setPrivateRequestStatus,
}: {
  room: RoomDetail
  viewerState: ViewerRoomState | undefined
  menuItems: { id: string; label: string; tokenAmount: number }[]
  privateRequestStatus: 'IDLE' | 'PENDING' | 'ACCEPTED' | 'DECLINED'
  setPrivateRequestStatus: (status: 'IDLE' | 'PENDING' | 'ACCEPTED' | 'DECLINED') => void
}) {
  const qc = useQueryClient()
  const navigate = useNavigate()
  const { data: walletData } = useWallet()
  const balance = walletData?.data?.wallet.tokenBalance ?? 0

  const { mutateAsync: createTip, isPending: isTipping } = useCreateTip()
  const { mutateAsync: requestPrivate, isPending: isRequesting } = useRequestPrivateSession()

  const { mutateAsync: createReport, isPending: isReporting } = useCreateReport()
  const [customTip, setCustomTip] = useState('')
  const [showReport, setShowReport] = useState(false)
  const [reportReason, setReportReason] = useState('')

  const handleTip = async (amount: number, type: 'GENERAL' | 'MENU_ITEM' | 'CUSTOM', menuItemId?: string) => {
    if (balance < amount) {
      toast.error('Insufficient token balance')
      return
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
    } catch (err: any) {
      toast.error(err.message || 'Failed to send tip')
    }
  }

  const handleRequestPrivate = async () => {
    try {
      await requestPrivate({
        roomId: room.id,
      })
      setPrivateRequestStatus('PENDING')
      toast.success('Private session requested!')
      qc.invalidateQueries({ queryKey: ['wallet'] })
    } catch (err: any) {
      toast.error(err.message || 'Failed to request private session')
    }
  }

  const canTip = viewerState?.canTip ?? true
  const canRequest = viewerState?.canRequestPrivate ?? true
  const hasActiveSession = viewerState?.hasActivePrivateSession ?? false
  const privateRate = room.privateRateTokensPerMinute ?? 0

  return (
    <div className="flex flex-col gap-4">
      {/* Wallet Balance */}
      <Card>
        <CardContent className="p-4 flex items-center justify-between bg-primary/5 rounded-lg border-primary/20">
          <div className="flex items-center gap-2">
            <Coins className="h-5 w-5 text-amber-500" />
            <span className="font-semibold text-lg">{balance}</span>
            <span className="text-sm text-muted-foreground uppercase tracking-wide">Tokens</span>
          </div>
          <Button asChild size="sm" variant="outline" className="text-xs">
            <Link to="/wallet">Buy Tokens</Link>
          </Button>
        </CardContent>
      </Card>

      {/* Tip Menu */}
      <Card>
        <CardHeader className="p-4 pb-2">
          <CardTitle className="text-sm uppercase tracking-wide text-muted-foreground flex items-center gap-2">
            <Star className="h-4 w-4" /> Creator Menu
          </CardTitle>
        </CardHeader>
        <CardContent className="p-4 pt-0 space-y-3">
          {menuItems.length === 0 ? (
            <p className="text-sm text-muted-foreground">No menu items available.</p>
          ) : (
            <div className="grid gap-2">
              {menuItems.map((item) => (
                <Button
                  key={item.id}
                  variant="outline"
                  className="w-full justify-between hover:bg-amber-500/10 hover:text-amber-600 hover:border-amber-500/30 transition-colors"
                  disabled={!canTip || isTipping}
                  onClick={() => handleTip(item.tokenAmount, 'MENU_ITEM', item.id)}
                >
                  <span className="truncate pr-2">{item.label}</span>
                  <span className="flex items-center gap-1 font-semibold shrink-0">
                    {item.tokenAmount} <Coins className="h-3 w-3" />
                  </span>
                </Button>
              ))}
            </div>
          )}

          <div className="pt-2 border-t flex gap-2">
            <Input
              type="number"
              placeholder="Custom tip amount"
              value={customTip}
              onChange={(e) => setCustomTip(e.target.value)}
              min={1}
              className="flex-1"
            />
            <Button
              disabled={!canTip || isTipping || !customTip || Number(customTip) < 1}
              onClick={() => {
                handleTip(Number(customTip), 'CUSTOM')
                setCustomTip('')
              }}
            >
              Tip
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Private Session */}
      {privateRate > 0 && (
        <Card>
          <CardHeader className="p-4 pb-2">
            <CardTitle className="text-sm uppercase tracking-wide text-muted-foreground flex items-center gap-2">
              <Lock className="h-4 w-4" /> Private Session
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4 pt-0 space-y-3">
            <div className="text-sm text-muted-foreground flex justify-between">
              <span>Rate:</span>
              <span className="font-semibold text-foreground flex items-center gap-1">
                {privateRate} <Coins className="h-3 w-3" /> / min
              </span>
            </div>
            
            {hasActiveSession ? (
              <Button asChild className="w-full" variant="default">
                <Link to={`/rooms/${room.id}/private-sessions/active`}>
                  Go to Private Session <ChevronRight className="h-4 w-4 ml-1" />
                </Link>
              </Button>
            ) : privateRequestStatus === 'PENDING' ? (
              <Button disabled className="w-full">
                Pending Approval...
              </Button>
            ) : privateRequestStatus === 'ACCEPTED' ? (
              <Button asChild className="w-full bg-green-600 hover:bg-green-700 text-white">
                <Link to={`/rooms/${room.id}/private-sessions/active`}>
                  Join Private Session <ChevronRight className="h-4 w-4 ml-1" />
                </Link>
              </Button>
            ) : (
              <div className="space-y-2">
                {privateRequestStatus === 'DECLINED' && (
                  <p className="text-xs text-destructive text-center font-medium">Request declined</p>
                )}
                <Button asChild className="w-full">
                  <Link to={`/rooms/${room.id}/private-sessions/request`}>
                    <Lock className="h-4 w-4 mr-2" /> Request Private
                  </Link>
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      )}
      {/* Report */}
      <div className="pt-2">
        {!showReport ? (
          <button
            onClick={() => setShowReport(true)}
            className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-destructive transition-colors"
          >
            <Flag className="h-3.5 w-3.5" />
            Report room
          </button>
        ) : (
          <div className="space-y-2 border rounded-lg p-3">
            <p className="text-xs font-medium">Report this room</p>
            <select
              className="w-full rounded border border-input bg-background px-2 py-1.5 text-xs"
              value={reportReason}
              onChange={e => setReportReason(e.target.value)}
            >
              <option value="">Select a reason…</option>
              <option value="SPAM">Spam</option>
              <option value="HARASSMENT">Harassment</option>
              <option value="ILLEGAL_CONTENT">Illegal content</option>
              <option value="UNDERAGE">Suspected underage</option>
              <option value="OTHER">Other</option>
            </select>
            <div className="flex gap-2">
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
                  } catch {
                    toast.error('Failed to submit report')
                  }
                }}
              >
                Submit
              </Button>
              <Button size="sm" variant="ghost" onClick={() => setShowReport(false)}>Cancel</Button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
