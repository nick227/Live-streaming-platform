import { useMutation, useQueryClient } from '@tanstack/react-query'
import { getApiClient, ApiError } from '../client'

export function useUploadMedia() {
  return useMutation({
    mutationFn: async (formData: FormData) => {
      const response = await fetch(
        `${(getApiClient() as any)._baseUrl ?? 'http://localhost:3001'}/media/upload`,
        { method: 'POST', body: formData, credentials: 'include' },
      )
      if (!response.ok) throw new ApiError(response.status, 'Upload failed')
      return response.json()
    },
  })
}

export function useCaptureRoomThumbnail() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ roomId, formData }: { roomId: string; formData: FormData }) => {
      const response = await fetch(
        `${(getApiClient() as any)._baseUrl ?? 'http://localhost:3001'}/rooms/${roomId}/thumbnail/capture`,
        { method: 'POST', body: formData, credentials: 'include' },
      )
      if (!response.ok) throw new ApiError(response.status, 'Capture failed')
      return response.json()
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['rooms'] }),
  })
}
