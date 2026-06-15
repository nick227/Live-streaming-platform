import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { getApiClient, ApiError } from '../client'

export function useCreatorProfile() {
  return useQuery({
    queryKey: ['creator-profile'],
    queryFn: async () => {
      const { data, error } = await getApiClient().GET('/creator/profile')
      if (error) throw new ApiError(500, 'Failed to fetch creator profile')
      return data
    },
  })
}

export function useUpdateCreatorProfile() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (body: any) => {
      const { data, error } = await getApiClient().PATCH('/creator/profile', { body })
      if (error) throw new ApiError(500, 'Failed to update creator profile')
      return data
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['creator-profile'] }),
  })
}

export function useCreatorMenuItems() {
  return useQuery({
    queryKey: ['creator-menu-items'],
    queryFn: async () => {
      const { data, error } = await getApiClient().GET('/creator/menu-items')
      if (error) throw new ApiError(500, 'Failed to fetch menu items')
      return data
    },
  })
}

export function useCreateCreatorMenuItem() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (body: any) => {
      const { data, error } = await getApiClient().POST('/creator/menu-items', { body })
      if (error) throw new ApiError(500, 'Failed to create menu item')
      return data
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['creator-menu-items'] }),
  })
}

export function useUpdateCreatorMenuItem() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ menuItemId, ...body }: { menuItemId: string; [key: string]: any }) => {
      const { data, error } = await getApiClient().PATCH('/creator/menu-items/{menuItemId}', {
        params: { path: { menuItemId } },
        body,
      })
      if (error) throw new ApiError(500, 'Failed to update menu item')
      return data
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['creator-menu-items'] }),
  })
}

export function useDeleteCreatorMenuItem() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (menuItemId: string) => {
      const { data, error } = await getApiClient().DELETE('/creator/menu-items/{menuItemId}', {
        params: { path: { menuItemId } },
      })
      if (error) throw new ApiError(500, 'Failed to delete menu item')
      return data
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['creator-menu-items'] }),
  })
}

export function useCreatorEarnings(params?: { cursor?: string; limit?: number }) {
  return useQuery({
    queryKey: ['creator-earnings', params],
    queryFn: async () => {
      const { data, error } = await getApiClient().GET('/creator/earnings', {
        params: { query: params as any },
      })
      if (error) throw new ApiError(500, 'Failed to fetch earnings')
      return data
    },
  })
}

export function useGetLivekitToken() {
  return useMutation({
    mutationFn: async (body: { appRoomType: 'PUBLIC_ROOM' | 'PRIVATE_SESSION'; appRoomId: string }) => {
      const { data, error } = await getApiClient().POST('/livekit/token', { body })
      if (error) throw new ApiError(500, 'Failed to get LiveKit token')
      return data
    },
  })
}

export function useAcknowledgeTip() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (tipId: string) => {
      const { data, error } = await getApiClient().POST('/creator/tips/{tipId}/acknowledge', {
        params: { path: { tipId } },
        body: undefined as any,
      })
      if (error) throw new ApiError(500, 'Failed to acknowledge tip')
      return data
    },
  })
}

export function useCompleteTip() {
  return useMutation({
    mutationFn: async (tipId: string) => {
      const { data, error } = await getApiClient().POST('/creator/tips/{tipId}/complete', {
        params: { path: { tipId } },
        body: undefined as any,
      })
      if (error) throw new ApiError(500, 'Failed to complete tip')
      return data
    },
  })
}
