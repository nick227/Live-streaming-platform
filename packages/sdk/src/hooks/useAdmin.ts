import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { getApiClient, unwrap } from '../client'

// ── Overview ──────────────────────────────────────────────────────────────────

export function useAdminOverview() {
  return useQuery({
    queryKey: ['admin', 'overview'],
    queryFn: async () => unwrap(await getApiClient().GET('/admin/overview')),
  })
}

// ── Rooms ─────────────────────────────────────────────────────────────────────

export function useAdminRooms(params?: { cursor?: string; limit?: number; status?: string }) {
  return useQuery({
    queryKey: ['admin', 'rooms', params],
    queryFn: async () =>
      unwrap(await getApiClient().GET('/admin/rooms', { params: { query: params as any } })),
  })
}

export function useAdminRoom(roomId: string) {
  return useQuery({
    queryKey: ['admin', 'room', roomId],
    queryFn: async () =>
      unwrap(
        await getApiClient().GET('/admin/rooms/{roomId}', { params: { path: { roomId } } }),
      ),
    enabled: Boolean(roomId),
  })
}

export function useAdminEndRoom() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ roomId, ...body }: { roomId: string; reason?: string }) =>
      unwrap(
        await getApiClient().POST('/admin/rooms/{roomId}/end', {
          params: { path: { roomId } },
          body: body as any,
        }),
      ),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['admin', 'rooms'] }),
  })
}

export function useAdminHideRoom() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ roomId, ...body }: { roomId: string; reason?: string }) =>
      unwrap(
        await getApiClient().POST('/admin/rooms/{roomId}/hide', {
          params: { path: { roomId } },
          body: body as any,
        }),
      ),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['admin', 'rooms'] }),
  })
}

// ── Users ─────────────────────────────────────────────────────────────────────

export function useAdminUsers(params?: { cursor?: string; limit?: number; q?: string; role?: string }) {
  return useQuery({
    queryKey: ['admin', 'users', params],
    queryFn: async () =>
      unwrap(await getApiClient().GET('/admin/users', { params: { query: params as any } })),
  })
}

export function useAdminUser(userId: string) {
  return useQuery({
    queryKey: ['admin', 'user', userId],
    queryFn: async () =>
      unwrap(
        await getApiClient().GET('/admin/users/{userId}', { params: { path: { userId } } }),
      ),
    enabled: Boolean(userId),
  })
}

export function useAdminSuspendUser() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ userId, ...body }: { userId: string; reason?: string }) =>
      unwrap(
        await getApiClient().POST('/admin/users/{userId}/suspend', {
          params: { path: { userId } },
          body: body as any,
        }),
      ),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['admin', 'users'] }),
  })
}

export function useAdminRestoreUser() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ userId, ...body }: { userId: string; reason?: string }) =>
      unwrap(
        await getApiClient().POST('/admin/users/{userId}/restore', {
          params: { path: { userId } },
          body: body as any,
        }),
      ),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['admin', 'users'] }),
  })
}

// ── Admin Wallet ──────────────────────────────────────────────────────────────

export function useAdminUserWallet(userId: string, params?: { cursor?: string; limit?: number }) {
  return useQuery({
    queryKey: ['admin', 'user', userId, 'wallet', params],
    queryFn: async () =>
      unwrap(
        await getApiClient().GET('/admin/users/{userId}/wallet', {
          params: { path: { userId }, query: params as any },
        }),
      ),
    enabled: Boolean(userId),
  })
}

export function useAdminGrantTokens() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ userId, ...body }: { userId: string; amountTokens: number; reason: string }) =>
      unwrap(
        await getApiClient().POST('/admin/users/{userId}/wallet/grant', {
          params: { path: { userId } },
          body: body as any,
        }),
      ),
    onSuccess: (_, { userId }) => {
      qc.invalidateQueries({ queryKey: ['admin', 'user', userId] })
    },
  })
}

export function useAdminRevokeTokens() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ userId, ...body }: { userId: string; amountTokens: number; reason: string }) =>
      unwrap(
        await getApiClient().POST('/admin/users/{userId}/wallet/revoke', {
          params: { path: { userId } },
          body: body as any,
        }),
      ),
    onSuccess: (_, { userId }) => {
      qc.invalidateQueries({ queryKey: ['admin', 'user', userId] })
    },
  })
}

export function useAdminResetWallet() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ userId, ...body }: { userId: string; reason: string }) =>
      unwrap(
        await getApiClient().POST('/admin/users/{userId}/wallet/reset', {
          params: { path: { userId } },
          body: body as any,
        }),
      ),
    onSuccess: (_, { userId }) => {
      qc.invalidateQueries({ queryKey: ['admin', 'user', userId] })
    },
  })
}

// ── Creators ──────────────────────────────────────────────────────────────────

export function useAdminCreators(params?: { cursor?: string; limit?: number; status?: string }) {
  return useQuery({
    queryKey: ['admin', 'creators', params],
    queryFn: async () =>
      unwrap(await getApiClient().GET('/admin/creators', { params: { query: params as any } })),
  })
}

export function useAdminCreator(creatorId: string) {
  return useQuery({
    queryKey: ['admin', 'creator', creatorId],
    queryFn: async () =>
      unwrap(
        await getApiClient().GET('/admin/creators/{creatorId}', { params: { path: { creatorId } } }),
      ),
    enabled: Boolean(creatorId),
  })
}

export function useAdminApproveCreator() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ creatorId, ...body }: { creatorId: string; reason?: string }) =>
      unwrap(
        await getApiClient().POST('/admin/creators/{creatorId}/approve', {
          params: { path: { creatorId } },
          body: body as any,
        }),
      ),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['admin', 'creators'] }),
  })
}

export function useAdminSuspendCreator() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ creatorId, ...body }: { creatorId: string; reason?: string }) =>
      unwrap(
        await getApiClient().POST('/admin/creators/{creatorId}/suspend', {
          params: { path: { creatorId } },
          body: body as any,
        }),
      ),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['admin', 'creators'] }),
  })
}

// ── Payments ──────────────────────────────────────────────────────────────────

export function useAdminPayments(params?: { cursor?: string; limit?: number; status?: string }) {
  return useQuery({
    queryKey: ['admin', 'payments', params],
    queryFn: async () =>
      unwrap(await getApiClient().GET('/admin/payments', { params: { query: params as any } })),
  })
}

export function useAdminPayment(paymentId: string) {
  return useQuery({
    queryKey: ['admin', 'payment', paymentId],
    queryFn: async () =>
      unwrap(
        await getApiClient().GET('/admin/payments/{paymentId}', {
          params: { path: { paymentId } },
        }),
      ),
    enabled: Boolean(paymentId),
  })
}

// ── Wallets ───────────────────────────────────────────────────────────────────

export function useAdminWallet(userId: string) {
  return useQuery({
    queryKey: ['admin', 'wallet', userId],
    queryFn: async () =>
      unwrap(
        await getApiClient().GET('/admin/wallets/{userId}', { params: { path: { userId } } }),
      ),
    enabled: Boolean(userId),
  })
}

export function useAdminAdjustWallet() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ userId, ...body }: { userId: string; amountTokens: number; reason: string }) =>
      unwrap(
        await getApiClient().POST('/admin/wallets/{userId}/adjust', {
          params: { path: { userId } },
          body: body as any,
        }),
      ),
    onSuccess: (_, { userId }) => qc.invalidateQueries({ queryKey: ['admin', 'wallet', userId] }),
  })
}

// ── Private sessions ──────────────────────────────────────────────────────────

export function useAdminPrivateSessions(params?: { cursor?: string; limit?: number; status?: string }) {
  return useQuery({
    queryKey: ['admin', 'private-sessions', params],
    queryFn: async () =>
      unwrap(
        await getApiClient().GET('/admin/private-sessions', { params: { query: params as any } }),
      ),
  })
}

export function useAdminForceEndPrivateSession() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ sessionId, ...body }: { sessionId: string; reason?: string }) =>
      unwrap(
        await getApiClient().POST('/admin/private-sessions/{sessionId}/force-end', {
          params: { path: { sessionId } },
          body: body as any,
        }),
      ),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['admin', 'private-sessions'] }),
  })
}

// ── Media ─────────────────────────────────────────────────────────────────────

export function useAdminMedia(params?: { cursor?: string; limit?: number; status?: string }) {
  return useQuery({
    queryKey: ['admin', 'media', params],
    queryFn: async () =>
      unwrap(await getApiClient().GET('/admin/media', { params: { query: params as any } })),
  })
}

export function useAdminApproveMedia() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (mediaId: string) =>
      unwrap(
        await getApiClient().POST('/admin/media/{mediaId}/approve', {
          params: { path: { mediaId } },
          body: undefined as any,
        }),
      ),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['admin', 'media'] }),
  })
}

export function useAdminHideMedia() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ mediaId, ...body }: { mediaId: string; reason?: string }) =>
      unwrap(
        await getApiClient().POST('/admin/media/{mediaId}/hide', {
          params: { path: { mediaId } },
          body: body as any,
        }),
      ),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['admin', 'media'] }),
  })
}

// ── Reports ───────────────────────────────────────────────────────────────────

export function useAdminReports(params?: { cursor?: string; limit?: number; status?: string }) {
  return useQuery({
    queryKey: ['admin', 'reports', params],
    queryFn: async () =>
      unwrap(await getApiClient().GET('/admin/reports', { params: { query: params as any } })),
  })
}

// ── Tags ──────────────────────────────────────────────────────────────────────

export function useAdminTags() {
  return useQuery({
    queryKey: ['admin', 'tags'],
    queryFn: async () => unwrap(await getApiClient().GET('/admin/tags')),
  })
}

export function useAdminCreateTag() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (body: { slug: string; label: string; group?: string; sortOrder?: number }) =>
      unwrap(await getApiClient().POST('/admin/tags', { body: body as any })),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['admin', 'tags'] }),
  })
}

export function useAdminUpdateTag() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ tagId, ...body }: { tagId: string; label?: string; group?: string; sortOrder?: number; isActive?: boolean }) =>
      unwrap(
        await getApiClient().PATCH('/admin/tags/{tagId}', {
          params: { path: { tagId } },
          body: body as any,
        }),
      ),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['admin', 'tags'] }),
  })
}

export function useAdminDeleteTag() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (tagId: string) =>
      unwrap(
        await getApiClient().DELETE('/admin/tags/{tagId}', { params: { path: { tagId } } }),
      ),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['admin', 'tags'] }),
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
    }) =>
      unwrap(
        await getApiClient().POST('/admin/reports/{reportId}/review', {
          params: { path: { reportId } },
          body: body as any,
        }),
      ),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['admin', 'reports'] }),
  })
}

// ── Token Packs ───────────────────────────────────────────────────────────────

export function useAdminTokenPacks() {
  return useQuery({
    queryKey: ['admin', 'token-packs'],
    queryFn: async () => unwrap(await getApiClient().GET('/admin/token-packs')),
  })
}

export function useAdminCreateTokenPack() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (body: { name: string; priceCents: number; tokenAmount: number; bonusTokenAmount?: number; currency?: string; isActive?: boolean; sortOrder?: number }) =>
      unwrap(await getApiClient().POST('/admin/token-packs', { body: body as any })),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin', 'token-packs'] })
      qc.invalidateQueries({ queryKey: ['token-packs'] })
    },
  })
}

export function useAdminUpdateTokenPack() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ packId, ...body }: { packId: string; name?: string; priceCents?: number; tokenAmount?: number; bonusTokenAmount?: number; isActive?: boolean; sortOrder?: number }) =>
      unwrap(
        await getApiClient().PATCH('/admin/token-packs/{packId}', {
          params: { path: { packId } },
          body: body as any,
        }),
      ),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin', 'token-packs'] })
      qc.invalidateQueries({ queryKey: ['token-packs'] })
    },
  })
}

export function useAdminDeleteTokenPack() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (packId: string) =>
      unwrap(
        await getApiClient().DELETE('/admin/token-packs/{packId}', { params: { path: { packId } } }),
      ),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin', 'token-packs'] })
      qc.invalidateQueries({ queryKey: ['token-packs'] })
    },
  })
}

// ── Settings ──────────────────────────────────────────────────────────────────

export function useAdminSettings() {
  return useQuery({
    queryKey: ['admin', 'settings'],
    queryFn: async () => unwrap(await getApiClient().GET('/admin/settings')),
  })
}

export function useUpdateAdminSettings() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (body: { activePaymentProvider: 'CCBILL' | 'DEMO' }) =>
      unwrap(
        await getApiClient().PATCH('/admin/settings', {
          body: body as any,
        }),
      ),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin', 'settings'] })
      qc.invalidateQueries({ queryKey: ['settings'] })
    },
  })
}
