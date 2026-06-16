import { useNavigate, useParams } from 'react-router-dom'
import { useAdminTokenPacks, useAdminUpdateTokenPack } from '@streamyolo/sdk'
import { Skeleton } from '@/components/ui/Skeleton'
import { toast } from 'sonner'
import { useState, useEffect } from 'react'
import { TokenPackForm, tokenPackInput, type TokenPackFormValues } from './TokenPackForm'

export function AdminEditTokenPackPage() {
  const navigate = useNavigate()
  const { packId } = useParams<{ packId: string }>()
  const { data, isLoading } = useAdminTokenPacks()
  const updatePack = useAdminUpdateTokenPack()

  const packs: any[] = (data as any)?.data ?? []
  const pack = packs.find((p: any) => p.id === packId)

  const [values, setValues] = useState<TokenPackFormValues>({
    name: '',
    priceCents: '',
    tokenAmount: '',
    bonusTokenAmount: '0',
    sortOrder: '0',
  })

  useEffect(() => {
    if (pack) {
      setValues({
        name: pack.name,
        priceCents: String(pack.priceCents),
        tokenAmount: String(pack.tokenAmount),
        bonusTokenAmount: String(pack.bonusTokenAmount),
        sortOrder: String(pack.sortOrder),
      })
    }
  }, [pack])

  if (isLoading) return <Skeleton className="h-64 w-full rounded-xl" />
  if (!pack) return <p className="text-muted-foreground">Pack not found.</p>

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    try {
      await updatePack.mutateAsync({
        packId: packId!,
        ...tokenPackInput(values),
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

      <TokenPackForm
        values={values}
        setValue={(name, value) => setValues((prev) => ({ ...prev, [name]: value }))}
        onSubmit={handleSubmit}
        submitLabel="Save Changes"
        loading={updatePack.isPending}
        priceHint={values.priceCents ? `$${(parseInt(values.priceCents, 10) / 100).toFixed(2)}` : ''}
      />
    </div>
  )
}
