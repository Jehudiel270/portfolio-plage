const MONTHS = ['janv.', 'févr.', 'mars', 'avr.', 'mai', 'juin', 'juil.', 'août', 'sept.', 'oct.', 'nov.', 'déc.']

export function formatMonth(date: string | null | undefined): string {
  if (!date) return ''
  const [year, month] = date.split('-')
  const index = Number(month) - 1
  return MONTHS[index] ? `${MONTHS[index]} ${year}` : String(year)
}

export function formatRange(start: string | null | undefined, end: string | null | undefined, isCurrent: boolean, currentLabel = 'en cours'): string {
  const from = formatMonth(start)
  const to = isCurrent ? currentLabel : formatMonth(end)
  return [from, to].filter(Boolean).join(' – ')
}

export function isExpired(expiresAt: string | null | undefined, now = new Date()): boolean {
  return Boolean(expiresAt) && new Date(`${expiresAt}T23:59:59`) < now
}

export const paragraphs = (text: string): string[] => text.split(/\n{2,}/).map((p) => p.trim()).filter(Boolean)

export const initials = (text: string): string => text.split(/\s+/).filter(Boolean).slice(0, 2).map((w) => w[0]?.toUpperCase() ?? '').join('')
