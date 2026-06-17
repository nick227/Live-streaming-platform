import { useEffect } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { Ban, Coins, ExternalLink, RefreshCw, X } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/Button'
import { Skeleton } from '@/components/ui/Skeleton'
import { rememberTokenPackReturnTarget } from '@/lib/paymentReturn'
import { useCreateCheckout, usePlatformSettings, useTokenPacks, useWallet } from '@streamyolo/sdk'
import type { components } from '@streamyolo/sdk'

type TokenPack = components['schemas']['TokenPackDto']

function getErrorMessage(error: unknown, fallback: string) {
  return error instanceof Error && error.message ? error.message : fallback
}

function currentRoute() {
  return `${window.location.pathname}${window.location.search}${window.location.hash}`
}

function formatUsd(cents: number) {
  return `$${(cents / 100).toFixed(2)}`
}

export function TokenPurchaseModal({
  open,
  onOpenChange,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
}) {
  const qc = useQueryClient()
  const { data: walletData, isFetching: walletFetching } = useWallet()
  const { data: settingsData, isLoading: settingsLoading } = usePlatformSettings()
  const { data: packsData, isLoading: packsLoading } = useTokenPacks()
  const checkout = useCreateCheckout()

  useEffect(() => {
    if (!open) return
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onOpenChange(false)
    }
    document.addEventListener('keydown', onKeyDown)
    return () => document.removeEventListener('keydown', onKeyDown)
  }, [onOpenChange, open])

  if (!open) return null

  const balance = walletData?.data?.wallet.tokenBalance ?? 0
  const tokenPurchasesEnabled = (settingsData as any)?.tokenPurchasesEnabled ?? true
  const activeProvider = (settingsData as any)?.activePaymentProvider ?? 'DEMO'
  const packs = (packsData?.data ?? []) as TokenPack[]
  const isLoading = settingsLoading || packsLoading

  async function refreshWallet() {
    await qc.invalidateQueries({ queryKey: ['wallet'] })
    toast.success('Wallet refreshed')
  }

  async function buyPack(pack: TokenPack) {
    try {
      rememberTokenPackReturnTarget(currentRoute())
      const result = await checkout.mutateAsync({ tokenPackId: pack.id })

      if (result.checkoutUrl) {
        window.open(result.checkoutUrl, '_blank', 'noopener,noreferrer')
        toast.info('Checkout opened in a new tab')
        return
      }

      if (result.status === 'APPROVED') {
        await qc.invalidateQueries({ queryKey: ['wallet'] })
        toast.success(`Purchased ${result.tokensCredited ?? 0} tokens`)
      }
    } catch (err) {
      toast.error(getErrorMessage(err, 'Failed to start checkout'))
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4 py-6"
      role="dialog"
      aria-modal="true"
      aria-labelledby="token-purchase-title"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onOpenChange(false)
      }}
    >
      <div className="w-full max-w-md rounded-lg border bg-card text-card-foreground shadow-xl">
        <div className="flex items-start justify-between gap-4 border-b p-4">
          <div>
            <h2 id="token-purchase-title" className="text-base font-semibold">
              Buy Tokens
            </h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Balance: <span className="font-semibold text-foreground">{balance.toLocaleString()}</span> tokens
            </p>
          </div>
          <Button variant="ghost" size="icon" onClick={() => onOpenChange(false)} aria-label="Close token purchase">
            <X className="h-4 w-4" />
          </Button>
        </div>

        <div className="max-h-[70vh] space-y-3 overflow-y-auto p-4">
          {!tokenPurchasesEnabled ? (
            <div className="flex flex-col items-center gap-2 py-8 text-center">
              <Ban className="h-8 w-8 text-muted-foreground" />
              <p className="text-sm font-medium">Token purchases are currently unavailable</p>
              <p className="text-xs text-muted-foreground">Please check back later.</p>
            </div>
          ) : isLoading ? (
            <div className="space-y-2">
              {Array.from({ length: 3 }).map((_, index) => (
                <Skeleton key={index} className="h-20 w-full rounded-lg" />
              ))}
            </div>
          ) : packs.length === 0 ? (
            <div className="flex flex-col items-center gap-2 py-8 text-center">
              <Coins className="h-8 w-8 text-muted-foreground" />
              <p className="text-sm font-medium">No token packs available</p>
              <p className="text-xs text-muted-foreground">Check back soon.</p>
            </div>
          ) : (
            <div className="space-y-2">
              {packs.map((pack) => {
                const totalTokens = pack.tokenAmount + pack.bonusTokenAmount
                return (
                  <button
                    key={pack.id}
                    type="button"
                    className="flex w-full items-center justify-between gap-3 rounded-lg border bg-background p-3 text-left transition-colors hover:bg-accent disabled:pointer-events-none disabled:opacity-60"
                    disabled={checkout.isPending}
                    onClick={() => buyPack(pack)}
                  >
                    <span className="min-w-0">
                      <span className="block truncate text-sm font-semibold">{pack.name}</span>
                      <span className="mt-1 flex items-center gap-1 text-sm text-muted-foreground">
                        <Coins className="h-3.5 w-3.5 text-amber-500" />
                        {totalTokens.toLocaleString()} tokens
                      </span>
                    </span>
                    <span className="flex shrink-0 items-center gap-2 text-sm font-semibold">
                      {formatUsd(pack.priceCents)}
                      {activeProvider === 'CCBILL' && <ExternalLink className="h-3.5 w-3.5 text-muted-foreground" />}
                    </span>
                  </button>
                )
              })}
            </div>
          )}
        </div>

        <div className="flex items-center justify-between gap-3 border-t p-4">
          <p className="text-xs text-muted-foreground">
            {activeProvider === 'CCBILL' ? 'External checkout opens separately.' : 'Demo purchases credit instantly.'}
          </p>
          <Button variant="outline" size="sm" onClick={refreshWallet} loading={walletFetching}>
            <RefreshCw className="h-3.5 w-3.5" />
            Refresh
          </Button>
        </div>
      </div>
    </div>
  )
}
