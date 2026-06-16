import { db } from '@streamyolo/db'
import { httpError } from '../lib/errors'
import { ROOM_INCLUDES, formatRoom } from './RoomService'

export class UserService {
  async getUserChannel(username: string) {
    const user = await db.user.findUnique({
      where: { username },
      include: {
        creatorProfile: {
          include: {
            defaultRoomTags: { include: { tag: true } },
          },
        },
      },
    })

    if (!user) {
      throw httpError(404, 'User not found')
    }

    const avatarUrl = user.creatorProfile?.avatarMediaId
      ? `/media/${user.creatorProfile.avatarMediaId}`
      : null

    const publicUser = {
      id: user.id,
      displayName: user.displayName,
      username: user.username,
      role: user.role,
      status: user.status,
      createdAt: user.createdAt.toISOString(),
    }

    let creatorSummary = null
    let roomDetail = null

    if (user.creatorProfile) {
      const c = user.creatorProfile
      creatorSummary = {
        id: c.id,
        userId: user.id,
        displayName: user.displayName,
        avatarUrl,
        user: publicUser,
        bio: c.bio,
        status: c.status,
        isLive: c.isLive,
        privateRateTokensPerMinute: c.privateRateTokensPerMinute,
        minPrivateMinutes: c.minPrivateMinutes,
        privateViewerCamRequired: c.privateViewerCamRequired,
        privateScreenShareAllowed: c.privateScreenShareAllowed,
        privateRulesText: c.privateRulesText,
      }

      if (c.isLive && c.currentRoomId) {
        const room = await db.room.findUnique({
          where: { id: c.currentRoomId },
          include: {
            ...ROOM_INCLUDES,
            menuItems: { where: { isActive: true }, orderBy: { sortOrder: 'asc' } },
          },
        })

        if (room && room.status === 'LIVE') {
          roomDetail = formatRoom(room)
        }
      }
    }

    return {
      user: publicUser,
      creator: creatorSummary,
      room: roomDetail,
    }
  }
}
