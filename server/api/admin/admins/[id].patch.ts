import { z } from 'zod'
import { ADMIN_MODULES, DEFAULT_ADMIN_PERMISSIONS, isAdminAccountOwner } from '../../../../shared/admin-permissions'
import { findAdminById, updateAdminAccess, writeAdminAuditLog } from '../../../db/repositories/admin'

const schema = z.object({
  role: z.enum(['superadmin', 'admin', 'editor']),
  permissions: z.array(z.object({ module: z.enum(ADMIN_MODULES), access: z.enum(['read', 'write']) })).max(ADMIN_MODULES.length),
}).superRefine((data, ctx) => {
  if (new Set(data.permissions.map((item) => item.module)).size !== data.permissions.length) {
    ctx.addIssue({ code: 'custom', path: ['permissions'], message: 'Chaque module ne peut apparaître qu’une seule fois.' })
  }
})

export default defineEventHandler(async (event) => {
  const actor = await requireAdmin(event)
  if (actor.role !== 'superadmin') throw apiError(403, 'SUPERADMIN_REQUIRED', 'Seul un super administrateur peut modifier les permissions.')
  const id = Number(getRouterParam(event, 'id'))
  if (!Number.isSafeInteger(id) || id < 1) throw apiError(400, 'INVALID_ID', 'Identifiant de compte invalide.')
  const body = await readBodyWith(event, schema)
  const before = await findAdminById(useDb(), id)
  if (!before) throw apiError(404, 'ADMIN_NOT_FOUND', 'Compte introuvable.')
  if (id === actor.adminId) throw apiError(409, 'CANNOT_EDIT_SELF', 'Utilisez un autre compte super administrateur pour modifier vos propres autorisations.')
  const ownerEmail = useServerConfig().superadminOwnerEmail
  if (isAdminAccountOwner(before.email, ownerEmail) && !isAdminAccountOwner(actor.email, ownerEmail)) {
    throw apiError(403, 'ACCOUNT_OWNER_PROTECTED', 'Seul le compte propriétaire peut modifier ses autorisations.')
  }
  if (body.role === 'superadmin' && !isAdminAccountOwner(actor.email, ownerEmail)) {
    throw apiError(403, 'ACCOUNT_OWNER_REQUIRED', 'Seul le compte propriétaire peut nommer un super administrateur.')
  }
  const permissions = body.role === 'superadmin' ? DEFAULT_ADMIN_PERMISSIONS
    : [...body.permissions.filter((item) => item.module !== 'security'), { module: 'security' as const, access: 'write' as const }]
  const updated = await updateAdminAccess(useDb(), id, { role: body.role, permissions })
  if (updated.lastSuperadmin) throw apiError(409, 'LAST_SUPERADMIN', 'Le dernier super administrateur ne peut pas être rétrogradé.')
  if (!updated.row) throw apiError(404, 'ADMIN_NOT_FOUND', 'Compte introuvable.')
  if (before.role !== updated.row.role || JSON.stringify(before.permissions) !== JSON.stringify(updated.row.permissions)) {
    await writeAdminAuditLog(useDb(), {
      actorId: actor.adminId, action: 'admin.permissions_changed', target: before.email,
      details: { oldRole: before.role, role: updated.row.role, permissionCount: updated.row.permissions.length },
    })
  }
  return { ok: true, item: { id: updated.row.id, email: updated.row.email, role: updated.row.role, permissions: updated.row.permissions } }
})
