import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import { buildTestApp, asAuth, validateResponse, testUserId } from './helpers'
import { io as SocketClient } from 'socket.io-client'
import { db } from '@streamyolo/db'
import { CreatorProfileService } from '../services/CreatorProfileService'
import { AuthService } from '../services/AuthService'

const app = buildTestApp()

describe('Smoke Test - Room connection and lifecycle', () => {
  let port: number
  let sessionToken: string
  let roomId: string

  beforeAll(async () => {
    await app.listen({ port: 0 })
    port = (app.server.address() as any).port
  })

  afterAll(async () => {
    await app.close()
  })

  it('runs the full lifecycle', async () => {
    // 1. Setup creator profile so user can go live
    const creatorService = new CreatorProfileService()
    const creator = await creatorService.getOrCreateByUserId(testUserId)
    
    // Admin approval
    await db.creatorProfile.update({
      where: { id: creator.id },
      data: {
        status: 'ACTIVE',
        privateRateTokensPerMinute: 10,
        privateRulesText: 'No rules',
      },
    })
    
    // Create menu item
    await db.creatorMenuItem.create({
      data: {
        creatorId: creator.id,
        label: 'Shoutout',
        tokenAmount: 50,
        isActive: true,
      }
    })

    // Create session token
    const session = await db.session.create({
      data: {
        userId: testUserId,
        token: `test-smoke-session-token-${Date.now()}-${Math.random()}`,
        expiresAt: new Date(Date.now() + 1000 * 60 * 60 * 24 * 7),
      }
    })
    sessionToken = session.token

    // 2. Prepare a room
    let res = await app.inject({
      method: 'POST',
      url: '/creator/rooms/prepare',
      headers: asAuth(testUserId),
      payload: {
        title: 'Smoke Test Room',
        thumbnailMediaId: 'test-media-id',
        category: 'FEMALE',
        countryCode: 'US',
      }
    })
    expect(res.statusCode).toBe(200)
    await validateResponse('prepareRoom', 200, res.json())
    let data = res.json().data
    expect(data.goLiveEligibility.canGoLive).toBe(true)
    roomId = data.room.id

    // 3. Go live
    res = await app.inject({
      method: 'POST',
      url: `/creator/rooms/${roomId}/go-live`,
      headers: asAuth(testUserId)
    })
    if (res.statusCode !== 200) {
      console.log('GO LIVE FAILED:', res.json())
    }
    expect(res.statusCode).toBe(200)
    await validateResponse('goLive', 200, res.json())

    // 4. List rooms correctly (catches isLive bug)
    res = await app.inject({
      method: 'GET',
      url: '/rooms',
    })
    expect(res.statusCode).toBe(200)
    await validateResponse('listRooms', 200, res.json())
    
    data = res.json().data
    expect(data.length).toBeGreaterThan(0)
    expect(data[0].id).toBe(roomId)
    expect(data[0].creator.isLive).toBe(true)

    // 5. Connect via Socket.IO and join the room
    await new Promise<void>((resolve, reject) => {
      const socket = SocketClient(`http://localhost:${port}`, {
        auth: { token: sessionToken }
      })

      socket.on('connect', () => {
        socket.emit('room:join', { roomId }, (response: any) => {
          if (!response?.ok) {
            socket.disconnect()
            reject(new Error('Failed to join room: ' + JSON.stringify(response)))
          }
        })
      })

      socket.on('room:viewer_count', (data: any) => {
        try {
          expect(data.roomId).toBe(roomId)
          expect(data.viewerCount).toBeGreaterThan(0)
          socket.disconnect()
          resolve()
        } catch (err) {
          socket.disconnect()
          reject(err)
        }
      })

      socket.on('connect_error', (err) => {
        reject(err)
      })
    })
  })
})
