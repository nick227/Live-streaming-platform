import { useNavigate } from 'react-router-dom'
import { useAdminCreateTokenPack } from '@streamyolo/sdk'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { toast } from 'sonner'
import { useState } from 'react'

export function AdminCreateTokenPackPage() {
  const navigate = useNavigate()
  const createPack = useAdminCreateTokenPack()

  const [name, setName] = useState('')
  const [priceCents, setPriceCents] = useState('')
  const [tokenAmount, setTokenAmount] = useState('')
  const [bonusTokenAmount, setBonusTokenAmount] = useState('0')
  const [sortOrder, setSortOrder] = useState('0')

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!name || !priceCents || !tokenAmount) {
      toast.error('Name, price, and token amount are required')
      return
    }
    try {
      await createPack.mutateAsync({
        name,
        priceCents: parseInt(priceCents, 10),
        tokenAmount: parseInt(tokenAmount, 10),
        bonusTokenAmount: parseInt(bonusTokenAmount || '0', 10),
        sortOrder: parseInt(sortOrder || '0', 10),
      })
      toast.success('Token pack created')
      navigate('/admin/token-packs')
    } catch {
      toast.error('Failed to create token pack')
    }
  }

  return (
    <div className="space-y-6 max-w-md">
      <div>
        <button onClick={() => navigate('/admin/token-packs')} className="text-sm text-muted-foreground hover:text-foreground transition-colors">
          ← Token Packs
        </button>
        <h1 className="text-xl font-semibold mt-2">New Token Pack</h1>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-1">
          <label className="text-sm font-medium">Name</label>
          <Input placeholder="e.g. Starter Pack" value={name} onChange={e => setName(e.target.value)} />
        </div>
        <div className="space-y-1">
          <label className="text-sm font-medium">Price (cents USD)</label>
          <Input type="number" min="1" placeholder="999" value={priceCents} onChange={e => setPriceCents(e.target.value)} />
          <p className="text-xs text-muted-foreground">Enter cents — e.g. 999 = $9.99</p>
        </div>
        <div className="space-y-1">
          <label className="text-sm font-medium">Token Amount</label>
          <Input type="number" min="1" placeholder="1000" value={tokenAmount} onChange={e => setTokenAmount(e.target.value)} />
        </div>
        <div className="space-y-1">
          <label className="text-sm font-medium">Bonus Tokens</label>
          <Input type="number" min="0" placeholder="0" value={bonusTokenAmount} onChange={e => setBonusTokenAmount(e.target.value)} />
        </div>
        <div className="space-y-1">
          <label className="text-sm font-medium">Sort Order</label>
          <Input type="number" placeholder="0" value={sortOrder} onChange={e => setSortOrder(e.target.value)} />
          <p className="text-xs text-muted-foreground">Lower numbers appear first</p>
        </div>
        <Button type="submit" loading={createPack.isPending}>Create Pack</Button>
      </form>
    </div>
  )
}
