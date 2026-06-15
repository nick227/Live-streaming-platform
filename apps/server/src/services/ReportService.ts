import { httpError } from '../lib/errors'
import { db } from '@streamyolo/db'
import { encodeCursor, decodeCursor, normalizeLimit } from '../lib/pagination'

export class ReportService {
  async create(
    reporterId: string,
    data: {
      targetType: 'USER' | 'ROOM' | 'MESSAGE' | 'MEDIA'
      targetUserId?: string
      targetRoomId?: string
      targetMessageId?: string
      targetMediaId?: string
      reason: string
      description?: string
    },
  ) {
    const report = await db.report.create({
      data: {
        reporterId,
        targetType: data.targetType,
        targetUserId: data.targetUserId,
        targetRoomId: data.targetRoomId,
        targetMessageId: data.targetMessageId,
        targetMediaId: data.targetMediaId,
        reason: data.reason,
        description: data.description,
        status: 'PENDING',
      },
    })
    return report
  }

  async list(params: { cursor?: string; limit?: number; status?: string }) {
    const limit = normalizeLimit(params.limit)
    const cursorPayload = decodeCursor(params.cursor)

    const reports = await db.report.findMany({
      where: {
        ...(params.status ? { status: params.status as any } : {}),
        ...(cursorPayload
          ? {
              OR: [
                { createdAt: { lt: new Date(cursorPayload.createdAt) } },
                { createdAt: new Date(cursorPayload.createdAt), id: { lt: cursorPayload.id } },
              ],
            }
          : {}),
      },
      orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
      take: limit + 1,
    })

    const hasMore = reports.length > limit
    if (hasMore) reports.pop()

    const nextCursor = hasMore
      ? encodeCursor({
          createdAt: reports[reports.length - 1].createdAt.toISOString(),
          id: reports[reports.length - 1].id,
        })
      : null

    return { reports: reports.map(formatReport), meta: { hasMore, nextCursor } }
  }

  async review(
    reviewerId: string,
    reportId: string,
    data: { status: 'REVIEWED' | 'ACTIONED' | 'DISMISSED'; adminNotes?: string },
  ) {
    const report = await db.report.findUnique({ where: { id: reportId } })
    if (!report) throw httpError(404, 'Report not found')

    const updated = await db.report.update({
      where: { id: reportId },
      data: {
        status: data.status,
        reviewedAt: new Date(),
        reviewedById: reviewerId,
        adminNotes: data.adminNotes,
      },
    })

    return formatReport(updated)
  }
}

export function formatReport(report: any) {
  return {
    id: report.id,
    reporterId: report.reporterId,
    targetType: report.targetType,
    targetUserId: report.targetUserId ?? null,
    targetRoomId: report.targetRoomId ?? null,
    targetMessageId: report.targetMessageId ?? null,
    targetMediaId: report.targetMediaId ?? null,
    reason: report.reason,
    description: report.description ?? null,
    status: report.status,
    reviewedAt: report.reviewedAt?.toISOString() ?? null,
    reviewedById: report.reviewedById ?? null,
    adminNotes: report.adminNotes ?? null,
    createdAt: report.createdAt.toISOString(),
    updatedAt: report.updatedAt.toISOString(),
  }
}
