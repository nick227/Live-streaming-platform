import { CreatorMenuService, formatMenuItem } from '../services/CreatorMenuService'

const menuService = new CreatorMenuService()

export async function listCreatorMenuItems(request: any, reply: any) {
  const items = await menuService.list(request.user.id)
  return reply.send({ data: items.map(formatMenuItem) })
}

export async function createCreatorMenuItem(request: any, reply: any) {
  const item = await menuService.create(request.user.id, request.body)
  return reply.status(201).send({ data: formatMenuItem(item) })
}

export async function updateCreatorMenuItem(request: any, reply: any) {
  const item = await menuService.update(request.user.id, request.params.itemId, request.body ?? {})
  return reply.send({ data: formatMenuItem(item) })
}

export async function deleteCreatorMenuItem(request: any, reply: any) {
  const result = await menuService.delete(request.user.id, request.params.itemId)
  return reply.send(result)
}
