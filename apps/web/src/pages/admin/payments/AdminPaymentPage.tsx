import { useParams } from 'react-router-dom'
import { useAdminPayment } from '@streamyolo/sdk'
import { StatusBadge } from '@/components/admin/StatusBadge'
import { Card, CardContent } from '@/components/ui/Card'
import { Skeleton } from '@/components/ui/Skeleton'

export function AdminPaymentPage() {
  const { paymentId } = useParams<{ paymentId: string }>()
  const { data, isLoading } = useAdminPayment(paymentId!)

  if (isLoading) return <Skeleton className="h-64 w-full" />

  const txn = (data as any)?.data
  if (!txn) return <p className="text-muted-foreground">Payment not found.</p>

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-xl font-semibold">
            ${((txn.amountCents ?? 0) / 100).toFixed(2)} {txn.currency}
          </h1>
          <p className="text-sm text-muted-foreground">{txn.provider}</p>
        </div>
        <StatusBadge status={txn.status} />
      </div>

      <Card>
        <CardContent className="py-4">
          <dl className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
            <dt className="text-muted-foreground">Tokens credited</dt>
            <dd>{txn.tokensCredited?.toLocaleString()}</dd>
            <dt className="text-muted-foreground">User</dt>
            <dd className="truncate">{txn.userId}</dd>
            <dt className="text-muted-foreground">Token pack</dt>
            <dd className="truncate">{txn.tokenPackId}</dd>
            {txn.providerTxnId && (
              <>
                <dt className="text-muted-foreground">Provider TXN</dt>
                <dd className="truncate font-mono text-xs">{txn.providerTxnId}</dd>
              </>
            )}
            <dt className="text-muted-foreground">Created</dt>
            <dd>{new Date(txn.createdAt).toLocaleString()}</dd>
            {txn.approvedAt && (
              <>
                <dt className="text-muted-foreground">Approved</dt>
                <dd>{new Date(txn.approvedAt).toLocaleString()}</dd>
              </>
            )}
          </dl>
        </CardContent>
      </Card>
    </div>
  )
}
