import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { getApiClient, unwrap } from '../client'

export function useCreatorProfile() {
  return useQuery({
    queryKey: ['creator-profile'],
    queryFn: async () => unwrap(await getApiClient().GET('/creator/profile')),
  })
}

export function useUpdateCreatorProfile() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (body: any) =>
      unwrap(await getApiClient().PATCH('/creator/profile', { body })),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['creator-profile'] }),
  })
}

export function useCreatorMenuItems() {
  return useQuery({
    queryKey: ['creator-menu-items'],
    queryFn: async () => unwrap(await getApiClient().GET('/creator/menu-items')),
  })
}

export function useCreateCreatorMenuItem() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (body: any) =>
      unwrap(await getApiClient().POST('/creator/menu-items', { body })),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['creator-menu-items'] }),
  })
}

export function useUpdateCreatorMenuItem() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ menuItemId, ...body }: { menuItemId: string; [key: string]: any }) =>
      unwrap(
        await getApiClient().PATCH('/creator/menu-items/{menuItemId}', {
          params: { path: { menuItemId } },
          body,
        }),
      ),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['creator-menu-items'] }),
  })
}

export function useDeleteCreatorMenuItem() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (menuItemId: string) =>
      unwrap(
        await getApiClient().DELETE('/creator/menu-items/{menuItemId}', {
          params: { path: { menuItemId } },
        }),
      ),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['creator-menu-items'] }),
  })
}

export function useCreatorEarnings(params?: { cursor?: string; limit?: number }) {
  return useQuery({
    queryKey: ['creator-earnings', params],
    queryFn: async () =>
      unwrap(
        await getApiClient().GET('/creator/earnings', { params: { query: params as any } }),
      ),
  })
}

export function useGetLivekitToken() {
  return useMutation({
    mutationFn: async (body: { appRoomType: 'PUBLIC_ROOM' | 'PRIVATE_SESSION'; appRoomId: string }) =>
      unwrap(await getApiClient().POST('/livekit/token', { body })),
  })
}

export function useAcknowledgeTip() {
  return useMutation({
    mutationFn: async (tipId: string) =>
      unwrap(
        await getApiClient().POST('/creator/tips/{tipId}/acknowledge', {
          params: { path: { tipId } },
          body: undefined as any,
        }),
      ),
  })
}

export function useCompleteTip() {
  return useMutation({
    mutationFn: async (tipId: string) =>
      unwrap(
        await getApiClient().POST('/creator/tips/{tipId}/complete', {
          params: { path: { tipId } },
          body: undefined as any,
        }),
      ),
  })
}
