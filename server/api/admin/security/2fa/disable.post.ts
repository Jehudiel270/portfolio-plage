import { z } from 'zod'
import { addAdminRecoveryCodes, findAdminById, setAdminTotp, writeAdminAuditLog } from '../../../../db/repositories/admin'
import { hitRateLimit } from '../../../../db/repositories/rate-limit'

/** Désactivation : exige le mot de passe ET un code valide (une session volée ne suffit pas). */
export default defineEventHandler(async (event) => {
  const admin = await requireAdmin(event)
  const db = useDb()
  if ((await hitRateLimit(db, `2fa:${admin.adminId}`, 900)) > 10) throw apiError(429, 'TOO_MANY_ATTEMPTS', 'Trop d’essais : patientez quelques minutes.')
  if ((await hitRateLimit(db, `2fa:${admin.adminId}`, 900)) > 10) throw apiError(429, 'TOO_MANY_ATTEMPTS', 'Trop d’essais : patientez quelques minutes.')
  const { password, code } = await readBodyWith(event, z.object({ password: z.string().min(1).max(200), code: z.string().min(6).max(12) }))
  const row = await findAdminById(db, admin.adminId)
  const secret = row?.totpSecret ? decryptSecret(row.totpSecret, serverSecret()) : null
  if (!row || !(await verifyPassword(password, row.passwordHash)) || !secret || !verifyTotp(secret, code)) throw apiError(401, 'INVALID_CREDENTIALS', 'Mot de passe ou code incorrect.')
  await setAdminTotp(db, admin.adminId, { secret: null, enabled: false })
  await addAdminRecoveryCodes(db, admin.adminId, [])
  await writeAdminAuditLog(db, { actorId: admin.adminId, action: 'security.totp_disabled' })
  return { ok: true }
})
