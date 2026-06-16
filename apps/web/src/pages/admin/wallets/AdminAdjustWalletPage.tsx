import { useNavigate, useParams } from 'react-router-dom'
import { useState } from 'react'
import { useAdminGrantTokens, useAdminRevokeTokens, useAdminResetWallet } from '@streamyolo/sdk'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Textarea } from '@/components/ui/Textarea'
import { toast } from 'sonner'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'

export function AdminAdjustWalletPage() {
  const navigate = useNavigate()
  const { userId } = useParams<{ userId: string }>()
  
  const grantTokens = useAdminGrantTokens()
  const revokeTokens = useAdminRevokeTokens()
  const resetWallet = useAdminResetWallet()

  const [amountTokens, setAmountTokens] = useState('')
  const [reason, setReason] = useState('')

  const handleGrant = async () => {
    if (!amountTokens || !reason) return toast.error('Fill in amount and reason')
    try {
      await grantTokens.mutateAsync({ userId: userId!, amountTokens: parseInt(amountTokens, 10), reason })
      toast.success('Tokens granted')
      navigate(-1)
    } catch {
      toast.error('Failed to grant tokens')
    }
  }

  const handleRevoke = async () => {
    if (!amountTokens || !reason) return toast.error('Fill in amount and reason')
    try {
      await revokeTokens.mutateAsync({ userId: userId!, amountTokens: parseInt(amountTokens, 10), reason })
      toast.success('Tokens revoked')
      navigate(-1)
    } catch {
      toast.error('Failed to revoke tokens')
    }
  }

  const handleReset = async () => {
    if (!reason) return toast.error('Fill in reason for reset')
    try {
      await resetWallet.mutateAsync({ userId: userId!, reason })
      toast.success('Wallet reset to 0')
      navigate(-1)
    } catch {
      toast.error('Failed to reset wallet')
    }
  }

  return (
    <div className="space-y-6">
      <h1 className="text-xl font-semibold">Adjust Wallet</h1>
      
      <Card>
        <CardHeader>
          <CardTitle>Grant or Revoke Tokens</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <label htmlFor="amountTokens" className="text-sm font-medium">Amount</label>
            <Input id="amountTokens" type="number" min="1" value={amountTokens} onChange={e => setAmountTokens(e.target.value)} placeholder="e.g. 500" />
          </div>
          <div className="space-y-2">
            <label htmlFor="reason" className="text-sm font-medium">Reason</label>
            <Textarea id="reason" rows={3} value={reason} onChange={e => setReason(e.target.value)} placeholder="Why is this adjustment being made?" />
          </div>
          <div className="flex gap-4">
            <Button onClick={handleGrant} disabled={grantTokens.isPending}>Grant Tokens</Button>
            <Button onClick={handleRevoke} disabled={revokeTokens.isPending} variant="outline">Revoke Tokens</Button>
          </div>
        </CardContent>
      </Card>

      <Card className="border-destructive/50">
        <CardHeader>
          <CardTitle className="text-destructive">Reset Wallet</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">This will wipe the token balance to 0 and append a TEST_RESET ledger entry.</p>
          <div className="space-y-2">
            <label htmlFor="resetReason" className="text-sm font-medium">Reset Reason</label>
            <Textarea id="resetReason" rows={2} value={reason} onChange={e => setReason(e.target.value)} placeholder="Reason for reset" />
          </div>
          <Button onClick={handleReset} disabled={resetWallet.isPending} variant="destructive">Reset to 0</Button>
        </CardContent>
      </Card>
    </div>
  )
}
