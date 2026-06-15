import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { getApiClient, unwrap } from '../client'

export function useCurrentUser() {
  return useQuery({
    queryKey: ['me'],
    queryFn: async () => unwrap(await getApiClient().GET('/auth/me')),
    retry: false,
    staleTime: 60_000,
  })
}

export function useUpdateCurrentUser() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (body: { displayName: string }) =>
      unwrap(await getApiClient().PATCH('/auth/me', { body })),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['me'] })
      queryClient.invalidateQueries({ queryKey: ['creator-profile'] })
    },
  })
}

export function useLogin() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (body: { email: string; password: string }) =>
      unwrap(await getApiClient().POST('/auth/login', { body })),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['me'] })
    },
  })
}

export function useRegister() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (body: { email: string; password: string; displayName: string; role?: 'VIEWER' | 'CREATOR' }) =>
      unwrap(await getApiClient().POST('/auth/register', { body })),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['me'] })
    },
  })
}

export function useLogout() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async () => { unwrap(await getApiClient().POST('/auth/logout')) },
    onSuccess: () => {
      queryClient.clear()
    },
  })
}
