import { useQuery } from '@tanstack/react-query'
import { getApiClient, unwrap } from '../client'

export function useWallet(params?: { cursor?: string; limit?: number }) {
  return useQuery({
    queryKey: ['wallet', params],
    queryFn: async () =>
      unwrap(await getApiClient().GET('/wallet', { params: { query: params as any } })),
  })
}
