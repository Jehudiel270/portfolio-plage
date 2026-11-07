import { z } from 'zod'
import { addAdminRecoveryCodes, findAdminById, setAdminTotp, writeAdminAuditLog } from '../../../../db/repositories/admin'
import { hitRateLimit } from '../../../../db/repositories/rate-limit'
import { generateRecoveryCodes, hashRecoveryCode } from '../../../../utils/totp'

export default defineEventHandler(async (event) => {
  const admin = await requireAdmin(event)
  const db = useDb()
  if ((await hitRateLimit(db, `2fa:${admin.adminId}`, 900)) > 10) throw apiError(429, 'TOO_MANY_ATTEMPTS', 'Trop d’essais : patientez quelques minutes.')
  const { code, password } = await readBodyWith(event, z.object({ code: z.string().min(6).max(12), password: z.string().min(1).max(200) }))
  const row = await findAdminById(db, admin.adminId)
  const secret = row?.totpSecret ? decryptSecret(row.totpSecret, serverSecret()) : null
  if (!row || !secret) throw apiError(409, 'NOT_STARTED', 'Lancez d’abord la configuration.')
  if (!(await verifyPassword(password, row.passwordHash))) throw apiError(401, 'INVALID_CREDENTIALS', 'Mot de passe incorrect.')
  if (!verifyTotp(secret, code)) throw apiError(422, 'INVALID_CODE', 'Code incorrect : vérifiez l’heure de votre téléphone et réessayez.')
  const recoveryCodes = generateRecoveryCodes()
  await addAdminRecoveryCodes(db, admin.adminId, recoveryCodes.map((item) => hashRecoveryCode(item, serverSecret())))
  await setAdminTotp(db, admin.adminId, { secret: row.totpSecret, enabled: true })
  await writeAdminAuditLog(db, { actorId: admin.adminId, action: 'security.totp_enabled' })
  return { ok: true, recoveryCodes }
})
