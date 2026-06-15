import { CreatorProfileService, formatCreatorProfile } from '../services/CreatorProfileService'

const creatorProfileService = new CreatorProfileService()

export async function getCreatorProfile(request: any, reply: any) {
  const profile = await creatorProfileService.getOrCreateByUserId(request.user.id)
  return reply.send({ data: formatCreatorProfile(profile) })
}

export async function updateCreatorProfile(request: any, reply: any) {
  await creatorProfileService.getOrCreateByUserId(request.user.id)
  const profile = await creatorProfileService.update(request.user.id, request.body ?? {})
  return reply.send({ data: formatCreatorProfile(profile) })
}
