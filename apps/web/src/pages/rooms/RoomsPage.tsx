import { useState, useEffect, useMemo } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useRooms, useRoomTaxonomy } from '@streamyolo/sdk'
import { RoomCard } from '@/components/rooms/RoomCard'
import { Skeleton } from '@/components/ui/Skeleton'
import { EmptyState } from '@/components/ui/EmptyState'
import { Input } from '@/components/ui/Input'
import { Button } from '@/components/ui/Button'
import { Radio, Plus } from 'lucide-react'
import {
  browseFiltersToQuery,
  buildBrowsePath,
  legacyBrowseSearchToPath,
  parseBrowsePath,
  type BrowseFilters,
} from '@/lib/roomBrowseRoutes'
import type { RoomCategory } from '@streamyolo/shared/room-taxonomy'
import { POPULAR_COUNTRY_CODES } from '@streamyolo/shared/iso-countries'
import { cn } from '@/lib/utils'

function toggleValue<T>(list: T[], value: T): T[] {
  return list.includes(value) ? list.filter((item) => item !== value) : [...list, value]
}

export function RoomsPage() {
  const location = useLocation()
  const navigate = useNavigate()

  const filters = useMemo(
    () => parseBrowsePath(location.pathname, location.search),
    [location.pathname, location.search],
  )

  useEffect(() => {
    const legacyPath = legacyBrowseSearchToPath(location.search)
    if (!legacyPath || legacyPath === `${location.pathname}${location.search}`) return
    navigate(legacyPath, { replace: true })
  }, [location.pathname, location.search, navigate])

  const [qInput, setQInput] = useState(filters.q ?? '')
  useEffect(() => {
    setQInput(filters.q ?? '')
  }, [filters.q])

  const queryParams = browseFiltersToQuery(filters)
  const { data, isLoading } = useRooms(
    Object.keys(queryParams).length > 0 ? queryParams : undefined,
  )
  const { data: taxonomyData } = useRoomTaxonomy()

  const taxonomy = taxonomyData?.data
  const rooms = (data?.data as Array<Record<string, unknown>>) ?? []

  function applyFilters(next: BrowseFilters) {
    navigate(buildBrowsePath(next))
  }

  function toggleCategory(value: RoomCategory) {
    applyFilters({ ...filters, categories: toggleValue(filters.categories, value) })
  }

  function toggleCountry(code: string) {
    applyFilters({ ...filters, countries: toggleValue(filters.countries, code) })
  }

  function toggleTag(slug: string) {
    applyFilters({ ...filters, tags: toggleValue(filters.tags, slug) })
  }

  function submitSearch() {
    applyFilters({ ...filters, q: qInput.trim() || undefined })
  }

  const popularCountries = taxonomy?.countries.filter((country) =>
    POPULAR_COUNTRY_CODES.includes(country.code as (typeof POPULAR_COUNTRY_CODES)[number]),
  )

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-10 w-full" />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="aspect-video rounded-lg" />
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2">
        {taxonomy?.categories.map((category) => {
          const active = filters.categories.includes(category.value as RoomCategory)
          return (
            <Button
              key={category.value}
              size="sm"
              variant={active ? 'default' : 'outline'}
              onClick={() => toggleCategory(category.value as RoomCategory)}
            >
              {category.label}
            </Button>
          )
        })}
        {(filters.categories.length > 0 || filters.countries.length > 0 || filters.tags.length > 0) && (
          <Button
            size="sm"
            variant="ghost"
            onClick={() => applyFilters({ categories: [], countries: [], tags: [], q: filters.q })}
          >
            Clear filters
          </Button>
        )}
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-2">
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Country</p>
          <div className="flex flex-wrap gap-2">
            {popularCountries?.map((country) => {
              const active = filters.countries.includes(country.code)
              return (
                <button
                  key={country.code}
                  type="button"
                  onClick={() => toggleCountry(country.code)}
                  className={cn(
                    'rounded-full border px-3 py-1 text-xs transition-colors',
                    active
                      ? 'border-primary bg-primary text-primary-foreground'
                      : 'border-border hover:border-primary/50',
                  )}
                >
                  {country.name}
                </button>
              )
            })}
          </div>
          <select
            className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
            value=""
            onChange={(event) => {
              if (event.target.value) toggleCountry(event.target.value)
            }}
          >
            <option value="">All countries…</option>
            {taxonomy?.countries.map((country) => (
              <option key={country.code} value={country.code}>
                {country.name}
              </option>
            ))}
          </select>
        </div>

        <div className="space-y-2">
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Tags</p>
          <div className="flex flex-wrap gap-2 max-h-32 overflow-y-auto">
            {taxonomy?.tags.map((tag) => {
              const active = filters.tags.includes(tag.slug)
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
      </div>

      <div className="flex items-center gap-3">
        <Input
          value={qInput}
          onChange={(e) => setQInput(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && submitSearch()}
          placeholder="Search live rooms..."
          className="flex-1"
        />
        <Button size="md" variant="outline" onClick={submitSearch}>
          Search
        </Button>
        <Button asChild size="md" variant="outline">
          <Link to="/creator/rooms/prepare">
            <Plus className="h-4 w-4 mr-1" />
            New Room
          </Link>
        </Button>
      </div>

      {rooms.length === 0 ? (
        <EmptyState
          icon={Radio}
          title="No live rooms right now"
          description="Try different filters or start your own stream."
        />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {rooms.map((room) => (
            <RoomCard key={String(room.id)} room={room as Parameters<typeof RoomCard>[0]['room']} />
          ))}
        </div>
      )}
    </div>
  )
}
