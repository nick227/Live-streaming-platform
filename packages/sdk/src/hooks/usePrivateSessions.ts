import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { getApiClient, unwrap } from '../client'
import type { components } from '../generated/types'

type RequestPrivateSessionBody = components['schemas']['RequestPrivateSessionInput']

export function useRequestPrivateSession() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ roomId, ...body }: { roomId: string } & RequestPrivateSessionBody) =>
      unwrap(
        await getApiClient().POST('/rooms/{roomId}/private-sessions/request', {
          params: { path: { roomId } },
          body,
        }),
      ),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['wallet'] }),
  })
}

export function useAcceptPrivateSession() {
  return useMutation({
    mutationFn: async (sessionId: string) =>
      unwrap(
        await getApiClient().POST('/creator/private-sessions/{sessionId}/accept', {
          params: { path: { sessionId } },
          body: undefined as any,
        }),
      ),
  })
}

export function useDeclinePrivateSession() {
  return useMutation({
    mutationFn: async ({ sessionId, ...body }: { sessionId: string; reason?: string }) =>
      unwrap(
        await getApiClient().POST('/creator/private-sessions/{sessionId}/decline', {
          params: { path: { sessionId } },
          body: body as any,
        }),
      ),
  })
}

export function useStartPrivateSession() {
  return useMutation({
    mutationFn: async (sessionId: string) =>
      unwrap(
        await getApiClient().POST('/private-sessions/{sessionId}/start', {
          params: { path: { sessionId } },
          body: undefined as any,
        }),
      ),
  })
}

export function useEndPrivateSession() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (sessionId: string) =>
      unwrap(
        await getApiClient().POST('/private-sessions/{sessionId}/end', {
          params: { path: { sessionId } },
          body: undefined as any,
        }),
      ),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['wallet'] }),
  })
}

export function useCreatorPrivateSessions(roomId: string) {
  return useQuery({
    queryKey: ['creator-private-sessions', roomId],
    queryFn: async () =>
      unwrap(
        await getApiClient().GET('/creator/rooms/{roomId}/private-sessions', {
          params: { path: { roomId } },
        })
      ),
    refetchInterval: 5000, // Poll every 5s for new requests
  })
}
