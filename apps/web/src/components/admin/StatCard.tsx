import { type LucideIcon } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/Card'

interface StatCardProps {
  label: string
  value: number | string
  icon?: LucideIcon
  accent?: boolean
}

export function StatCard({ label, value, icon: Icon, accent }: StatCardProps) {
  return (
    <Card>
      <CardContent className="py-5 flex items-center gap-4">
        {Icon && (
          <div className={`p-2 rounded-lg ${accent ? 'bg-destructive/10 text-destructive' : 'bg-primary/10 text-primary'}`}>
            <Icon className="h-5 w-5" />
          </div>
        )}
        <div>
          <p className="text-2xl font-bold">{typeof value === 'number' ? value.toLocaleString() : value}</p>
          <p className="text-xs text-muted-foreground">{label}</p>
        </div>
      </CardContent>
    </Card>
  )
}
