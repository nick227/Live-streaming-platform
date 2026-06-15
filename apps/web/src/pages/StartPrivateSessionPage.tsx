import { useNavigate, useParams } from 'react-router-dom'
import { useStartPrivateSession } from '@streamyolo/sdk'
import { Button } from '@/components/ui/Button'
import { toast } from 'sonner'

export function StartPrivateSessionPage() {
  const navigate = useNavigate()
  const { sessionId } = useParams<{ sessionId: string }>()
  const mutation = useStartPrivateSession()

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-semibold">Start Private Session</h1>
      <Button
        onClick={async () => {
          try {
            await mutation.mutateAsync(sessionId!)
            toast.success('Session started')
            navigate(-1)
          } catch {
            toast.error('Failed to start session')
          }
        }}
        loading={mutation.isPending}
      >
        Start Session
      </Button>
    </div>
  )
}
