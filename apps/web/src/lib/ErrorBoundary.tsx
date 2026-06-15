import React from 'react'
import { Button } from '@/components/ui/Button'

interface State {
  hasError: boolean
  error: Error | null
}

interface Props {
  children: React.ReactNode
}

export class ErrorBoundary extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props)
    this.state = { hasError: false, error: null }
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    console.error('[ErrorBoundary]', error, info.componentStack)
  }

  reset() {
    this.setState({ hasError: false, error: null })
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex flex-col items-center justify-center gap-4 py-24 text-center px-4">
          <p className="text-lg font-semibold">Something went wrong</p>
          {this.state.error?.message && (
            <p className="text-sm text-muted-foreground max-w-sm">{this.state.error.message}</p>
          )}
          <Button variant="outline" size="sm" onClick={() => this.reset()}>
            Try again
          </Button>
        </div>
      )
    }
    return this.props.children
  }
}
