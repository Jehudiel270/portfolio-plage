import { findAdminById } from '../../../db/repositories/admin'

export default defineEventHandler(async (event) => {
  setResponseHeader(event, 'Cache-Control', 'no-store')
  const admin = await getAdminSession(event)
  if (!admin) return { authenticated: false as const, databaseConfigured: isDatabaseConfigured() }
  const row = await findAdminById(useDb(), admin.adminId)
  return {
    authenticated: true as const,
    databaseConfigured: true,
    totpRequired: useServerConfig().isProduction,
    user: { id: admin.adminId, email: admin.email, role: admin.role, permissions: row?.permissions ?? admin.permissions, totpEnabled: row?.totpEnabled ?? false },
    csrfToken: csrfTokenFor(admin.sessionId),
  }
})
