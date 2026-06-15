import { describe, it, expect } from 'vitest'
import { buildTestApp, asAuth, validateResponse, testUserId, createTestCreator, createRoom } from './helpers'

const app = buildTestApp()

function multipartPayload(fields: Array<{ name: string; value: string }>, file: { name: string; filename: string; contentType: string; content: Buffer }) {
  const boundary = `----streamyolo-test-${Math.random().toString(16).slice(2)}`
  const chunks: Buffer[] = []

  for (const field of fields) {
    chunks.push(Buffer.from(`--${boundary}\r\n`))
    chunks.push(Buffer.from(`Content-Disposition: form-data; name="${field.name}"\r\n\r\n`))
    chunks.push(Buffer.from(`${field.value}\r\n`))
  }

  chunks.push(Buffer.from(`--${boundary}\r\n`))
  chunks.push(Buffer.from(`Content-Disposition: form-data; name="${file.name}"; filename="${file.filename}"\r\n`))
  chunks.push(Buffer.from(`Content-Type: ${file.contentType}\r\n\r\n`))
  chunks.push(file.content)
  chunks.push(Buffer.from(`\r\n--${boundary}--\r\n`))

  return {
    headers: { 'content-type': `multipart/form-data; boundary=${boundary}` },
    payload: Buffer.concat(chunks),
  }
}

describe('uploadMedia', () => {
  it('requires auth', async () => {
    const res = await app.inject({ method: 'POST', url: '/media/upload' })
    expect(res.statusCode).toBe(401)
  })

  it('POST /media/upload', async () => {
    const form = multipartPayload(
      [{ name: 'type', value: 'AVATAR' }],
      { name: 'file', filename: 'test.png', contentType: 'image/png', content: Buffer.from('fake image data') },
    )

    const res = await app.inject({
      method: 'POST',
      url: '/media/upload',
      headers: {
        ...asAuth(testUserId),
        ...form.headers,
      },
      payload: form.payload,
    })
    expect(res.statusCode).toBe(201)
    await validateResponse('uploadMedia', 201, res.json())
  })
})

describe('captureRoomThumbnail', () => {
  it('requires auth', async () => {
    const res = await app.inject({ method: 'POST', url: '/rooms/00000000-0000-0000-0000-000000000001/thumbnail/capture' })
    expect(res.statusCode).toBe(401)
  })

  it('POST /rooms/{roomId}/thumbnail/capture', async () => {
    const creator = await createTestCreator(testUserId)
    const room = await createRoom(creator.id)

    const form = multipartPayload(
      [],
      { name: 'image', filename: 'thumb.png', contentType: 'image/png', content: Buffer.from('fake image data') },
    )

    const res = await app.inject({
      method: 'POST',
      url: `/rooms/${room.id}/thumbnail/capture`,
      headers: {
        ...asAuth(testUserId),
        ...form.headers,
      },
      payload: form.payload,
    })
    expect(res.statusCode).toBe(200)
    await validateResponse('captureRoomThumbnail', 200, res.json())
  })
})
