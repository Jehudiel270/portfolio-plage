import { and, asc, eq, max } from 'drizzle-orm'
import type { CategoryScope } from '../../../shared/constants'
import type { CategoryInput } from '../../../shared/schemas/entities'
import type { Database } from '../client'
import { achievements, categories, certifications, projects, skills } from '../schema'

export type CategoryRow = typeof categories.$inferSelect

/** Table d'entités associée à chaque liste de catégories (la colonne `category` y est un texte). */
const OWNER = { skills, projects, certifications, achievements } as const

export async function listCategories(db: Database, scope?: CategoryScope): Promise<CategoryRow[]> {
  const query = db.select().from(categories)
  return (scope ? query.where(eq(categories.scope, scope)) : query).orderBy(asc(categories.scope), asc(categories.sortOrder), asc(categories.id))
}

export async function createCategory(db: Database, input: CategoryInput & { isDemo?: boolean }): Promise<CategoryRow> {
  const [row] = await db.insert(categories).values(input).onConflictDoNothing().returning()
  if (row) return row
  const [existing] = await db.select().from(categories).where(and(eq(categories.scope, input.scope), eq(categories.name, input.name))).limit(1)
  if (!existing) throw new Error('Création de la catégorie impossible')
  return existing
}

/** Retourne la catégorie existante ou la crée en fin de liste (utilisé par les formulaires, imports et l'import de CV). */
export async function ensureCategory(db: Database, scope: CategoryScope, name: string): Promise<CategoryRow | null> {
  const clean = name.trim().slice(0, 60)
  if (!clean) return null
  const [existing] = await db.select().from(categories).where(and(eq(categories.scope, scope), eq(categories.name, clean))).limit(1)
  if (existing) return existing
  const [last] = await db.select({ value: max(categories.sortOrder) }).from(categories).where(eq(categories.scope, scope))
  return createCategory(db, { scope, name: clean, color: null, icon: null, iconPublicId: null, sortOrder: (last?.value ?? -1) + 1 })
}

/** Renommer une catégorie met à jour toutes les fiches qui l'utilisent. */
export async function updateCategory(db: Database, id: number, patch: Partial<Omit<CategoryInput, 'scope'>>): Promise<CategoryRow | null> {
  const [before] = await db.select().from(categories).where(eq(categories.id, id)).limit(1)
  if (!before) return null
  const [after] = await db.update(categories).set({ ...patch, updatedAt: new Date() }).where(eq(categories.id, id)).returning()
  if (after && patch.name && patch.name !== before.name) {
    const owner = OWNER[before.scope]
    await db.update(owner).set({ category: patch.name } as never).where(eq(owner.category, before.name))
  }
  return after ?? null
}

/** Supprimer une catégorie vide la colonne `category` des fiches concernées (aucune fiche n'est supprimée). */
export async function deleteCategory(db: Database, id: number): Promise<{ detached: number } | null> {
  const [row] = await db.select().from(categories).where(eq(categories.id, id)).limit(1)
  if (!row) return null
  const owner = OWNER[row.scope]
  const detached = await db.update(owner).set({ category: '' } as never).where(eq(owner.category, row.name)).returning({ id: owner.id })
  await db.delete(categories).where(eq(categories.id, id))
  return { detached: detached.length }
}

export async function countCategoryUsage(db: Database, scope: CategoryScope, name: string): Promise<number> {
  const owner = OWNER[scope]
  return (await db.select({ id: owner.id }).from(owner).where(eq(owner.category, name))).length
}
