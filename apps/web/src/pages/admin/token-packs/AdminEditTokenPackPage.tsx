import { useNavigate, useParams } from 'react-router-dom'
import { useAdminTokenPacks, useAdminUpdateTokenPack } from '@streamyolo/sdk'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Skeleton } from '@/components/ui/Skeleton'
import { toast } from 'sonner'
import { useState, useEffect } from 'react'

export function AdminEditTokenPackPage() {
  const navigate = useNavigate()
  const { packId } = useParams<{ packId: string }>()
  const { data, isLoading } = useAdminTokenPacks()
  const updatePack = useAdminUpdateTokenPack()

  const packs: any[] = (data as any)?.data ?? []
  const pack = packs.find((p: any) => p.id === packId)

  const [name, setName] = useState('')
  const [priceCents, setPriceCents] = useState('')
  const [tokenAmount, setTokenAmount] = useState('')
  const [bonusTokenAmount, setBonusTokenAmount] = useState('0')
  const [sortOrder, setSortOrder] = useState('0')

  useEffect(() => {
    if (pack) {
      setName(pack.name)
      setPriceCents(String(pack.priceCents))
      setTokenAmount(String(pack.tokenAmount))
      setBonusTokenAmount(String(pack.bonusTokenAmount))
      setSortOrder(String(pack.sortOrder))
    }
  }, [pack])

  if (isLoading) return <Skeleton className="h-64 w-full rounded-xl" />
  if (!pack) return <p className="text-muted-foreground">Pack not found.</p>

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    try {
      await updatePack.mutateAsync({
        packId: packId!,
        name,
        priceCents: parseInt(priceCents, 10),
        tokenAmount: parseInt(tokenAmount, 10),
        bonusTokenAmount: parseInt(bonusTokenAmount || '0', 10),
        sortOrder: parseInt(sortOrder || '0', 10),
      })
      toast.success('Token pack updated')
      navigate('/admin/token-packs')
    } catch {
      toast.error('Failed to update token pack')
    }
  }

  return (
    <div className="space-y-6 max-w-md">
      <div>
        <button onClick={() => navigate('/admin/token-packs')} className="text-sm text-muted-foreground hover:text-foreground transition-colors">
          ← Token Packs
        </button>
        <h1 className="text-xl font-semibold mt-2">Edit Token Pack</h1>
        <p className="text-xs text-muted-foreground font-mono mt-0.5">{packId}</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-1">
          <label className="text-sm font-medium">Name</label>
          <Input placeholder="e.g. Starter Pack" value={name} onChange={e => setName(e.target.value)} />
        </div>
        <div className="space-y-1">
          <label className="text-sm font-medium">Price (cents USD)</label>
          <Input type="number" min="1" value={priceCents} onChange={e => setPriceCents(e.target.value)} />
          <p className="text-xs text-muted-foreground">{priceCents ? `$${(parseInt(priceCents) / 100).toFixed(2)}` : ''}</p>
        </div>
        <div className="space-y-1">
          <label className="text-sm font-medium">Token Amount</label>
          <Input type="number" min="1" value={tokenAmount} onChange={e => setTokenAmount(e.target.value)} />
        </div>
        <div className="space-y-1">
          <label className="text-sm font-medium">Bonus Tokens</label>
          <Input type="number" min="0" value={bonusTokenAmount} onChange={e => setBonusTokenAmount(e.target.value)} />
        </div>
        <div className="space-y-1">
          <label className="text-sm font-medium">Sort Order</label>
          <Input type="number" value={sortOrder} onChange={e => setSortOrder(e.target.value)} />
        </div>
        <Button type="submit" loading={updatePack.isPending}>Save Changes</Button>
      </form>
    </div>
  )
}
