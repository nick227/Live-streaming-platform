import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { getApiClient, ApiError } from '../client'

// â”€â”€ Overview â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

export function useAdminOverview() {
  return useQuery({
    queryKey: ['admin', 'overview'],
    queryFn: async () => {
      const { data, error } = await getApiClient().GET('/admin/overview')
      if (error) throw new ApiError(500, 'Failed to fetch overview')
      return data
    },
  })
}

// â”€â”€ Rooms â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

export function useAdminRooms(params?: { cursor?: string; limit?: number; status?: string }) {
  return useQuery({
    queryKey: ['admin', 'rooms', params],
    queryFn: async () => {
      const { data, error } = await getApiClient().GET('/admin/rooms', {
        params: { query: params as any },
      })
      if (error) throw new ApiError(500, 'Failed to fetch admin rooms')
      return data
    },
  })
}

export function useAdminRoom(roomId: string) {
  return useQuery({
    queryKey: ['admin', 'room', roomId],
    queryFn: async () => {
      const { data, error } = await getApiClient().GET('/admin/rooms/{roomId}', {
        params: { path: { roomId } },
      })
      if (error) throw new ApiError(404, 'Room not found')
      return data
    },
    enabled: Boolean(roomId),
  })
}

export function useAdminEndRoom() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ roomId, ...body }: { roomId: string; reason?: string }) => {
      const { data, error } = await getApiClient().POST('/admin/rooms/{roomId}/end', {
        params: { path: { roomId } },
        body: body as any,
      })
      if (error) throw new ApiError(500, 'Failed to end room')
      return data
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['admin', 'rooms'] }),
  })
}

export function useAdminHideRoom() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ roomId, ...body }: { roomId: string; reason?: string }) => {
      const { data, error } = await getApiClient().POST('/admin/rooms/{roomId}/hide', {
        params: { path: { roomId } },
        body: body as any,
      })
      if (error) throw new ApiError(500, 'Failed to hide room')
      return data
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['admin', 'rooms'] }),
  })
}

// â”€â”€ Users â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

export function useAdminUsers(params?: { cursor?: string; limit?: number; q?: string; role?: string }) {
  return useQuery({
    queryKey: ['admin', 'users', params],
    queryFn: async () => {
      const { data, error } = await getApiClient().GET('/admin/users', {
        params: { query: params as any },
      })
      if (error) throw new ApiError(500, 'Failed to fetch admin users')
      return data
    },
  })
}

export function useAdminUser(userId: string) {
  return useQuery({
    queryKey: ['admin', 'user', userId],
    queryFn: async () => {
      const { data, error } = await getApiClient().GET('/admin/users/{userId}', {
        params: { path: { userId } },
      })
      if (error) throw new ApiError(404, 'User not found')
      return data
    },
    enabled: Boolean(userId),
  })
}

export function useAdminSuspendUser() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ userId, ...body }: { userId: string; reason?: string }) => {
      const { data, error } = await getApiClient().POST('/admin/users/{userId}/suspend', {
        params: { path: { userId } },
        body: body as any,
      })
      if (error) throw new ApiError(500, 'Failed to suspend user')
      return data
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['admin', 'users'] }),
  })
}

export function useAdminRestoreUser() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ userId, ...body }: { userId: string; reason?: string }) => {
      const { data, error } = await getApiClient().POST('/admin/users/{userId}/restore', {
        params: { path: { userId } },
        body: body as any,
      })
      if (error) throw new ApiError(500, 'Failed to restore user')
      return data
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['admin', 'users'] }),
  })
}

// â”€â”€ Creators â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

export function useAdminCreators(params?: { cursor?: string; limit?: number; status?: string }) {
  return useQuery({
    queryKey: ['admin', 'creators', params],
    queryFn: async () => {
      const { data, error } = await getApiClient().GET('/admin/creators', {
        params: { query: params as any },
      })
      if (error) throw new ApiError(500, 'Failed to fetch admin creators')
      return data
    },
  })
}

export function useAdminApproveCreator() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ creatorId, ...body }: { creatorId: string; reason?: string }) => {
      const { data, error } = await getApiClient().POST('/admin/creators/{creatorId}/approve', {
        params: { path: { creatorId } },
        body: body as any,
      })
      if (error) throw new ApiError(500, 'Failed to approve creator')
      return data
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['admin', 'creators'] }),
  })
}

export function useAdminSuspendCreator() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ creatorId, ...body }: { creatorId: string; reason?: string }) => {
      const { data, error } = await getApiClient().POST('/admin/creators/{creatorId}/suspend', {
        params: { path: { creatorId } },
        body: body as any,
      })
      if (error) throw new ApiError(500, 'Failed to suspend creator')
      return data
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['admin', 'creators'] }),
  })
}

// â”€â”€ Payments â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

export function useAdminPayments(params?: { cursor?: string; limit?: number; status?: string }) {
  return useQuery({
    queryKey: ['admin', 'payments', params],
    queryFn: async () => {
      const { data, error } = await getApiClient().GET('/admin/payments', {
        params: { query: params as any },
      })
      if (error) throw new ApiError(500, 'Failed to fetch admin payments')
      return data
    },
  })
}

export function useAdminPayment(paymentId: string) {
  return useQuery({
    queryKey: ['admin', 'payment', paymentId],
    queryFn: async () => {
      const { data, error } = await getApiClient().GET('/admin/payments/{paymentId}', {
        params: { path: { paymentId } },
      })
      if (error) throw new ApiError(404, 'Payment not found')
      return data
    },
    enabled: Boolean(paymentId),
  })
}

// â”€â”€ Wallets â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

export function useAdminWallet(userId: string) {
  return useQuery({
    queryKey: ['admin', 'wallet', userId],
    queryFn: async () => {
      const { data, error } = await getApiClient().GET('/admin/wallets/{userId}', {
        params: { path: { userId } },
      })
      if (error) throw new ApiError(404, 'Wallet not found')
      return data
    },
    enabled: Boolean(userId),
  })
}

export function useAdminAdjustWallet() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ userId, ...body }: { userId: string; amountTokens: number; reason: string }) => {
      const { data, error } = await getApiClient().POST('/admin/wallets/{userId}/adjust', {
        params: { path: { userId } },
        body: body as any,
      })
      if (error) throw new ApiError(500, 'Failed to adjust wallet')
      return data
    },
    onSuccess: (_, { userId }) => qc.invalidateQueries({ queryKey: ['admin', 'wallet', userId] }),
  })
}

// â”€â”€ Private sessions â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

export function useAdminPrivateSessions(params?: { cursor?: string; limit?: number; status?: string }) {
  return useQuery({
    queryKey: ['admin', 'private-sessions', params],
    queryFn: async () => {
      const { data, error } = await getApiClient().GET('/admin/private-sessions', {
        params: { query: params as any },
      })
      if (error) throw new ApiError(500, 'Failed to fetch admin sessions')
      return data
    },
  })
}

export function useAdminForceEndPrivateSession() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ sessionId, ...body }: { sessionId: string; reason?: string }) => {
      const { data, error } = await getApiClient().POST('/admin/private-sessions/{sessionId}/force-end', {
        params: { path: { sessionId } },
        body: body as any,
      })
      if (error) throw new ApiError(500, 'Failed to force-end session')
      return data
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['admin', 'private-sessions'] }),
  })
}

// â”€â”€ Media â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

export function useAdminMedia(params?: { cursor?: string; limit?: number; status?: string }) {
  return useQuery({
    queryKey: ['admin', 'media', params],
    queryFn: async () => {
      const { data, error } = await getApiClient().GET('/admin/media', {
        params: { query: params as any },
      })
      if (error) throw new ApiError(500, 'Failed to fetch admin media')
      return data
    },
  })
}

export function useAdminApproveMedia() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (mediaId: string) => {
      const { data, error } = await getApiClient().POST('/admin/media/{mediaId}/approve', {
        params: { path: { mediaId } },
        body: undefined as any,
      })
      if (error) throw new ApiError(500, 'Failed to approve media')
      return data
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['admin', 'media'] }),
  })
}

export function useAdminHideMedia() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ mediaId, ...body }: { mediaId: string; reason?: string }) => {
      const { data, error } = await getApiClient().POST('/admin/media/{mediaId}/hide', {
        params: { path: { mediaId } },
        body: body as any,
      })
      if (error) throw new ApiError(500, 'Failed to hide media')
      return data
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['admin', 'media'] }),
  })
}

// â”€â”€ Reports â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

export function useAdminReports(params?: { cursor?: string; limit?: number; status?: string }) {
  return useQuery({
    queryKey: ['admin', 'reports', params],
    queryFn: async () => {
      const { data, error } = await getApiClient().GET('/admin/reports', {
        params: { query: params as any },
      })
      if (error) throw new ApiError(500, 'Failed to fetch admin reports')
      return data
    },
  })
}

export function useAdminReviewReport() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({
      reportId,
      ...body
    }: {
      reportId: string
      status: 'REVIEWED' | 'ACTIONED' | 'DISMISSED'
      adminNotes?: string
    }) => {
      const { data, error } = await getApiClient().POST('/admin/reports/{reportId}/review', {
        params: { path: { reportId } },
        body: body as any,
      })
      if (error) throw new ApiError(500, 'Failed to review report')
      return data
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['admin', 'reports'] }),
  })
}
