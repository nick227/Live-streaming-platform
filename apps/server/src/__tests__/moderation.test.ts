import { describe, expect, it } from 'vitest'
import { db } from '@streamyolo/db'
import { ModerationService } from '../services/ModerationService'
import { PrivateSessionService } from '../services/PrivateSessionService'
import { TipService } from '../services/TipService'
import { buildTestApp, testOtherUserId, testUserId } from './helpers'

buildTestApp()

const moderation = new ModerationService()
const privateSessions = new PrivateSessionService()
const tips = new TipService()
const roomId = 'room-moderation-test'
const creatorId = 'creator-moderation-test'

async function seedLiveRoom() {
  await db.user.update({ where: { id: testUserId }, data: { role: 'CREATOR' } })
  await db.wallet.createMany({
    data: [
      { userId: testUserId, tokenBalance: 0 },
      { userId: testOtherUserId, tokenBalance: 100 },
    ],
    skipDuplicates: true,
  })
  await db.creatorProfile.create({
    data: {
      id: creatorId,
      userId: testUserId,
      status: 'ACTIVE',
      privateRateTokensPerMinute: 10,
      privateRulesText: 'Be kind.',
    },
  })
  await db.room.create({
    data: {
      id: roomId,
      creatorId,
      title: 'Moderation Room',
      slug: 'moderation-room',
      status: 'LIVE',
      visibility: 'PUBLIC',
      livekitRoomName: 'lk-moderation-room',
      thumbnailMediaId: 'thumb-1',
    },
  })
}

describe('streamer moderation', () => {
  it('mute blocks chat and unmute restores chat', async () => {
    await seedLiveRoom()

    await moderation.mute(testUserId, roomId, { targetUserId: testOtherUserId, durationSeconds: 60 })
    await expect(moderation.canSendChat(testOtherUserId, roomId)).resolves.toMatchObject({ ok: false })

    await moderation.unmute(testUserId, roomId, { targetUserId: testOtherUserId })
    await expect(moderation.canSendChat(testOtherUserId, roomId)).resolves.toMatchObject({ ok: true })
  })

  it('ban blocks room join', async () => {
    await seedLiveRoom()

    await moderation.ban(testUserId, roomId, { targetUserId: testOtherUserId, reason: 'spam' })

    await expect(moderation.canJoinRoom(testOtherUserId, roomId)).resolves.toMatchObject({
      ok: false,
      error: 'You are banned from this creator',
    })
  })

  it('ban blocks tips and private requests', async () => {
    await seedLiveRoom()
    await moderation.ban(testUserId, roomId, { targetUserId: testOtherUserId, reason: 'spam' })

    await expect(
      tips.createTip(testOtherUserId, roomId, { amountTokens: 1, requestType: 'GENERAL' }),
    ).rejects.toMatchObject({ statusCode: 403 })
    await expect(privateSessions.request(testOtherUserId, roomId)).rejects.toMatchObject({ statusCode: 403 })
  })

  it('slow mode throttles messages', async () => {
    await seedLiveRoom()

    await db.chatMessage.create({
      data: { roomId, userId: testOtherUserId, type: 'USER_MESSAGE', body: 'first' },
    })
    await moderation.updateChatSettings(testUserId, roomId, { slowModeSeconds: 30 })

    await expect(moderation.canSendChat(testOtherUserId, roomId)).resolves.toMatchObject({ ok: false })
  })

  it('writes audit actions for streamer controls', async () => {
    await seedLiveRoom()

    await moderation.kick(testUserId, roomId, { targetUserId: testOtherUserId, reason: 'spam' })

    await expect(
      db.roomModerationAction.count({ where: { roomId, targetUserId: testOtherUserId, type: 'KICK' } }),
    ).resolves.toBe(1)
  })

  it('keeps wallet and ledger unchanged for rewards', async () => {
    await seedLiveRoom()
    const beforeWallet = await db.wallet.findUniqueOrThrow({ where: { userId: testOtherUserId } })

    await moderation.reward(testUserId, roomId, { targetUserId: testOtherUserId, type: 'VIP' })

    const afterWallet = await db.wallet.findUniqueOrThrow({ where: { userId: testOtherUserId } })
    await expect(db.ledgerEntry.count({ where: { userId: testOtherUserId } })).resolves.toBe(0)
    expect(afterWallet.tokenBalance).toBe(beforeWallet.tokenBalance)
    expect(afterWallet.reservedTokenBalance).toBe(beforeWallet.reservedTokenBalance)
  })
})
