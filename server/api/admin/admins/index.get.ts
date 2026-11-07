import { listAdminUsers } from '../../../db/repositories/admin'

export default defineEventHandler(async (event) => {
  const admin = await requireAdmin(event)
  if (admin.role !== 'superadmin') throw apiError(403, 'SUPERADMIN_REQUIRED', 'Seul un super administrateur peut gérer les comptes.')
  return { items: await listAdminUsers(useDb()) }
})
