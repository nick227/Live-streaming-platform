import { PrismaClient } from '@prisma/client'
import * as argon2 from 'argon2'
import { existsSync, readFileSync } from 'fs'
import { resolve } from 'path'

loadEnvFile(resolve(__dirname, '../../../.env'))
const db = new PrismaClient()

const PASSWORD = 'password123'
const now = new Date('2026-06-15T15:00:00.000Z')

function loadEnvFile(path: string) {
  if (!existsSync(path)) return

  const lines = readFileSync(path, 'utf8').split(/\r?\n/)
  for (const line of lines) {
    const trimmed = line.trim()
    if (!trimmed || trimmed.startsWith('#')) continue

    const separatorIndex = trimmed.indexOf('=')
    if (separatorIndex === -1) continue

    const key = trimmed.slice(0, separatorIndex).trim()
    let value = trimmed.slice(separatorIndex + 1).trim()
    if (!key || process.env[key] !== undefined) continue

    if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
      value = value.slice(1, -1)
    }

    process.env[key] = value
  }
}

function daysAgo(days: number) {
  return new Date(now.getTime() - days * 24 * 60 * 60 * 1000)
}

function minutesAgo(minutes: number) {
  return new Date(now.getTime() - minutes * 60 * 1000)
}

async function upsertById(model: { upsert: (args: any) => Promise<any> }, data: any) {
  const { id, ...update } = data
  return model.upsert({
    where: { id },
    update,
    create: data,
  })
}

async function seedTokenPacks() {
  const packs = [
    { id: 'pack-100', name: '100 Tokens', priceCents: 999, tokenAmount: 100, bonusTokenAmount: 0, currency: 'USD', isActive: true, sortOrder: 1 },
    { id: 'pack-500', name: '500 Tokens', priceCents: 3999, tokenAmount: 500, bonusTokenAmount: 50, currency: 'USD', isActive: true, sortOrder: 2 },
    { id: 'pack-1000', name: '1000 Tokens', priceCents: 6999, tokenAmount: 1000, bonusTokenAmount: 150, currency: 'USD', isActive: true, sortOrder: 3 },
    { id: 'pack-5000', name: '5000 Tokens', priceCents: 29999, tokenAmount: 5000, bonusTokenAmount: 1000, currency: 'USD', isActive: true, sortOrder: 4 },
    { id: 'pack-legacy-250', name: 'Legacy 250 Tokens', priceCents: 1999, tokenAmount: 250, bonusTokenAmount: 0, currency: 'USD', isActive: false, sortOrder: 99 },
  ]

  for (const pack of packs) {
    await upsertById(db.tokenPack, pack)
  }
}

async function seedUsers(passwordHash: string) {
  const users = {
    admin: await db.user.upsert({
      where: { email: 'admin@dev.local' },
      update: {
        username: 'sysadmin',
        displayName: 'Admin',
        passwordHash,
        role: 'ADMIN',
        status: 'ACTIVE',
        ageVerifiedAt: now,
        emailVerifiedAt: now,
      },
      create: {
        email: 'admin@dev.local',
        username: 'sysadmin',
        displayName: 'Admin',
        passwordHash,
        role: 'ADMIN',
        status: 'ACTIVE',
        ageVerifiedAt: now,
        emailVerifiedAt: now,
      },
    }),
    luna: await db.user.upsert({
      where: { email: 'creator.live@dev.local' },
      update: {
        username: 'lunasignal',
        displayName: 'Luna Signal',
        passwordHash,
        role: 'CREATOR',
        status: 'ACTIVE',
        ageVerifiedAt: daysAgo(80),
        emailVerifiedAt: daysAgo(80),
      },
      create: {
        email: 'creator.live@dev.local',
        username: 'lunasignal',
        displayName: 'Luna Signal',
        passwordHash,
        role: 'CREATOR',
        status: 'ACTIVE',
        ageVerifiedAt: daysAgo(80),
        emailVerifiedAt: daysAgo(80),
      },
    }),
    nova: await db.user.upsert({
      where: { email: 'creator.offline@dev.local' },
      update: {
        username: 'novaroom',
        displayName: 'Nova Room',
        passwordHash,
        role: 'CREATOR',
        status: 'ACTIVE',
        ageVerifiedAt: daysAgo(70),
        emailVerifiedAt: daysAgo(70),
      },
      create: {
        email: 'creator.offline@dev.local',
        username: 'novaroom',
        displayName: 'Nova Room',
        passwordHash,
        role: 'CREATOR',
        status: 'ACTIVE',
        ageVerifiedAt: daysAgo(70),
        emailVerifiedAt: daysAgo(70),
      },
    }),
    mira: await db.user.upsert({
      where: { email: 'creator.pending@dev.local' },
      update: {
        username: 'mirapending',
        displayName: 'Mira Pending',
        passwordHash,
        role: 'CREATOR',
        status: 'ACTIVE',
        ageVerifiedAt: daysAgo(15),
        emailVerifiedAt: daysAgo(15),
      },
      create: {
        email: 'creator.pending@dev.local',
        username: 'mirapending',
        displayName: 'Mira Pending',
        passwordHash,
        role: 'CREATOR',
        status: 'ACTIVE',
        ageVerifiedAt: daysAgo(15),
        emailVerifiedAt: daysAgo(15),
      },
    }),
    echo: await db.user.upsert({
      where: { email: 'creator.draft@dev.local' },
      update: {
        username: 'echodraft',
        displayName: 'Echo Draft',
        passwordHash,
        role: 'CREATOR',
        status: 'ACTIVE',
        ageVerifiedAt: daysAgo(5),
        emailVerifiedAt: daysAgo(5),
      },
      create: {
        email: 'creator.draft@dev.local',
        username: 'echodraft',
        displayName: 'Echo Draft',
        passwordHash,
        role: 'CREATOR',
        status: 'ACTIVE',
        ageVerifiedAt: daysAgo(5),
        emailVerifiedAt: daysAgo(5),
      },
    }),
    vera: await db.user.upsert({
      where: { email: 'creator.suspended@dev.local' },
      update: {
        username: 'verapaused',
        displayName: 'Vera Paused',
        passwordHash,
        role: 'CREATOR',
        status: 'SUSPENDED',
        suspendedAt: daysAgo(2),
        ageVerifiedAt: daysAgo(90),
        emailVerifiedAt: daysAgo(90),
      },
      create: {
        email: 'creator.suspended@dev.local',
        username: 'verapaused',
        displayName: 'Vera Paused',
        passwordHash,
        role: 'CREATOR',
        status: 'SUSPENDED',
        suspendedAt: daysAgo(2),
        ageVerifiedAt: daysAgo(90),
        emailVerifiedAt: daysAgo(90),
      },
    }),
    funded: await db.user.upsert({
      where: { email: 'viewer.funded@dev.local' },
      update: {
        username: 'fundedfan',
        displayName: 'Funded Fan',
        passwordHash,
        role: 'VIEWER',
        status: 'ACTIVE',
        ageVerifiedAt: daysAgo(40),
        emailVerifiedAt: daysAgo(40),
      },
      create: {
        email: 'viewer.funded@dev.local',
        username: 'fundedfan',
        displayName: 'Funded Fan',
        passwordHash,
        role: 'VIEWER',
        status: 'ACTIVE',
        ageVerifiedAt: daysAgo(40),
        emailVerifiedAt: daysAgo(40),
      },
    }),
    low: await db.user.upsert({
      where: { email: 'viewer.low@dev.local' },
      update: {
        username: 'lowtokens',
        displayName: 'Low Tokens',
        passwordHash,
        role: 'VIEWER',
        status: 'ACTIVE',
        ageVerifiedAt: daysAgo(12),
        emailVerifiedAt: daysAgo(12),
      },
      create: {
        email: 'viewer.low@dev.local',
        username: 'lowtokens',
        displayName: 'Low Tokens',
        passwordHash,
        role: 'VIEWER',
        status: 'ACTIVE',
        ageVerifiedAt: daysAgo(12),
        emailVerifiedAt: daysAgo(12),
      },
    }),
    privateViewer: await db.user.upsert({
      where: { email: 'viewer.private@dev.local' },
      update: {
        username: 'privatequeue',
        displayName: 'Private Queue',
        passwordHash,
        role: 'VIEWER',
        status: 'ACTIVE',
        ageVerifiedAt: daysAgo(20),
        emailVerifiedAt: daysAgo(20),
      },
      create: {
        email: 'viewer.private@dev.local',
        username: 'privatequeue',
        displayName: 'Private Queue',
        passwordHash,
        role: 'VIEWER',
        status: 'ACTIVE',
        ageVerifiedAt: daysAgo(20),
        emailVerifiedAt: daysAgo(20),
      },
    }),
    reporter: await db.user.upsert({
      where: { email: 'viewer.reporter@dev.local' },
      update: {
        username: 'sharpmoderator',
        displayName: 'Sharp Reporter',
        passwordHash,
        role: 'VIEWER',
        status: 'ACTIVE',
        ageVerifiedAt: daysAgo(22),
        emailVerifiedAt: daysAgo(22),
      },
      create: {
        email: 'viewer.reporter@dev.local',
        username: 'sharpmoderator',
        displayName: 'Sharp Reporter',
        passwordHash,
        role: 'VIEWER',
        status: 'ACTIVE',
        ageVerifiedAt: daysAgo(22),
        emailVerifiedAt: daysAgo(22),
      },
    }),
  }

  return users
}

async function seedWallets(users: Awaited<ReturnType<typeof seedUsers>>) {
  const walletSpecs = [
    { userId: users.luna.id, tokenBalance: 3920, reservedTokenBalance: 0, lifetimePurchasedTokens: 0, lifetimeSpentTokens: 0 },
    { userId: users.nova.id, tokenBalance: 840, reservedTokenBalance: 0, lifetimePurchasedTokens: 0, lifetimeSpentTokens: 0 },
    { userId: users.mira.id, tokenBalance: 0, reservedTokenBalance: 0, lifetimePurchasedTokens: 0, lifetimeSpentTokens: 0 },
    { userId: users.echo.id, tokenBalance: 0, reservedTokenBalance: 0, lifetimePurchasedTokens: 0, lifetimeSpentTokens: 0 },
    { userId: users.vera.id, tokenBalance: 150, reservedTokenBalance: 0, lifetimePurchasedTokens: 0, lifetimeSpentTokens: 0 },
    { userId: users.funded.id, tokenBalance: 1530, reservedTokenBalance: 0, lifetimePurchasedTokens: 2650, lifetimeSpentTokens: 1120 },
    { userId: users.low.id, tokenBalance: 20, reservedTokenBalance: 0, lifetimePurchasedTokens: 100, lifetimeSpentTokens: 80 },
    { userId: users.privateViewer.id, tokenBalance: 680, reservedTokenBalance: 300, lifetimePurchasedTokens: 1550, lifetimeSpentTokens: 570 },
    { userId: users.reporter.id, tokenBalance: 260, reservedTokenBalance: 0, lifetimePurchasedTokens: 550, lifetimeSpentTokens: 290 },
  ]

  const wallets: Record<string, any> = {}
  for (const spec of walletSpecs) {
    wallets[spec.userId] = await db.wallet.upsert({
      where: { userId: spec.userId },
      update: spec,
      create: spec,
    })
  }

  return wallets
}

async function seedCreatorProfiles(users: Awaited<ReturnType<typeof seedUsers>>) {
  const profiles = {
    luna: await db.creatorProfile.upsert({
      where: { userId: users.luna.id },
      update: {
        bio: 'Late-night synth sets, chill chat, and high-energy goals.',
        status: 'ACTIVE',
        isLive: true,
        privateRateTokensPerMinute: 60,
        minPrivateMinutes: 5,
        privateViewerCamRequired: false,
        privateScreenShareAllowed: true,
        privateRulesText: 'Be kind, keep requests platform-safe, and confirm custom requests in chat first.',
        payoutStatus: 'ENABLED',
        pendingTokenBalance: 3920,
      },
      create: {
        userId: users.luna.id,
        bio: 'Late-night synth sets, chill chat, and high-energy goals.',
        status: 'ACTIVE',
        isLive: true,
        privateRateTokensPerMinute: 60,
        minPrivateMinutes: 5,
        privateViewerCamRequired: false,
        privateScreenShareAllowed: true,
        privateRulesText: 'Be kind, keep requests platform-safe, and confirm custom requests in chat first.',
        payoutStatus: 'ENABLED',
        pendingTokenBalance: 3920,
      },
    }),
    nova: await db.creatorProfile.upsert({
      where: { userId: users.nova.id },
      update: {
        bio: 'Cozy daytime streams with games, music, and quick-fire tip menu challenges.',
        status: 'ACTIVE',
        isLive: true,
        privateRateTokensPerMinute: 45,
        minPrivateMinutes: 3,
        privateViewerCamRequired: true,
        privateScreenShareAllowed: false,
        privateRulesText: 'Viewer cam required for private sessions. No recording or reposting.',
        payoutStatus: 'ENABLED',
        pendingTokenBalance: 840,
      },
      create: {
        userId: users.nova.id,
        bio: 'Cozy daytime streams with games, music, and quick-fire tip menu challenges.',
        status: 'ACTIVE',
        isLive: true,
        privateRateTokensPerMinute: 45,
        minPrivateMinutes: 3,
        privateViewerCamRequired: true,
        privateScreenShareAllowed: false,
        privateRulesText: 'Viewer cam required for private sessions. No recording or reposting.',
        payoutStatus: 'ENABLED',
        pendingTokenBalance: 840,
      },
    }),
    mira: await db.creatorProfile.upsert({
      where: { userId: users.mira.id },
      update: {
        bio: 'Profile complete, waiting for admin approval.',
        status: 'PENDING',
        isLive: false,
        privateRateTokensPerMinute: 35,
        minPrivateMinutes: 4,
        privateViewerCamRequired: false,
        privateScreenShareAllowed: false,
        privateRulesText: 'Respectful chat only. Private requests are reviewed before acceptance.',
        payoutStatus: 'DISABLED',
        pendingTokenBalance: 0,
      },
      create: {
        userId: users.mira.id,
        bio: 'Profile complete, waiting for admin approval.',
        status: 'PENDING',
        isLive: false,
        privateRateTokensPerMinute: 35,
        minPrivateMinutes: 4,
        privateViewerCamRequired: false,
        privateScreenShareAllowed: false,
        privateRulesText: 'Respectful chat only. Private requests are reviewed before acceptance.',
        payoutStatus: 'DISABLED',
        pendingTokenBalance: 0,
      },
    }),
    echo: await db.creatorProfile.upsert({
      where: { userId: users.echo.id },
      update: {
        bio: 'Incomplete profile for go-live eligibility testing.',
        status: 'DRAFT',
        isLive: false,
        privateRateTokensPerMinute: 0,
        minPrivateMinutes: 1,
        privateViewerCamRequired: false,
        privateScreenShareAllowed: false,
        privateRulesText: null,
        payoutStatus: 'DISABLED',
        pendingTokenBalance: 0,
      },
      create: {
        userId: users.echo.id,
        bio: 'Incomplete profile for go-live eligibility testing.',
        status: 'DRAFT',
        isLive: false,
        privateRateTokensPerMinute: 0,
        minPrivateMinutes: 1,
        privateViewerCamRequired: false,
        privateScreenShareAllowed: false,
        privateRulesText: null,
        payoutStatus: 'DISABLED',
        pendingTokenBalance: 0,
      },
    }),
    vera: await db.creatorProfile.upsert({
      where: { userId: users.vera.id },
      update: {
        bio: 'Suspended profile retained for admin enforcement review.',
        status: 'SUSPENDED',
        isLive: false,
        privateRateTokensPerMinute: 70,
        minPrivateMinutes: 5,
        privateViewerCamRequired: false,
        privateScreenShareAllowed: false,
        privateRulesText: 'Historical rules captured before suspension.',
        payoutStatus: 'HOLD',
        pendingTokenBalance: 150,
      },
      create: {
        userId: users.vera.id,
        bio: 'Suspended profile retained for admin enforcement review.',
        status: 'SUSPENDED',
        isLive: false,
        privateRateTokensPerMinute: 70,
        minPrivateMinutes: 5,
        privateViewerCamRequired: false,
        privateScreenShareAllowed: false,
        privateRulesText: 'Historical rules captured before suspension.',
        payoutStatus: 'HOLD',
        pendingTokenBalance: 150,
      },
    }),
  }

  return profiles
}

async function seedMedia(users: Awaited<ReturnType<typeof seedUsers>>, profiles: Awaited<ReturnType<typeof seedCreatorProfiles>>) {
  const media = [
    { id: 'media-luna-avatar', ownerUserId: users.luna.id, creatorId: profiles.luna.id, type: 'AVATAR', url: 'http://localhost:3001/uploads/dev/luna-avatar.webp', dominantColor: '#7c3aed', status: 'APPROVED', source: 'UPLOADED' },
    { id: 'media-luna-banner', ownerUserId: users.luna.id, creatorId: profiles.luna.id, type: 'BANNER', url: 'http://localhost:3001/uploads/dev/luna-banner.webp', dominantColor: '#0f172a', status: 'APPROVED', source: 'UPLOADED' },
    { id: 'media-luna-thumb', ownerUserId: users.luna.id, creatorId: profiles.luna.id, type: 'ROOM_THUMBNAIL_CAPTURE', url: 'http://localhost:3001/uploads/dev/luna-thumb.webp', dominantColor: '#db2777', status: 'APPROVED', source: 'CREATOR_CAPTURED' },
    { id: 'media-nova-avatar', ownerUserId: users.nova.id, creatorId: profiles.nova.id, type: 'AVATAR', url: 'http://localhost:3001/uploads/dev/nova-avatar.webp', dominantColor: '#0284c7', status: 'APPROVED', source: 'UPLOADED' },
    { id: 'media-nova-thumb', ownerUserId: users.nova.id, creatorId: profiles.nova.id, type: 'ROOM_THUMBNAIL_CAPTURE', url: 'http://localhost:3001/uploads/dev/nova-thumb.webp', dominantColor: '#16a34a', status: 'APPROVED', source: 'CREATOR_CAPTURED' },
    { id: 'media-mira-avatar', ownerUserId: users.mira.id, creatorId: profiles.mira.id, type: 'AVATAR', url: 'http://localhost:3001/uploads/dev/mira-avatar.webp', dominantColor: '#f97316', status: 'PENDING', source: 'UPLOADED' },
    { id: 'media-echo-cover', ownerUserId: users.echo.id, creatorId: profiles.echo.id, type: 'ROOM_COVER', url: 'http://localhost:3001/uploads/dev/echo-cover.webp', dominantColor: '#64748b', status: 'PENDING', source: 'UPLOADED' },
    { id: 'media-vera-rejected', ownerUserId: users.vera.id, creatorId: profiles.vera.id, type: 'AVATAR', url: 'http://localhost:3001/uploads/dev/vera-rejected.webp', dominantColor: '#991b1b', status: 'REJECTED', source: 'UPLOADED' },
  ]

  const created: Record<string, any> = {}
  for (const asset of media) {
    created[asset.id] = await upsertById(db.mediaAsset, asset)
  }

  await db.creatorProfile.update({
    where: { id: profiles.luna.id },
    data: { avatarMediaId: created['media-luna-avatar'].id, bannerMediaId: created['media-luna-banner'].id },
  })
  await db.creatorProfile.update({
    where: { id: profiles.nova.id },
    data: { avatarMediaId: created['media-nova-avatar'].id },
  })
  await db.creatorProfile.update({
    where: { id: profiles.mira.id },
    data: { avatarMediaId: created['media-mira-avatar'].id },
  })

  return created
}

async function seedRoomTags() {
  const tags = [
    { slug: 'latina', label: 'Latina', group: 'ethnicity', sortOrder: 1 },
    { slug: 'asian', label: 'Asian', group: 'ethnicity', sortOrder: 2 },
    { slug: 'ebony', label: 'Ebony', group: 'ethnicity', sortOrder: 3 },
    { slug: 'caucasian', label: 'Caucasian', group: 'ethnicity', sortOrder: 4 },
    { slug: 'middle-eastern', label: 'Middle Eastern', group: 'ethnicity', sortOrder: 5 },
    { slug: 'milf', label: 'MILF', group: 'ethnicity', sortOrder: 6 },
    { slug: 'mature', label: 'Mature', group: 'ethnicity', sortOrder: 7 },
    { slug: 'young-adult', label: 'Young Adult', group: 'ethnicity', sortOrder: 8 },
    { slug: 'college-vibe', label: 'College Vibe', group: 'ethnicity', sortOrder: 9 },
    { slug: 'new-model', label: 'New Model', group: 'ethnicity', sortOrder: 10 },
    { slug: 'petite', label: 'Petite', group: 'body', sortOrder: 1 },
    { slug: 'curvy', label: 'Curvy', group: 'body', sortOrder: 2 },
    { slug: 'bbw', label: 'BBW', group: 'body', sortOrder: 3 },
    { slug: 'athletic', label: 'Athletic', group: 'body', sortOrder: 4 },
    { slug: 'tattooed', label: 'Tattooed', group: 'body', sortOrder: 5 },
    { slug: 'interactive-toys', label: 'Interactive Toys', group: 'activity', sortOrder: 1 },
    { slug: 'roleplay', label: 'Roleplay', group: 'activity', sortOrder: 2 },
    { slug: 'asmr', label: 'ASMR', group: 'activity', sortOrder: 3 },
    { slug: 'gaming', label: 'Gaming', group: 'activity', sortOrder: 4 },
    { slug: 'fitness', label: 'Fitness', group: 'activity', sortOrder: 5 },
    { slug: 'cooking', label: 'Cooking', group: 'activity', sortOrder: 6 },
    { slug: 'english', label: 'English', group: 'language', sortOrder: 1 },
    { slug: 'spanish', label: 'Spanish', group: 'language', sortOrder: 2 },
    { slug: 'french', label: 'French', group: 'language', sortOrder: 3 },
    { slug: 'german', label: 'German', group: 'language', sortOrder: 4 },
    { slug: 'portuguese', label: 'Portuguese', group: 'language', sortOrder: 5 },
  ]

  const created: Record<string, { id: string; slug: string }> = {}
  for (const tag of tags) {
    const row = await db.roomTag.upsert({
      where: { slug: tag.slug },
      update: {
        label: tag.label,
        group: tag.group,
        sortOrder: tag.sortOrder,
        isActive: true,
      },
      create: tag,
    })
    created[tag.slug] = row
  }
  return created
}

async function seedRoomTaxonomy(
  profiles: Awaited<ReturnType<typeof seedCreatorProfiles>>,
  rooms: Awaited<ReturnType<typeof seedRooms>>,
  tags: Record<string, { id: string; slug: string }>,
) {
  await db.creatorProfile.update({
    where: { id: profiles.luna.id },
    data: { defaultRoomCategory: 'FEMALE', defaultCountryCode: 'US' },
  })
  await db.creatorProfile.update({
    where: { id: profiles.nova.id },
    data: { defaultRoomCategory: 'COUPLES', defaultCountryCode: 'GB' },
  })

  await db.creatorDefaultRoomTag.createMany({
    data: [
      { creatorId: profiles.luna.id, tagId: tags.latina.id },
      { creatorId: profiles.luna.id, tagId: tags['interactive-toys'].id },
      { creatorId: profiles.luna.id, tagId: tags.english.id },
      { creatorId: profiles.nova.id, tagId: tags.gaming.id },
      { creatorId: profiles.nova.id, tagId: tags.english.id },
    ],
    skipDuplicates: true,
  })

  await db.room.update({
    where: { id: rooms.lunaLive.id },
    data: { category: 'FEMALE', countryCode: 'US' },
  })
  await db.room.update({
    where: { id: rooms.novaLive.id },
    data: { category: 'COUPLES', countryCode: 'GB' },
  })

  await db.roomTagAssignment.createMany({
    data: [
      { roomId: rooms.lunaLive.id, tagId: tags.latina.id },
      { roomId: rooms.lunaLive.id, tagId: tags['interactive-toys'].id },
      { roomId: rooms.lunaLive.id, tagId: tags.english.id },
      { roomId: rooms.novaLive.id, tagId: tags.gaming.id },
      { roomId: rooms.novaLive.id, tagId: tags.english.id },
      { roomId: rooms.novaLive.id, tagId: tags.roleplay.id },
    ],
    skipDuplicates: true,
  })
}

async function seedRooms(profiles: Awaited<ReturnType<typeof seedCreatorProfiles>>, media: Record<string, any>) {
  const rooms = {
    lunaLive: await db.room.upsert({
      where: { slug: 'luna-signal-live' },
      update: {
        creatorId: profiles.luna.id,
        title: 'Luna Signal After Dark',
        status: 'LIVE',
        visibility: 'PUBLIC',
        livekitRoomName: 'dev-room-luna-live',
        thumbnailMediaId: media['media-luna-thumb'].id,
        viewerCount: 184,
        startedAt: minutesAgo(82),
        endedAt: null,
      },
      create: {
        creatorId: profiles.luna.id,
        title: 'Luna Signal After Dark',
        slug: 'luna-signal-live',
        status: 'LIVE',
        visibility: 'PUBLIC',
        livekitRoomName: 'dev-room-luna-live',
        thumbnailMediaId: media['media-luna-thumb'].id,
        viewerCount: 184,
        startedAt: minutesAgo(82),
      },
    }),
    novaLive: await db.room.upsert({
      where: { slug: 'nova-room-live' },
      update: {
        creatorId: profiles.nova.id,
        title: 'Nova Room Plays Requests',
        status: 'LIVE',
        visibility: 'PUBLIC',
        livekitRoomName: 'dev-room-nova-live',
        thumbnailMediaId: media['media-nova-thumb'].id,
        viewerCount: 73,
        startedAt: minutesAgo(34),
        endedAt: null,
      },
      create: {
        creatorId: profiles.nova.id,
        title: 'Nova Room Plays Requests',
        slug: 'nova-room-live',
        status: 'LIVE',
        visibility: 'PUBLIC',
        livekitRoomName: 'dev-room-nova-live',
        thumbnailMediaId: media['media-nova-thumb'].id,
        viewerCount: 73,
        startedAt: minutesAgo(34),
      },
    }),
    lunaUnlisted: await db.room.upsert({
      where: { slug: 'luna-vip-unlisted' },
      update: {
        creatorId: profiles.luna.id,
        title: 'Luna VIP Warmup',
        status: 'LIVE',
        visibility: 'UNLISTED',
        livekitRoomName: 'dev-room-luna-unlisted',
        thumbnailMediaId: media['media-luna-thumb'].id,
        viewerCount: 12,
        startedAt: minutesAgo(18),
        endedAt: null,
      },
      create: {
        creatorId: profiles.luna.id,
        title: 'Luna VIP Warmup',
        slug: 'luna-vip-unlisted',
        status: 'LIVE',
        visibility: 'UNLISTED',
        livekitRoomName: 'dev-room-luna-unlisted',
        thumbnailMediaId: media['media-luna-thumb'].id,
        viewerCount: 12,
        startedAt: minutesAgo(18),
      },
    }),
    miraDraft: await db.room.upsert({
      where: { slug: 'mira-pending-preview' },
      update: {
        creatorId: profiles.mira.id,
        title: 'Mira Pending Preview',
        status: 'DRAFT',
        visibility: 'PUBLIC',
        livekitRoomName: 'dev-room-mira-draft',
        thumbnailMediaId: null,
        viewerCount: 0,
        startedAt: null,
        endedAt: null,
      },
      create: {
        creatorId: profiles.mira.id,
        title: 'Mira Pending Preview',
        slug: 'mira-pending-preview',
        status: 'DRAFT',
        visibility: 'PUBLIC',
        livekitRoomName: 'dev-room-mira-draft',
        viewerCount: 0,
      },
    }),
    echoDraft: await db.room.upsert({
      where: { slug: 'echo-draft-setup' },
      update: {
        creatorId: profiles.echo.id,
        title: 'Echo Draft Setup',
        status: 'DRAFT',
        visibility: 'PUBLIC',
        livekitRoomName: 'dev-room-echo-draft',
        thumbnailMediaId: null,
        coverMediaId: media['media-echo-cover'].id,
        viewerCount: 0,
        startedAt: null,
        endedAt: null,
      },
      create: {
        creatorId: profiles.echo.id,
        title: 'Echo Draft Setup',
        slug: 'echo-draft-setup',
        status: 'DRAFT',
        visibility: 'PUBLIC',
        livekitRoomName: 'dev-room-echo-draft',
        coverMediaId: media['media-echo-cover'].id,
        viewerCount: 0,
      },
    }),
    novaEnded: await db.room.upsert({
      where: { slug: 'nova-arcade-recap' },
      update: {
        creatorId: profiles.nova.id,
        title: 'Nova Arcade Recap',
        status: 'ENDED',
        visibility: 'PUBLIC',
        livekitRoomName: 'dev-room-nova-ended',
        thumbnailMediaId: media['media-nova-thumb'].id,
        viewerCount: 0,
        startedAt: daysAgo(1),
        endedAt: new Date(daysAgo(1).getTime() + 92 * 60 * 1000),
      },
      create: {
        creatorId: profiles.nova.id,
        title: 'Nova Arcade Recap',
        slug: 'nova-arcade-recap',
        status: 'ENDED',
        visibility: 'PUBLIC',
        livekitRoomName: 'dev-room-nova-ended',
        thumbnailMediaId: media['media-nova-thumb'].id,
        viewerCount: 0,
        startedAt: daysAgo(1),
        endedAt: new Date(daysAgo(1).getTime() + 92 * 60 * 1000),
      },
    }),
    veraHidden: await db.room.upsert({
      where: { slug: 'vera-hidden-room' },
      update: {
        creatorId: profiles.vera.id,
        title: 'Vera Hidden Room',
        status: 'HIDDEN',
        visibility: 'PUBLIC',
        livekitRoomName: 'dev-room-vera-hidden',
        viewerCount: 0,
        startedAt: daysAgo(3),
        endedAt: daysAgo(2),
      },
      create: {
        creatorId: profiles.vera.id,
        title: 'Vera Hidden Room',
        slug: 'vera-hidden-room',
        status: 'HIDDEN',
        visibility: 'PUBLIC',
        livekitRoomName: 'dev-room-vera-hidden',
        viewerCount: 0,
        startedAt: daysAgo(3),
        endedAt: daysAgo(2),
      },
    }),
  }

  await db.creatorProfile.update({
    where: { id: profiles.luna.id },
    data: { currentRoomId: rooms.lunaLive.id },
  })
  await db.creatorProfile.update({
    where: { id: profiles.nova.id },
    data: { currentRoomId: rooms.novaLive.id },
  })

  return rooms
}

async function seedMenus(profiles: Awaited<ReturnType<typeof seedCreatorProfiles>>, rooms: Awaited<ReturnType<typeof seedRooms>>) {
  const menuSpecs = [
    { id: 'menu-luna-shoutout', creatorId: profiles.luna.id, label: 'Name shoutout', description: 'A quick thank-you live on stream.', tokenAmount: 50, isActive: true, sortOrder: 1 },
    { id: 'menu-luna-song', creatorId: profiles.luna.id, label: 'Song request', description: 'Pick the next safe-for-stream track.', tokenAmount: 150, isActive: true, sortOrder: 2 },
    { id: 'menu-luna-dance', creatorId: profiles.luna.id, label: 'Dance break', description: 'Thirty seconds of movement.', tokenAmount: 250, isActive: true, sortOrder: 3 },
    { id: 'menu-luna-qna', creatorId: profiles.luna.id, label: 'Q and A question', description: 'Ask one question for the live chat.', tokenAmount: 100, isActive: true, sortOrder: 4 },
    { id: 'menu-luna-retired', creatorId: profiles.luna.id, label: 'Retired bit', description: 'Inactive item for filter testing.', tokenAmount: 25, isActive: false, sortOrder: 99 },
    { id: 'menu-nova-shoutout', creatorId: profiles.nova.id, label: 'Controller pick', description: 'Choose the next challenge.', tokenAmount: 75, isActive: true, sortOrder: 1 },
    { id: 'menu-nova-spin', creatorId: profiles.nova.id, label: 'Wheel spin', description: 'Spin the stream wheel.', tokenAmount: 125, isActive: true, sortOrder: 2 },
    { id: 'menu-nova-voice', creatorId: profiles.nova.id, label: 'Voice line', description: 'A quick character voice line.', tokenAmount: 90, isActive: true, sortOrder: 3 },
    { id: 'menu-mira-intro', creatorId: profiles.mira.id, label: 'Intro shoutout', description: 'Ready once approved.', tokenAmount: 40, isActive: true, sortOrder: 1 },
  ]

  const menus: Record<string, any> = {}
  for (const item of menuSpecs) {
    menus[item.id] = await upsertById(db.creatorMenuItem, item)
  }

  const roomMenuSpecs = [
    { id: 'room-menu-luna-shoutout', roomId: rooms.lunaLive.id, sourceCreatorMenuItemId: menus['menu-luna-shoutout'].id, label: 'Name shoutout', description: 'A quick thank-you live on stream.', tokenAmount: 50, isActive: true, sortOrder: 1 },
    { id: 'room-menu-luna-song', roomId: rooms.lunaLive.id, sourceCreatorMenuItemId: menus['menu-luna-song'].id, label: 'Song request', description: 'Pick the next safe-for-stream track.', tokenAmount: 150, isActive: true, sortOrder: 2 },
    { id: 'room-menu-luna-dance', roomId: rooms.lunaLive.id, sourceCreatorMenuItemId: menus['menu-luna-dance'].id, label: 'Dance break', description: 'Thirty seconds of movement.', tokenAmount: 250, isActive: true, sortOrder: 3 },
    { id: 'room-menu-luna-qna', roomId: rooms.lunaLive.id, sourceCreatorMenuItemId: menus['menu-luna-qna'].id, label: 'Q and A question', description: 'Ask one question for the live chat.', tokenAmount: 100, isActive: true, sortOrder: 4 },
    { id: 'room-menu-nova-controller', roomId: rooms.novaLive.id, sourceCreatorMenuItemId: menus['menu-nova-shoutout'].id, label: 'Controller pick', description: 'Choose the next challenge.', tokenAmount: 75, isActive: true, sortOrder: 1 },
    { id: 'room-menu-nova-spin', roomId: rooms.novaLive.id, sourceCreatorMenuItemId: menus['menu-nova-spin'].id, label: 'Wheel spin', description: 'Spin the stream wheel.', tokenAmount: 125, isActive: true, sortOrder: 2 },
    { id: 'room-menu-nova-voice', roomId: rooms.novaLive.id, sourceCreatorMenuItemId: menus['menu-nova-voice'].id, label: 'Voice line', description: 'A quick character voice line.', tokenAmount: 90, isActive: true, sortOrder: 3 },
  ]

  const roomMenus: Record<string, any> = {}
  for (const item of roomMenuSpecs) {
    roomMenus[item.id] = await upsertById(db.roomMenuItem, item)
  }

  return { menus, roomMenus }
}

async function seedGoals(rooms: Awaited<ReturnType<typeof seedRooms>>) {
  const goals = [
    { id: 'goal-luna-lights', roomId: rooms.lunaLive.id, title: 'Studio lights', targetTokens: 2000, currentTokens: 1800 },
    { id: 'goal-nova-boss', roomId: rooms.novaLive.id, title: 'Beat the bonus boss', targetTokens: 1000, currentTokens: 0 },
    { id: 'goal-luna-vip', roomId: rooms.lunaUnlisted.id, title: 'VIP afterparty', targetTokens: 2000, currentTokens: 2200 },
  ]

  for (const goal of goals) {
    await upsertById(db.roomGoal, goal)
  }
}

async function seedPayments(users: Awaited<ReturnType<typeof seedUsers>>) {
  const payments = [
    {
      id: 'payment-funded-approved-001',
      userId: users.funded.id,
      tokenPackId: 'pack-1000',
      provider: 'CCBILL',
      providerTxnId: 'dev-ccbill-approved-001',
      providerCustomerId: 'dev-customer-funded',
      status: 'APPROVED',
      amountCents: 6999,
      currency: 'USD',
      tokensCredited: 1150,
      checkoutUrl: null,
      rawProviderJson: { demo: true, outcome: 'approved' },
      approvedAt: daysAgo(7),
      failedAt: null,
      refundedAt: null,
      chargebackAt: null,
      createdAt: daysAgo(7),
    },
    {
      id: 'payment-funded-pending-001',
      userId: users.funded.id,
      tokenPackId: 'pack-500',
      provider: 'CCBILL',
      providerTxnId: 'dev-ccbill-pending-001',
      providerCustomerId: 'dev-customer-funded',
      status: 'PENDING',
      amountCents: 3999,
      currency: 'USD',
      tokensCredited: 0,
      checkoutUrl: 'https://ccbill.example.test/checkout/dev-pending',
      rawProviderJson: { demo: true, outcome: 'pending' },
      approvedAt: null,
      failedAt: null,
      refundedAt: null,
      chargebackAt: null,
      createdAt: minutesAgo(45),
    },
    {
      id: 'payment-low-declined-001',
      userId: users.low.id,
      tokenPackId: 'pack-100',
      provider: 'CCBILL',
      providerTxnId: 'dev-ccbill-declined-001',
      providerCustomerId: 'dev-customer-low',
      status: 'DECLINED',
      amountCents: 999,
      currency: 'USD',
      tokensCredited: 0,
      checkoutUrl: null,
      rawProviderJson: { demo: true, declineCode: 'insufficient_funds' },
      approvedAt: null,
      failedAt: daysAgo(3),
      refundedAt: null,
      chargebackAt: null,
      createdAt: daysAgo(3),
    },
    {
      id: 'payment-private-refunded-001',
      userId: users.privateViewer.id,
      tokenPackId: 'pack-500',
      provider: 'CCBILL',
      providerTxnId: 'dev-ccbill-refunded-001',
      providerCustomerId: 'dev-customer-private',
      status: 'REFUNDED',
      amountCents: 3999,
      currency: 'USD',
      tokensCredited: 550,
      checkoutUrl: null,
      rawProviderJson: { demo: true, outcome: 'refunded' },
      approvedAt: daysAgo(12),
      failedAt: null,
      refundedAt: daysAgo(2),
      chargebackAt: null,
      createdAt: daysAgo(12),
    },
    {
      id: 'payment-reporter-chargeback-001',
      userId: users.reporter.id,
      tokenPackId: 'pack-500',
      provider: 'CCBILL',
      providerTxnId: 'dev-ccbill-chargeback-001',
      providerCustomerId: 'dev-customer-reporter',
      status: 'CHARGEBACK',
      amountCents: 3999,
      currency: 'USD',
      tokensCredited: 550,
      checkoutUrl: null,
      rawProviderJson: { demo: true, outcome: 'chargeback' },
      approvedAt: daysAgo(18),
      failedAt: null,
      refundedAt: null,
      chargebackAt: daysAgo(1),
      createdAt: daysAgo(18),
    },
    {
      id: 'payment-funded-review-001',
      userId: users.funded.id,
      tokenPackId: 'pack-5000',
      provider: 'CCBILL',
      providerTxnId: 'dev-ccbill-review-001',
      providerCustomerId: 'dev-customer-funded',
      status: 'MANUAL_REVIEW',
      amountCents: 29999,
      currency: 'USD',
      tokensCredited: 0,
      checkoutUrl: null,
      rawProviderJson: { demo: true, reviewReason: 'velocity_check' },
      approvedAt: null,
      failedAt: null,
      refundedAt: null,
      chargebackAt: null,
      createdAt: minutesAgo(10),
    },
  ]

  const created: Record<string, any> = {}
  for (const payment of payments) {
    created[payment.id] = await upsertById(db.paymentTransaction, payment)
  }
  return created
}

async function seedTips(
  users: Awaited<ReturnType<typeof seedUsers>>,
  profiles: Awaited<ReturnType<typeof seedCreatorProfiles>>,
  rooms: Awaited<ReturnType<typeof seedRooms>>,
  menus: Awaited<ReturnType<typeof seedMenus>>,
) {
  const tips = [
    {
      id: 'tip-luna-general-001',
      roomId: rooms.lunaLive.id,
      fromUserId: users.funded.id,
      toCreatorId: profiles.luna.id,
      amountTokens: 100,
      requestType: 'GENERAL',
      menuItemId: null,
      roomMenuItemId: null,
      requestText: 'Great set tonight.',
      status: 'SENT',
      createdAt: minutesAgo(70),
    },
    {
      id: 'tip-luna-menu-001',
      roomId: rooms.lunaLive.id,
      fromUserId: users.privateViewer.id,
      toCreatorId: profiles.luna.id,
      amountTokens: 150,
      requestType: 'MENU_ITEM',
      menuItemId: menus.menus['menu-luna-song'].id,
      roomMenuItemId: menus.roomMenus['room-menu-luna-song'].id,
      requestText: 'Play the synthwave request.',
      status: 'ACKNOWLEDGED',
      createdAt: minutesAgo(55),
    },
    {
      id: 'tip-luna-custom-001',
      roomId: rooms.lunaLive.id,
      fromUserId: users.reporter.id,
      toCreatorId: profiles.luna.id,
      amountTokens: 250,
      requestType: 'CUSTOM',
      menuItemId: null,
      roomMenuItemId: null,
      requestText: 'Custom safe-for-stream intro line.',
      status: 'COMPLETED',
      createdAt: minutesAgo(32),
    },
    {
      id: 'tip-nova-goal-001',
      roomId: rooms.novaLive.id,
      fromUserId: users.funded.id,
      toCreatorId: profiles.nova.id,
      amountTokens: 300,
      requestType: 'GOAL',
      menuItemId: null,
      roomMenuItemId: null,
      requestText: 'For the boss goal.',
      status: 'COMPLETED',
      createdAt: minutesAgo(20),
    },
    {
      id: 'tip-nova-reversed-001',
      roomId: rooms.novaEnded.id,
      fromUserId: users.low.id,
      toCreatorId: profiles.nova.id,
      amountTokens: 80,
      requestType: 'GENERAL',
      menuItemId: null,
      roomMenuItemId: null,
      requestText: 'Historical reversed tip.',
      status: 'REVERSED',
      createdAt: daysAgo(1),
    },
  ]

  const created: Record<string, any> = {}
  for (const tip of tips) {
    created[tip.id] = await upsertById(db.tip, tip)
  }
  return created
}

async function seedPrivateSessions(
  users: Awaited<ReturnType<typeof seedUsers>>,
  profiles: Awaited<ReturnType<typeof seedCreatorProfiles>>,
  rooms: Awaited<ReturnType<typeof seedRooms>>,
) {
  const sessions = [
    {
      id: 'private-luna-requested-001',
      creatorId: profiles.luna.id,
      viewerId: users.privateViewer.id,
      publicRoomId: rooms.lunaLive.id,
      status: 'REQUESTED',
      rateTokensPerMinute: 60,
      minMinutes: 5,
      viewerCamRequired: false,
      screenShareAllowed: true,
      rulesText: 'Be kind, keep requests platform-safe, and confirm custom requests in chat first.',
      reservedTokens: 300,
      capturedTokens: 0,
      releasedTokens: 0,
      livekitRoomName: null,
      requestedAt: minutesAgo(6),
      acceptedAt: null,
      startedAt: null,
      endedAt: null,
      declineReason: null,
      createdAt: minutesAgo(6),
    },
    {
      id: 'private-nova-accepted-001',
      creatorId: profiles.nova.id,
      viewerId: users.funded.id,
      publicRoomId: rooms.novaLive.id,
      status: 'ACCEPTED',
      rateTokensPerMinute: 45,
      minMinutes: 3,
      viewerCamRequired: true,
      screenShareAllowed: false,
      rulesText: 'Viewer cam required for private sessions. No recording or reposting.',
      reservedTokens: 135,
      capturedTokens: 0,
      releasedTokens: 0,
      livekitRoomName: null,
      requestedAt: minutesAgo(22),
      acceptedAt: minutesAgo(18),
      startedAt: null,
      endedAt: null,
      declineReason: null,
      createdAt: minutesAgo(22),
    },
    {
      id: 'private-luna-active-001',
      creatorId: profiles.luna.id,
      viewerId: users.reporter.id,
      publicRoomId: rooms.lunaLive.id,
      status: 'ACTIVE',
      rateTokensPerMinute: 60,
      minMinutes: 5,
      viewerCamRequired: false,
      screenShareAllowed: true,
      rulesText: 'Be kind, keep requests platform-safe, and confirm custom requests in chat first.',
      reservedTokens: 300,
      capturedTokens: 0,
      releasedTokens: 0,
      livekitRoomName: 'dev-private-luna-active',
      requestedAt: minutesAgo(16),
      acceptedAt: minutesAgo(14),
      startedAt: minutesAgo(12),
      endedAt: null,
      declineReason: null,
      createdAt: minutesAgo(16),
    },
    {
      id: 'private-luna-ended-001',
      creatorId: profiles.luna.id,
      viewerId: users.funded.id,
      publicRoomId: rooms.lunaLive.id,
      status: 'ENDED',
      rateTokensPerMinute: 60,
      minMinutes: 5,
      viewerCamRequired: false,
      screenShareAllowed: true,
      rulesText: 'Be kind, keep requests platform-safe, and confirm custom requests in chat first.',
      reservedTokens: 600,
      capturedTokens: 420,
      releasedTokens: 180,
      livekitRoomName: 'dev-private-luna-ended',
      requestedAt: daysAgo(2),
      acceptedAt: new Date(daysAgo(2).getTime() + 4 * 60 * 1000),
      startedAt: new Date(daysAgo(2).getTime() + 7 * 60 * 1000),
      endedAt: new Date(daysAgo(2).getTime() + 14 * 60 * 1000),
      declineReason: null,
      createdAt: daysAgo(2),
    },
    {
      id: 'private-nova-declined-001',
      creatorId: profiles.nova.id,
      viewerId: users.low.id,
      publicRoomId: rooms.novaLive.id,
      status: 'DECLINED',
      rateTokensPerMinute: 45,
      minMinutes: 3,
      viewerCamRequired: true,
      screenShareAllowed: false,
      rulesText: 'Viewer cam required for private sessions. No recording or reposting.',
      reservedTokens: 135,
      capturedTokens: 0,
      releasedTokens: 135,
      livekitRoomName: null,
      requestedAt: daysAgo(4),
      acceptedAt: null,
      startedAt: null,
      endedAt: null,
      declineReason: 'Viewer asked for unavailable content.',
      createdAt: daysAgo(4),
    },
    {
      id: 'private-vera-force-ended-001',
      creatorId: profiles.vera.id,
      viewerId: users.funded.id,
      publicRoomId: rooms.veraHidden.id,
      status: 'FORCE_ENDED',
      rateTokensPerMinute: 70,
      minMinutes: 5,
      viewerCamRequired: false,
      screenShareAllowed: false,
      rulesText: 'Historical rules captured before suspension.',
      reservedTokens: 350,
      capturedTokens: 140,
      releasedTokens: 210,
      livekitRoomName: 'dev-private-vera-force-ended',
      requestedAt: daysAgo(3),
      acceptedAt: new Date(daysAgo(3).getTime() + 2 * 60 * 1000),
      startedAt: new Date(daysAgo(3).getTime() + 4 * 60 * 1000),
      endedAt: daysAgo(2),
      declineReason: null,
      createdAt: daysAgo(3),
    },
  ]

  const created: Record<string, any> = {}
  for (const session of sessions) {
    created[session.id] = await upsertById(db.privateSession, session)
  }
  return created
}

async function seedChat(
  users: Awaited<ReturnType<typeof seedUsers>>,
  rooms: Awaited<ReturnType<typeof seedRooms>>,
  tips: Record<string, any>,
  sessions: Record<string, any>,
) {
  const messages = [
    { id: 'chat-luna-001', roomId: rooms.lunaLive.id, userId: null, type: 'SYSTEM_MESSAGE', body: 'Luna Signal is live.', tipId: null, privateSessionId: null, metadataJson: { event: 'room_started' }, createdAt: minutesAgo(82), deletedAt: null },
    { id: 'chat-luna-002', roomId: rooms.lunaLive.id, userId: users.funded.id, type: 'USER_MESSAGE', body: 'This lighting is so good tonight.', tipId: null, privateSessionId: null, metadataJson: null, createdAt: minutesAgo(78), deletedAt: null },
    { id: 'chat-luna-003', roomId: rooms.lunaLive.id, userId: users.luna.id, type: 'CREATOR_MESSAGE', body: 'Thank you, welcome in everyone.', tipId: null, privateSessionId: null, metadataJson: null, createdAt: minutesAgo(76), deletedAt: null },
    { id: 'chat-luna-004', roomId: rooms.lunaLive.id, userId: users.funded.id, type: 'TIP_EVENT', body: 'Funded Fan sent 100 tokens.', tipId: tips['tip-luna-general-001'].id, privateSessionId: null, metadataJson: { amountTokens: 100 }, createdAt: minutesAgo(70), deletedAt: null },
    { id: 'chat-luna-005', roomId: rooms.lunaLive.id, userId: users.privateViewer.id, type: 'MENU_EVENT', body: 'Private Queue requested Song request.', tipId: tips['tip-luna-menu-001'].id, privateSessionId: null, metadataJson: { menuLabel: 'Song request' }, createdAt: minutesAgo(55), deletedAt: null },
    { id: 'chat-luna-006', roomId: rooms.lunaLive.id, userId: null, type: 'GOAL_EVENT', body: 'Studio lights goal is almost complete.', tipId: null, privateSessionId: null, metadataJson: { currentTokens: 1800, targetTokens: 2000 }, createdAt: minutesAgo(42), deletedAt: null },
    { id: 'chat-luna-007', roomId: rooms.lunaLive.id, userId: users.reporter.id, type: 'USER_MESSAGE', body: 'Can we get one more synth run?', tipId: null, privateSessionId: null, metadataJson: null, createdAt: minutesAgo(35), deletedAt: null },
    { id: 'chat-luna-008', roomId: rooms.lunaLive.id, userId: users.reporter.id, type: 'TIP_EVENT', body: 'Sharp Reporter sent 250 tokens.', tipId: tips['tip-luna-custom-001'].id, privateSessionId: null, metadataJson: { amountTokens: 250 }, createdAt: minutesAgo(32), deletedAt: null },
    { id: 'chat-luna-009', roomId: rooms.lunaLive.id, userId: users.privateViewer.id, type: 'PRIVATE_REQUEST', body: 'Private Queue requested a private session.', tipId: null, privateSessionId: sessions['private-luna-requested-001'].id, metadataJson: { status: 'REQUESTED' }, createdAt: minutesAgo(6), deletedAt: null },
    { id: 'chat-luna-010', roomId: rooms.lunaLive.id, userId: users.low.id, type: 'USER_MESSAGE', body: 'Deleted moderation sample.', tipId: null, privateSessionId: null, metadataJson: null, createdAt: minutesAgo(5), deletedAt: minutesAgo(4) },
    { id: 'chat-nova-001', roomId: rooms.novaLive.id, userId: null, type: 'SYSTEM_MESSAGE', body: 'Nova Room is live.', tipId: null, privateSessionId: null, metadataJson: { event: 'room_started' }, createdAt: minutesAgo(34), deletedAt: null },
    { id: 'chat-nova-002', roomId: rooms.novaLive.id, userId: users.funded.id, type: 'USER_MESSAGE', body: 'Boss goal lets go.', tipId: null, privateSessionId: null, metadataJson: null, createdAt: minutesAgo(25), deletedAt: null },
    { id: 'chat-nova-003', roomId: rooms.novaLive.id, userId: users.funded.id, type: 'GOAL_EVENT', body: 'Funded Fan added 300 tokens to Beat the bonus boss.', tipId: tips['tip-nova-goal-001'].id, privateSessionId: null, metadataJson: { amountTokens: 300 }, createdAt: minutesAgo(20), deletedAt: null },
    { id: 'chat-nova-004', roomId: rooms.novaLive.id, userId: users.nova.id, type: 'CREATOR_MESSAGE', body: 'Alright, boss attempt after this round.', tipId: null, privateSessionId: null, metadataJson: null, createdAt: minutesAgo(19), deletedAt: null },
    { id: 'chat-nova-005', roomId: rooms.novaLive.id, userId: users.low.id, type: 'USER_MESSAGE', body: 'Reported message sample for admin.', tipId: null, privateSessionId: null, metadataJson: { reported: true }, createdAt: minutesAgo(12), deletedAt: null },
  ]

  const created: Record<string, any> = {}
  for (const message of messages) {
    created[message.id] = await upsertById(db.chatMessage, message)
  }
  return created
}

async function seedAdminAndReports(
  users: Awaited<ReturnType<typeof seedUsers>>,
  profiles: Awaited<ReturnType<typeof seedCreatorProfiles>>,
  rooms: Awaited<ReturnType<typeof seedRooms>>,
  media: Record<string, any>,
  messages: Record<string, any>,
) {
  const actions = [
    { id: 'admin-action-approve-luna', adminUserId: users.admin.id, targetUserId: users.luna.id, targetRoomId: null, targetPaymentId: null, type: 'APPROVE_CREATOR', reason: 'Initial dev approval.', metadataJson: { creatorId: profiles.luna.id }, createdAt: daysAgo(75) },
    { id: 'admin-action-hide-vera-room', adminUserId: users.admin.id, targetUserId: users.vera.id, targetRoomId: rooms.veraHidden.id, targetPaymentId: null, type: 'HIDE_ROOM', reason: 'Policy review sample.', metadataJson: { creatorId: profiles.vera.id }, createdAt: daysAgo(2) },
    { id: 'admin-action-suspend-vera', adminUserId: users.admin.id, targetUserId: users.vera.id, targetRoomId: null, targetPaymentId: null, type: 'SUSPEND_CREATOR', reason: 'Repeated moderation issues.', metadataJson: { creatorId: profiles.vera.id }, createdAt: daysAgo(2) },
    { id: 'admin-action-wallet-funded', adminUserId: users.admin.id, targetUserId: users.funded.id, targetRoomId: null, targetPaymentId: null, type: 'ADMIN_ADJUST_WALLET', reason: 'Demo credit adjustment.', metadataJson: { amountTokens: 50 }, createdAt: daysAgo(1) },
    { id: 'admin-action-force-private', adminUserId: users.admin.id, targetUserId: users.vera.id, targetRoomId: rooms.veraHidden.id, targetPaymentId: null, type: 'FORCE_END_PRIVATE_SESSION', reason: 'Moderator intervention sample.', metadataJson: { privateSessionId: 'private-vera-force-ended-001' }, createdAt: daysAgo(2) },
    { id: 'admin-action-reject-media', adminUserId: users.admin.id, targetUserId: users.vera.id, targetRoomId: null, targetPaymentId: null, type: 'REJECT_MEDIA', reason: 'Rejected media sample.', metadataJson: { mediaId: media['media-vera-rejected'].id }, createdAt: daysAgo(2) },
  ]

  const createdActions: Record<string, any> = {}
  for (const action of actions) {
    createdActions[action.id] = await upsertById(db.adminAction, action)
  }

  const reports = [
    { id: 'report-room-vera-pending', reporterId: users.reporter.id, targetType: 'ROOM', targetUserId: null, targetRoomId: rooms.veraHidden.id, targetMessageId: null, targetMediaId: null, reason: 'Unsafe room content', description: 'Demo pending room report.', status: 'PENDING', reviewedAt: null, reviewedById: null, adminNotes: null, createdAt: daysAgo(2) },
    { id: 'report-message-nova-pending', reporterId: users.reporter.id, targetType: 'MESSAGE', targetUserId: null, targetRoomId: null, targetMessageId: messages['chat-nova-005'].id, targetMediaId: null, reason: 'Chat violation', description: 'Demo pending message report.', status: 'PENDING', reviewedAt: null, reviewedById: null, adminNotes: null, createdAt: minutesAgo(11) },
    { id: 'report-media-vera-reviewed', reporterId: users.funded.id, targetType: 'MEDIA', targetUserId: null, targetRoomId: null, targetMessageId: null, targetMediaId: media['media-vera-rejected'].id, reason: 'Media review', description: 'Reviewed media example.', status: 'REVIEWED', reviewedAt: daysAgo(2), reviewedById: users.admin.id, adminNotes: 'Media rejected during review.', createdAt: daysAgo(3) },
    { id: 'report-user-vera-actioned', reporterId: users.reporter.id, targetType: 'USER', targetUserId: users.vera.id, targetRoomId: null, targetMessageId: null, targetMediaId: null, reason: 'User conduct', description: 'Actioned user report example.', status: 'ACTIONED', reviewedAt: daysAgo(2), reviewedById: users.admin.id, adminNotes: 'Creator suspended.', createdAt: daysAgo(3) },
    { id: 'report-room-luna-dismissed', reporterId: users.low.id, targetType: 'ROOM', targetUserId: null, targetRoomId: rooms.lunaLive.id, targetMessageId: null, targetMediaId: null, reason: 'Mistaken report', description: 'Dismissed report example.', status: 'DISMISSED', reviewedAt: daysAgo(1), reviewedById: users.admin.id, adminNotes: 'No violation found.', createdAt: daysAgo(2) },
  ]

  for (const report of reports) {
    await upsertById(db.report, report)
  }

  return createdActions
}

async function seedLedger(
  users: Awaited<ReturnType<typeof seedUsers>>,
  wallets: Record<string, any>,
  payments: Record<string, any>,
  tips: Record<string, any>,
  sessions: Record<string, any>,
  actions: Record<string, any>,
) {
  const entries = [
    { id: 'ledger-funded-purchase-001', walletId: wallets[users.funded.id].id, userId: users.funded.id, type: 'TOKEN_PURCHASE', amountTokens: 1150, balanceAfter: 1150, paymentTransactionId: payments['payment-funded-approved-001'].id, tipId: null, roomId: null, privateSessionId: null, adminActionId: null, description: 'Approved CCBill token purchase', metadataJson: { providerTxnId: 'dev-ccbill-approved-001' }, createdAt: daysAgo(7) },
    { id: 'ledger-funded-tip-luna-001', walletId: wallets[users.funded.id].id, userId: users.funded.id, type: 'TIP_SENT', amountTokens: -100, balanceAfter: 1050, paymentTransactionId: null, tipId: tips['tip-luna-general-001'].id, roomId: tips['tip-luna-general-001'].roomId, privateSessionId: null, adminActionId: null, description: 'Tip sent to Luna Signal', metadataJson: null, createdAt: minutesAgo(70) },
    { id: 'ledger-luna-tip-luna-001', walletId: wallets[users.luna.id].id, userId: users.luna.id, type: 'TIP_RECEIVED', amountTokens: 100, balanceAfter: 100, paymentTransactionId: null, tipId: tips['tip-luna-general-001'].id, roomId: tips['tip-luna-general-001'].roomId, privateSessionId: null, adminActionId: null, description: 'Tip received from Funded Fan', metadataJson: null, createdAt: minutesAgo(70) },
    { id: 'ledger-private-hold-requested', walletId: wallets[users.privateViewer.id].id, userId: users.privateViewer.id, type: 'PRIVATE_SESSION_HOLD', amountTokens: -300, balanceAfter: 680, paymentTransactionId: null, tipId: null, roomId: null, privateSessionId: sessions['private-luna-requested-001'].id, adminActionId: null, description: 'Private session hold', metadataJson: null, createdAt: minutesAgo(6) },
    { id: 'ledger-funded-private-capture', walletId: wallets[users.funded.id].id, userId: users.funded.id, type: 'PRIVATE_SESSION_CAPTURE', amountTokens: -420, balanceAfter: 630, paymentTransactionId: null, tipId: null, roomId: null, privateSessionId: sessions['private-luna-ended-001'].id, adminActionId: null, description: 'Private session captured for 7 minutes', metadataJson: { minutes: 7 }, createdAt: daysAgo(2) },
    { id: 'ledger-funded-private-release', walletId: wallets[users.funded.id].id, userId: users.funded.id, type: 'PRIVATE_SESSION_RELEASE', amountTokens: 180, balanceAfter: 810, paymentTransactionId: null, tipId: null, roomId: null, privateSessionId: sessions['private-luna-ended-001'].id, adminActionId: null, description: 'Private session hold released', metadataJson: null, createdAt: daysAgo(2) },
    { id: 'ledger-luna-private-capture', walletId: wallets[users.luna.id].id, userId: users.luna.id, type: 'PRIVATE_SESSION_CAPTURE', amountTokens: 420, balanceAfter: 520, paymentTransactionId: null, tipId: null, roomId: null, privateSessionId: sessions['private-luna-ended-001'].id, adminActionId: null, description: 'Private session earnings', metadataJson: { minutes: 7 }, createdAt: daysAgo(2) },
    { id: 'ledger-private-refund-reversal', walletId: wallets[users.privateViewer.id].id, userId: users.privateViewer.id, type: 'REFUND_REVERSAL', amountTokens: -550, balanceAfter: 430, paymentTransactionId: payments['payment-private-refunded-001'].id, tipId: null, roomId: null, privateSessionId: null, adminActionId: null, description: 'Refund reversal for token purchase', metadataJson: null, createdAt: daysAgo(2) },
    { id: 'ledger-reporter-chargeback-reversal', walletId: wallets[users.reporter.id].id, userId: users.reporter.id, type: 'CHARGEBACK_REVERSAL', amountTokens: -550, balanceAfter: 260, paymentTransactionId: payments['payment-reporter-chargeback-001'].id, tipId: null, roomId: null, privateSessionId: null, adminActionId: null, description: 'Chargeback reversal for token purchase', metadataJson: null, createdAt: daysAgo(1) },
    { id: 'ledger-funded-admin-adjustment', walletId: wallets[users.funded.id].id, userId: users.funded.id, type: 'ADMIN_ADJUSTMENT', amountTokens: 50, balanceAfter: 1530, paymentTransactionId: null, tipId: null, roomId: null, privateSessionId: null, adminActionId: actions['admin-action-wallet-funded'].id, description: 'Demo credit adjustment', metadataJson: null, createdAt: daysAgo(1) },
    { id: 'ledger-funded-tip-nova-goal', walletId: wallets[users.funded.id].id, userId: users.funded.id, type: 'TIP_SENT', amountTokens: -300, balanceAfter: 1230, paymentTransactionId: null, tipId: tips['tip-nova-goal-001'].id, roomId: tips['tip-nova-goal-001'].roomId, privateSessionId: null, adminActionId: null, description: 'Goal tip sent to Nova Room', metadataJson: null, createdAt: minutesAgo(20) },
    { id: 'ledger-nova-tip-goal', walletId: wallets[users.nova.id].id, userId: users.nova.id, type: 'TIP_RECEIVED', amountTokens: 300, balanceAfter: 300, paymentTransactionId: null, tipId: tips['tip-nova-goal-001'].id, roomId: tips['tip-nova-goal-001'].roomId, privateSessionId: null, adminActionId: null, description: 'Goal tip received from Funded Fan', metadataJson: null, createdAt: minutesAgo(20) },
  ]

  for (const entry of entries) {
    await upsertById(db.ledgerEntry, entry)
  }
}

async function main() {
  console.log('Seeding StreamYolo demo data...')

  const passwordHash = await argon2.hash(PASSWORD)
  await seedTokenPacks()
  const users = await seedUsers(passwordHash)
  const wallets = await seedWallets(users)
  const profiles = await seedCreatorProfiles(users)
  const media = await seedMedia(users, profiles)
  const roomTags = await seedRoomTags()
  const rooms = await seedRooms(profiles, media)
  await seedRoomTaxonomy(profiles, rooms, roomTags)
  const menus = await seedMenus(profiles, rooms)
  await seedGoals(rooms)
  const payments = await seedPayments(users)
  const tips = await seedTips(users, profiles, rooms, menus)
  const sessions = await seedPrivateSessions(users, profiles, rooms)
  const messages = await seedChat(users, rooms, tips, sessions)
  const actions = await seedAdminAndReports(users, profiles, rooms, media, messages)
  await seedLedger(users, wallets, payments, tips, sessions, actions)

  console.log('Seed complete.')
  console.log('')
  console.log('Demo logins, all using password123:')
  console.log('  admin@dev.local              ADMIN')
  console.log('  creator.live@dev.local       CREATOR active/live')
  console.log('  creator.offline@dev.local    CREATOR active/live')
  console.log('  creator.pending@dev.local    CREATOR pending approval')
  console.log('  creator.draft@dev.local      CREATOR incomplete setup')
  console.log('  creator.suspended@dev.local  CREATOR suspended')
  console.log('  viewer.funded@dev.local      VIEWER funded')
  console.log('  viewer.low@dev.local         VIEWER low balance')
  console.log('  viewer.private@dev.local     VIEWER private-session hold')
  console.log('  viewer.reporter@dev.local    VIEWER report/moderation data')
  console.log('')
  console.log('Demo room slugs:')
  console.log('  /rooms/luna-signal-live')
  console.log('  /rooms/nova-room-live')
  console.log('Demo browse URLs:')
  console.log('  /rooms/c/female')
  console.log('  /rooms/c/couples/country/gb')
  console.log('  /rooms/t/gaming')
}

main()
  .catch((error) => {
    console.error(error)
    process.exit(1)
  })
  .finally(async () => {
    await db.$disconnect()
  })
