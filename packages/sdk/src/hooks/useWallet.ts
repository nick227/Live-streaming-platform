import { useQuery } from '@tanstack/react-query'
import { getApiClient, ApiError } from '../client'

export function useWallet(params?: { cursor?: string; limit?: number }) {
  return useQuery({
    queryKey: ['wallet', params],
    queryFn: async () => {
      const { data, error } = await getApiClient().GET('/wallet', {
        params: { query: params as any },
      })
      if (error) throw new ApiError(500, 'Failed to fetch wallet')
      return data
    },
  })
}
