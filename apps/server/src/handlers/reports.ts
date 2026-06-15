import { ReportService, formatReport } from '../services/ReportService'

const reportService = new ReportService()

export async function createReport(request: any, reply: any) {
  const report = await reportService.create(request.user.id, request.body)
  return reply.status(201).send({ data: formatReport(report) })
}
