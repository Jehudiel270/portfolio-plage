import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest'
import { contactPayloadSchema } from '../../shared/schemas/contact'
import { DEFAULT_SETTINGS, type SiteSettings } from '../../shared/schemas/settings'
import type { Database } from '../../server/db/client'
import { listMessages } from '../../server/db/repositories/messages'
import { ContactValidationError, buildContactMail, processContactSubmission } from '../../server/services/contact'
import type { OutgoingMail } from '../../server/services/mailer'
import { createTestDb } from '../helpers/db'

let db: Database
let close: () => Promise<void>
beforeAll(async () => { ;({ db, close } = await createTestDb()) })
afterAll(async () => close())

const smtp = { host: 'smtp.test', port: 587, secure: false, user: 'u', password: 'p', from: 'Portfolio <no-reply@test>' }
const settings: SiteSettings = { ...DEFAULT_SETTINGS, contact: { ...DEFAULT_SETTINGS.contact, recipientEmail: 'moi@exemple.com' } }
const payload = (extra: Record<string, unknown> = {}) => contactPayloadSchema.parse({ name: 'Ada', email: 'ada@exemple.com', message: 'Bonjour, ceci est un message.', startedAt: 1_000, ...extra })

describe('service de contact', () => {
  it('ignore silencieusement les robots (piège et envoi trop rapide) sans rien enregistrer', async () => {
    const send = vi.fn()
    const bot = await processContactSubmission({ db, settings, smtp, send, now: () => 60_000 }, payload({ website: 'http://spam.test' }))
    const fast = await processContactSubmission({ db, settings, smtp, send, now: () => 1_200 }, payload())
    expect(bot).toEqual({ ok: true, stored: false, emailStatus: 'skipped' })
    expect(fast.stored).toBe(false)
    expect(send).not.toHaveBeenCalled()
    expect(await listMessages(db)).toHaveLength(0)
  })

  it('enregistre le message, envoie l’e-mail et reflète le statut réel', async () => {
    const sent: OutgoingMail[] = []
    const result = await processContactSubmission({ db, settings, smtp, send: async (_c, mail) => { sent.push(mail) }, now: () => 60_000 }, payload())
    expect(result).toEqual({ ok: true, stored: true, emailStatus: 'sent' })
    expect(sent[0]?.to).toBe('moi@exemple.com')
    expect(sent[0]?.replyTo).toBe('ada@exemple.com')
    expect((await listMessages(db))[0]?.emailStatus).toBe('sent')
  })

  it('ne prétend jamais avoir envoyé un e-mail si SMTP est absent, destinataire absent ou en échec', async () => {
    const none = await processContactSubmission({ db, settings, smtp: { ...smtp, host: '' }, now: () => 60_000 }, payload())
    expect(none).toEqual({ ok: true, stored: true, emailStatus: 'not_configured' })
    const noRecipient = await processContactSubmission({ db, settings: DEFAULT_SETTINGS, smtp, now: () => 60_000 }, payload())
    expect(noRecipient.emailStatus).toBe('not_configured')
    const failed = await processContactSubmission({ db, settings, smtp, send: async () => { throw new Error('connexion refusée') }, now: () => 60_000 }, payload())
    expect(failed.emailStatus).toBe('failed')
    expect((await listMessages(db)).map((m) => m.emailStatus)).toEqual(expect.arrayContaining(['not_configured', 'failed']))
  })

  it('rejette un formulaire invalide selon la configuration', async () => {
    await expect(processContactSubmission({ db, settings, smtp, now: () => 60_000 }, payload({ email: 'invalide' }))).rejects.toBeInstanceOf(ContactValidationError)
  })

  it('construit un e-mail sans injection d’en-têtes', () => {
    const mail = buildContactMail(settings, payload({ name: 'Eve\r\nBcc: evil@exemple.com' }), 'moi@exemple.com')
    expect(mail.subject).not.toMatch(/[\r\n]/)
    expect(mail.text).toContain('Bonjour, ceci est un message.')
  })
})
