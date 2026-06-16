import { describe, it, expect, beforeAll, afterAll, vi } from 'vitest'
import { io as SocketClient } from 'socket.io-client'
import {
  asAuth,
  buildTestApp,
  createActiveCreator,
  createLiveRoom,
  testOtherUserId,
  testUserId,
  validateResponse,
} from './helpers'
import { db } from '@streamyolo/db'

vi.mock('../services/LiveKitService', () => ({
  LiveKitService: class {
    createRoom = vi.fn().mockResolvedValue(undefined)
    deleteRoom = vi.fn().mockResolvedValue(undefined)
    getToken = vi.fn().mockResolvedValue({
      livekitUrl: 'wss://fake.livekit.cloud',
      token: 'fake-livekit-jwt-token',
      roomName: 'fake-room',
    })
  },
}))

const app = buildTestApp()

describe('join room smoke', () => {
  let port: number

  beforeAll(async () => {
    await app.listen({ port: 0 })
    port = (app.server.address() as { port: number }).port
  })

  afterAll(async () => {
    await app.close()
  })

  it('lets a viewer discover, load, get media credentials for, and socket-join a live room', async () => {
    await createActiveCreator(testOtherUserId)
    const room = await createLiveRoom(testOtherUserId)
    const session = await db.session.create({
      data: {
        userId: testUserId,
        token: `join-room-smoke-${Date.now()}-${Math.random()}`,
        expiresAt: new Date(Date.now() + 60 * 60 * 1000),
      },
    })

    const listRes = await app.inject({ method: 'GET', url: '/rooms' })
    expect(listRes.statusCode).toBe(200)
    await validateResponse('listRooms', 200, listRes.json())
    expect(listRes.json().data.some((item: { id: string }) => item.id === room.id)).toBe(true)

    const roomRes = await app.inject({ method: 'GET', url: `/rooms/${room.id}` })
    expect(roomRes.statusCode).toBe(200)
    await validateResponse('getRoom', 200, roomRes.json())
    expect(roomRes.json().data.room.id).toBe(room.id)
    expect(roomRes.json().data.room.status).toBe('LIVE')

    const tokenRes = await app.inject({
      method: 'POST',
      url: '/livekit/token',
      headers: asAuth(testUserId),
      payload: { appRoomType: 'PUBLIC_ROOM', appRoomId: room.id },
    })
    expect(tokenRes.statusCode).toBe(200)
    await validateResponse('getLivekitToken', 200, tokenRes.json())
    expect(tokenRes.json().data.token).toBeTruthy()

    await new Promise<void>((resolve, reject) => {
      const socket = SocketClient(`http://localhost:${port}`, {
        auth: { token: session.token },
        transports: ['websocket'],
      })
      const timeout = setTimeout(() => {
        socket.disconnect()
        reject(new Error('Timed out waiting for room join acknowledgement'))
      }, 5000)

      socket.on('connect', () => {
        socket.emit('room:join', { roomId: room.id }, (ack: { ok: boolean; error?: string }) => {
          try {
            expect(ack).toEqual({ ok: true })
          } catch (err) {
            clearTimeout(timeout)
            socket.disconnect()
            reject(err)
          }
        })
      })

      socket.on('room:viewer_count', (payload: { roomId: string; viewerCount: number }) => {
        try {
          expect(payload.roomId).toBe(room.id)
          expect(payload.viewerCount).toBeGreaterThan(0)
          clearTimeout(timeout)
          socket.disconnect()
          resolve()
        } catch (err) {
          clearTimeout(timeout)
          socket.disconnect()
          reject(err)
        }
      })

      socket.on('connect_error', (err) => {
        clearTimeout(timeout)
        socket.disconnect()
        reject(err)
      })
    })
  })
})
