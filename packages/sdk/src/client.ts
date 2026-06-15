import createClient, { type Middleware } from 'openapi-fetch'
import type { paths } from './generated/types'

type ClientConfig = {
  baseUrl: string
  getToken?: () => string | null  // only for native apps; web uses httpOnly cookies
}

let _client: ReturnType<typeof createClient<paths>> | null = null

export function createApiClient(config: ClientConfig) {
  const client = createClient<paths>({
    baseUrl: config.baseUrl,
    credentials: 'include',
  })

  if (config.getToken) {
    const authMiddleware: Middleware = {
      async onRequest({ request }) {
        const token = config.getToken!()
        if (token) request.headers.set('Authorization', `Bearer ${token}`)
        return request
      },
    }
    client.use(authMiddleware)
  }

  _client = client
  return client
}

export function getApiClient() {
  if (!_client) throw new Error('Call createApiClient() before using hooks.')
  return _client
}

export class ApiError extends Error {
  constructor(
    public status: number,
    message: string,
    public code?: string,
  ) {
    super(message)
    this.name = 'ApiError'
  }
}

/** Call after every openapi-fetch request. Throws ApiError on failure, returns data on success. */
export function unwrap<T>(result: { data?: T; error?: unknown; response?: Response }): T {
  const { data, error, response } = result
  if (error) {
    const status = response?.status ?? 500
    const message =
      (error as any)?.error ??
      (error as any)?.message ??
      (response?.status === 401 ? 'Unauthorized' : 'Request failed')
    throw new ApiError(status, message)
  }
  return data!
}
