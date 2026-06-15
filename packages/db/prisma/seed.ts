import { PrismaClient } from '@prisma/client'
import * as argon2 from 'argon2'

const db = new PrismaClient()

async function main() {
  console.log('Seeding...')

  // ── Token packs ────────────────────────────────────────────────────────────

  const packs = [
    { id: 'pack-100',  name: '100 Tokens',   priceCents: 999,   tokenAmount: 100,  bonusTokenAmount: 0,    sortOrder: 1 },
    { id: 'pack-500',  name: '500 Tokens',   priceCents: 3999,  tokenAmount: 500,  bonusTokenAmount: 50,   sortOrder: 2 },
    { id: 'pack-1000', name: '1000 Tokens',  priceCents: 6999,  tokenAmount: 1000, bonusTokenAmount: 150,  sortOrder: 3 },
    { id: 'pack-5000', name: '5000 Tokens',  priceCents: 29999, tokenAmount: 5000, bonusTokenAmount: 1000, sortOrder: 4 },
  ]

  for (const pack of packs) {
    await db.tokenPack.upsert({
      where: { id: pack.id },
      update: {},
      create: { ...pack, currency: 'USD', isActive: true },
    })
  }

  // ── Dev users ──────────────────────────────────────────────────────────────

  const adminPw   = await argon2.hash('password123')
  const creatorPw = await argon2.hash('password123')
  const viewerPw  = await argon2.hash('password123')

  const admin = await db.user.upsert({
    where: { email: 'admin@dev.local' },
    update: {},
    create: {
      email: 'admin@dev.local',
      username: 'admin',
      displayName: 'Admin',
      passwordHash: adminPw,
      role: 'ADMIN',
    },
  })

  const creator = await db.user.upsert({
    where: { email: 'creator@dev.local' },
    update: {},
    create: {
      email: 'creator@dev.local',
      username: 'streamstar',
      displayName: 'Stream Star',
      passwordHash: creatorPw,
      role: 'CREATOR',
    },
  })

  const viewer = await db.user.upsert({
    where: { email: 'viewer@dev.local' },
    update: {},
    create: {
      email: 'viewer@dev.local',
      username: 'viewer1',
      displayName: 'Viewer One',
      passwordHash: viewerPw,
      role: 'VIEWER',
    },
  })

  // ── Wallets ────────────────────────────────────────────────────────────────

  await db.wallet.upsert({
    where: { userId: creator.id },
    update: {},
    create: { userId: creator.id, tokenBalance: 0, reservedTokenBalance: 0 },
  })

  await db.wallet.upsert({
    where: { userId: viewer.id },
    update: {},
    create: { userId: viewer.id, tokenBalance: 1000, reservedTokenBalance: 0 },
  })

  // ── Creator profile ────────────────────────────────────────────────────────

  const profile = await db.creatorProfile.upsert({
    where: { userId: creator.id },
    update: {},
    create: {
      userId: creator.id,
      stageName: 'Stream Star',
      bio: 'Welcome to my stream! Tips appreciated.',
      status: 'ACTIVE',
      privateRateTokensPerMinute: 50,
      minPrivateMinutes: 5,
      privateViewerCamRequired: false,
      privateScreenShareAllowed: false,
      privateRulesText: 'Be respectful. No refunds after session starts.',
    },
  })

  // ── Tip menu items ─────────────────────────────────────────────────────────

  const menuItems = [
    { label: 'Say my name', tokenAmount: 50,  description: "I'll shout out your username" },
    { label: 'Dance break',  tokenAmount: 150, description: '30 seconds of dancing' },
    { label: 'Q&A question', tokenAmount: 100, description: "I'll answer any question" },
  ]

  for (let i = 0; i < menuItems.length; i++) {
    const item = menuItems[i]
    await db.creatorMenuItem.upsert({
      where: { id: `menu-${profile.id}-${i}` },
      update: {},
      create: {
        id: `menu-${profile.id}-${i}`,
        creatorProfileId: profile.id,
        label: item.label,
        description: item.description,
        tokenAmount: item.tokenAmount,
        isActive: true,
        sortOrder: i + 1,
      },
    })
  }

  // ── Dev room ───────────────────────────────────────────────────────────────

  await db.room.upsert({
    where: { slug: 'streamstar-live' },
    update: {},
    create: {
      slug: 'streamstar-live',
      title: "Stream Star's Room",
      creatorId: profile.id,
      status: 'DRAFT',
      visibility: 'PUBLIC',
      viewerCount: 0,
      privateRateTokensPerMinute: 50,
      minPrivateMinutes: 5,
      privateViewerCamRequired: false,
      privateScreenShareAllowed: false,
    },
  })

  console.log('Seed complete.')
  console.log('  admin@dev.local   / password123  (ADMIN)')
  console.log('  creator@dev.local / password123  (CREATOR — approved, ACTIVE)')
  console.log('  viewer@dev.local  / password123  (VIEWER — 1000 tokens)')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await db.$disconnect()
  })
