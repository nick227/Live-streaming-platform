import { describe, it, expect, vi } from 'vitest'
import { db } from '@streamyolo/db'
import { RoomService } from '../services/RoomService'
import { LiveKitService } from '../services/LiveKitService'
import { AccessToken, TrackSource } from 'livekit-server-sdk'
import { buildTestApp, testUserId, testOtherUserId } from './helpers'

vi.mock('livekit-server-sdk', async () => {
  const actual = await vi.importActual('livekit-server-sdk')
  return {
    ...actual as any,
    AccessToken: vi.fn().mockImplementation(() => {
      return {
        addGrant: vi.fn(),
        toJwt: vi.fn().mockReturnValue('mocked-token'),
      }
    }),
  }
})

const app = buildTestApp()

describe('RoomMediaMode', () => {
  const roomSvc = new RoomService()
  const lkSvc = new LiveKitService()

  describe('GoLive Eligibility', () => {
    it('VIDEO room requires thumbnail', async () => {
      const creator = await db.creatorProfile.upsert({
        where: { userId: testUserId },
        update: { status: 'ACTIVE' },
        create: { userId: testUserId, status: 'ACTIVE' }
      })
      
      const room = await db.room.create({
        data: {
          title: 'Video Room',
          status: 'DRAFT',
          visibility: 'PUBLIC',
          mediaMode: 'VIDEO',
          livekitRoomName: 'test-video-room-' + Date.now(),
          creatorId: creator.id,
          category: 'COMEDY',
          countryCode: 'US',
        },
      })
      const eligibility = await roomSvc.getGoLiveEligibility(testUserId, room.id)
      expect(eligibility.missing.length).toBeGreaterThan(0)
      expect(eligibility.missing).toContain('ROOM_THUMBNAIL')
    })

    it('AUDIO_ONLY room does not require thumbnail', async () => {
      const creator = await db.creatorProfile.upsert({
        where: { userId: testUserId },
        update: { status: 'ACTIVE' },
        create: { userId: testUserId, status: 'ACTIVE' }
      })

      const room = await db.room.create({
        data: {
          title: 'Audio Room',
          status: 'DRAFT',
          visibility: 'PUBLIC',
          mediaMode: 'AUDIO_ONLY',
          livekitRoomName: 'test-audio-room-' + Date.now(),
          creatorId: creator.id,
          category: 'COMEDY',
          countryCode: 'US',
        },
      })
      const eligibility = await roomSvc.getGoLiveEligibility(testUserId, room.id)
      expect(eligibility.missing).not.toContain('ROOM_THUMBNAIL')
    })
  })

  describe('LiveKit Token Grants', () => {
    it('AUDIO_ONLY creator token only grants microphone', async () => {
      const creator = await db.creatorProfile.upsert({
        where: { userId: testUserId },
        update: { status: 'ACTIVE' },
        create: { userId: testUserId, status: 'ACTIVE' }
      })

      const room = await db.room.create({
        data: {
          title: 'Audio Room 2',
          status: 'DRAFT',
          visibility: 'PUBLIC',
          mediaMode: 'AUDIO_ONLY',
          livekitRoomName: 'test-audio-room-2-' + Date.now(),
          creatorId: creator.id,
        },
      })
      
      const mockedAccessToken = vi.mocked(AccessToken)
      mockedAccessToken.mockClear()
      
      await lkSvc.getToken(testUserId, { appRoomType: 'PUBLIC_ROOM', appRoomId: room.id })
      
      const instance = mockedAccessToken.mock.results[0].value
      expect(instance.addGrant).toHaveBeenCalledWith(expect.objectContaining({
        roomJoin: true,
        canPublish: true,
        canPublishSources: [TrackSource.MICROPHONE]
      }))
    })

    it('AUDIO_ONLY public viewer token remains subscribe-only', async () => {
      const creator = await db.creatorProfile.upsert({
        where: { userId: testUserId },
        update: { status: 'ACTIVE' },
        create: { userId: testUserId, status: 'ACTIVE' }
      })

      const room = await db.room.create({
        data: {
          title: 'Audio Room 3',
          status: 'LIVE',
          visibility: 'PUBLIC',
          mediaMode: 'AUDIO_ONLY',
          livekitRoomName: 'test-audio-room-3-' + Date.now(),
          creatorId: creator.id,
        },
      })
      
      const mockedAccessToken = vi.mocked(AccessToken)
      mockedAccessToken.mockClear()
      
      await lkSvc.getToken(testOtherUserId, { appRoomType: 'PUBLIC_ROOM', appRoomId: room.id })
      
      const instance = mockedAccessToken.mock.results[0].value
      expect(instance.addGrant).toHaveBeenCalledWith(expect.objectContaining({
        roomJoin: true,
        canPublish: false,
      }))
    })
  })
})
