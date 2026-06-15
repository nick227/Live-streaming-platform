import { db } from '@streamyolo/db'
import * as argon2 from 'argon2'
import { randomUUID } from 'crypto'

const SESSION_TTL_MS = 30 * 24 * 60 * 60 * 1000

export class AuthService {
  async register(data: { email: string; password: string; username: string; displayName?: string; role?: 'VIEWER' | 'CREATOR' }) {
    const hash = await argon2.hash(data.password)
    const user = await db.user.create({
      data: {
        email: data.email,
        passwordHash: hash,
        username: data.username,
        displayName: data.displayName ?? data.username,
        role: data.role ?? 'VIEWER',
        wallet: { create: {} },
      },
    })
    const session = await this._createSession(user.id)
    return { user, token: session.token }
  }

  async login(data: { email: string; password: string }) {
    const user = await db.user.findUnique({ where: { email: data.email } })
    if (!user) throw { statusCode: 401, message: 'Invalid credentials' }

    const valid = await argon2.verify(user.passwordHash, data.password)
    if (!valid) throw { statusCode: 401, message: 'Invalid credentials' }

    if (user.suspendedAt) throw { statusCode: 403, message: 'Account suspended' }

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
