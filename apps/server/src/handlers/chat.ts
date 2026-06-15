import { httpError } from '../lib/errors'
import { db } from '@streamyolo/db'
import { normalizeLimit } from '../lib/pagination'

export async function getRoomMessages(request: any, reply: any) {
  const { roomId } = request.params
  const limit = normalizeLimit(request.query?.limit, 100, 50)

  const room = await db.room.findUnique({ where: { id: roomId }, select: { id: true } })
  if (!room) throw httpError(404, 'Room not found')

  const messages = await db.chatMessage.findMany({
    where: { roomId, deletedAt: null },
    include: {
      user: { select: { id: true, displayName: true } },
    },
    orderBy: { createdAt: 'desc' },
    take: limit,
  })

  return reply.send({
    data: messages.reverse().map((m: any) => ({
      id: m.id,
      roomId: m.roomId,
      user: m.user
        ? { id: m.user.id, displayName: m.user.displayName }
        : undefined,
      type: m.type,
      body: m.body,
      metadata: (m.metadataJson as Record<string, unknown>) ?? undefined,
      createdAt: m.createdAt.toISOString(),
      deletedAt: m.deletedAt?.toISOString() ?? undefined,
    })),
  })
}

export async function getRoomMenu(request: any, reply: any) {
  const { roomId } = request.params

  const room = await db.room.findUnique({
    where: { id: roomId },
    include: {
      menuItems: { where: { isActive: true }, orderBy: { sortOrder: 'asc' } },
      goal: true,
    },
  })
  if (!room) throw httpError(404, 'Room not found')

  return reply.send({
    data: {
      items: room.menuItems.map((item: any) => ({
        id: item.id,
        roomId: item.roomId,
        label: item.label,
        description: item.description ?? null,
        tokenAmount: item.tokenAmount,
        isActive: item.isActive,
        sortOrder: item.sortOrder,
      })),
      ...(room.goal
        ? {
            goal: {
              id: room.goal.id,
              title: room.goal.title,
              targetTokens: room.goal.targetTokens,
              currentTokens: room.goal.currentTokens,
            },
          }
        : {}),
    },
  })
}
