import { describe, expect, it } from 'vitest'
import { contrastRatio } from '../../shared/icons'
import { contactPayloadSchema, validateContactAgainstConfig } from '../../shared/schemas/contact'
import { ENTITY_DEFAULTS, ENTITY_SCHEMAS } from '../../shared/schemas/entities'
import { contactSchema, DEFAULT_SETTINGS, effectsSchema, themeSchema } from '../../shared/schemas/settings'

describe('schémas des entités', () => {
  it('refuse les URL dangereuses', () => {
    const base = { ...ENTITY_DEFAULTS.projects, title: 'Projet', slug: 'projet' }
    expect(ENTITY_SCHEMAS.projects.safeParse(base).success).toBe(true)
    expect(ENTITY_SCHEMAS.skills.safeParse({ ...ENTITY_DEFAULTS.skills, name: 'Vue', slug: 'vue', icon: 'javascript:alert(1)' }).success).toBe(false)
    expect(ENTITY_SCHEMAS.skills.safeParse({ ...ENTITY_DEFAULTS.skills, name: 'Vue', slug: 'vue', icon: 'si:vuedotjs' }).success).toBe(true)
    expect(ENTITY_SCHEMAS.projects.safeParse({ ...base, liveUrl: 'javascript:alert(1)' }).success).toBe(false)
    expect(ENTITY_SCHEMAS.projects.safeParse({ ...base, repositoryUrl: 'ftp://exemple.com' }).success).toBe(false)
    expect(ENTITY_SCHEMAS.projects.safeParse({ ...base, liveUrl: '' }).success).toBe(true)
  })
  it('valide slug, statut et couleur', () => {
    const base = { ...ENTITY_DEFAULTS.projects, title: 'Projet', slug: 'projet' }
    expect(ENTITY_SCHEMAS.projects.safeParse({ ...base, slug: 'Pas Valide' }).success).toBe(false)
    expect(ENTITY_SCHEMAS.projects.safeParse({ ...base, status: 'archived' }).success).toBe(false)
    expect(ENTITY_SCHEMAS.projects.safeParse({ ...base, color: 'rouge' }).success).toBe(false)
  })
  it('la modification partielle n’applique jamais de valeur par défaut aux champs absents', () => {
    const patch = ENTITY_SCHEMAS.projects.partial().parse({ featured: true })
    expect(patch).toEqual({ featured: true })
  })
  it('exige les dates et bornes des autres entités', () => {
    expect(ENTITY_SCHEMAS.education.safeParse({ ...ENTITY_DEFAULTS.education, title: 'Licence', institution: 'Univ', startDate: '2020-09-01' }).success).toBe(true)
    expect(ENTITY_SCHEMAS.education.safeParse({ ...ENTITY_DEFAULTS.education, title: 'Licence', institution: 'Univ', startDate: '2020/09/01' }).success).toBe(false)
    expect(ENTITY_SCHEMAS.skills.safeParse({ ...ENTITY_DEFAULTS.skills, name: 'Vue', slug: 'vue', proficiency: 140 }).success).toBe(false)
    expect(ENTITY_SCHEMAS.skills.safeParse({ ...ENTITY_DEFAULTS.skills, name: 'Vue', slug: 'vue', proficiency: '' }).success).toBe(true)
  })
})

describe('réglages bornés (aucun code ni shader arbitraire)', () => {
  it('valide la palette', () => {
    expect(themeSchema.safeParse(DEFAULT_SETTINGS.theme).success).toBe(true)
    expect(themeSchema.safeParse({ ...DEFAULT_SETTINGS.theme, accent: 'url(javascript:1)' }).success).toBe(false)
    expect(contrastRatio(DEFAULT_SETTINGS.theme.text, DEFAULT_SETTINGS.theme.background)).toBeGreaterThan(7)
    expect(contrastRatio(DEFAULT_SETTINGS.theme.primary, DEFAULT_SETTINGS.theme.surface)).toBeGreaterThan(4.5)
  })
  it('borne les effets', () => {
    expect(effectsSchema.safeParse(DEFAULT_SETTINGS.effects).success).toBe(true)
    expect(effectsSchema.safeParse({ ...DEFAULT_SETTINGS.effects, waveHeight: 50 }).success).toBe(false)
    expect(effectsSchema.safeParse({ ...DEFAULT_SETTINGS.effects, maxPixelRatio: 0 }).success).toBe(false)
  })
  it('normalise le numéro WhatsApp et refuse les redirections externes', () => {
    const ok = contactSchema.parse({ ...DEFAULT_SETTINGS.contact, whatsappNumber: '+229 97 00 00 00' })
    expect(ok.whatsappNumber).toBe('22997000000')
    expect(contactSchema.safeParse({ ...DEFAULT_SETTINGS.contact, whatsappNumber: '12' }).success).toBe(false)
    expect(contactSchema.safeParse({ ...DEFAULT_SETTINGS.contact, afterSubmit: 'redirect', redirectPath: 'https://evil.com' }).success).toBe(false)
    expect(contactSchema.safeParse({ ...DEFAULT_SETTINGS.contact, afterSubmit: 'redirect', redirectPath: '/merci' }).success).toBe(true)
  })
})

describe('formulaire de contact', () => {
  it('applique les limites et la configuration des champs', () => {
    expect(contactPayloadSchema.safeParse({ message: 'abc' }).success).toBe(false)
    expect(contactPayloadSchema.safeParse({ message: 'x'.repeat(4001) }).success).toBe(false)
    const payload = contactPayloadSchema.parse({ message: 'Bonjour à tous', email: 'pas-un-email' })
    const errors = validateContactAgainstConfig(payload, DEFAULT_SETTINGS.contact)
    expect(errors.map((e) => e.field).sort()).toEqual(['email', 'name'])
    expect(validateContactAgainstConfig(payload, { ...DEFAULT_SETTINGS.contact, requireConsent: true }).map((e) => e.field)).toContain('consent')
  })
})
