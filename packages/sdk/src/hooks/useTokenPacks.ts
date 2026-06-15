import { useQuery } from '@tanstack/react-query'
import { getApiClient, unwrap } from '../client'

export function useTokenPacks() {
  return useQuery({
    queryKey: ['token-packs'],
    queryFn: async () => unwrap(await getApiClient().GET('/token-packs')),
    staleTime: 5 * 60 * 1000,
  })
}
