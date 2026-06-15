import { Coins } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/Card'
import { EmptyState } from '@/components/ui/EmptyState'
import { LedgerEntryRow } from './LedgerEntryRow'

interface LedgerListProps {
  ledger: any[]
  emptyTitle: string
  emptyDescription: string
}

export function LedgerList({ ledger, emptyTitle, emptyDescription }: LedgerListProps) {
  if (ledger.length === 0) {
    return <EmptyState icon={Coins} title={emptyTitle} description={emptyDescription} />
  }
  return (
    <Card>
      <CardContent className="py-2 px-4">
        {ledger.map((entry: any) => (
          <LedgerEntryRow key={entry.id} entry={entry} />
        ))}
      </CardContent>
    </Card>
  )
}
