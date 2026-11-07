import { z } from 'zod'
import { adminPasswordMinimumLength } from '../../../../shared/admin-permissions'
import { deleteOtherSessions, findAdminById, updateAdminPassword, writeAdminAuditLog } from '../../../db/repositories/admin'
import { hitRateLimit } from '../../../db/repositories/rate-limit'
import { decryptSecret, verifyTotp } from '../../../utils/totp'

export default defineEventHandler(async (event) => {
  const admin = await requireAdmin(event)
  const db = useDb()
  const { current, next, code } = await readBodyWith(event, z.object({
    current: z.string().min(1).max(200), next: z.string().min(1).max(200), code: z.string().max(12).optional(),
  }))
  if ((await hitRateLimit(db, `pwd:${admin.adminId}`, 900)) > 8) throw apiError(429, 'TOO_MANY_ATTEMPTS', 'Trop d’essais : patientez quelques minutes.')
  const row = await findAdminById(db, admin.adminId)
  if (!row || !(await verifyPassword(current, row.passwordHash))) throw apiError(401, 'INVALID_CREDENTIALS', 'Mot de passe actuel incorrect.')
  if (row.totpEnabled) {
    const secret = row.totpSecret ? decryptSecret(row.totpSecret, serverSecret()) : null
    if (!secret || !code || !verifyTotp(secret, code)) throw apiError(401, 'INVALID_CODE', 'Saisissez un code 2FA valide pour changer le mot de passe.')
  }
  const minimumLength = adminPasswordMinimumLength(admin.email, useServerConfig().superadminOwnerEmail)
  const weakness = validatePasswordStrength(next, minimumLength)
  if (weakness) throw apiError(422, 'WEAK_PASSWORD', weakness)
  await updateAdminPassword(db, admin.adminId, await hashPassword(next))
  const revoked = await deleteOtherSessions(db, admin.adminId, admin.sessionId)
  await writeAdminAuditLog(db, { actorId: admin.adminId, action: 'security.password_changed', details: { revokedSessions: revoked } })
  return { ok: true, revokedSessions: revoked }
})
