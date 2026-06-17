import { httpError } from '../lib/errors'
import { db } from '@streamyolo/db'
import { nanoid } from 'nanoid'
import { LiveKitService } from './LiveKitService'

const liveKit = new LiveKitService()
const disconnectTimers = new Map<string, number>()
const viewerDisconnectTimers = new Map<string, number>()

export class PrivateSessionService {
  async request(viewerId: string, roomId: string, _data?: { message?: string }) {
    const room = await db.room.findUnique({
      where: { id: roomId },
      include: { creator: true },
    })
    if (!room) throw httpError(404, 'Room not found')
    if (room.status !== 'LIVE') throw httpError(400, 'Room is not live')
    if (room.creator.userId !== viewerId) {
      const ban = await db.creatorUserBan.findFirst({
        where: {
          creatorId: room.creatorId,
          userId: viewerId,
          OR: [{ expiresAt: null }, { expiresAt: { gt: new Date() } }],
        },
      })
      if (ban) throw httpError(403, 'You are banned from this creator')
    }

    const creator = room.creator
    const ratePerMin = creator.privateRateTokensPerMinute
    const minMinutes = creator.minPrivateMinutes
    const minCost = ratePerMin * minMinutes
    const MAX_SESSION_MINUTES = 30

    // Check no active session already
    const activeSession = await db.privateSession.findFirst({
      where: {
        viewerId,
        status: { in: ['REQUESTED', 'ACCEPTED', 'ACTIVE'] },
      },
    })
    if (activeSession) throw httpError(400, 'You already have an active private session')

    const [session, viewerWallet] = await db.$transaction(async (tx: any) => {
      const wallet = await tx.wallet.findUnique({ where: { userId: viewerId } })
      if (!wallet) throw httpError(400, 'Wallet not found')

      const maxAffordableMinutes = Math.floor(wallet.tokenBalance / ratePerMin)
      if (maxAffordableMinutes < minMinutes) {
        throw httpError(400, `Insufficient tokens — minimum cost is ${minCost}`)
      }

      const affordableMinutes = Math.min(maxAffordableMinutes, MAX_SESSION_MINUTES)
      const reservedTokens = affordableMinutes * ratePerMin

      const session = await tx.privateSession.create({
        data: {
          creatorId: creator.id,
          viewerId,
          publicRoomId: roomId,
          status: 'REQUESTED',
          rateTokensPerMinute: ratePerMin,
          minMinutes,
          viewerCamMode: creator.privateViewerCamMode,
          screenShareAllowed: creator.privateScreenShareAllowed,
          rulesText: creator.privateRulesText,
          reservedTokens,
        },
      })

      const hold = await tx.wallet.updateMany({
        where: { userId: viewerId, tokenBalance: { gte: reservedTokens } },
        data: {
          tokenBalance: { decrement: reservedTokens },
          reservedTokenBalance: { increment: reservedTokens },
        },
      })
      if (hold.count !== 1) {
        throw httpError(400, `Insufficient tokens`)
      }

      const updatedWallet = await tx.wallet.findUniqueOrThrow({ where: { userId: viewerId } })

      await tx.ledgerEntry.create({
        data: {
          walletId: wallet.id,
          userId: viewerId,
          type: 'PRIVATE_SESSION_HOLD',
          amountTokens: -reservedTokens,
          balanceAfter: updatedWallet.tokenBalance,
          privateSessionId: session.id,
          description: `Private session hold (up to ${affordableMinutes} min)`,
        },
      })

      return [session, updatedWallet]
    })

    return {
      privateSession: formatSession(session),
      wallet: {
        tokenBalance: viewerWallet.tokenBalance,
        reservedTokenBalance: viewerWallet.reservedTokenBalance,
        lifetimePurchasedTokens: viewerWallet.lifetimePurchasedTokens,
        lifetimeSpentTokens: viewerWallet.lifetimeSpentTokens,
      },
    }
  }

  async accept(creatorUserId: string, sessionId: string) {
    const session = await this._assertCreatorOwnsSession(creatorUserId, sessionId)
    if (session.status !== 'REQUESTED') {
      throw httpError(400, 'Session is not in REQUESTED state')
    }

    const updated = await db.privateSession.update({
      where: { id: sessionId },
      data: { status: 'ACCEPTED', acceptedAt: new Date() },
    })

    return formatSession(updated)
  }

  async decline(creatorUserId: string, sessionId: string, data?: { reason?: string }) {
    const session = await this._assertCreatorOwnsSession(creatorUserId, sessionId)

    const viewerWallet = await db.wallet.findUniqueOrThrow({ where: { userId: session.viewerId } })

    const updated = await db.$transaction(async (tx: any) => {
      const s = await tx.privateSession.update({
        where: { id: sessionId },
        data: { status: 'DECLINED', declineReason: data?.reason },
      })

      // Release hold
      const newWallet = await tx.wallet.update({
        where: { userId: session.viewerId },
        data: {
          tokenBalance: { increment: session.reservedTokens },
          reservedTokenBalance: { decrement: session.reservedTokens },
        },
      })

      await tx.ledgerEntry.create({
        data: {
          walletId: viewerWallet.id,
          userId: session.viewerId,
          type: 'PRIVATE_SESSION_RELEASE',
          amountTokens: session.reservedTokens,
          balanceAfter: newWallet.tokenBalance,
          privateSessionId: sessionId,
          description: 'Private session hold released (declined)',
        },
      })

      return s
    })

    return formatSession(updated)
  }

  async start(userId: string, sessionId: string) {
    const session = await db.privateSession.findUnique({
      where: { id: sessionId },
      include: { creator: true },
    })
    if (!session) throw httpError(404, 'Session not found')
    
    const isCreator = session.creator.userId === userId
    const isViewer = session.viewerId === userId
    if (!isCreator && !isViewer) throw httpError(403, 'Forbidden')

    let updated = session
    if (session.status === 'ACCEPTED') {
      const envPrefix = process.env.NODE_ENV === 'production' ? 'prod' : 'dev'
      const livekitRoomName = `sy-${envPrefix}-private-session-${sessionId}`
      try {
        await liveKit.createRoom(livekitRoomName)
      } catch (err) {
        throw httpError(502, 'Failed to create video room — please try again')
      }

      const startedAt = new Date()
      // Calculate max minutes based on reserved tokens
      const maxMinutes = session.reservedTokens / session.rateTokensPerMinute
      const hardEndAt = new Date(startedAt.getTime() + maxMinutes * 60000)

      try {
        updated = await db.privateSession.update({
          where: { id: sessionId },
          data: { status: 'ACTIVE', startedAt, hardEndAt, livekitRoomName },
        }) as any
      } catch (err) {
        await liveKit.deleteRoom(livekitRoomName)
        throw err
      }
    } else if (session.status !== 'ACTIVE') {
      throw httpError(400, 'Session is not active or accepted')
    }

    const at = await liveKit.getToken(userId, {
      appRoomType: 'PRIVATE_SESSION',
      appRoomId: sessionId,
    })

    return {
      privateSession: formatSession(updated),
      livekitToken: at.token,
      livekitUrl: at.livekitUrl,
    }
  }

  async end(userId: string, sessionId: string) {
    const session = await db.privateSession.findUnique({
      where: { id: sessionId },
      include: { creator: true },
    })
    if (!session) throw httpError(404, 'Session not found')

    const isCreator = session.creator.userId === userId
    const isViewer = session.viewerId === userId
    if (!isCreator && !isViewer) throw httpError(403, 'Forbidden')

    if (!session.startedAt || !session.hardEndAt) throw httpError(400, 'Session not started')

    if (session.status === 'ENDED' || session.status === 'FORCE_ENDED' || session.status === 'EXPIRED') {
      const viewerWallet = await db.wallet.findUniqueOrThrow({ where: { userId: session.viewerId } })
      return {
        privateSession: formatSession(session),
        wallet: {
          tokenBalance: viewerWallet.tokenBalance,
          reservedTokenBalance: viewerWallet.reservedTokenBalance,
          lifetimePurchasedTokens: viewerWallet.lifetimePurchasedTokens,
          lifetimeSpentTokens: viewerWallet.lifetimeSpentTokens,
        },
      }
    }

    const now = Date.now()
    const hardEndMs = session.hardEndAt.getTime()
    const startMs = session.startedAt.getTime()

    const elapsedMs = Math.min(now, hardEndMs) - startMs
    let elapsedMinutes = Math.ceil(elapsedMs / 60000)
    // Enforce minMinutes
    elapsedMinutes = Math.max(elapsedMinutes, session.minMinutes)

    const tokensDue = Math.min(session.reservedTokens, elapsedMinutes * session.rateTokensPerMinute)
    const capture = tokensDue - session.capturedTokens
    const release = session.reservedTokens - tokensDue
    const capped = capture // using 'capped' as the local capture amount to match existing code

    const viewerWallet = await db.wallet.findUniqueOrThrow({ where: { userId: session.viewerId } })
    const creatorWallet = await db.wallet.upsert({
      where: { userId: session.creator.userId },
      create: { userId: session.creator.userId },
      update: {},
    })

    const [updated, finalViewerWallet] = await db.$transaction(async (tx: any) => {
      const s = await tx.privateSession.update({
        where: { id: sessionId },
        data: {
          status: 'ENDED',
          endedAt: new Date(),
          capturedTokens: tokensDue,
          releasedTokens: release,
          endedReason: 'User ended session',
        },
      })

      const newViewerWallet = await tx.wallet.update({
        where: { userId: session.viewerId },
        data: {
          reservedTokenBalance: { decrement: session.reservedTokens },
          tokenBalance: { increment: release },
          lifetimeSpentTokens: { increment: capped },
        },
      })

      if (release > 0) {
        await tx.ledgerEntry.create({
          data: {
            walletId: viewerWallet.id,
            userId: session.viewerId,
            type: 'PRIVATE_SESSION_RELEASE',
            amountTokens: release,
            balanceAfter: newViewerWallet.tokenBalance,
            privateSessionId: sessionId,
            description: `Private session hold released (unused ${release} tokens)`,
          },
        })
      }

      if (capped > 0) {
        const newCreatorBalance = creatorWallet.tokenBalance + capped
        await tx.wallet.update({
          where: { userId: session.creator.userId },
          data: { tokenBalance: { increment: capped } },
        })

        await tx.ledgerEntry.create({
          data: {
            walletId: creatorWallet.id,
            userId: session.creator.userId,
            type: 'PRIVATE_SESSION_EARNED',
            amountTokens: capped,
            balanceAfter: newCreatorBalance,
            privateSessionId: sessionId,
            description: 'Private session earnings',
          },
        })
      }

      return [s, newViewerWallet]
    })

    if (session.livekitRoomName) {
      await liveKit.deleteRoom(session.livekitRoomName)
    }

    return {
      privateSession: formatSession(updated),
      wallet: {
        tokenBalance: finalViewerWallet.tokenBalance,
        reservedTokenBalance: finalViewerWallet.reservedTokenBalance,
        lifetimePurchasedTokens: finalViewerWallet.lifetimePurchasedTokens,
        lifetimeSpentTokens: finalViewerWallet.lifetimeSpentTokens,
      },
    }
  }

  static async cleanupStaleSessionsOnStartup() {
    const count = await db.privateSession.count({
      where: { status: { in: ['REQUESTED', 'ACCEPTED', 'ACTIVE'] } },
    })
    if (count === 0) return
    console.log(`[startup] Cleaning up ${count} open private session(s) from previous process`)

    // REQUESTED/ACCEPTED never started — release holds
    const pending = await db.privateSession.findMany({
      where: { status: { in: ['REQUESTED', 'ACCEPTED'] } },
      include: { viewer: { select: { wallet: true } } },
    })
    for (const session of pending) {
      try {
        await db.$transaction(async (tx: any) => {
          await tx.privateSession.update({
            where: { id: session.id },
            data: { status: 'EXPIRED' },
          })
          if (!session.viewer.wallet || session.reservedTokens <= 0) return
          const newWallet = await tx.wallet.update({
            where: { userId: session.viewerId },
            data: {
              tokenBalance: { increment: session.reservedTokens },
              reservedTokenBalance: { decrement: session.reservedTokens },
            },
          })
          await tx.ledgerEntry.create({
            data: {
              walletId: session.viewer.wallet.id,
              userId: session.viewerId,
              type: 'PRIVATE_SESSION_RELEASE',
              amountTokens: session.reservedTokens,
              balanceAfter: newWallet.tokenBalance,
              privateSessionId: session.id,
              description: 'Private session hold released (server restart)',
            },
          })
        })
      } catch (err) {
        console.error(`[PrivateSessionService] Failed to expire session ${session.id} on startup:`, err)
      }
    }

    // ACTIVE — settle billing up to min(now, hardEndAt)
    const active = await db.privateSession.findMany({
      where: { status: 'ACTIVE' },
      include: { creator: true, viewer: { select: { wallet: true } } },
    })
    for (const session of active) {
      try {
        await new PrivateSessionService()._forceEnd(session, 'Server restart')
      } catch (err) {
        console.error(`[PrivateSessionService] Failed to settle session ${session.id} on startup:`, err)
      }
    }
  }

  static async expireStaleRequested(ttlMs = 5 * 60 * 1000) {
    const cutoff = new Date(Date.now() - ttlMs)
    const stale = await db.privateSession.findMany({
      where: { status: 'REQUESTED', requestedAt: { lt: cutoff } },
      include: { viewer: { select: { wallet: true } } },
    })

    for (const session of stale) {
      const viewerWallet = session.viewer.wallet
      if (!viewerWallet || session.reservedTokens <= 0) continue

      try {
        await db.$transaction(async (tx: any) => {
          await tx.privateSession.update({
            where: { id: session.id },
            data: { status: 'EXPIRED' },
          })

          const newWallet = await tx.wallet.update({
            where: { userId: session.viewerId },
            data: {
              tokenBalance: { increment: session.reservedTokens },
              reservedTokenBalance: { decrement: session.reservedTokens },
            },
          })

          await tx.ledgerEntry.create({
            data: {
              walletId: viewerWallet.id,
              userId: session.viewerId,
              type: 'PRIVATE_SESSION_RELEASE',
              amountTokens: session.reservedTokens,
              balanceAfter: newWallet.tokenBalance,
              privateSessionId: session.id,
              description: 'Private session hold released (expired)',
            },
          })
        })
      } catch (err) {
        console.error(`[PrivateSessionService] Failed to expire session ${session.id}:`, err)
      }
    }
  }

  static async expireStaleActive() {
    const now = new Date()
    // Find active sessions that have passed their hardEndAt by at least 1 minute grace period
    const cutoff = new Date(now.getTime() - 60000)
    
    const stale = await db.privateSession.findMany({
      where: { status: 'ACTIVE', hardEndAt: { lt: cutoff } },
      include: { creator: true, viewer: { select: { wallet: true } } },
    })

    for (const session of stale) {
      if (!session.viewer.wallet || session.reservedTokens <= 0) continue

      const capture = session.reservedTokens - session.capturedTokens
      if (capture <= 0) continue // already fully captured?

      try {
        await db.$transaction(async (tx: any) => {
          await tx.privateSession.update({
            where: { id: session.id },
            data: { 
              status: 'FORCE_ENDED', 
              endedAt: now, 
              capturedTokens: session.reservedTokens,
              releasedTokens: 0,
              endedReason: 'System auto-closed (time limit reached)',
            },
          })

          const newViewerWallet = await tx.wallet.update({
            where: { userId: session.viewerId },
            data: {
              reservedTokenBalance: { decrement: session.reservedTokens },
              lifetimeSpentTokens: { increment: capture },
            },
          })

          const creatorWallet = await tx.wallet.upsert({
            where: { userId: session.creator.userId },
            create: { userId: session.creator.userId },
            update: {},
          })

          const newCreatorBalance = creatorWallet.tokenBalance + capture
          await tx.wallet.update({
            where: { userId: session.creator.userId },
            data: { tokenBalance: { increment: capture } },
          })

          await tx.ledgerEntry.create({
            data: {
              walletId: creatorWallet.id,
              userId: session.creator.userId,
              type: 'PRIVATE_SESSION_EARNED',
              amountTokens: capture,
              balanceAfter: newCreatorBalance,
              privateSessionId: session.id,
              description: 'Private session earnings (auto-closed)',
            },
          })
        })

        if (session.livekitRoomName) {
          await liveKit.deleteRoom(session.livekitRoomName).catch(() => {})
        }
      } catch (err) {
        console.error(`[PrivateSessionService] Failed to auto-close stale session ${session.id}:`, err)
      }
    }
  }

  static async checkCreatorDisconnects() {
    const activeSessions = await db.privateSession.findMany({
      where: { status: 'ACTIVE' },
      include: { creator: true },
    })

    for (const session of activeSessions) {
      if (!session.livekitRoomName) continue
      const participants = await liveKit.getRoomParticipants(session.livekitRoomName)
      const creatorParticipant = participants.find(p => p.identity === session.creator.userId)

      if (!creatorParticipant) {
        if (!disconnectTimers.has(session.id)) {
          disconnectTimers.set(session.id, Date.now())
        } else {
          const disconnectedAt = disconnectTimers.get(session.id)!
          if (Date.now() - disconnectedAt > 45 * 1000) {
            try {
              await new PrivateSessionService()._forceEnd(session, 'Creator disconnected (grace period expired)')
              disconnectTimers.delete(session.id)
              viewerDisconnectTimers.delete(session.id)
            } catch (err) {
              console.error(`[PrivateSessionService] Failed to force end session ${session.id} after grace:`, err)
            }
          }
        }
      } else {
        disconnectTimers.delete(session.id)
      }

      // Viewer disconnect: 2-minute grace period before auto-ending
      const viewerParticipant = participants.find(p => p.identity === session.viewerId)
      if (!viewerParticipant) {
        if (!viewerDisconnectTimers.has(session.id)) {
          viewerDisconnectTimers.set(session.id, Date.now())
        } else {
          const disconnectedAt = viewerDisconnectTimers.get(session.id)!
          if (Date.now() - disconnectedAt > 2 * 60 * 1000) {
            try {
              await new PrivateSessionService()._forceEnd(session, 'Viewer disconnected (grace period expired)')
              viewerDisconnectTimers.delete(session.id)
              disconnectTimers.delete(session.id)
            } catch (err) {
              console.error(`[PrivateSessionService] Failed to force end session ${session.id} after viewer grace:`, err)
            }
          }
        }
      } else {
        viewerDisconnectTimers.delete(session.id)
      }
    }
  }

  private async _forceEnd(session: any, reason: string) {
    const current = await db.privateSession.findUnique({
      where: { id: session.id },
      select: { status: true },
    })
    if (!current || ['ENDED', 'FORCE_ENDED', 'EXPIRED'].includes(current.status)) return

    const now = Date.now()
    const startMs = session.startedAt instanceof Date ? session.startedAt.getTime() : null
    const hardEndMs = session.hardEndAt instanceof Date ? session.hardEndAt.getTime() : now

    let tokensDue = session.capturedTokens
    if (startMs !== null) {
      const elapsedMs = Math.max(0, Math.min(now, hardEndMs) - startMs)
      let elapsedMinutes = Math.ceil(elapsedMs / 60000)
      elapsedMinutes = Math.max(elapsedMinutes, session.minMinutes)
      tokensDue = Math.min(session.reservedTokens, elapsedMinutes * session.rateTokensPerMinute)
      tokensDue = Math.max(tokensDue, session.capturedTokens)
    }

    const capture = tokensDue - session.capturedTokens
    const release = session.reservedTokens - tokensDue
    const capped = capture

    const viewerWallet = await db.wallet.findUniqueOrThrow({ where: { userId: session.viewerId } })
    const creatorWallet = await db.wallet.upsert({
      where: { userId: session.creator.userId },
      create: { userId: session.creator.userId },
      update: {},
    })

    await db.$transaction(async (tx: any) => {
      await tx.privateSession.update({
        where: { id: session.id },
        data: {
          status: 'FORCE_ENDED',
          endedAt: new Date(),
          capturedTokens: tokensDue,
          releasedTokens: release,
          endedReason: reason,
        },
      })

      const newViewerWallet = await tx.wallet.update({
        where: { userId: session.viewerId },
        data: {
          reservedTokenBalance: { decrement: session.reservedTokens },
          tokenBalance: { increment: release },
          lifetimeSpentTokens: { increment: capped },
        },
      })

      if (release > 0) {
        await tx.ledgerEntry.create({
          data: {
            walletId: viewerWallet.id,
            userId: session.viewerId,
            type: 'PRIVATE_SESSION_RELEASE',
            amountTokens: release,
            balanceAfter: newViewerWallet.tokenBalance,
            privateSessionId: session.id,
            description: `Private session hold released (unused ${release} tokens)`,
          },
        })
      }

      if (capped > 0) {
        const newCreatorBalance = creatorWallet.tokenBalance + capped
        await tx.wallet.update({
          where: { userId: session.creator.userId },
          data: { tokenBalance: { increment: capped } },
        })

        await tx.ledgerEntry.create({
          data: {
            walletId: creatorWallet.id,
            userId: session.creator.userId,
            type: 'PRIVATE_SESSION_EARNED',
            amountTokens: capped,
            balanceAfter: newCreatorBalance,
            privateSessionId: session.id,
            description: 'Private session earnings',
          },
        })
      }
    })

    if (session.livekitRoomName) {
      await liveKit.deleteRoom(session.livekitRoomName)
    }
  }

  private async _assertCreatorOwnsSession(creatorUserId: string, sessionId: string) {
    const session = await db.privateSession.findUnique({
      where: { id: sessionId },
      include: { creator: true },
    })
    if (!session) throw httpError(404, 'Session not found')
    if (session.creator.userId !== creatorUserId) throw httpError(403, 'Forbidden')
    return session
  }
}

export function formatSession(session: any) {
  return {
    id: session.id,
    creatorId: session.creatorId,
    viewerId: session.viewerId,
    publicRoomId: session.publicRoomId,
    status: session.status,
    rateTokensPerMinute: session.rateTokensPerMinute,
    minMinutes: session.minMinutes,
    viewerCamMode: session.viewerCamMode,
    screenShareAllowed: session.screenShareAllowed,
    rulesText: session.rulesText ?? null,
    reservedTokens: session.reservedTokens,
    capturedTokens: session.capturedTokens,
    releasedTokens: session.releasedTokens,
    livekitRoomName: session.livekitRoomName ?? null,
    requestedAt: session.requestedAt.toISOString(),
    acceptedAt: session.acceptedAt?.toISOString() ?? null,
    startedAt: session.startedAt?.toISOString() ?? null,
    hardEndAt: session.hardEndAt?.toISOString() ?? null,
    endedAt: session.endedAt?.toISOString() ?? null,
    endedReason: session.endedReason ?? null,
    declineReason: session.declineReason ?? null,
    createdAt: session.createdAt.toISOString(),
    updatedAt: session.updatedAt.toISOString(),
  }
}
