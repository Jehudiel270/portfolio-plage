import { z } from 'zod'
import { MAX_CONTACT_MESSAGE_LENGTH } from '../constants'
import type { ContactSettings } from './settings'

/** Charge utile du formulaire public. `website` est le champ piège (honeypot) : il doit rester vide. */
export const contactPayloadSchema = z.object({
  name: z.string().trim().max(120).default(''),
  email: z.string().trim().max(200).default(''),
  phone: z.string().trim().max(40).default(''),
  subject: z.string().trim().max(160).default(''),
  message: z.string().trim().min(5, 'Votre message est trop court (5 caractères minimum).').max(MAX_CONTACT_MESSAGE_LENGTH),
  source: z.enum(['form', 'widget']).default('form'),
  consent: z.boolean().default(false),
  website: z.string().max(200).default(''),
  startedAt: z.number().int().nonnegative().optional(),
})
export type ContactPayload = z.infer<typeof contactPayloadSchema>

export interface ContactFieldError { field: keyof ContactPayload; message: string }

/** Contrôles dépendant de la configuration (champs visibles/obligatoires, consentement) — partagés client/serveur. */
export function validateContactAgainstConfig(payload: ContactPayload, config: Pick<ContactSettings, 'fields'> & { requireConsent?: boolean }): ContactFieldError[] {
  const errors: ContactFieldError[] = []
  for (const key of ['name', 'email', 'phone', 'subject'] as const) {
    const field = config.fields[key]
    if (!field.visible) continue
    if (field.required && !payload[key]) errors.push({ field: key, message: `${field.label} est obligatoire.` })
  }
  if (payload.email && !z.email().safeParse(payload.email).success) errors.push({ field: 'email', message: 'Adresse e-mail invalide.' })
  if (payload.phone && !/^[+\d][\d\s().-]{5,38}$/.test(payload.phone)) errors.push({ field: 'phone', message: 'Numéro de téléphone invalide.' })
  if (config.requireConsent && !payload.consent) errors.push({ field: 'consent', message: 'Le consentement est requis.' })
  return errors
}
