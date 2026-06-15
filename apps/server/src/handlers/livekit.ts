import { LiveKitService } from '../services/LiveKitService'

const livekitService = new LiveKitService()

export async function getLivekitToken(request: any, reply: any) {
  const result = await livekitService.getToken(request.user.id, request.body)
  return reply.send({ data: result })
}
