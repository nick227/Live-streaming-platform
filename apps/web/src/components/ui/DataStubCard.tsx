import { Card, CardContent } from './Card'
import { Skeleton } from './Skeleton'

interface DataStubCardProps {
  title: string
  isLoading: boolean
  data: unknown
}

export function DataStubCard({ title, isLoading, data }: DataStubCardProps) {
  if (isLoading) return <Skeleton className="h-48 w-full" />
  if (!data) return <p className="text-muted-foreground">Not found.</p>
  return (
    <div className="space-y-4">
      <h1 className="text-xl font-semibold">{title}</h1>
      <Card>
        <CardContent className="py-4">
          <pre className="text-xs text-muted-foreground overflow-auto">
            {JSON.stringify(data, null, 2)}
          </pre>
        </CardContent>
      </Card>
    </div>
  )
}
