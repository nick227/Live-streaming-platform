import { useQuery } from '@tanstack/react-query'
import { getApiClient, ApiError } from '../client'

export function useTokenPacks() {
  return useQuery({
    queryKey: ['token-packs'],
    queryFn: async () => {
      const { data, error } = await getApiClient().GET('/token-packs')
      if (error) throw new ApiError(500, 'Failed to fetch token packs')
      return data
    },
    staleTime: 5 * 60 * 1000,
  })
}
