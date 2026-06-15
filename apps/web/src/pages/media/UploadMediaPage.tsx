import { useNavigate } from 'react-router-dom'
import { useRef } from 'react'
import { useUploadMedia } from '@streamyolo/sdk'
import { Button } from '@/components/ui/Button'
import { toast } from 'sonner'

export function UploadMediaPage() {
  const navigate = useNavigate()
  const fileRef = useRef<HTMLInputElement>(null)
  const mutation = useUploadMedia()

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-semibold">Upload Media</h1>
      <input ref={fileRef} type="file" className="block w-full text-sm text-muted-foreground" />
      <Button
        onClick={async () => {
          const file = fileRef.current?.files?.[0]
          if (!file) { toast.error('Select a file first'); return }
          const fd = new FormData()
          fd.append('file', file)
          try {
            await mutation.mutateAsync(fd)
            toast.success('Media uploaded')
            navigate(-1)
          } catch {
            toast.error('Upload failed')
          }
        }}
        loading={mutation.isPending}
      >
        Upload
      </Button>
    </div>
  )
}
