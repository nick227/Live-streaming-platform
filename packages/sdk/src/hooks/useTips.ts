import { useMutation, useQueryClient } from '@tanstack/react-query'
import { getApiClient, ApiError } from '../client'

export function useCreateTip() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (args: {
      roomId: string
      amountTokens: number
      requestType: 'GENERAL' | 'MENU_ITEM' | 'CUSTOM' | 'GOAL'
      menuItemId?: string
      requestText?: string
    }) => {
      const { roomId, ...body } = args
      const { data, error } = await getApiClient().POST('/rooms/{roomId}/tips', {
        params: { path: { roomId } },
        body: body as any,
      })
      if (error) throw new ApiError(500, 'Failed to send tip')
      return data
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['wallet'] }),
  })
}
