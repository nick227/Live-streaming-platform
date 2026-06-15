import { useNavigate } from 'react-router-dom'
import { z } from 'zod'
import { usePrepareRoom, useRoomTaxonomy } from '@streamyolo/sdk'
import { Form } from '@/components/ui/Form'
import type { FieldConfig } from '@/components/ui/Form'
import { toast } from 'sonner'
import { useEffect, useRef, useState } from 'react'
import { POPULAR_COUNTRY_CODES } from '@streamyolo/shared/iso-countries'
import { MAX_ROOM_TAGS } from '@streamyolo/shared/room-taxonomy'
import { Button } from '@/components/ui/Button'
import { cn } from '@/lib/utils'

const schema = z.object({
  title: z.string().min(1).max(200),
  visibility: z.enum(['PUBLIC', 'UNLISTED']),
  category: z.enum(['MALE', 'FEMALE', 'COUPLES', 'TRANS']),
})
type FormData = z.infer<typeof schema>

const fields: FieldConfig[] = [
  { name: 'title', label: 'Room Title', type: 'text', voice: true, required: true },
  {
    name: 'visibility',
    label: 'Visibility',
    type: 'select',
    required: true,
    options: [
      { label: 'Public', value: 'PUBLIC' },
      { label: 'Unlisted', value: 'UNLISTED' },
    ],
  },
  {
    name: 'category',
    label: 'Category',
    type: 'select',
    required: true,
    options: [
      { label: 'Male', value: 'MALE' },
      { label: 'Female', value: 'FEMALE' },
      { label: 'Couples', value: 'COUPLES' },
      { label: 'Trans', value: 'TRANS' },
    ],
  },
]

function CameraPreview() {
  const videoRef = useRef<HTMLVideoElement>(null)

  useEffect(() => {
    let stream: MediaStream | null = null
    async function setupCamera() {
      try {
        stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true })
        if (videoRef.current) {
          videoRef.current.srcObject = stream
        }
      } catch (err) {
        console.error('Failed to access camera:', err)
      }
    }
    setupCamera()

    return () => {
      if (stream) {
        stream.getTracks().forEach((track) => track.stop())
      }
    }
  }, [])

  return (
    <div className="rounded-lg overflow-hidden bg-black aspect-video relative flex items-center justify-center">
      <video
        ref={videoRef}
        autoPlay
        playsInline
        muted
        className="w-full h-full object-cover transform scale-x-[-1]"
      />
      <div className="absolute bottom-2 left-2 right-2 text-white text-xs text-center drop-shadow-md bg-black/40 py-1 rounded">
        Camera & Mic Test
      </div>
    </div>
  )
}

export function PrepareRoomPage() {
  const navigate = useNavigate()
  const mutation = usePrepareRoom()
  const { data: taxonomyData } = useRoomTaxonomy()
  const taxonomy = taxonomyData?.data

  const [countryCode, setCountryCode] = useState('US')
  const [tagSlugs, setTagSlugs] = useState<string[]>([])
  const [saveAsDefaults, setSaveAsDefaults] = useState(true)

  const popularCountries = taxonomy?.countries.filter((country) =>
    POPULAR_COUNTRY_CODES.includes(country.code as (typeof POPULAR_COUNTRY_CODES)[number]),
  )

  function toggleTag(slug: string) {
    setTagSlugs((current) => {
      if (current.includes(slug)) return current.filter((item) => item !== slug)
      if (current.length >= MAX_ROOM_TAGS) {
        toast.error(`You can select up to ${MAX_ROOM_TAGS} tags`)
        return current
      }
      return [...current, slug]
    })
  }

  async function handleSubmit(values: FormData) {
    try {
      const result = await mutation.mutateAsync({
        ...values,
        countryCode,
        tagSlugs,
        saveAsDefaults,
      })
      toast.success('Room prepared')
      navigate(`/creator/rooms/${result.data.room.id}/go-live`)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to prepare room')
    }
  }

  return (
    <div className="space-y-6 max-w-2xl mx-auto">
      <div>
        <h1 className="text-xl font-semibold">New Room</h1>
        <p className="text-sm text-muted-foreground">
          Set up your room taxonomy, check equipment, then go live.
        </p>
      </div>

      <CameraPreview />

      <div className="space-y-4">
        <div className="space-y-2">
          <label className="text-sm font-medium" htmlFor="countryCode">
            Country of origin
          </label>
          <div className="flex flex-wrap gap-2">
            {popularCountries?.map((country) => (
              <Button
                key={country.code}
                type="button"
                size="sm"
                variant={countryCode === country.code ? 'default' : 'outline'}
                onClick={() => setCountryCode(country.code)}
              >
                {country.name}
              </Button>
            ))}
          </div>
          <select
            id="countryCode"
            className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
            value={countryCode}
            onChange={(event) => setCountryCode(event.target.value)}
          >
            {taxonomy?.countries.map((country) => (
              <option key={country.code} value={country.code}>
                {country.name}
              </option>
            ))}
          </select>
        </div>

        <div className="space-y-2">
          <p className="text-sm font-medium">Tags (optional)</p>
          <div className="flex flex-wrap gap-2 max-h-40 overflow-y-auto">
            {taxonomy?.tags.map((tag) => {
              const active = tagSlugs.includes(tag.slug)
              return (
                <button
                  key={tag.slug}
                  type="button"
                  onClick={() => toggleTag(tag.slug)}
                  className={cn(
                    'rounded-full border px-3 py-1 text-xs transition-colors',
                    active
                      ? 'border-primary bg-primary text-primary-foreground'
                      : 'border-border hover:border-primary/50',
                  )}
                >
                  {tag.label}
                </button>
              )
            })}
          </div>
        </div>

        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={saveAsDefaults}
            onChange={(event) => setSaveAsDefaults(event.target.checked)}
          />
          Remember category, country, and tags for future rooms
        </label>

        <Form<FormData>
          fields={fields}
          schema={schema}
          defaultValues={{ title: '', visibility: 'PUBLIC', category: 'FEMALE' }}
          onSubmit={handleSubmit}
          isLoading={mutation.isPending}
          submitLabel="Prepare Room"
        />
      </div>
    </div>
  )
}
