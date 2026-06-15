import { db } from '@streamyolo/db'

export async function listTokenPacks(_request: any, reply: any) {
  const packs = await db.tokenPack.findMany({
    where: { isActive: true },
    orderBy: { sortOrder: 'asc' },
  })
  return reply.send({
    data: packs.map((p: any) => ({
      id: p.id,
      name: p.name,
      priceCents: p.priceCents,
      tokenAmount: p.tokenAmount,
      bonusTokenAmount: p.bonusTokenAmount,
      currency: p.currency,
      isActive: p.isActive,
      sortOrder: p.sortOrder,
    })),
  })
}
