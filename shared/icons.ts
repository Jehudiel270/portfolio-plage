import { LUCIDE_ICON_NAMES } from './constants'

/**
 * Une icône est stockée sous forme de texte :
 *  - `si:typescript`  → bibliothèque de marques (Simple Icons, domaine public CC0)
 *  - `lucide:Code`    → icône générique (Lucide)
 *  - `https://…`      → icône ou image personnalisée téléversée (Cloudinary) ou lien externe
 *  - vide (null)      → aucune icône
 */
export type IconKind = 'brand' | 'lucide' | 'image'

export type ResolvedIcon =
  | { type: 'brand'; slug: string; title: string; hex: string; path: string }
  | { type: 'lucide'; name: string }
  | { type: 'image'; url: string }

const BRAND = /^si:[a-z0-9]{1,60}$/
const LUCIDE = /^lucide:([A-Za-z0-9]{1,40})$/
const IMAGE = /^https?:\/\/\S{3,2040}$/

export function isValidIconValue(value: string | null | undefined): boolean {
  if (value === null || value === undefined || value === '') return true
  if (BRAND.test(value)) return true
  const lucide = LUCIDE.exec(value)
  if (lucide) return (LUCIDE_ICON_NAMES as readonly string[]).includes(lucide[1]!)
  return IMAGE.test(value)
}

export function parseIconValue(value: string | null | undefined): { kind: IconKind; key: string } | null {
  if (!value) return null
  if (BRAND.test(value)) return { kind: 'brand', key: value.slice(3) }
  const lucide = LUCIDE.exec(value)
  if (lucide && (LUCIDE_ICON_NAMES as readonly string[]).includes(lucide[1]!)) return { kind: 'lucide', key: lucide[1]! }
  return IMAGE.test(value) ? { kind: 'image', key: value } : null
}

/** Luminance relative WCAG d'une couleur #rrggbb. */
export function luminance(hex: string): number {
  const channel = (i: number): number => {
    const v = Number.parseInt(hex.slice(1 + i * 2, 3 + i * 2), 16) / 255
    return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4
  }
  return 0.2126 * channel(0) + 0.7152 * channel(1) + 0.0722 * channel(2)
}

/** Rapport de contraste WCAG entre deux couleurs (1 à 21). */
export function contrastRatio(a: string, b: string): number {
  const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x)
  return ((hi ?? 0) + 0.05) / ((lo ?? 0) + 0.05)
}
