import { deleteOtherSessions, writeAdminAuditLog } from '../../../../db/repositories/admin'

export default defineEventHandler(async (event) => {
  const admin = await requireAdmin(event)
  const revoked = await deleteOtherSessions(useDb(), admin.adminId, admin.sessionId)
  await writeAdminAuditLog(useDb(), { actorId: admin.adminId, action: 'security.sessions_revoked', details: { revoked } })
  return { ok: true, revoked }
})
