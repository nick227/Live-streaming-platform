import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { useWallet, useCreateTip, useRequestPrivateSession } from '@streamyolo/sdk'
import { useQueryClient } from '@tanstack/react-query'
import { Coins, Lock, Star, ChevronRight } from 'lucide-react'
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

  const [customTip, setCustomTip] = useState('')

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
                <Button
                  className="w-full"
                  disabled={!canRequest || isRequesting}
                  onClick={handleRequestPrivate}
                >
                  <Lock className="h-4 w-4 mr-2" /> Request Private
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  )
}
