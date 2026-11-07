import QRCode from 'qrcode'
import { z } from 'zod'
import { findAdminById, setAdminTotp, writeAdminAuditLog } from '../../../../db/repositories/admin'
import { hitRateLimit } from '../../../../db/repositories/rate-limit'

/** Démarre l'activation : génère un secret (chiffré en base, inactif tant qu'un code n'a pas été vérifié) et son QR code. */
export default defineEventHandler(async (event) => {
  const admin = await requireAdmin(event)
  const db = useDb()
  if ((await hitRateLimit(db, `2fa:${admin.adminId}`, 900)) > 10) throw apiError(429, 'TOO_MANY_ATTEMPTS', 'Trop d’essais : patientez quelques minutes.')
  const { password } = await readBodyWith(event, z.object({ password: z.string().min(1).max(200) }))
  const row = await findAdminById(db, admin.adminId)
  if (row?.totpEnabled) throw apiError(409, 'ALREADY_ENABLED', 'La vérification en deux étapes est déjà activée.')
  if (!row || !(await verifyPassword(password, row.passwordHash))) throw apiError(401, 'INVALID_CREDENTIALS', 'Mot de passe incorrect.')
  const secret = generateTotpSecret()
  await setAdminTotp(db, admin.adminId, { secret: encryptSecret(secret, serverSecret()), enabled: false })
  await writeAdminAuditLog(db, { actorId: admin.adminId, action: 'security.totp_setup_started' })
  const uri = otpauthUri(secret, admin.email, 'Portfolio')
  return { secret, uri, qrSvg: await QRCode.toString(uri, { type: 'svg', margin: 1, width: 220 }) }
})
