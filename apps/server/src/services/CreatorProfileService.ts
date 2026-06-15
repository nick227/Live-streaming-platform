import { db } from '@streamyolo/db'

export class CreatorProfileService {
  async getByUserId(userId: string) {
    const profile = await db.creatorProfile.findUnique({ where: { userId } })
    if (!profile) throw { statusCode: 404, message: 'Creator profile not found' }
    return profile
  }

  async getOrCreateByUserId(userId: string) {
    const user = await db.user.findUnique({ where: { id: userId } })
    if (!user) throw { statusCode: 404, message: 'User not found' }

    const existing = await db.creatorProfile.findUnique({ where: { userId } })
    if (existing) return existing

    // Apply to be a creator — creates DRAFT profile, admin must set ACTIVE
    const profile = await db.creatorProfile.create({
      data: {
        userId,
        stageName: user.displayName ?? user.username,
        status: 'PENDING',
      },
    })

    await db.user.update({ where: { id: userId }, data: { role: 'CREATOR' } })

    return profile
  }

  async update(
    userId: string,
    data: {
      stageName?: string
      bio?: string
      avatarMediaId?: string
      bannerMediaId?: string
      logoMediaId?: string
      privateRateTokensPerMinute?: number
      minPrivateMinutes?: number
      privateViewerCamRequired?: boolean
      privateScreenShareAllowed?: boolean
      privateRulesText?: string
    },
  ) {
    const existing = await db.creatorProfile.findUnique({ where: { userId } })
    if (!existing) throw { statusCode: 404, message: 'Creator profile not found' }

    return db.creatorProfile.update({
      where: { userId },
      data: {
        ...(data.stageName !== undefined ? { stageName: data.stageName } : {}),
        ...(data.bio !== undefined ? { bio: data.bio } : {}),
        ...(data.avatarMediaId !== undefined ? { avatarMediaId: data.avatarMediaId } : {}),
        ...(data.bannerMediaId !== undefined ? { bannerMediaId: data.bannerMediaId } : {}),
        ...(data.logoMediaId !== undefined ? { logoMediaId: data.logoMediaId } : {}),
        ...(data.privateRateTokensPerMinute !== undefined
          ? { privateRateTokensPerMinute: data.privateRateTokensPerMinute }
          : {}),
        ...(data.minPrivateMinutes !== undefined ? { minPrivateMinutes: data.minPrivateMinutes } : {}),
        ...(data.privateViewerCamRequired !== undefined
          ? { privateViewerCamRequired: data.privateViewerCamRequired }
          : {}),
        ...(data.privateScreenShareAllowed !== undefined
          ? { privateScreenShareAllowed: data.privateScreenShareAllowed }
          : {}),
        ...(data.privateRulesText !== undefined ? { privateRulesText: data.privateRulesText } : {}),
      },
    })
  }
}

export function formatCreatorProfile(profile: any) {
  return {
    id: profile.id,
    userId: profile.userId,
    stageName: profile.stageName,
    bio: profile.bio ?? null,
    avatarMediaId: profile.avatarMediaId ?? null,
    logoMediaId: profile.logoMediaId ?? null,
    bannerMediaId: profile.bannerMediaId ?? null,
    status: profile.status,
    isLive: profile.isLive,
    currentRoomId: profile.currentRoomId ?? null,
    privateRateTokensPerMinute: profile.privateRateTokensPerMinute,
    minPrivateMinutes: profile.minPrivateMinutes,
    privateViewerCamRequired: profile.privateViewerCamRequired,
    privateScreenShareAllowed: profile.privateScreenShareAllowed,
    privateRulesText: profile.privateRulesText ?? null,
    createdAt: profile.createdAt.toISOString(),
    updatedAt: profile.updatedAt.toISOString(),
  }
}
