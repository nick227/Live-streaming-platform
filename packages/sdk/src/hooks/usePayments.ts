import { useMutation } from '@tanstack/react-query'
import { getApiClient, unwrap } from '../client'

export function useCreateCcbillCheckout() {
  return useMutation({
    mutationFn: async (body: { tokenPackId: string }) =>
      unwrap(await getApiClient().POST('/payments/ccbill/checkout', { body })),
  })
}

export function useHandleCcbillWebhook() {
  return useMutation({
    mutationFn: async (body: Record<string, unknown>) =>
      unwrap(await getApiClient().POST('/webhooks/ccbill', { body })),
  })
}
