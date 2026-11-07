import { describe, expect, it } from 'vitest'
import { DEFAULT_SETTINGS, deepMerge, normalizeContactSettings, resolveSettingsSection } from '../../shared/schemas/settings'
import { hexToRgb01, hexToRgba, isHexColor } from '../../shared/utils/color'
import { optimizeCloudinaryUrl } from '../../shared/utils/cloudinary'
import { slugify } from '../../shared/utils/slug'
import { buildWhatsAppUrl, isSafeInternalPath, renderTemplate, safeHref, sanitizeHeaderValue } from '../../shared/utils/template'

describe('modèles de messages', () => {
  it('ne substitue que les variables prédéfinies et n’exécute rien', () => {
    const out = renderTemplate('Bonjour {name} <{email}> {constructor} ${process.env.X} {{message}}', { name: 'Ada', email: 'ada@x.co', message: 'Salut' })
    expect(out).toBe('Bonjour Ada <ada@x.co> {constructor} ${process.env.X} {Salut}')
  })
  it('neutralise l’injection d’en-têtes e-mail', () => {
    const subject = sanitizeHeaderValue('Hello\r\nBcc: evil@example.com\nX-Test: 1')
    expect(subject).not.toMatch(/[\r\n]/)
    expect(sanitizeHeaderValue('a'.repeat(500)).length).toBe(200)
  })
  it('construit un lien WhatsApp wa.me valide ou rien', () => {
    expect(buildWhatsAppUrl('22997000000', 'Salut & bienvenue')).toBe('https://wa.me/22997000000?text=Salut%20%26%20bienvenue')
    expect(buildWhatsAppUrl('+229 97', 'x')).toBeNull()
    expect(buildWhatsAppUrl(null, 'x')).toBeNull()
  })
  it('accepte uniquement des redirections internes et des liens http(s)', () => {
    expect(isSafeInternalPath('/merci')).toBe(true)
    for (const bad of ['//evil.com', 'https://evil.com', '/\\evil', 'javascript:alert(1)', '', null]) expect(isSafeInternalPath(bad as string)).toBe(false)
    expect(safeHref('https://exemple.com/a')).toBe('https://exemple.com/a')
    expect(safeHref('javascript:alert(1)')).toBeNull()
    expect(safeHref('data:text/html,<script>')).toBeNull()
  })
})

describe('utilitaires', () => {
  it('optimise uniquement les URL Cloudinary', () => {
    const url = 'https://res.cloudinary.com/demo/image/upload/v1/portfolio/projects/a.jpg'
    expect(optimizeCloudinaryUrl(url, { width: 800 })).toBe('https://res.cloudinary.com/demo/image/upload/f_auto,q_auto,w_800,c_limit/v1/portfolio/projects/a.jpg')
    expect(optimizeCloudinaryUrl('https://exemple.com/a.jpg', { width: 800 })).toBe('https://exemple.com/a.jpg')
    expect(optimizeCloudinaryUrl(null)).toBe('')
  })
  it('génère des slugs propres', () => {
    expect(slugify('Été 2024 — Projet Spécial !')).toBe('ete-2024-projet-special')
    expect(slugify('***')).toBe('element')
  })
  it('normalise les couleurs pour les shaders', () => {
    expect(hexToRgb01('#ff0000')).toEqual([1, 0, 0])
    expect(hexToRgb01('#0f0')).toEqual([0, 1, 0])
    expect(isHexColor('#12abEF')).toBe(true)
    expect(isHexColor('#12abE')).toBe(false)
    expect(hexToRgba('#000000', 0.5)).toBe('rgba(0, 0, 0, 0.5)')
  })
})

describe('réglages', () => {
  it('fusionne en profondeur et retombe sur les défauts si la valeur stockée est invalide', () => {
    expect(deepMerge({ a: 1, b: { c: 2, d: 3 } }, { b: { c: 9 } })).toEqual({ a: 1, b: { c: 9, d: 3 } })
    expect(resolveSettingsSection('theme', { accent: '#00ff00' }).accent).toBe('#00ff00')
    expect(resolveSettingsSection('theme', { accent: 'pas-une-couleur' })).toEqual(DEFAULT_SETTINGS.theme)
    expect(resolveSettingsSection('display', undefined)).toEqual(DEFAULT_SETTINGS.display)
  })
  it('force le champ message visible et obligatoire', () => {
    const hidden = { ...DEFAULT_SETTINGS.contact, fields: { ...DEFAULT_SETTINGS.contact.fields, message: { ...DEFAULT_SETTINGS.contact.fields.message, visible: false, required: false } } }
    const fixed = normalizeContactSettings(hidden)
    expect(fixed.fields.message.visible && fixed.fields.message.required).toBe(true)
  })
})
