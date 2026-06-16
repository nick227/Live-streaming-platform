import { useEffect } from 'react'
import { Link, useLocation, useNavigate, useSearchParams } from 'react-router-dom'
import { useQueryClient } from '@tanstack/react-query'
import { Button } from '@/components/ui/Button'
import { CheckCircle2, XCircle, Coins } from 'lucide-react'
import { getTokenPackReturnTarget } from '@/lib/paymentReturn'

export function PaymentReturnPage() {
  const [params] = useSearchParams()
  const location = useLocation()
  const navigate = useNavigate()
  const qc = useQueryClient()
  const returnTo = getTokenPackReturnTarget(location)

  const approved = params.get('approval') === '1' || params.get('status') === 'approved' || !params.get('denial')
  const denied = params.get('denial') === '1' || params.get('status') === 'denied'
  const success = approved && !denied

  useEffect(() => {
    if (success) {
      const t = setTimeout(() => {
        qc.invalidateQueries({ queryKey: ['wallet'] })
        navigate(returnTo, { replace: true })
      }, 2000)
      return () => clearTimeout(t)
    }
  }, [success, qc, navigate, returnTo])

  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] text-center space-y-6 px-4">
      {success ? (
        <>
          <CheckCircle2 className="h-16 w-16 text-green-500" />
          <div>
            <h1 className="text-2xl font-bold">Payment Received!</h1>
            <p className="text-muted-foreground mt-2">
              Your tokens are being added to your account. This may take a moment.
            </p>
          </div>
          <div className="flex gap-3">
            <Button asChild>
              <Link to={returnTo}>
                <Coins className="h-4 w-4 mr-1.5" />
                Return
              </Link>
            </Button>
            <Button asChild variant="outline">
              <Link to="/rooms">Browse Rooms</Link>
            </Button>
          </div>
        </>
      ) : (
        <>
          <XCircle className="h-16 w-16 text-destructive" />
          <div>
            <h1 className="text-2xl font-bold">Payment Not Completed</h1>
            <p className="text-muted-foreground mt-2">
              Your payment was cancelled or declined. No charges were made.
            </p>
          </div>
          <div className="flex gap-3">
            <Button asChild>
              <Link to="/token-packs" state={{ from: returnTo }}>Try Again</Link>
            </Button>
            <Button asChild variant="outline">
              <Link to="/rooms">Go to Rooms</Link>
            </Button>
          </div>
        </>
      )}
    </div>
  )
}
