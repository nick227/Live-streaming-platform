import '../../lib/env'
import { db } from '@streamyolo/db'
import { afterEach } from 'vitest'

// FK-safe delete order — leaf tables first
afterEach(async () => {
  try {
    console.log('Starting afterEach cleanup')
    await db.ledgerEntry.deleteMany()
    await db.roomModerationAction.deleteMany()
    await db.creatorUserReward.deleteMany()
    await db.creatorUserBan.deleteMany()
    await db.roomChatSettings.deleteMany()
    await db.adminAction.deleteMany()
    await db.report.deleteMany()
    await db.tip.deleteMany()
    await db.privateSession.deleteMany()
    await db.roomMenuItem.deleteMany()
    await db.roomGoal.deleteMany()
    await db.chatMessage.deleteMany()
    await db.room.deleteMany()
    await db.creatorMenuItem.deleteMany()
    await db.creatorProfile.deleteMany()
    await db.mediaAsset.deleteMany()
    await db.paymentTransaction.deleteMany()
    await db.tokenPack.deleteMany()
    await db.wallet.deleteMany()
    await db.session.deleteMany()
    await db.user.deleteMany({
      where: {
        id: {
          notIn: [
            '00000000-0000-0000-0000-000000000001',
            '00000000-0000-0000-0000-000000000002',
            '00000000-0000-0000-0000-admin0000000',
          ],
        },
      },
    })
    console.log('Finished afterEach cleanup')
  } catch (err) {
    console.error('Error in afterEach cleanup:', err)
  }
})
