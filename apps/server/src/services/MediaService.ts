import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3'
import { httpError } from '../lib/errors'
import { db } from '@streamyolo/db'
import { CREATOR_INCLUDE } from './RoomService'
import { createWriteStream, mkdirSync } from 'fs'
import { resolve, extname } from 'path'
import { nanoid } from 'nanoid'
import { pipeline } from 'stream/promises'
import type { MediaAssetSource } from '@prisma/client'

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

const EXT_TO_MIME: Record<string, string> = {
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.png': 'image/png',
  '.webp': 'image/webp',
  '.gif': 'image/gif',
}

function useObjectStorage() {
  return Boolean(STORAGE_ENDPOINT && STORAGE_BUCKET && STORAGE_ACCESS_KEY && STORAGE_SECRET_KEY)
}

function s3Endpoint() {
  if (!STORAGE_ENDPOINT) return ''
  try {
    const url = new URL(STORAGE_ENDPOINT)
    return `${url.protocol}//${url.host}`
  } catch {
    return STORAGE_ENDPOINT.replace(/\/+$/, '')
  }
}

function objectPublicUrl(key: string) {
  return `${STORAGE_BASE_URL.replace(/\/+$/, '')}/${key}`
}

function normalizeImageMimetype(mimetype: string, filename: string) {
  if (ALLOWED_MIME.has(mimetype)) return mimetype
  const fromExt = EXT_TO_MIME[extname(filename).toLowerCase()]
  return fromExt ?? mimetype
}

async function uploadToS3(key: string, stream: NodeJS.ReadableStream, mimetype: string): Promise<string> {
  const client = new S3Client({
    endpoint: s3Endpoint(),
    region: process.env.STORAGE_REGION ?? 'auto',
    credentials: { accessKeyId: STORAGE_ACCESS_KEY, secretAccessKey: STORAGE_SECRET_KEY },
    forcePathStyle: true,
  })

  const chunks: Buffer[] = []
  for await (const chunk of stream as AsyncIterable<Buffer>) {
    chunks.push(chunk)
  }

  await client.send(new PutObjectCommand({
    Bucket: STORAGE_BUCKET,
    Key: key,
    Body: Buffer.concat(chunks),
    ContentType: mimetype,
  }))

  return objectPublicUrl(key)
}

async function uploadToLocal(filename: string, stream: NodeJS.ReadableStream): Promise<string> {
  try { mkdirSync(UPLOAD_DIR, { recursive: true }) } catch { /* dir may already exist */ }
  const filePath = resolve(UPLOAD_DIR, filename)
  await pipeline(stream, createWriteStream(filePath))
  return objectPublicUrl(filename)
}

export class MediaService {
  async upload(
    ownerUserId: string,
    file: { filename: string; mimetype: string; file: NodeJS.ReadableStream; bytesRead?: number },
    type: 'AVATAR' | 'LOGO' | 'BANNER' | 'ROOM_COVER' | 'ROOM_THUMBNAIL_CAPTURE',
    meta?: { creatorId?: string; roomId?: string; source?: MediaAssetSource },
  ) {
    const mimetype = normalizeImageMimetype(file.mimetype, file.filename)
    if (!ALLOWED_MIME.has(mimetype)) {
      throw httpError(422, 'Unsupported file type')
    }

    if (file.bytesRead !== undefined && file.bytesRead > MAX_FILE_BYTES) {
      throw httpError(413, 'File too large — maximum size is 10 MB')
    }

    const ext = extname(file.filename) || '.jpg'
    const key = `${nanoid(16)}${ext}`

    const url = useObjectStorage()
      ? await uploadToS3(key, file.file, mimetype)
      : await uploadToLocal(key, file.file)

    const asset = await db.mediaAsset.create({
      data: {
        ownerUserId,
        creatorId: meta?.creatorId,
        roomId: meta?.roomId,
        type,
        url,
        source: meta?.source ?? 'UPLOADED',
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
    if (!room) throw httpError(404, 'Room not found')
    if (room.creator.userId !== creatorUserId) throw httpError(403, 'Forbidden')

    const asset = await this.upload(creatorUserId, file, 'ROOM_THUMBNAIL_CAPTURE', {
      roomId,
      creatorId: room.creator.id,
      source: 'CREATOR_CAPTURED',
    })

    const updatedRoom = await db.room.update({
      where: { id: roomId },
      data: { thumbnailMediaId: asset.id },
      include: { creator: CREATOR_INCLUDE, goal: true, tags: { include: { tag: true } } },
    })

    return { media: asset, room: updatedRoom }
  }
}

export function formatMedia(asset: {
  id: string
  ownerUserId: string
  creatorId: string | null
  roomId: string | null
  type: string
  url: string
  blurhash: string | null
  dominantColor: string | null
  status: string
  source: string
  createdAt: Date
  updatedAt: Date
}) {
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
