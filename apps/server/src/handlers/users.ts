import { UserService } from '../services/UserService'
import { ModerationService } from '../services/ModerationService'

const userService = new UserService()
const moderationService = new ModerationService()

export async function getUserChannel(request: { params: { username: string } }, reply: { send: (body: unknown) => unknown }) {
  const result = await userService.getUserChannel(request.params.username)
  
  let vipUserIds: string[] = []
  if (result.room && result.room.creator?.id) {
    vipUserIds = await moderationService.getActiveVipUserIds(result.room.creator.id)
  }

  return reply.send({
    data: {
      user: result.user,
      creator: result.creator,
      room: result.room,
      vipUserIds,
      viewerState: result.room ? {
        canChat: true,
        canTip: true,
        canRequestPrivate: result.room.privateAvailable,
        hasActivePrivateSession: false,
      } : undefined,
    },
  })
}
