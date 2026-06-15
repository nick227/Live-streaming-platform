import { useMutation } from '@tanstack/react-query'
import { getApiClient, unwrap } from '../client'

export function useCreateReport() {
  return useMutation({
    mutationFn: async (body: {
      targetType: 'USER' | 'ROOM' | 'MESSAGE' | 'MEDIA'
      targetUserId?: string
      targetRoomId?: string
      targetMessageId?: string
      targetMediaId?: string
      reason: string
      description?: string
    }) => unwrap(await getApiClient().POST('/reports', { body })),
  })
}
