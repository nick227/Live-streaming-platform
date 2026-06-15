import { Card, CardContent } from './Card'

interface AuthPageShellProps {
  title: string
  children: React.ReactNode
  footer?: React.ReactNode
}

export function AuthPageShell({ title, children, footer }: AuthPageShellProps) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4">
      <div className="w-full max-w-sm space-y-6">
        <div className="text-center">
          <h1 className="text-2xl font-semibold">{title}</h1>
        </div>
        <Card>
          <CardContent className="py-6">{children}</CardContent>
        </Card>
        {footer && (
          <p className="text-center text-sm text-muted-foreground">{footer}</p>
        )}
      </div>
    </div>
  )
}
