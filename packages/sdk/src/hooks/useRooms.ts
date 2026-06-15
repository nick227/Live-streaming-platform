import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { getApiClient, ApiError } from '../client'

export function useRooms(params?: { cursor?: string; limit?: number; q?: string }) {
  return useQuery({
    queryKey: ['rooms', params],
    queryFn: async () => {
      const { data, error } = await getApiClient().GET('/rooms', {
        params: { query: params as any },
      })
      if (error) throw new ApiError(500, 'Failed to fetch rooms')
      return data
    },
  })
}

export function useRoom(slug: string) {
  return useQuery({
    queryKey: ['room', slug],
    queryFn: async () => {
      const { data, error } = await getApiClient().GET('/rooms/{slug}', {
        params: { path: { slug } },
      })
      if (error) throw new ApiError(404, 'Room not found')
      return data
    },
    enabled: Boolean(slug),
  })
}

export function usePrepareRoom() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (body: any) => {
      const { data, error } = await getApiClient().POST('/creator/rooms/prepare', { body })
      if (error) throw new ApiError(500, 'Failed to prepare room')
      return data
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['rooms'] }),
  })
}

export function useGoLive() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (roomId: string) => {
      const { data, error } = await getApiClient().POST('/creator/rooms/{roomId}/go-live', {
        params: { path: { roomId } },
        body: undefined as any,
      })
      if (error) throw new ApiError(500, 'Failed to go live')
      return data
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['rooms'] }),
  })
}

export function useEndRoom() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (roomId: string) => {
      const { data, error } = await getApiClient().POST('/creator/rooms/{roomId}/end', {
        params: { path: { roomId } },
        body: undefined as any,
      })
      if (error) throw new ApiError(500, 'Failed to end room')
      return data
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['rooms'] }),
  })
}

export function useRoomMessages(roomId: string) {
  return useQuery({
    queryKey: ['room-messages', roomId],
    queryFn: async () => {
      const { data, error } = await getApiClient().GET('/rooms/{roomId}/messages', {
        params: { path: { roomId } },
      })
      if (error) throw new ApiError(500, 'Failed to fetch messages')
      return data
    },
    enabled: Boolean(roomId),
  })
}

export function useRoomMenu(roomId: string) {
  return useQuery({
    queryKey: ['room-menu', roomId],
    queryFn: async () => {
      const { data, error } = await getApiClient().GET('/rooms/{roomId}/menu', {
        params: { path: { roomId } },
      })
      if (error) throw new ApiError(500, 'Failed to fetch room menu')
      return data
    },
    enabled: Boolean(roomId),
  })
}
