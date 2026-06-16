import { useQuery } from '@tanstack/react-query'
import { getApiClient, unwrap } from '../client'

export function usePlatformSettings() {
  return useQuery({
    queryKey: ['settings'],
    queryFn: async () => unwrap(await getApiClient().GET('/settings')),
  })
}
