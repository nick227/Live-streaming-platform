import { Readable } from 'stream'
import { httpError } from '../lib/errors'
import { MediaService, formatMedia } from '../services/MediaService'
import { formatRoom } from '../services/RoomService'

const mediaService = new MediaService()

type FileCapture = { filename: string; mimetype: string; buffer: Buffer }

export async function uploadMedia(request: any, reply: any) {
  const parts = request.parts()
  let file: FileCapture | undefined
  let type: string | undefined
  let creatorId: string | undefined
  let roomId: string | undefined

  for await (const part of parts) {
    if (part.type === 'file') {
      // Consume the stream immediately — required by @fastify/multipart to avoid stall
      const buf = await part.toBuffer()
      if (part.fieldname === 'file') {
        file = { filename: part.filename, mimetype: part.mimetype, buffer: buf }
      }
    } else if (part.type === 'field') {
      if (part.fieldname === 'type') type = part.value as string
      if (part.fieldname === 'creatorId') creatorId = part.value as string
      if (part.fieldname === 'roomId') roomId = part.value as string
    }
  }

  if (!file || !type) throw httpError(422, 'file and type are required')

  const asset = await mediaService.upload(
    request.user.id,
    { filename: file.filename, mimetype: file.mimetype, file: Readable.from([file.buffer]) },
    type as any,
    { creatorId, roomId },
  )

  return reply.status(201).send({ data: formatMedia(asset) })
}

export async function captureRoomThumbnail(request: any, reply: any) {
  const parts = request.parts()
  let image: FileCapture | undefined

  for await (const part of parts) {
    if (part.type === 'file') {
      const buf = await part.toBuffer()
      if (part.fieldname === 'image') {
        image = { filename: part.filename, mimetype: part.mimetype, buffer: buf }
      }
    }
  }

  if (!image) throw httpError(422, 'image is required')

  const { media, room } = await mediaService.captureRoomThumbnail(
    request.user.id,
    request.params.roomId,
    { filename: image.filename, mimetype: image.mimetype, file: Readable.from([image.buffer]) },
  )

  return reply.send({ data: { media: formatMedia(media), room: formatRoom(room) } })
}
