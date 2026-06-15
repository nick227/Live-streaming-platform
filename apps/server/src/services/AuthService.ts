import { db } from '@streamyolo/db'
import * as argon2 from 'argon2'
import { randomUUID } from 'crypto'
import { nanoid } from 'nanoid'

const SESSION_TTL_MS = 30 * 24 * 60 * 60 * 1000
export const STARTER_TOKEN_AMOUNT = 100

function slugifyDisplayName(displayName: string) {
  return displayName
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_|_$/g, '')
    .slice(0, 24)
}

async function uniqueUsername(tx: { user: { findUnique: (args: { where: { username: string } }) => Promise<unknown | null> } }, displayName: string) {
  let base = slugifyDisplayName(displayName)
  if (base.length < 3) base = `user_${nanoid(8)}`

  let candidate = base
  let suffix = 0
  while (await tx.user.findUnique({ where: { username: candidate } })) {
    suffix += 1
    candidate = `${base.slice(0, 20)}_${suffix}`
  }
  return candidate
}

export class AuthService {
  async register(data: { email: string; password: string; displayName: string; role?: 'VIEWER' | 'CREATOR' }) {
    const hash = await argon2.hash(data.password)
    const { user, session } = await db.$transaction(async (tx: any) => {
      const username = await uniqueUsername(tx, data.displayName)
      const user = await tx.user.create({
        data: {
          email: data.email,
          passwordHash: hash,
          username,
          displayName: data.displayName,
          role: data.role ?? 'VIEWER',
          wallet: { create: { tokenBalance: STARTER_TOKEN_AMOUNT } },
        },
        include: { wallet: true },
      })

      await tx.ledgerEntry.create({
        data: {
          walletId: user.wallet.id,
          userId: user.id,
          type: 'ADMIN_ADJUSTMENT',
          amountTokens: STARTER_TOKEN_AMOUNT,
          balanceAfter: STARTER_TOKEN_AMOUNT,
          description: 'Starter token credit',
        },
      })

      const session = await tx.session.create({
        data: {
          userId: user.id,
          token: randomUUID(),
          expiresAt: new Date(Date.now() + SESSION_TTL_MS),
        },
      })

      return { user, session }
    })
    return { user, token: session.token }
  }

  async updateCurrentUser(userId: string, data: { displayName: string }) {
    return db.user.update({
      where: { id: userId },
      data: { displayName: data.displayName },
    })
  }

  async login(data: { email: string; password: string }) {
    const user = await db.user.findUnique({ where: { email: data.email } })
    if (!user) throw { statusCode: 401, message: 'Invalid credentials' }

    const valid = await argon2.verify(user.passwordHash, data.password)
    if (!valid) throw { statusCode: 401, message: 'Invalid credentials' }

    if (user.status === 'DELETED' || user.deletedAt) throw { statusCode: 403, message: 'Account deactivated' }
    if (user.suspendedAt || user.status === 'SUSPENDED') throw { statusCode: 403, message: 'Account suspended' }

    const session = await this._createSession(user.id)
    return { user, token: session.token }
  }

  async logout(token: string) {
    const { count } = await db.session.deleteMany({ where: { token } })
    if (count === 0) {
      console.warn('[AuthService] logout: no session found for token — possible reuse of expired/invalid token')
    }
  }

  private async _createSession(userId: string) {
    return db.session.create({
      data: {
        userId,
        token: randomUUID(),
        expiresAt: new Date(Date.now() + SESSION_TTL_MS),
      },
    })
  }
}
