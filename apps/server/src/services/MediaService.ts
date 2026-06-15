import { db } from '@streamyolo/db'
import { createWriteStream, mkdirSync } from 'fs'
import { resolve, extname } from 'path'
import { nanoid } from 'nanoid'
import { pipeline } from 'stream/promises'

const UPLOAD_DIR = process.env.STORAGE_LOCAL_PATH ?? resolve(__dirname, '../../../uploads')
const STORAGE_BASE_URL = process.env.STORAGE_BASE_URL ?? 'http://localhost:3001/uploads'
const STORAGE_ENDPOINT = process.env.STORAGE_ENDPOINT ?? ''
const STORAGE_BUCKET = process.env.STORAGE_BUCKET ?? ''
const STORAGE_ACCESS_KEY = process.env.STORAGE_ACCESS_KEY ?? ''
const STORAGE_SECRET_KEY = process.env.STORAGE_SECRET_KEY ?? ''

const MAX_FILE_BYTES = 10 * 1024 * 1024 // 10 MB

const ALLOWED_MIME = new Set([
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/gif',
])

async function uploadToS3(key: string, stream: NodeJS.ReadableStream, mimetype: string): Promise<string> {
  // Lazy-require AWS SDK so local dev without S3 creds doesn't break at startup
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const { S3Client, PutObjectCommand } = require('@aws-sdk/client-s3')
  const { Readable } = require('stream')

  const client = new S3Client({
    endpoint: STORAGE_ENDPOINT,
    region: process.env.STORAGE_REGION ?? 'us-east-1',
    credentials: { accessKeyId: STORAGE_ACCESS_KEY, secretAccessKey: STORAGE_SECRET_KEY },
    forcePathStyle: true,
  })

  const chunks: Buffer[] = []
  for await (const chunk of stream as AsyncIterable<Buffer>) {
    chunks.push(chunk)
  }
  const body = Buffer.concat(chunks)

  await client.send(new PutObjectCommand({
    Bucket: STORAGE_BUCKET,
    Key: key,
    Body: body,
    ContentType: mimetype,
  }))

  return `${STORAGE_ENDPOINT}/${STORAGE_BUCKET}/${key}`
}

async function uploadToLocal(filename: string, stream: NodeJS.ReadableStream): Promise<string> {
  try { mkdirSync(UPLOAD_DIR, { recursive: true }) } catch { /* dir may already exist */ }
  const filePath = resolve(UPLOAD_DIR, filename)
  await pipeline(stream, createWriteStream(filePath))
  return `${STORAGE_BASE_URL}/${filename}`
}

export class MediaService {
  async upload(
    ownerUserId: string,
    file: { filename: string; mimetype: string; file: NodeJS.ReadableStream; bytesRead?: number },
    type: 'AVATAR' | 'LOGO' | 'BANNER' | 'ROOM_COVER' | 'ROOM_THUMBNAIL_CAPTURE',
    meta?: { creatorId?: string; roomId?: string },
  ) {
    if (!ALLOWED_MIME.has(file.mimetype)) {
      throw { statusCode: 422, message: 'Unsupported file type' }
    }

    // Enforce size cap — bytesRead is populated by @fastify/multipart after the stream is consumed
    if (file.bytesRead !== undefined && file.bytesRead > MAX_FILE_BYTES) {
      throw { statusCode: 413, message: 'File too large — maximum size is 10 MB' }
    }

    const ext = extname(file.filename) || '.jpg'
    const key = `${nanoid(16)}${ext}`

    const url = STORAGE_ENDPOINT
      ? await uploadToS3(key, file.file, file.mimetype)
      : await uploadToLocal(key, file.file)

    const asset = await db.mediaAsset.create({
      data: {
        ownerUserId,
        creatorId: meta?.creatorId,
        roomId: meta?.roomId,
        type,
        url,
        source: 'UPLOADED',
        status: 'APPROVED',
      },
    })

    return asset
  }

  async captureRoomThumbnail(
    creatorUserId: string,
    roomId: string,
    file: { filename: string; mimetype: string; file: NodeJS.ReadableStream; bytesRead?: number },
  ) {
    const room = await db.room.findUnique({
      where: { id: roomId },
      include: { creator: true },
    })
    if (!room) throw { statusCode: 404, message: 'Room not found' }
    if (room.creator.userId !== creatorUserId) throw { statusCode: 403, message: 'Forbidden' }

    const asset = await this.upload(creatorUserId, file, 'ROOM_THUMBNAIL_CAPTURE', { roomId })

    const updatedRoom = await db.room.update({
      where: { id: roomId },
      data: { thumbnailMediaId: asset.id },
      include: { creator: { select: { id: true, stageName: true, userId: true } }, goal: true },
    })

    return { media: asset, room: updatedRoom }
  }
}

export function formatMedia(asset: any) {
  return {
    id: asset.id,
    ownerUserId: asset.ownerUserId,
    creatorId: asset.creatorId ?? null,
    roomId: asset.roomId ?? null,
    type: asset.type,
    url: asset.url,
    blurhash: asset.blurhash ?? null,
    dominantColor: asset.dominantColor ?? null,
    status: asset.status,
    source: asset.source,
    createdAt: asset.createdAt.toISOString(),
    updatedAt: asset.updatedAt.toISOString(),
  }
}
