import { ENTITY_DEFAULTS, type EntityKey } from '../../shared/schemas/entities'

const LIST_SEPARATOR = ' | '

function cell(value: unknown): string {
  if (value === null || value === undefined) return ''
  if (Array.isArray(value)) return value.map((v) => (typeof v === 'object' ? JSON.stringify(v) : String(v))).join(LIST_SEPARATOR)
  if (value instanceof Date) return value.toISOString()
  return typeof value === 'object' ? JSON.stringify(value) : String(value)
}

/** CSV (séparateur « ; », BOM UTF-8 pour Excel). Les listes sont séparées par « | ». */
export function toCsv(columns: string[], rows: Record<string, unknown>[]): string {
  const escape = (v: string): string => (/[";\n\r]/.test(v) ? `"${v.replace(/"/g, '""')}"` : v)
  // Neutralise l'injection de formules dans les tableurs (cellule commençant par = + - @).
  const safe = (v: string): string => (/^[=+@]/.test(v) || /^-[^\d]/.test(v) ? `'${v}` : v)
  return `\uFEFF${[columns.join(';'), ...rows.map((row) => columns.map((c) => escape(safe(cell(row[c])))).join(';'))].join('\r\n')}\r\n`
}

/** Lecteur CSV minimal (guillemets, retours à la ligne dans les cellules) ; le séparateur « ; » ou « , » est détecté sur l'en-tête. */
export function parseCsv(input: string): string[][] {
  const text = input.replace(/^\uFEFF/, '')
  const firstLine = text.split(/\r?\n/, 1)[0] ?? ''
  const delimiter = (firstLine.match(/;/g)?.length ?? 0) >= (firstLine.match(/,/g)?.length ?? 0) ? ';' : ','
  const rows: string[][] = []
  let row: string[] = []
  let field = ''
  let quoted = false
  for (let i = 0; i < text.length; i += 1) {
    const ch = text[i]!
    if (quoted) {
      if (ch === '"' && text[i + 1] === '"') {
        field += '"'
        i += 1
      } else if (ch === '"') {
        quoted = false
      } else {
        field += ch
      }
    } else if (ch === '"') {
      quoted = true
    } else if (ch === delimiter) {
      row.push(field)
      field = ''
    } else if (ch === '\n' || ch === '\r') {
      if (ch === '\r' && text[i + 1] === '\n') i += 1
      row.push(field)
      rows.push(row)
      row = []
      field = ''
    } else {
      field += ch
    }
  }
  if (field !== '' || row.length) { row.push(field); rows.push(row) }
  return rows.filter((r) => r.length > 1 || (r[0] ?? '') !== '')
}

/** Convertit une ligne de texte en valeurs typées d'après les valeurs par défaut de l'entité (listes, booléens, nombres). */
export function coerceRow(key: EntityKey, headers: string[], cells: string[]): Record<string, unknown> {
  const defaults = ENTITY_DEFAULTS[key] as Record<string, unknown>
  const out: Record<string, unknown> = {}
  headers.forEach((header, i) => {
    if (!(header in defaults) || header === 'gallery') return
    const raw = (cells[i] ?? '').trim().replace(/^'(?=[=+\-@])/, '')
    const reference = defaults[header]
    if (Array.isArray(reference)) out[header] = raw ? raw.split(/\s*\|\s*|\s*;\s*/).filter(Boolean) : []
    else if (typeof reference === 'boolean') out[header] = /^(true|1|oui|yes|vrai|x)$/i.test(raw)
    else if (typeof reference === 'number' || header === 'proficiency') out[header] = raw === '' ? null : Number(raw.replace(',', '.'))
    else out[header] = raw
  })
  return out
}
