import { TipService } from '../services/TipService'

const tipService = new TipService()

export async function createTip(request: any, reply: any) {
  const result = await tipService.createTip(request.user.id, request.params.roomId, request.body)
  const io = (request.server as any).io
  if (io) {
    // Broadcast tip event to the room
    io.to(`room:${request.params.roomId}`).emit('tip:created', {
      tip: result.tip,
      message: {
        id: `tip-${result.tip.id}`,
        roomId: request.params.roomId,
        type: 'TIP_EVENT',
        body: `Tipped ${result.tip.amountTokens} tokens`,
        createdAt: new Date().toISOString(),
      },
    })
    io.to(`user:${request.user.id}`).emit('wallet:update', result.wallet)
  }
  return reply.status(201).send({ data: result })
}

export async function acknowledgeTip(request: any, reply: any) {
  const tip = await tipService.acknowledgeTip(request.user.id, request.params.tipId)
  const io = (request.server as any).io
  if (io) io.to(`room:${tip.roomId}`).emit('tip:updated', { tip })
  return reply.send({ data: { tip } })
}

export async function completeTip(request: any, reply: any) {
  const tip = await tipService.completeTip(request.user.id, request.params.tipId)
  const io = (request.server as any).io
  if (io) io.to(`room:${tip.roomId}`).emit('tip:updated', { tip })
  return reply.send({ data: { tip } })
}
