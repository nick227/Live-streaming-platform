import { WalletService } from '../services/WalletService'

const walletService = new WalletService()

export async function getWallet(request: any, reply: any) {
  const { cursor, limit } = request.query ?? {}
  const result = await walletService.getWallet(request.user.id, { cursor, limit })
  return reply.send({ data: result })
}
