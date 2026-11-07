import { ENTITY_CATEGORY_SCOPE, ENTITY_DEFAULTS, ENTITY_PUBLICATION_FIELD, ENTITY_SCHEMAS, type BulkAction, type EntityKey } from '../../shared/schemas/entities'
import { slugify } from '../../shared/utils/slug'
import type { Database } from '../db/client'
import { ensureCategory } from '../db/repositories/categories'
import { collectReferencedPublicIds, createRow, deleteRow, getRow, publicIdsOfRow, updateMany, updateRow, type EntityRow } from '../db/repositories/content'
import { coerceRow, parseCsv, toCsv } from './csv'
import { findBrandIcon } from './icons'

export class EntityRuleError extends Error {}

/** Valide un corps de création : défauts + valeurs reçues, slug généré si absent. */
export function parseCreateInput(key: EntityKey, raw: unknown) {
  const merged: Record<string, unknown> = { ...ENTITY_DEFAULTS[key], ...(typeof raw === 'object' && raw ? raw : {}) }
  if ((key === 'projects' || key === 'skills') && !merged.slug) merged.slug = slugify(String(merged.title ?? merged.name ?? ''))
  return ENTITY_SCHEMAS[key].safeParse(merged)
}

/** Valide une modification partielle (les champs absents ne sont pas touchés). */
export function parsePatchInput(key: EntityKey, raw: unknown) {
  return ENTITY_SCHEMAS[key].partial().safeParse(raw)
}

/** Règles transverses : date de fin postérieure à la date de début, « en cours » sans date de fin. */
export function applyEntityRules(key: EntityKey, data: Record<string, unknown>, existing?: Record<string, unknown> | null): Record<string, unknown> {
  const next = { ...data }
  if (key === 'education' || key === 'experiences') {
    const merged = { ...(existing ?? {}), ...next }
    if (merged.isCurrent === true) next.endDate = null
    const start = merged.startDate
    const end = next.endDate !== undefined ? next.endDate : merged.endDate
    if (typeof start === 'string' && typeof end === 'string' && end < start) throw new EntityRuleError('La date de fin doit être postérieure à la date de début.')
  }
  if (key === 'certifications') {
    const merged = { ...(existing ?? {}), ...next }
    if (typeof merged.issuedAt === 'string' && typeof merged.expiresAt === 'string' && merged.expiresAt < merged.issuedAt) throw new EntityRuleError('La date d’expiration doit être postérieure à la date d’obtention.')
  }
  return next
}

export type AssetDestroyer = (publicId: string) => Promise<unknown>

/** Supprime de Cloudinary les images retirées, sauf si une autre fiche les référence encore. */
export async function cleanupOrphanedAssets(db: Database, candidates: string[], destroy: AssetDestroyer): Promise<string[]> {
  if (candidates.length === 0) return []
  const referenced = await collectReferencedPublicIds(db)
  const removed: string[] = []
  for (const id of candidates) {
    if (referenced.has(id)) continue
    try { await destroy(id); removed.push(id) } catch (error) { console.error('[cloudinary] suppression impossible', id, error instanceof Error ? error.message : error) }
  }
  return removed
}

/** La catégorie saisie (ou importée) est ajoutée à la liste de l'administration si elle n'existe pas encore. */
async function syncCategory(db: Database, key: EntityKey, row: Record<string, unknown>): Promise<void> {
  const scope = ENTITY_CATEGORY_SCOPE[key]
  if (scope && typeof row.category === 'string' && row.category) await ensureCategory(db, scope, row.category)
}

export async function createEntity(db: Database, key: EntityKey, data: Record<string, unknown>): Promise<EntityRow> {
  const row = await createRow(db, key, applyEntityRules(key, data))
  await syncCategory(db, key, row)
  return row
}

export async function patchEntity(db: Database, key: EntityKey, id: number, data: Record<string, unknown>, destroy: AssetDestroyer) {
  const before = await getRow(db, key, id)
  if (!before) return null
  const after = await updateRow(db, key, id, applyEntityRules(key, data, before))
  if (!after) return null
  await syncCategory(db, key, after)
  const dropped = publicIdsOfRow(key, before).filter((p) => !publicIdsOfRow(key, after).includes(p))
  await cleanupOrphanedAssets(db, dropped, destroy)
  return after
}

export async function removeEntity(db: Database, key: EntityKey, id: number, destroy: AssetDestroyer): Promise<boolean> {
  const before = await getRow(db, key, id)
  if (!before) return false
  const deleted = await deleteRow(db, key, id)
  if (deleted) await cleanupOrphanedAssets(db, publicIdsOfRow(key, before), destroy)
  return deleted
}

/* ------------------------------- Actions en masse ------------------------------ */
export async function runBulk(db: Database, key: EntityKey, action: BulkAction, destroy: AssetDestroyer): Promise<{ affected: number }> {
  switch (action.action) {
    case 'publish':
    case 'hide': {
      const field = ENTITY_PUBLICATION_FIELD[key]
      const on = action.action === 'publish'
      return { affected: await updateMany(db, key, action.ids, { [field]: field === 'status' ? (on ? 'published' : 'draft') : on }) }
    }
    case 'feature':
      if (!('featured' in ENTITY_DEFAULTS[key])) throw new EntityRuleError('La mise en avant n’existe pas pour ce type de contenu.')
      return { affected: await updateMany(db, key, action.ids, { featured: action.value }) }
    case 'category': {
      const scope = ENTITY_CATEGORY_SCOPE[key]
      if (!scope) throw new EntityRuleError('Ce type de contenu n’utilise pas de catégories.')
      await ensureCategory(db, scope, action.value)
      return { affected: await updateMany(db, key, action.ids, { category: action.value.trim() }) }
    }
    case 'delete': {
      let affected = 0
      for (const id of action.ids) if (await removeEntity(db, key, id, destroy)) affected += 1
      return { affected }
    }
  }
}

/* ----------------------------- Import / export ------------------------------ */
export interface ImportResult { index: number; ok: boolean; id?: number; errors?: Record<string, string> }

/** Importe des lignes (JSON ou CSV déjà converti) : chaque ligne est validée comme à la création ; `dryRun` ne crée rien. */
export async function importRows(db: Database, key: EntityKey, rows: unknown[], options: { dryRun?: boolean; autoIcons?: boolean } = {}): Promise<ImportResult[]> {
  const results: ImportResult[] = []
  for (const [index, raw] of rows.entries()) {
    const input = typeof raw === 'object' && raw ? { ...(raw as Record<string, unknown>) } : {}
    // Compétences importées en masse : l'icône de la technologie est proposée automatiquement (modifiable ensuite).
    if (options.autoIcons && key === 'skills' && !input.icon && typeof input.name === 'string') {
      const icon = findBrandIcon(input.name)
      if (icon) input.icon = `si:${icon.slug}`
    }
    const parsed = parseCreateInput(key, input)
    if (!parsed.success) {
      results.push({ index, ok: false, errors: Object.fromEntries(parsed.error.issues.map((i) => [i.path.join('.') || 'ligne', i.message])) })
      continue
    }
    try {
      const data = applyEntityRules(key, parsed.data as Record<string, unknown>)
      if (options.dryRun) { results.push({ index, ok: true }); continue }
      const row = await createEntity(db, key, data)
      results.push({ index, ok: true, id: row.id })
    } catch (error) {
      results.push({ index, ok: false, errors: { ligne: error instanceof Error ? error.message : 'Erreur' } })
    }
  }
  return results
}

export const exportColumns = (key: EntityKey): string[] => Object.keys(ENTITY_DEFAULTS[key]).filter((c) => c !== 'gallery')
export const exportCsv = (key: EntityKey, rows: Record<string, unknown>[]): string => toCsv(exportColumns(key), rows)
export function importCsvRows(key: EntityKey, text: string): Record<string, unknown>[] {
  const table = parseCsv(text)
  const [headers = [], ...lines] = table
  return lines.filter((cells) => cells.some((c) => c.trim() !== '')).map((cells) => coerceRow(key, headers.map((h) => h.trim()), cells))
}
