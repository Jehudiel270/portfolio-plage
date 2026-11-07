import { contrastRatio } from '#shared/icons'
import type { ThemeSettings } from '#shared/schemas/settings'
import { DEFAULT_THEME } from '#shared/schemas/settings'
import { isHexColor } from '#shared/utils/color'

const safe = (value: string, fallback: string): string => (isHexColor(value) ? value : fallback)
/** Texte lisible (blanc ou bleu nuit) sur une couleur d'aplat. */
const onColor = (hex: string): string => (contrastRatio('#ffffff', hex) >= contrastRatio('#0b1d2a', hex) ? '#ffffff' : '#0b1d2a')

/** Variables CSS du thème (valeurs hexadécimales validées uniquement : aucune injection possible). */
export function themeToCssVars(theme: ThemeSettings): Record<string, string> {
  const t = { ...DEFAULT_THEME, ...theme }
  const primary = safe(t.primary, DEFAULT_THEME.primary)
  const accent = safe(t.accent, DEFAULT_THEME.accent)
  return {
    '--primary': primary, '--accent': accent, '--sun': safe(t.sun, DEFAULT_THEME.sun), '--bg': safe(t.background, DEFAULT_THEME.background),
    '--surface': safe(t.surface, DEFAULT_THEME.surface), '--fg': safe(t.text, DEFAULT_THEME.text), '--fg-muted': safe(t.textMuted, DEFAULT_THEME.textMuted),
    '--sea-deep': safe(t.seaDeep, DEFAULT_THEME.seaDeep), '--sea-shallow': safe(t.seaShallow, DEFAULT_THEME.seaShallow), '--sky': safe(t.sky, DEFAULT_THEME.sky),
    '--on-primary': onColor(primary), '--on-accent': onColor(accent),
  }
}

export const themeToCss = (theme: ThemeSettings): string => `:root{${Object.entries(themeToCssVars(theme)).map(([k, v]) => `${k}:${v}`).join(';')}}`
