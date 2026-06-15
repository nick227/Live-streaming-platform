import { useTokenPacks, useCreateCcbillCheckout } from '@streamyolo/sdk'
import { TokenPackCard } from '@/components/tokens/TokenPackCard'
import { Skeleton } from '@/components/ui/Skeleton'
import { EmptyState } from '@/components/ui/EmptyState'
import { Coins } from 'lucide-react'
import { toast } from 'sonner'

export function TokenPacksPage() {
  const { data, isLoading } = useTokenPacks()
  const checkout = useCreateCcbillCheckout()

  if (isLoading) return (
    <div className="space-y-4">
      <Skeleton className="h-6 w-32" />
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-48 rounded-xl" />)}
      </div>
    </div>
  )

  const packs: any[] = (data?.data as any[]) ?? []

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold">Buy Tokens</h1>
        <p className="text-sm text-muted-foreground mt-1">Tokens are used to tip creators and unlock private sessions.</p>
      </div>

      {packs.length === 0 ? (
        <EmptyState
          icon={Coins}
          title="No token packs available"
          description="Check back soon."
        />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {packs.map((pack: any) => (
            <TokenPackCard
              key={pack.id}
              pack={pack}
              isBuying={checkout.isPending}
              onBuy={async () => {
                try {
                  const result = await checkout.mutateAsync({ tokenPackId: pack.id }) as any
                  if (result?.checkoutUrl) window.location.href = result.checkoutUrl
                } catch {
                  toast.error('Failed to start checkout')
                }
              }}
            />
          ))}
        </div>
      )}
    </div>
  )
}
