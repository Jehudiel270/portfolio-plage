import { findAdminById } from '../../../db/repositories/admin'
import { isAdminAccountOwner } from '../../../../shared/admin-permissions'

export default defineEventHandler(async (event) => {
  setResponseHeader(event, 'Cache-Control', 'no-store')
  const admin = await getAdminSession(event)
  if (!admin) return { authenticated: false as const, databaseConfigured: isDatabaseConfigured() }
  const row = await findAdminById(useDb(), admin.adminId)
  return {
    authenticated: true as const,
    databaseConfigured: true,
    totpRequired: useServerConfig().isProduction,
    passwordMinLength: isAdminAccountOwner(admin.email, useServerConfig().superadminOwnerEmail) ? 10 : 12,
    user: { id: admin.adminId, email: admin.email, role: admin.role, permissions: row?.permissions ?? admin.permissions, totpEnabled: row?.totpEnabled ?? false },
    csrfToken: csrfTokenFor(admin.sessionId),
  }
})
