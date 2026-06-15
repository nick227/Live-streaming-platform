import { useMutation } from '@tanstack/react-query'
import { getApiClient, ApiError } from '../client'

export function useCreateCcbillCheckout() {
  return useMutation({
    mutationFn: async (body: { tokenPackId: string }) => {
      const { data, error } = await getApiClient().POST('/payments/ccbill/checkout', { body })
      if (error) throw new ApiError(500, 'Failed to create checkout')
      return data
    },
  })
}

export function useHandleCcbillWebhook() {
  return useMutation({
    mutationFn: async (body: Record<string, unknown>) => {
      const { data, error } = await getApiClient().POST('/webhooks/ccbill', { body })
      if (error) throw new ApiError(400, 'Webhook error')
      return data
    },
  })
}
