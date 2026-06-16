import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'

export type TokenPackFormValues = {
  name: string
  priceCents: string
  tokenAmount: string
  bonusTokenAmount: string
  sortOrder: string
}

type TokenPackFormProps = {
  values: TokenPackFormValues
  setValue: (name: keyof TokenPackFormValues, value: string) => void
  onSubmit: (e: React.FormEvent) => void
  submitLabel: string
  loading?: boolean
  priceHint?: string
}

export function tokenPackInput(values: TokenPackFormValues) {
  return {
    name: values.name,
    priceCents: parseInt(values.priceCents, 10),
    tokenAmount: parseInt(values.tokenAmount, 10),
    bonusTokenAmount: parseInt(values.bonusTokenAmount || '0', 10),
    sortOrder: parseInt(values.sortOrder || '0', 10),
  }
}

export function TokenPackForm({
  values,
  setValue,
  onSubmit,
  submitLabel,
  loading,
  priceHint = 'Enter cents - e.g. 999 = $9.99',
}: TokenPackFormProps) {
  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <div className="space-y-1">
        <label className="text-sm font-medium">Name</label>
        <Input placeholder="e.g. Starter Pack" value={values.name} onChange={e => setValue('name', e.target.value)} />
      </div>
      <div className="space-y-1">
        <label className="text-sm font-medium">Price (cents USD)</label>
        <Input type="number" min="1" placeholder="999" value={values.priceCents} onChange={e => setValue('priceCents', e.target.value)} />
        <p className="text-xs text-muted-foreground">{priceHint}</p>
      </div>
      <div className="space-y-1">
        <label className="text-sm font-medium">Token Amount</label>
        <Input type="number" min="1" placeholder="1000" value={values.tokenAmount} onChange={e => setValue('tokenAmount', e.target.value)} />
      </div>
      <div className="space-y-1">
        <label className="text-sm font-medium">Bonus Tokens</label>
        <Input type="number" min="0" placeholder="0" value={values.bonusTokenAmount} onChange={e => setValue('bonusTokenAmount', e.target.value)} />
      </div>
      <div className="space-y-1">
        <label className="text-sm font-medium">Sort Order</label>
        <Input type="number" placeholder="0" value={values.sortOrder} onChange={e => setValue('sortOrder', e.target.value)} />
        <p className="text-xs text-muted-foreground">Lower numbers appear first</p>
      </div>
      <Button type="submit" loading={loading}>{submitLabel}</Button>
    </form>
  )
}
