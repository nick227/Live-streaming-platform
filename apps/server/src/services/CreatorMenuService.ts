import { db } from '@streamyolo/db'

export class CreatorMenuService {
  async list(userId: string) {
    const creator = await this._getCreator(userId)
    return db.creatorMenuItem.findMany({
      where: { creatorId: creator.id },
      orderBy: { sortOrder: 'asc' },
    })
  }

  async create(
    userId: string,
    data: { label: string; description?: string; tokenAmount: number; sortOrder?: number },
  ) {
    const creator = await this._getCreator(userId)
    return db.creatorMenuItem.create({
      data: {
        creatorId: creator.id,
        label: data.label,
        description: data.description,
        tokenAmount: data.tokenAmount,
        sortOrder: data.sortOrder ?? 0,
      },
    })
  }

  async update(
    userId: string,
    itemId: string,
    data: { label?: string; description?: string; tokenAmount?: number; isActive?: boolean; sortOrder?: number },
  ) {
    const creator = await this._getCreator(userId)
    const item = await db.creatorMenuItem.findUnique({ where: { id: itemId } })
    if (!item) throw { statusCode: 404, message: 'Menu item not found' }
    if (item.creatorId !== creator.id) throw { statusCode: 403, message: 'Forbidden' }

    return db.creatorMenuItem.update({ where: { id: itemId }, data })
  }

  async delete(userId: string, itemId: string) {
    const creator = await this._getCreator(userId)
    const item = await db.creatorMenuItem.findUnique({ where: { id: itemId } })
    if (!item) throw { statusCode: 404, message: 'Menu item not found' }
    if (item.creatorId !== creator.id) throw { statusCode: 403, message: 'Forbidden' }

    await db.creatorMenuItem.delete({ where: { id: itemId } })
    return { ok: true }
  }

  private async _getCreator(userId: string) {
    const creator = await db.creatorProfile.findUnique({ where: { userId } })
    if (!creator) throw { statusCode: 403, message: 'Creator profile required' }
    return creator
  }
}

export function formatMenuItem(item: any) {
  return {
    id: item.id,
    creatorId: item.creatorId,
    label: item.label,
    description: item.description ?? null,
    tokenAmount: item.tokenAmount,
    isActive: item.isActive,
    sortOrder: item.sortOrder,
    createdAt: item.createdAt.toISOString(),
    updatedAt: item.updatedAt.toISOString(),
  }
}
