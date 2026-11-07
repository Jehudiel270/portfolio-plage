import { contactPayloadSchema } from '../../shared/schemas/contact'
import { hitRateLimit } from '../db/repositories/rate-limit'
import { loadSettings } from '../db/repositories/settings'
import { ContactValidationError, processContactSubmission } from '../services/contact'

export default defineEventHandler(async (event) => {
  assertBodySize(event, 20_000)
  const db = useDb()
  const settings = await loadSettings(db)
  if (settings.contact.channelMode !== 'email' && settings.contact.channelMode !== 'both') {
    throw apiError(403, 'CHANNEL_DISABLED', 'Le formulaire de contact est désactivé.')
  }
  if ((await hitRateLimit(db, rateLimitKey(event, 'contact'), 600)) > 5) {
    setResponseHeader(event, 'Retry-After', 600)
    throw apiError(429, 'TOO_MANY_REQUESTS', 'Trop de messages envoyés. Réessayez dans quelques minutes.')
  }
  const payload = await readBodyWith(event, contactPayloadSchema)
  if (payload.source === 'widget' && !(settings.widget.enabled && settings.widget.offerForm)) {
    throw apiError(403, 'CHANNEL_DISABLED', 'Le widget de contact est désactivé.')
  }
  try {
    return await processContactSubmission({ db, settings, smtp: useServerConfig().smtp }, payload)
  } catch (error) {
    if (error instanceof ContactValidationError) throw apiError(422, 'VALIDATION_ERROR', 'Certains champs sont invalides.', error.errors.map((e) => ({ path: e.field, message: e.message })))
    throw internalError('contact', error)
  }
})
