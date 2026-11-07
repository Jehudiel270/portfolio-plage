import { isAdminAccountOwner } from '../../../../shared/admin-permissions'
import { deleteAdminUser, findAdminById, writeAdminAuditLog } from '../../../db/repositories/admin'

export default defineEventHandler(async (event) => {
  const actor = await requireAdmin(event)
  if (actor.role !== 'superadmin') throw apiError(403, 'SUPERADMIN_REQUIRED', 'Seul un super administrateur peut supprimer un compte.')
  const id = Number(getRouterParam(event, 'id'))
  if (!Number.isSafeInteger(id) || id < 1) throw apiError(400, 'INVALID_ID', 'Identifiant de compte invalide.')
  if (id === actor.adminId) throw apiError(409, 'CANNOT_DELETE_SELF', 'Vous ne pouvez pas supprimer votre propre compte depuis cette page.')
  const target = await findAdminById(useDb(), id)
  if (!target) throw apiError(404, 'ADMIN_NOT_FOUND', 'Compte introuvable.')
  const ownerEmail = useServerConfig().superadminOwnerEmail
  if (isAdminAccountOwner(target.email, ownerEmail) && !isAdminAccountOwner(actor.email, ownerEmail)) {
    throw apiError(403, 'ACCOUNT_OWNER_PROTECTED', 'Seul le compte propriétaire peut supprimer ce compte.')
  }
  const result = await deleteAdminUser(useDb(), id)
  if (result.lastSuperadmin) throw apiError(409, 'LAST_SUPERADMIN', 'Le dernier super administrateur ne peut pas être supprimé.')
  if (!result.deleted) throw apiError(404, 'ADMIN_NOT_FOUND', 'Compte introuvable.')
  await writeAdminAuditLog(useDb(), { actorId: actor.adminId, action: 'admin.deleted', target: target.email, details: { role: target.role } })
  return { ok: true }
})
