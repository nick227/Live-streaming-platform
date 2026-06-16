import { useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useCreateTip, useRoomMenu, useWallet } from '@streamyolo/sdk'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Skeleton } from '@/components/ui/Skeleton'
import { Coins } from 'lucide-react'
import { toast } from 'sonner'
import { useQueryClient } from '@tanstack/react-query'

export function CreateTipPage() {
  const navigate = useNavigate()
  const qc = useQueryClient()
  const { roomId } = useParams<{ roomId: string }>()
  const { data: menuData, isLoading: menuLoading } = useRoomMenu(roomId!)
  const { data: walletData } = useWallet()
  const mutation = useCreateTip()

  const [customAmount, setCustomAmount] = useState('')
  const [customMessage, setCustomMessage] = useState('')

  const balance: number = walletData?.data?.wallet?.tokenBalance ?? 0
  const menuItems: any[] = menuData?.data?.items ?? []

  async function sendTip(amount: number, type: 'GENERAL' | 'MENU_ITEM' | 'CUSTOM', menuItemId?: string, requestText?: string) {
    if (balance < amount) {
      toast.error('Insufficient tokens')
      return
    }
    try {
      await mutation.mutateAsync({ roomId: roomId!, amountTokens: amount, requestType: type, menuItemId, requestText })
      toast.success(`Tipped ${amount} tokens!`)
      qc.invalidateQueries({ queryKey: ['wallet'] })
      navigate(-1)
    } catch {
      toast.error('Failed to send tip')
    }
  }

  if (menuLoading) return (
    <div className="space-y-4">
      <Skeleton className="h-6 w-32" />
      <div className="grid grid-cols-1 gap-2">
        {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-12 w-full rounded-lg" />)}
      </div>
    </div>
  )

  return (
    <div className="space-y-6 max-w-sm">
      <div>
        <button onClick={() => navigate(-1)} className="text-sm text-muted-foreground hover:text-foreground transition-colors">
          ← Back
        </button>
        <h1 className="text-xl font-semibold mt-2">Send Tip</h1>
        <p className="text-sm text-muted-foreground flex items-center gap-1 mt-0.5">
          <Coins className="h-3.5 w-3.5" />
          Balance: <strong>{balance.toLocaleString()}</strong> tokens
        </p>
      </div>

      {menuItems.length > 0 && (
        <div className="space-y-2">
          <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Creator Menu</p>
          <div className="grid gap-2">
            {menuItems.map((item: any) => (
              <button
                key={item.id}
                disabled={mutation.isPending || balance < item.tokenAmount}
                onClick={() => sendTip(item.tokenAmount, 'MENU_ITEM', item.id, item.label)}
                className="flex items-center justify-between w-full px-4 py-3 rounded-lg border border-border hover:border-primary/40 hover:bg-primary/5 transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-left"
              >
                <span className="text-sm font-medium">{item.label}</span>
                <span className="flex items-center gap-1 text-sm font-bold text-primary">
                  <Coins className="h-3.5 w-3.5" />
                  {item.tokenAmount.toLocaleString()}
                </span>
              </button>
            ))}
          </div>
        </div>
      )}

      <div className="space-y-2">
        <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Custom Tip</p>
        <div className="space-y-2">
          <Input
            type="number"
            min={1}
            placeholder="Amount"
            value={customAmount}
            onChange={e => setCustomAmount(e.target.value)}
          />
          <Input
            type="text"
            placeholder="Message (optional)"
            value={customMessage}
            onChange={e => setCustomMessage(e.target.value)}
            maxLength={300}
          />
          <Button
            className="w-full"
            loading={mutation.isPending}
            disabled={!customAmount || Number(customAmount) < 1 || balance < Number(customAmount)}
            onClick={() => sendTip(Number(customAmount), 'CUSTOM', undefined, customMessage || undefined)}
          >
            Send Tip
          </Button>
        </div>
      </div>
    </div>
  )
}
