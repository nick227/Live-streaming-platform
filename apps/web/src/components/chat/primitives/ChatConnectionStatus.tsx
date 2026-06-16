export function ChatConnectionStatus({ connected }: { connected: boolean }) {
  return (
    <span className="inline-flex items-center gap-1.5 text-xs text-muted-foreground">
      <span
        className={
          connected
            ? 'h-2 w-2 rounded-full bg-emerald-500 shadow-[0_0_6px_hsl(160_84%_39%_/_0.6)] animate-pulse'
            : 'h-2 w-2 rounded-full bg-muted-foreground/40'
        }
        aria-hidden
      />
      {connected ? 'Live' : 'Connecting…'}
    </span>
  )
}
