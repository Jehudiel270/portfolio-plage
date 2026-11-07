import { listAdminAuditLogs } from '../../../db/repositories/admin'

export default defineEventHandler(async (event) => {
  const admin = await requireAdmin(event)
  if (admin.role !== 'superadmin') throw apiError(403, 'SUPERADMIN_REQUIRED', 'Seul un super administrateur peut consulter le journal.')
  return { items: await listAdminAuditLogs(useDb(), 100) }
})
