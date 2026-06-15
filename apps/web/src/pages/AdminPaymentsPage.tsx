import { Link } from 'react-router-dom'
import { useAdminPayments } from '@streamyolo/sdk'
import { StatusBadge } from '@/components/admin/StatusBadge'
import { AdminListPage } from '@/components/admin/AdminListPage'
import { CreditCard } from 'lucide-react'

export function AdminPaymentsPage() {
  const { data, isLoading } = useAdminPayments()
  const items = (data?.data as any[]) ?? []

  return (
    <AdminListPage
      title="Payments"
      isLoading={isLoading}
      items={items}
      emptyIcon={CreditCard}
      emptyTitle="No payments"
      emptyDescription="Payment transactions will appear here."
      renderItem={(txn: any) => (
        <div key={txn.id} className="flex items-center justify-between py-3 gap-3">
          <div className="flex-1 min-w-0">
            <Link to={`/admin/payments/${txn.id}`} className="font-medium hover:underline block">
              ${((txn.amountCents ?? 0) / 100).toFixed(2)} {txn.currency}
            </Link>
            <p className="text-xs text-muted-foreground">
              {txn.tokensCredited?.toLocaleString()} tokens · {new Date(txn.createdAt).toLocaleDateString()}
            </p>
          </div>
          <StatusBadge status={txn.status} />
        </div>
      )}
    />
  )
}
