export type BrowseFilters = {
  categories: string[]
  countries: string[]
  tags: string[]
  q?: string
}

function splitSegment(value: string): string[] {
  return value.split('+').map((part) => part.trim()).filter(Boolean)
}

export function parseBrowsePath(pathname: string, search = ''): BrowseFilters {
  const filters: BrowseFilters = { categories: [], countries: [], tags: [] }
  const segments = pathname.replace(/\/+$/, '').split('/').filter(Boolean)
  if (segments[0] !== 'rooms') return filters

  let index = 1
  while (index < segments.length) {
    const key = segments[index]
    const rawValue = segments[index + 1]
    if (!rawValue) break

    if (key === 'c') {
      filters.categories = splitSegment(rawValue)
      index += 2
      continue
    }

    if (key === 'country') {
      filters.countries = splitSegment(rawValue).map((code) => code.toUpperCase())
      index += 2
      continue
    }

    if (key === 't') {
      filters.tags = splitSegment(rawValue)
      index += 2
      continue
    }

    break
  }

  const params = new URLSearchParams(search.startsWith('?') ? search.slice(1) : search)
  const q = params.get('q')?.trim()
  if (q) filters.q = q

  return filters
}

export function buildBrowsePath(filters: BrowseFilters): string {
  const segments = ['/rooms']

  if (filters.categories.length > 0) {
    segments.push('c', filters.categories.join('+'))
  }
  if (filters.countries.length > 0) {
    segments.push('country', filters.countries.map((code) => code.toLowerCase()).join('+'))
  }
  if (filters.tags.length > 0) {
    segments.push('t', filters.tags.join('+'))
  }

  const path = segments.join('/')
  if (filters.q?.trim()) {
    return `${path}?q=${encodeURIComponent(filters.q.trim())}`
  }
  return path
}

export function browseFiltersToQuery(filters: BrowseFilters) {
  return {
    ...(filters.categories.length ? { category: filters.categories } : {}),
    ...(filters.countries.length ? { country: filters.countries } : {}),
    ...(filters.tags.length ? { tag: filters.tags } : {}),
    ...(filters.q?.trim() ? { q: filters.q.trim() } : {}),
  }
}

/** Legacy query URLs → friendly path (e.g. ?category=female → /rooms/c/female) */
export function legacyBrowseSearchToPath(search: string): string | null {
  const params = new URLSearchParams(search.startsWith('?') ? search.slice(1) : search)
  const categories = params.getAll('category').map((v) => v.toLowerCase()).filter(Boolean)
  const countries = params.getAll('country').map((code) => code.toUpperCase()).filter(Boolean)
  const tags = params.getAll('tag').filter(Boolean)
  const q = params.get('q')?.trim()

  if (categories.length === 0 && countries.length === 0 && tags.length === 0 && !q) {
    return null
  }

  return buildBrowsePath({ categories, countries, tags, q })
}
