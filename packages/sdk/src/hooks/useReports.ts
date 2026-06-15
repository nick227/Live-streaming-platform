import { useMutation } from '@tanstack/react-query'
import { getApiClient, ApiError } from '../client'

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
    }) => {
      const { data, error } = await getApiClient().POST('/reports', { body })
      if (error) throw new ApiError(500, 'Failed to submit report')
      return data
    },
  })
}
