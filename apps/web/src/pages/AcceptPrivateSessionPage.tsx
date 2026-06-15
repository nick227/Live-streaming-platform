import { useNavigate, useParams } from 'react-router-dom'
import { useAcceptPrivateSession } from '@streamyolo/sdk'
import { Button } from '@/components/ui/Button'
import { toast } from 'sonner'

export function AcceptPrivateSessionPage() {
  const navigate = useNavigate()
  const { sessionId } = useParams<{ sessionId: string }>()
  const mutation = useAcceptPrivateSession()

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-semibold">Accept Private Session</h1>
      <Button
        onClick={async () => {
          try {
            await mutation.mutateAsync(sessionId!)
            toast.success('Session accepted')
            navigate(-1)
          } catch {
            toast.error('Failed to accept session')
          }
        }}
        loading={mutation.isPending}
      >
        Accept Session
      </Button>
    </div>
  )
}
