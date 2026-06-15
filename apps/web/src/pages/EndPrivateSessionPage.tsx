import { useNavigate, useParams } from 'react-router-dom'
import { useEndPrivateSession } from '@streamyolo/sdk'
import { Button } from '@/components/ui/Button'
import { toast } from 'sonner'

export function EndPrivateSessionPage() {
  const navigate = useNavigate()
  const { sessionId } = useParams<{ sessionId: string }>()
  const mutation = useEndPrivateSession()

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-semibold">End Private Session</h1>
      <Button
        variant="destructive"
        onClick={async () => {
          try {
            await mutation.mutateAsync(sessionId!)
            toast.success('Session ended')
            navigate(-1)
          } catch {
            toast.error('Failed to end session')
          }
        }}
        loading={mutation.isPending}
      >
        End Session
      </Button>
    </div>
  )
}
