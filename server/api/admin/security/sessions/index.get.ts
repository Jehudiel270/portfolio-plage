import { listAdminSessions } from '../../../../db/repositories/admin'

export default defineEventHandler(async (event) => {
  const admin = await requireAdmin(event)
  const sessions = await listAdminSessions(useDb(), admin.adminId)
  return { items: sessions.map((s) => ({ ...s, current: s.id === admin.sessionId })) }
})
