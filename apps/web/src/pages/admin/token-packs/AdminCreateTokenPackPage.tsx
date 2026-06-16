import { useNavigate } from 'react-router-dom'
import { useAdminCreateTokenPack } from '@streamyolo/sdk'
import { toast } from 'sonner'
import { useState } from 'react'
import { TokenPackForm, tokenPackInput, type TokenPackFormValues } from './TokenPackForm'

const initialValues: TokenPackFormValues = {
  name: '',
  priceCents: '',
  tokenAmount: '',
  bonusTokenAmount: '0',
  sortOrder: '0',
}

export function AdminCreateTokenPackPage() {
  const navigate = useNavigate()
  const createPack = useAdminCreateTokenPack()
  const [values, setValues] = useState<TokenPackFormValues>(initialValues)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!values.name || !values.priceCents || !values.tokenAmount) {
      toast.error('Name, price, and token amount are required')
      return
    }
    try {
      await createPack.mutateAsync(tokenPackInput(values))
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

      <TokenPackForm
        values={values}
        setValue={(name, value) => setValues((prev) => ({ ...prev, [name]: value }))}
        onSubmit={handleSubmit}
        submitLabel="Create Pack"
        loading={createPack.isPending}
      />
    </div>
  )
}
