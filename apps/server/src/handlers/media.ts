import { httpError } from '../lib/errors'
import { MediaService, formatMedia } from '../services/MediaService'
import { formatRoom } from '../services/RoomService'

const mediaService = new MediaService()

export async function uploadMedia(request: any, reply: any) {
  const parts = request.parts()
  let fileField: any
  let type: string | undefined
  let creatorId: string | undefined
  let roomId: string | undefined

  for await (const part of parts) {
    if (part.type === 'file' && part.fieldname === 'file') {
      fileField = part
    } else if (part.type === 'field') {
      if (part.fieldname === 'type') type = part.value as string
      if (part.fieldname === 'creatorId') creatorId = part.value as string
      if (part.fieldname === 'roomId') roomId = part.value as string
    }
  }

  if (!fileField || !type) {
    throw httpError(422, 'file and type are required')
  }

  const asset = await mediaService.upload(
    request.user.id,
    { filename: fileField.filename, mimetype: fileField.mimetype, file: fileField.file },
    type as any,
    { creatorId, roomId },
  )

  return reply.status(201).send({ data: formatMedia(asset) })
}

export async function captureRoomThumbnail(request: any, reply: any) {
  const parts = request.parts()
  let imageField: any

  for await (const part of parts) {
    if (part.type === 'file' && part.fieldname === 'image') {
      imageField = part
    }
  }

  if (!imageField) throw httpError(422, 'image is required')

  const { media, room } = await mediaService.captureRoomThumbnail(
    request.user.id,
    request.params.roomId,
    { filename: imageField.filename, mimetype: imageField.mimetype, file: imageField.file },
  )

  return reply.send({ data: { media: formatMedia(media), room: formatRoom(room) } })
}
