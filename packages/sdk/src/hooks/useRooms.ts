import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { getApiClient, unwrap } from '../client'
import type { components } from '../generated/types'

export type ListRoomsParams = {
  cursor?: string
  limit?: number
  q?: string
  category?: string | string[]
  country?: string | string[]
  tag?: string | string[]
}

type PrepareRoomBody = components['schemas']['PrepareRoomInput']

export function useRoomTaxonomy() {
  return useQuery({
    queryKey: ['room-taxonomy'],
    queryFn: async () =>
      unwrap(await getApiClient().GET('/rooms/taxonomy')),
  })
}

export function useRooms(params?: ListRoomsParams) {
  return useQuery({
    queryKey: ['rooms', params],
    queryFn: async () =>
      unwrap(await getApiClient().GET('/rooms', { params: { query: params as Record<string, unknown> } })),
    refetchInterval: 30_000,
  })
}

export function useCreatorRooms(params?: { cursor?: string; limit?: number }) {
  return useQuery({
    queryKey: ['creator-rooms', params],
    queryFn: async () =>
      unwrap(await getApiClient().GET('/creator/rooms', { params: { query: params as Record<string, unknown> } })),
  })
}

export function useRoom(roomId: string) {
  return useQuery({
    queryKey: ['room', roomId],
    queryFn: async () =>
      unwrap(await getApiClient().GET('/rooms/{roomId}', { params: { path: { roomId } } })),
    enabled: Boolean(roomId),
  })
}

export function usePrepareRoom() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (body: PrepareRoomBody) =>
      unwrap(await getApiClient().POST('/creator/rooms/prepare', { body })),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['rooms'] }),
  })
}

export function useUpdateCreatorRoom() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ roomId, body }: { roomId: string; body: Partial<PrepareRoomBody> }) =>
      unwrap(await getApiClient().PUT('/creator/rooms/{roomId}', { params: { path: { roomId } }, body: body as any })),
    onSuccess: (_, { roomId }) => {
      qc.invalidateQueries({ queryKey: ['room', roomId] })
      qc.invalidateQueries({ queryKey: ['rooms'] })
    },
  })
}

export function useGoLive() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (roomId: string) =>
      unwrap(
        await getApiClient().POST('/creator/rooms/{roomId}/go-live', {
          params: { path: { roomId } },
          body: undefined as never,
        }),
      ),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['rooms'] })
      qc.invalidateQueries({ queryKey: ['creator-profile'] })
    },
  })
}

export function useEndRoom() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (roomId: string) =>
      unwrap(
        await getApiClient().POST('/creator/rooms/{roomId}/end', {
          params: { path: { roomId } },
          body: undefined as never,
        }),
      ),
    onSuccess: () => {
      // Immediately write isLive: false so the TopBar stops showing "Broadcasting"
      // without waiting for the background refetch to complete.
      qc.setQueryData(['creator-profile'], (old: any) => {
        if (!old?.data) return old
        return { ...old, data: { ...old.data, isLive: false, currentRoomId: null } }
      })
      qc.invalidateQueries({ queryKey: ['rooms'] })
      qc.invalidateQueries({ queryKey: ['creator-profile'] })
    },
  })
}

export function useRoomMessages(roomId: string) {
  return useQuery({
    queryKey: ['room-messages', roomId],
    queryFn: async () =>
      unwrap(
        await getApiClient().GET('/rooms/{roomId}/messages', { params: { path: { roomId } } }),
      ),
    enabled: Boolean(roomId),
  })
}

export function useRoomMenu(roomId: string) {
  return useQuery({
    queryKey: ['room-menu', roomId],
    queryFn: async () =>
      unwrap(await getApiClient().GET('/rooms/{roomId}/menu', { params: { path: { roomId } } })),
    enabled: Boolean(roomId),
  })
}

export function useUserChannel(username: string) {
  return useQuery({
    queryKey: ['userChannel', username],
    queryFn: async () =>
      unwrap(await getApiClient().GET('/users/{username}', { params: { path: { username } } })),
    enabled: Boolean(username),
  })
}
