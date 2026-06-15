import { db } from '@streamyolo/db'

const PROFILE_INCLUDE = { user: { select: { displayName: true } } }

export class CreatorProfileService {
  async getByUserId(userId: string) {
    const profile = await db.creatorProfile.findUnique({ where: { userId }, include: PROFILE_INCLUDE })
    if (!profile) throw { statusCode: 404, message: 'Creator profile not found' }
    return profile
  }

  async getOrCreateByUserId(userId: string) {
    const user = await db.user.findUnique({ where: { id: userId } })
    if (!user) throw { statusCode: 404, message: 'User not found' }

    const existing = await db.creatorProfile.findUnique({ where: { userId }, include: PROFILE_INCLUDE })
    if (existing) return existing

    const profile = await db.creatorProfile.create({
      data: {
        userId,
        status: 'PENDING',
      },
      include: PROFILE_INCLUDE,
    })

    await db.user.update({ where: { id: userId }, data: { role: 'CREATOR' } })

    return profile
  }

  async update(
    userId: string,
    data: {
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
      include: PROFILE_INCLUDE,
    })
  }
}

function mediaUrl(mediaId: string | null | undefined) {
  return mediaId ? `/media/${mediaId}` : null
}

export function formatCreatorProfile(profile: any) {
  return {
    id: profile.id,
    userId: profile.userId,
    displayName: profile.user?.displayName ?? 'User',
    bio: profile.bio ?? null,
    avatarMediaId: profile.avatarMediaId ?? null,
    avatarUrl: mediaUrl(profile.avatarMediaId),
    logoMediaId: profile.logoMediaId ?? null,
    logoUrl: mediaUrl(profile.logoMediaId),
    bannerMediaId: profile.bannerMediaId ?? null,
    bannerUrl: mediaUrl(profile.bannerMediaId),
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
