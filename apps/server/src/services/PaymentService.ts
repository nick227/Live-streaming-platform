import { httpError } from '../lib/errors'
import { db } from '@streamyolo/db'
import { createHash } from 'crypto'

export class PaymentService {
  async createCcbillCheckout(userId: string, tokenPackId: string) {
    const clientAccNum = process.env.CCBILL_CLIENT_ACCOUNT_NUM ?? ''
    const clientSubNum = process.env.CCBILL_CLIENT_SUB_ACCOUNT_NUM ?? ''
    const _flexId = process.env.CCBILL_FLEX_ID ?? ''
    const salt = process.env.CCBILL_SALT ?? ''

    if (!clientAccNum || !clientSubNum || !_flexId || !salt) {
      throw httpError(503, 'Token purchases are disabled until payments are configured')
    }

    const pack = await db.tokenPack.findUnique({ where: { id: tokenPackId } })
    if (!pack || !pack.isActive) throw httpError(404, 'Token pack not found')

    const txn = await db.paymentTransaction.create({
      data: {
        userId,
        tokenPackId,
        provider: 'CCBILL',
        status: 'PENDING',
        amountCents: pack.priceCents,
        currency: pack.currency,
        tokensCredited: 0,
      },
    })

    // Build CCBill FlexForms URL
    const amountStr = (pack.priceCents / 100).toFixed(2)
    const initialPeriod = '2'
    const currencyCode = '840'

    const digestStr = `${amountStr}${initialPeriod}${amountStr}${initialPeriod}${currencyCode}${salt}`
    const formDigest = createHash('md5').update(digestStr).digest('hex')

    const params = new URLSearchParams({
      clientAccnum: clientAccNum,
      clientSubacc: clientSubNum,
      initialPrice: amountStr,
      initialPeriod,
      recurringPrice: amountStr,
      recurringPeriod: initialPeriod,
      numRebills: '0',
      currencyCode,
      formDigest,
      'custom[txnId]': txn.id,
      'custom[userId]': userId,
    })

    const checkoutUrl = `https://bill.ccbill.com/jpost/signup.cgi?${params.toString()}`

    await db.paymentTransaction.update({
      where: { id: txn.id },
      data: { checkoutUrl },
    })

    return { paymentTransactionId: txn.id, checkoutUrl }
  }

  async handleWebhook(headers: Record<string, string>, body: any) {
    const salt = process.env.CCBILL_SALT ?? ''

    // CCBill sends an md5 digest in body for verification
    const digest = body.formDigest ?? body.md5Sum

    // Minimal signature check — real implementation would follow CCBill's exact verification spec
    const verificationStr = `${body.clientAccnum ?? ''}${body.clientSubacc ?? ''}${body.initialPrice ?? ''}${body.initialPeriod ?? ''}${salt}`
    const expected = createHash('md5').update(verificationStr).digest('hex')

    if (digest !== expected) {
      throw httpError(400, 'Invalid webhook signature')
    }

    const txnId = body['custom[txnId]'] ?? body.customRef
    const providerTxnId = body.subscriptionId ?? body.transactionId ?? body.ccbillTxnId

    if (!txnId) return { ok: true } // ignore events we can't match

    // Idempotency — if providerTxnId already processed, skip
    if (providerTxnId) {
      const existing = await db.paymentTransaction.findFirst({
        where: { providerTxnId },
      })
      if (existing) return { ok: true }
    }

    const txn = await db.paymentTransaction.findUnique({ where: { id: txnId } })
    if (!txn) return { ok: true }

    const pack = await db.tokenPack.findUnique({ where: { id: txn.tokenPackId } })
    if (!pack) return { ok: true }

    const eventType = body.eventType ?? 'NewSaleSuccess'

    if (eventType === 'NewSaleSuccess' || eventType === 'RenewalSuccess') {
      const tokensToCredit = pack.tokenAmount + pack.bonusTokenAmount

      await db.$transaction(async (tx: any) => {
        await tx.paymentTransaction.update({
          where: { id: txnId },
          data: {
            status: 'APPROVED',
            providerTxnId: providerTxnId ?? null,
            rawProviderJson: body,
            approvedAt: new Date(),
            tokensCredited: tokensToCredit,
          },
        })

        const wallet = await tx.wallet.upsert({
          where: { userId: txn.userId },
          create: {
            userId: txn.userId,
            tokenBalance: tokensToCredit,
            lifetimePurchasedTokens: tokensToCredit,
          },
          update: {
            tokenBalance: { increment: tokensToCredit },
            lifetimePurchasedTokens: { increment: tokensToCredit },
          },
        })

        await tx.ledgerEntry.create({
          data: {
            walletId: wallet.id,
            userId: txn.userId,
            type: 'TOKEN_PURCHASE',
            amountTokens: tokensToCredit,
            balanceAfter: wallet.tokenBalance,
            paymentTransactionId: txnId,
            description: `Purchased ${pack.name}`,
          },
        })
      })
    } else if (eventType === 'Chargeback') {
      await db.paymentTransaction.update({
        where: { id: txnId },
        data: { status: 'CHARGEBACK', chargebackAt: new Date(), rawProviderJson: body },
      })
    } else if (eventType === 'Refund') {
      await db.paymentTransaction.update({
        where: { id: txnId },
        data: { status: 'REFUNDED', refundedAt: new Date(), rawProviderJson: body },
      })
    } else {
      await db.paymentTransaction.update({
        where: { id: txnId },
        data: { status: 'FAILED', failedAt: new Date(), rawProviderJson: body },
      })
    }

    return { ok: true }
  }
}
