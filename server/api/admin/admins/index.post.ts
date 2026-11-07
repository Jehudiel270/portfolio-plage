import { z } from 'zod'
import { ADMIN_MODULES, DEFAULT_ADMIN_PERMISSIONS, isAdminAccountOwner } from '../../../../shared/admin-permissions'
import { createAdmin, writeAdminAuditLog } from '../../../db/repositories/admin'

const grantSchema = z.object({ module: z.enum(ADMIN_MODULES), access: z.enum(['read', 'write']) })
const createSchema = z.object({
  email: z.email().max(200),
  password: z.string().min(12).max(200),
  role: z.enum(['superadmin', 'admin', 'editor']).default('admin'),
  permissions: z.array(grantSchema).max(ADMIN_MODULES.length).default([]),
}).superRefine((data, ctx) => {
  if (new Set(data.permissions.map((item) => item.module)).size !== data.permissions.length) {
    ctx.addIssue({ code: 'custom', path: ['permissions'], message: 'Chaque module ne peut apparaître qu’une seule fois.' })
  }
})

export default defineEventHandler(async (event) => {
  const actor = await requireAdmin(event)
  if (actor.role !== 'superadmin') throw apiError(403, 'SUPERADMIN_REQUIRED', 'Seul un super administrateur peut créer des comptes.')
  if (!isAdminAccountOwner(actor.email, useServerConfig().superadminOwnerEmail)) {
    throw apiError(403, 'ACCOUNT_OWNER_REQUIRED', 'Seul le compte propriétaire peut créer des comptes, y compris des super administrateurs.')
  }
  assertBodySize(event, 8_000)
  const body = await readBodyWith(event, createSchema)
  const weakness = validatePasswordStrength(body.password)
  if (weakness) throw apiError(422, 'WEAK_PASSWORD', weakness)
  const permissions = body.role === 'superadmin' ? DEFAULT_ADMIN_PERMISSIONS
    : [...body.permissions.filter((item) => item.module !== 'security'), { module: 'security' as const, access: 'write' as const }]
  const account = await createAdmin(useDb(), {
    email: body.email,
    passwordHash: await hashPassword(body.password),
    role: body.role,
    permissions,
  })
  await writeAdminAuditLog(useDb(), {
    actorId: actor.adminId, action: 'admin.created', target: account.email,
    details: { role: account.role, permissionCount: account.permissions.length },
  })
  return { ok: true, item: { id: account.id, email: account.email, role: account.role, permissions: account.permissions, totpEnabled: account.totpEnabled } }
})
