import { useState, useEffect } from 'react'
import { useAdminSettings, useUpdateAdminSettings } from '@streamyolo/sdk'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { toast } from 'sonner'
import { Skeleton } from '@/components/ui/Skeleton'

export function AdminSettingsPage() {
  const { data, isLoading } = useAdminSettings()
  const updateSettings = useUpdateAdminSettings()
  const [provider, setProvider] = useState<'CCBILL' | 'DEMO'>('DEMO')

  useEffect(() => {
    if ((data as any)?.activePaymentProvider) {
      setProvider((data as any).activePaymentProvider)
    }
  }, [data])

  if (isLoading) return <Skeleton className="h-48" />

  const handleSave = async () => {
    try {
      await updateSettings.mutateAsync({ activePaymentProvider: provider })
      toast.success('Settings updated')
    } catch {
      toast.error('Failed to update settings')
    }
  }

  return (
    <div className="space-y-6">
      <h1 className="text-xl font-semibold">Settings</h1>
      
      <Card>
        <CardHeader>
          <CardTitle>Payment Provider</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Switching to DEMO will allow fake token purchases for user testing.
          </p>
          
          <div className="space-y-2">
            <label className="flex items-center gap-2">
              <input
                type="radio"
                name="provider"
                value="DEMO"
                checked={provider === 'DEMO'}
                onChange={(e) => setProvider(e.target.value as any)}
                className="h-4 w-4 text-primary"
              />
              <span className="text-sm font-medium">DEMO (Fake Money)</span>
            </label>
            <label className="flex items-center gap-2">
              <input
                type="radio"
                name="provider"
                value="CCBILL"
                checked={provider === 'CCBILL'}
                onChange={(e) => setProvider(e.target.value as any)}
                className="h-4 w-4 text-primary"
              />
              <span className="text-sm font-medium">CCBill (Real Money)</span>
            </label>
          </div>

          <Button onClick={handleSave} disabled={updateSettings.isPending}>
            Save Changes
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}
