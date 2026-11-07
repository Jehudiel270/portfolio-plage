import { z } from 'zod'
import { hitRateLimit } from '../../../db/repositories/rate-limit'
import { loadSettings } from '../../../db/repositories/settings'
import { sendMail } from '../../../services/mailer'

/** Envoi de test réservé aux administrateurs authentifiés ; ne révèle jamais les identifiants SMTP. */
export default defineEventHandler(async (event) => {
  const admin = await requireAdmin(event)
  const db = useDb()
  if (!isSmtpConfigured()) throw apiError(503, 'EMAIL_NOT_CONFIGURED', 'SMTP non configuré : renseignez SMTP_HOST et SMTP_FROM (et les identifiants) dans l’environnement du serveur.')
  if ((await hitRateLimit(db, `email-test:${admin.adminId}`, 600)) > 5) throw apiError(429, 'TOO_MANY_REQUESTS', 'Trop d’envois de test. Patientez quelques minutes.')
  const { to } = await readBodyWith(event, z.object({ to: z.preprocess((v) => (v === '' ? undefined : v), z.email().max(200).optional()) }))
  const settings = await loadSettings(db)
  const recipient = to ?? settings.contact.recipientEmail ?? admin.email
  try {
    await sendMail(useServerConfig().smtp, { to: recipient, subject: `Test d’envoi — ${settings.content.name}`, text: 'Ce message confirme que la configuration SMTP du portfolio fonctionne.' })
    return { ok: true, to: recipient }
  } catch (error) {
    console.error('[email:test]', error instanceof Error ? error.message : error)
    throw apiError(502, 'EMAIL_SEND_FAILED', 'Le serveur SMTP a refusé ou n’a pas répondu. Vérifiez hôte, port, TLS et identifiants.')
  }
})
