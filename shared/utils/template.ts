import { TEMPLATE_VARIABLES, type TemplateVariable } from '../constants'

const VARIABLE_PATTERN = new RegExp(`\\{(${TEMPLATE_VARIABLES.join('|')})\\}`, 'g')

/**
 * Remplace uniquement les variables prédéfinies ({name}, {email}, …).
 * Aucune expression n'est évaluée : tout autre `{texte}` reste littéral.
 */
export function renderTemplate(template: string, values: Partial<Record<TemplateVariable, string>>): string {
  return template.replace(VARIABLE_PATTERN, (_match, key: TemplateVariable) => values[key] ?? '')
}

/** Neutralise l'injection d'en-têtes e-mail : supprime retours chariot, caractères de contrôle et espaces multiples. */
export function sanitizeHeaderValue(value: string, maxLength = 200): string {
  // eslint-disable-next-line no-control-regex
  return value.replace(/[\u0000-\u001f\u007f\u2028\u2029]+/g, ' ').replace(/\s{2,}/g, ' ').trim().slice(0, maxLength)
}

export function buildWhatsAppUrl(number: string | null | undefined, text: string): string | null {
  if (!number || !/^\d{8,15}$/.test(number)) return null
  const trimmed = text.trim().slice(0, 1200)
  return `https://wa.me/${number}${trimmed ? `?text=${encodeURIComponent(trimmed)}` : ''}`
}

/** Accepte uniquement un chemin interne (`/merci`) : pas de `//hote`, de schéma ni d'antislash. */
export function isSafeInternalPath(path: string | null | undefined): path is string {
  return typeof path === 'string' && /^\/(?!\/)[^\s\\]*$/.test(path) && !/^\/\w+:/.test(path)
}

/** N'autorise que http(s) pour les liens affichés (défense en profondeur côté interface). */
export function safeHref(url: string | null | undefined): string | null {
  if (!url) return null
  try {
    const parsed = new URL(url)
    return parsed.protocol === 'https:' || parsed.protocol === 'http:' ? parsed.toString() : null
  } catch {
    return null
  }
}
