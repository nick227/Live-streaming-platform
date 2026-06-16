import { TipService } from '../services/TipService'
import { db } from '@streamyolo/db'

const tipService = new TipService()

export async function createTip(request: any, reply: any) {
  const result = await tipService.createTip(request.user.id, request.params.roomId, request.body)
  const message = await db.chatMessage.create({
    data: {
      roomId: request.params.roomId,
      userId: request.user.id,
      type: 'TIP_EVENT',
      tipId: result.tip.id,
      body: `Tipped ${result.tip.amountTokens} tokens`,
    },
    include: { user: { select: { id: true, displayName: true } } },
  })
  const io = (request.server as any).io
  if (io) {
    // Broadcast tip event to the room
    io.to(`room:${request.params.roomId}`).emit('tip:created', {
      tip: result.tip,
      message: {
        id: message.id,
        roomId: message.roomId,
        user: message.user
          ? { id: message.user.id, displayName: message.user.displayName }
          : undefined,
        type: message.type,
        body: message.body,
        createdAt: message.createdAt.toISOString(),
      },
    })
    io.to(`user:${request.user.id}`).emit('wallet:update', { wallet: result.wallet })
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
