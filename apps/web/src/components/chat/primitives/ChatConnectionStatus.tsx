export function ChatConnectionStatus({ connected }: { connected: boolean }) {
  return (
    <span className="text-xs text-muted-foreground">
      {connected ? 'Live' : 'Connecting...'}
    </span>
  )
}
