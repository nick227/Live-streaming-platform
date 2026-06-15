export async function captureVideoFrameAsFormData(video: HTMLVideoElement): Promise<FormData> {
  const width = video.videoWidth
  const height = video.videoHeight
  if (!width || !height) {
    throw new Error('Video feed is not ready yet')
  }

  const canvas = document.createElement('canvas')
  canvas.width = width
  canvas.height = height

  const ctx = canvas.getContext('2d')
  if (!ctx) throw new Error('Could not capture frame')

  ctx.drawImage(video, 0, 0, width, height)

  const blob = await new Promise<Blob>((resolve, reject) => {
    canvas.toBlob(
      (result) => (result ? resolve(result) : reject(new Error('Failed to encode thumbnail'))),
      'image/jpeg',
      0.92,
    )
  })

  const formData = new FormData()
  formData.append('image', blob, 'room-thumbnail.jpg')
  return formData
}
