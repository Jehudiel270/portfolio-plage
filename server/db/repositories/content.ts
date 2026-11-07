import { and, asc, eq, getTableName, inArray, ne, sql } from 'drizzle-orm'
import type { PgColumn, PgTable } from 'drizzle-orm/pg-core'
import { ENTITY_IMAGE_FIELDS, ENTITY_PUBLICATION_FIELD, type EntityKey } from '../../../shared/schemas/entities'
import { slugify } from '../../../shared/utils/slug'
import type { Database } from '../client'
import { categories, ENTITY_TABLES, projects, skills } from '../schema'

export type EntityRow = Record<string, unknown> & { id: number }
type EntityTable = PgTable & { id: PgColumn; sortOrder: PgColumn }

/* Le CRUD générique manipule six tables : on accède aux colonnes par nom, les valeurs étant déjà validées par les schémas Zod. */
const tableOf = (key: EntityKey): EntityTable => ENTITY_TABLES[key] as unknown as EntityTable
const columnOf = (key: EntityKey, name: string): PgColumn => (tableOf(key) as unknown as Record<string, PgColumn>)[name] as PgColumn

export async function listRows(db: Database, key: EntityKey, options: { publicOnly?: boolean } = {}): Promise<EntityRow[]> {
  const table = tableOf(key)
  const field = ENTITY_PUBLICATION_FIELD[key]
  const publicFilter = options.publicOnly ? (field === 'status' ? eq(columnOf(key, 'status'), 'published') : eq(columnOf(key, 'visible'), true)) : undefined
  return (await db.select().from(table).where(publicFilter).orderBy(asc(table.sortOrder), asc(table.id))) as EntityRow[]
}

export async function getRow(db: Database, key: EntityKey, id: number): Promise<EntityRow | null> {
  const [row] = (await db.select().from(tableOf(key)).where(eq(tableOf(key).id, id)).limit(1)) as EntityRow[]
  return row ?? null
}

/** Garantit l'unicité d'un slug (suffixe -2, -3…) pour projets et compétences. */
export async function ensureUniqueSlug(db: Database, key: 'projects' | 'skills', wanted: string, excludeId?: number): Promise<string> {
  const table = key === 'projects' ? projects : skills
  const base = slugify(wanted)
  for (let attempt = 1; attempt < 200; attempt += 1) {
    const candidate = attempt === 1 ? base : `${base}-${attempt}`
    const where = excludeId ? and(eq(table.slug, candidate), ne(table.id, excludeId)) : eq(table.slug, candidate)
    const [taken] = await db.select({ id: table.id }).from(table).where(where).limit(1)
    if (!taken) return candidate
  }
  return `${base}-${Date.now()}`
}

export async function createRow(db: Database, key: EntityKey, values: Record<string, unknown>): Promise<EntityRow> {
  const columns = { ...values }
  if (key === 'projects' || key === 'skills') columns.slug = await ensureUniqueSlug(db, key, String(columns.slug || columns.title || columns.name || 'element'))
  const [row] = (await db.insert(tableOf(key)).values(columns as never).returning()) as EntityRow[]
  if (!row) throw new Error('Insertion impossible')
  return row
}

export async function updateRow(db: Database, key: EntityKey, id: number, patch: Record<string, unknown>): Promise<EntityRow | null> {
  const columns = { ...patch }
  if ((key === 'projects' || key === 'skills') && typeof columns.slug === 'string') columns.slug = await ensureUniqueSlug(db, key, columns.slug, id)
  if (Object.keys(columns).length > 0) {
    const updated = await db.update(tableOf(key)).set({ ...columns, updatedAt: new Date() } as never).where(eq(tableOf(key).id, id)).returning({ id: tableOf(key).id })
    if (updated.length === 0) return null
  }
  return getRow(db, key, id)
}

export async function deleteRow(db: Database, key: EntityKey, id: number): Promise<boolean> {
  const deleted = await db.delete(tableOf(key)).where(eq(tableOf(key).id, id)).returning({ id: tableOf(key).id })
  return deleted.length > 0
}

/** Mise à jour d'un champ pour plusieurs lignes à la fois (actions en masse). */
export async function updateMany(db: Database, key: EntityKey, ids: number[], patch: Record<string, unknown>): Promise<number> {
  if (ids.length === 0) return 0
  const rows = await db.update(tableOf(key)).set({ ...patch, updatedAt: new Date() } as never).where(inArray(tableOf(key).id, ids)).returning({ id: tableOf(key).id })
  return rows.length
}

/** Réécrit `sort_order` selon l'ordre des identifiants fournis, en une seule requête. */
export async function reorderRows(db: Database, key: EntityKey, ids: number[]): Promise<void> {
  if (ids.length === 0) return
  const tuples = sql.join(ids.map((id, index) => sql`(${id}::int, ${index}::int)`), sql`, `)
  await db.execute(sql`update ${sql.identifier(getTableName(tableOf(key)))} as t set sort_order = v.position, updated_at = now() from (values ${tuples}) as v(id, position) where t.id = v.id`)
}

/** Identifiants publics Cloudinary référencés par une ligne (champs image + galerie). */
export function publicIdsOfRow(key: EntityKey, row: Record<string, unknown> | null | undefined): string[] {
  if (!row) return []
  const ids = ENTITY_IMAGE_FIELDS[key].map((f) => row[f.publicId]).filter((v): v is string => typeof v === 'string' && v.length > 0)
  if (key === 'projects' && Array.isArray(row.gallery)) for (const item of row.gallery as { publicId?: string | null }[]) if (item?.publicId) ids.push(item.publicId)
  return [...new Set(ids)]
}

/** Ensemble de tous les identifiants publics encore référencés en base (évite de supprimer une image réutilisée). */
export async function collectReferencedPublicIds(db: Database): Promise<Set<string>> {
  const result = new Set<string>()
  for (const key of Object.keys(ENTITY_TABLES) as EntityKey[]) for (const row of (await db.select().from(tableOf(key))) as EntityRow[]) for (const id of publicIdsOfRow(key, row)) result.add(id)
  for (const row of await db.select({ id: categories.iconPublicId }).from(categories)) if (row.id) result.add(row.id)
  return result
}
