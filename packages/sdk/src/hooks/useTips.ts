import { useMutation, useQueryClient } from '@tanstack/react-query'
import { getApiClient, unwrap } from '../client'

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
      return unwrap(
        await getApiClient().POST('/rooms/{roomId}/tips', {
          params: { path: { roomId } },
          body: body as any,
        }),
      )
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['wallet'] }),
  })
}
