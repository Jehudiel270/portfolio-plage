import { validateContactAgainstConfig, type ContactFieldError, type ContactPayload } from '../../shared/schemas/contact'
import type { SiteSettings } from '../../shared/schemas/settings'
import type { ContactResponse } from '../../shared/types/portfolio'
import { renderTemplate, sanitizeHeaderValue } from '../../shared/utils/template'
import type { Database } from '../db/client'
import { createMessage, purgeOldMessages, updateEmailStatus } from '../db/repositories/messages'
import { sendMail, smtpIsConfigured, type OutgoingMail, type SmtpConfig } from './mailer'

export class ContactValidationError extends Error {
  constructor(public readonly errors: ContactFieldError[]) {
    super('Formulaire de contact invalide')
  }
}

export interface ContactDeps {
  db: Database
  settings: SiteSettings
  smtp: SmtpConfig
  send?: (smtp: SmtpConfig, mail: OutgoingMail) => Promise<void>
  now?: () => number
}

const MIN_FILL_MS = 1500

/** Construit l'e-mail à partir des modèles autorisés ; seules les variables prédéfinies sont substituées. */
export function buildContactMail(settings: SiteSettings, payload: ContactPayload, recipient: string): OutgoingMail {
  const values = {
    name: payload.name || 'Visiteur', email: payload.email, phone: payload.phone,
    subject: payload.subject, message: payload.message, siteName: settings.content.name,
  }
  return {
    to: recipient,
    subject: sanitizeHeaderValue(renderTemplate(settings.contact.emailSubjectTemplate, values)),
    text: renderTemplate(settings.contact.emailBodyTemplate, values).trim(),
    replyTo: payload.email || undefined,
  }
}

/**
 * Traite un message : validation, anti-spam (piège + délai minimal), enregistrement privé, puis envoi SMTP.
 * Le statut d'envoi réel est renvoyé : jamais de faux succès si l'e-mail n'est pas configuré ou échoue.
 */
export async function processContactSubmission(deps: ContactDeps, payload: ContactPayload): Promise<ContactResponse> {
  const { db, settings, smtp } = deps
  const now = (deps.now ?? Date.now)()
  if (payload.website.trim() !== '') return { ok: true, stored: false, emailStatus: 'skipped' }
  if (payload.startedAt && now - payload.startedAt < MIN_FILL_MS) return { ok: true, stored: false, emailStatus: 'skipped' }

  const errors = validateContactAgainstConfig(payload, settings.contact)
  if (errors.length > 0) throw new ContactValidationError(errors)

  const stored = await createMessage(db, {
    name: payload.name, email: payload.email || null, phone: payload.phone || null, subject: payload.subject || null,
    message: payload.message, source: payload.source, emailStatus: 'skipped',
  })
  await purgeOldMessages(db, settings.contact.retentionDays).catch(() => 0)

  const recipient = settings.contact.recipientEmail ?? settings.content.publicEmail
  let emailStatus: ContactResponse['emailStatus'] = 'not_configured'
  if (recipient && smtpIsConfigured(smtp)) {
    try {
      await (deps.send ?? sendMail)(smtp, buildContactMail(settings, payload, recipient))
      emailStatus = 'sent'
    } catch (error) {
      console.error('[contact] échec de l’envoi SMTP :', error instanceof Error ? error.message : error)
      emailStatus = 'failed'
    }
  }
  await updateEmailStatus(db, stored.id, emailStatus)
  return { ok: true, stored: true, emailStatus }
}
