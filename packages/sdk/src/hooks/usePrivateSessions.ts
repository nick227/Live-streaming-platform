import { useMutation, useQueryClient } from '@tanstack/react-query'
import { getApiClient, ApiError } from '../client'

export function useRequestPrivateSession() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ roomId, ...body }: { roomId: string; message?: string }) => {
      const { data, error } = await getApiClient().POST('/rooms/{roomId}/private-sessions/request', {
        params: { path: { roomId } },
        body: body as any,
      })
      if (error) throw new ApiError(500, 'Failed to request private session')
      return data
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['wallet'] }),
  })
}

export function useAcceptPrivateSession() {
  return useMutation({
    mutationFn: async (sessionId: string) => {
      const { data, error } = await getApiClient().POST('/creator/private-sessions/{sessionId}/accept', {
        params: { path: { sessionId } },
        body: undefined as any,
      })
      if (error) throw new ApiError(500, 'Failed to accept session')
      return data
    },
  })
}

export function useDeclinePrivateSession() {
  return useMutation({
    mutationFn: async ({ sessionId, ...body }: { sessionId: string; reason?: string }) => {
      const { data, error } = await getApiClient().POST('/creator/private-sessions/{sessionId}/decline', {
        params: { path: { sessionId } },
        body: body as any,
      })
      if (error) throw new ApiError(500, 'Failed to decline session')
      return data
    },
  })
}

export function useStartPrivateSession() {
  return useMutation({
    mutationFn: async (sessionId: string) => {
      const { data, error } = await getApiClient().POST('/private-sessions/{sessionId}/start', {
        params: { path: { sessionId } },
        body: undefined as any,
      })
      if (error) throw new ApiError(500, 'Failed to start session')
      return data
    },
  })
}

export function useEndPrivateSession() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (sessionId: string) => {
      const { data, error } = await getApiClient().POST('/private-sessions/{sessionId}/end', {
        params: { path: { sessionId } },
        body: undefined as any,
      })
      if (error) throw new ApiError(500, 'Failed to end session')
      return data
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['wallet'] }),
  })
}
