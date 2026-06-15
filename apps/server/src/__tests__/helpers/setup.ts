import { db } from '@streamyolo/db'
import { afterEach } from 'vitest'

// FK-safe delete order — leaf tables first
afterEach(async () => {
  await db.ledgerEntry.deleteMany()
  await db.adminAction.deleteMany()
  await db.report.deleteMany()
  await db.tip.deleteMany()
  await db.privateSession.deleteMany()
  await db.roomMenuItem.deleteMany()
  await db.roomGoal.deleteMany()
  await db.chatMessage.deleteMany()
  await db.mediaAsset.deleteMany()
  await db.room.deleteMany()
  await db.creatorMenuItem.deleteMany()
  await db.creatorProfile.deleteMany()
  await db.paymentTransaction.deleteMany()
  await db.wallet.deleteMany()
  await db.session.deleteMany()
  await db.user.deleteMany()
})
