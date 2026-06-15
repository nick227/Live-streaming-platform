import { AuthService } from '../services/AuthService'

const authService = new AuthService()

const COOKIE = {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: (process.env.NODE_ENV === 'production' ? 'strict' : 'lax') as 'strict' | 'lax',
  path: '/',
  maxAge: 30 * 24 * 60 * 60,
}

export async function register(request: any, reply: any) {
  const { user, token } = await authService.register(request.body)
  reply.setCookie('token', token, COOKIE)
  return reply.status(201).send({ data: formatUser(user) })
}

export async function login(request: any, reply: any) {
  const { user, token } = await authService.login(request.body)
  reply.setCookie('token', token, COOKIE)
  return reply.send({ data: formatUser(user) })
}

export async function logout(request: any, reply: any) {
  const token = request.cookies?.token ?? request.headers.authorization?.replace('Bearer ', '')
  if (token) await authService.logout(token)
  reply.clearCookie('token', { path: '/' })
  return reply.send({ data: null })
}

export async function getCurrentUser(request: any, reply: any) {
  const user = request.user
  const wallet = (user as any).wallet ?? null
  const creatorProfile = (user as any).creatorProfile ?? null
  return reply.send({
    data: {
      user: formatUser(user),
      wallet: wallet
        ? {
            tokenBalance: wallet.tokenBalance,
            reservedTokenBalance: wallet.reservedTokenBalance,
            lifetimePurchasedTokens: wallet.lifetimePurchasedTokens,
            lifetimeSpentTokens: wallet.lifetimeSpentTokens,
          }
        : null,
      creatorProfile: creatorProfile
        ? {
            id: creatorProfile.id,
            userId: creatorProfile.userId,
            stageName: creatorProfile.stageName,
            bio: creatorProfile.bio ?? null,
            status: creatorProfile.status,
            isLive: creatorProfile.isLive,
          }
        : null,
    },
  })
}

function formatUser(user: any) {
  return {
    id: user.id,
    username: user.username,
    displayName: user.displayName ?? null,
    role: user.role,
    status: user.status,
    createdAt: user.createdAt.toISOString(),
  }
}
