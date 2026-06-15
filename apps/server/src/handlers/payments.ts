import { PaymentService } from '../services/PaymentService'

const paymentService = new PaymentService()

export async function createCcbillCheckout(request: any, reply: any) {
  const { tokenPackId } = request.body
  const result = await paymentService.createCcbillCheckout(request.user.id, tokenPackId)
  return reply.send({ data: result })
}

export async function handleCcbillWebhook(request: any, reply: any) {
  try {
    const result = await paymentService.handleWebhook(request.headers as any, request.body)
    return reply.send(result)
  } catch (err: any) {
    if (err.statusCode === 400) {
      return reply.status(400).send({ error: err.message })
    }
    throw err
  }
}
