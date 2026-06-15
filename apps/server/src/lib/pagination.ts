import { httpError } from './errors'
type CursorPayload = {
  createdAt: string
  id: string
}

export function encodeCursor(payload: CursorPayload) {
  return Buffer.from(JSON.stringify(payload)).toString('base64url')
}

export function decodeCursor(cursor?: string): CursorPayload | null {
  if (!cursor) return null

  try {
    return JSON.parse(Buffer.from(cursor, 'base64url').toString('utf8'))
  } catch {
    throw httpError(400, 'Invalid cursor')
  }
}

export function normalizeLimit(limit?: number, max = 100, fallback = 20) {
  return Math.min(Math.max(Number(limit ?? fallback), 1), max)
}
