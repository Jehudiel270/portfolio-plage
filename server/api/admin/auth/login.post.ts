import { z } from 'zod'
import { adminPasswordMinimumLength } from '../../../../shared/admin-permissions'
import { consumeAdminRecoveryCode, findAdminByEmail, purgeExpiredSessions, touchLastLogin, writeAdminAuditLog } from '../../../db/repositories/admin'
import { hitRateLimit, purgeStaleRateLimits, resetRateLimit } from '../../../db/repositories/rate-limit'
import { hashRecoveryCode } from '../../../utils/totp'

const loginSchema = z.object({
  email: z.email().max(200), password: z.string().min(1).max(200),
  code: z.string().max(12).optional(), recoveryCode: z.string().max(24).optional(),
})
const WINDOW_SECONDS = 15 * 60

export default defineEventHandler(async (event) => {
  assertBodySize(event, 4_000)
  const db = useDb()
  const body = await readBodyWith(event, loginSchema)
  const email = body.email.trim().toLowerCase()
  const pairKey = rateLimitKey(event, 'login-pair', email)
  const mailKey = `login-mail:${sha256Hex(email)}`
  const admin = await findAdminByEmail(db, email)
  const trusted = admin ? isTrustedDevice(event, admin.id) : false

  // Trois plafonds : par IP, par couple IP+e-mail, et par compte — ce dernier ne s'applique pas aux appareils de confiance,
  // pour qu'un tiers connaissant votre adresse ne puisse pas vous verrouiller hors de l'administration.
  const [ipHits, pairHits, mailHits] = await Promise.all([hitRateLimit(db, rateLimitKey(event, 'login-ip'), WINDOW_SECONDS), hitRateLimit(db, pairKey, WINDOW_SECONDS), hitRateLimit(db, mailKey, WINDOW_SECONDS)])
  if (ipHits > 20 || pairHits > 6 || (mailHits > 30 && !trusted)) {
    setResponseHeader(event, 'Retry-After', WINDOW_SECONDS)
    throw apiError(429, 'TOO_MANY_ATTEMPTS', 'Trop de tentatives de connexion. Réessayez dans quelques minutes.')
  }

  // Même coût de calcul que l'e-mail existe ou non : pas de fuite par le temps de réponse.
  const valid = await verifyPassword(body.password, admin?.passwordHash ?? (await getDummyHash()))
  if (!admin || !valid) throw apiError(401, 'INVALID_CREDENTIALS', 'Identifiants incorrects.')

  if (admin.totpEnabled) {
    if (!admin.totpSecret) throw apiError(503, 'TOTP_CONFIGURATION_INVALID', 'La configuration de vérification en deux étapes est invalide. Contactez le super administrateur.')
    if (body.recoveryCode) {
      const consumed = await consumeAdminRecoveryCode(db, admin.id, hashRecoveryCode(body.recoveryCode, serverSecret()))
      if (!consumed) throw apiError(401, 'INVALID_CODE', 'Code de récupération incorrect ou déjà utilisé.')
    } else {
      if (!body.code) throw apiError(401, 'TOTP_REQUIRED', 'Saisissez le code de votre application ou un code de récupération.')
      const secret = decryptSecret(admin.totpSecret, serverSecret())
      if (!secret || !verifyTotp(secret, body.code)) throw apiError(401, 'INVALID_CODE', 'Code de vérification incorrect ou expiré.')
    }
  }

  await Promise.all([resetRateLimit(db, pairKey), resetRateLimit(db, mailKey)])
  await writeAdminAuditLog(db, { actorId: admin.id, action: 'auth.login', target: admin.email })
  const sessionId = await startAdminSession(event, admin)
  issueTrustedDevice(event, admin.id)
  await touchLastLogin(db, admin.id)
  await Promise.all([purgeExpiredSessions(db), purgeStaleRateLimits(db)]).catch(() => undefined)
  return {
    ok: true,
    totpRequired: useServerConfig().isProduction,
    passwordMinLength: adminPasswordMinimumLength(admin.email, useServerConfig().superadminOwnerEmail),
    user: { id: admin.id, email: admin.email, role: admin.role, permissions: admin.permissions, totpEnabled: admin.totpEnabled },
    csrfToken: csrfTokenFor(sessionId),
  }
})
