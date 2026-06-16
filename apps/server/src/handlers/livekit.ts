import { LiveKitService } from '../services/LiveKitService'
import { bearerAuth } from '../plugins/security'

const livekitService = new LiveKitService()

export async function getLivekitToken(request: any, reply: any) {
  let userId = `guest-${Math.random().toString(36).substring(2, 11)}`
  
  try {
    await bearerAuth(request, reply, {})
    if (request.user?.id) {
      userId = request.user.id
    }
  } catch (err) {
    // Ignore error, treat as guest
  }

  const result = await livekitService.getToken(userId, request.body)
  return reply.send({ data: result })
}
