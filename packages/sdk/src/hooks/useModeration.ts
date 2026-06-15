import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { getApiClient, unwrap } from '../client'

export function useRoomModerationActions(roomId: string) {
  return useQuery({
    queryKey: ['room-moderation-actions', roomId],
    queryFn: async () =>
      unwrap(
        await getApiClient().GET('/creator/rooms/{roomId}/moderation/actions' as any, {
          params: { path: { roomId } },
        } as any),
      ),
    enabled: Boolean(roomId),
  })
}

export function useCreatorBans() {
  return useQuery({
    queryKey: ['creator-bans'],
    queryFn: async () => unwrap(await getApiClient().GET('/creator/bans' as any, {} as any)),
  })
}

export function useMuteRoomUser() {
  return useModerationMutation('/creator/rooms/{roomId}/moderation/mute')
}

export function useUnmuteRoomUser() {
  return useModerationMutation('/creator/rooms/{roomId}/moderation/unmute')
}

export function useKickRoomUser() {
  return useModerationMutation('/creator/rooms/{roomId}/moderation/kick')
}

export function useBanCreatorUser() {
  return useModerationMutation('/creator/rooms/{roomId}/moderation/ban')
}

export function useUnbanCreatorUser() {
  return useModerationMutation('/creator/rooms/{roomId}/moderation/unban')
}

export function useRewardRoomUser() {
  return useModerationMutation('/creator/rooms/{roomId}/moderation/reward')
}

export function useDeleteRoomMessage() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ roomId, messageId }: { roomId: string; messageId: string }) =>
      unwrap(
        await getApiClient().DELETE('/creator/rooms/{roomId}/messages/{messageId}' as any, {
          params: { path: { roomId, messageId } },
        } as any),
      ),
    onSuccess: (_data, vars) => {
      qc.invalidateQueries({ queryKey: ['room-messages', vars.roomId] })
      qc.invalidateQueries({ queryKey: ['room-moderation-actions', vars.roomId] })
    },
  })
}

export function usePinRoomMessage() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ roomId, messageId }: { roomId: string; messageId: string }) =>
      unwrap(
        await getApiClient().POST('/creator/rooms/{roomId}/messages/{messageId}/pin' as any, {
          params: { path: { roomId, messageId } },
          body: undefined,
        } as any),
      ),
    onSuccess: (_data, vars) => {
      qc.invalidateQueries({ queryKey: ['room-moderation-actions', vars.roomId] })
    },
  })
}

export function useUpdateRoomChatSettings() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ roomId, ...body }: { roomId: string; slowModeSeconds?: number }) =>
      unwrap(
        await getApiClient().PATCH('/creator/rooms/{roomId}/chat-settings' as any, {
          params: { path: { roomId } },
          body,
        } as any),
      ),
    onSuccess: (_data, vars) => {
      qc.invalidateQueries({ queryKey: ['room-moderation-actions', vars.roomId] })
    },
  })
}

function useModerationMutation(path: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ roomId, ...body }: { roomId: string; [key: string]: unknown }) =>
      unwrap(
        await getApiClient().POST(path as any, {
          params: { path: { roomId } },
          body,
        } as any),
      ),
    onSuccess: (_data, vars) => {
      qc.invalidateQueries({ queryKey: ['room-moderation-actions', vars.roomId] })
      qc.invalidateQueries({ queryKey: ['creator-bans'] })
    },
  })
}
