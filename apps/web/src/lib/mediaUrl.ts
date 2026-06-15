const API_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:3001'

export function resolveMediaUrl(url: string | null | undefined) {
  if (!url) return null
  if (url.startsWith('http')) return url
  return `${API_URL}${url}`
}
