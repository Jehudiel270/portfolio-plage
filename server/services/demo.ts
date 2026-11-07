import { eq } from 'drizzle-orm'
import { DEMO_ACHIEVEMENTS, DEMO_CATEGORIES, DEMO_CERTIFICATIONS, DEMO_EDUCATION, DEMO_EXPERIENCES, DEMO_PROJECTS, DEMO_SKILLS } from '../../shared/demo/demo-content'
import type { Database } from '../db/client'
import { achievements, categories, certifications, educationEntries, professionalExperiences, projects, skills } from '../db/schema'

const TABLES = [projects, skills, educationEntries, professionalExperiences, certifications, achievements, categories] as const

/** Insère le jeu de démonstration (marqué `is_demo`). Idempotent : ne fait rien si des données de démo existent déjà. */
export async function seedDemoContent(db: Database): Promise<{ inserted: boolean }> {
  const [existing] = await db.select({ id: skills.id }).from(skills).where(eq(skills.isDemo, true)).limit(1)
  if (existing) return { inserted: false }
  await db.insert(categories).values(DEMO_CATEGORIES.map((c) => ({ ...c, color: null, isDemo: true }))).onConflictDoNothing()
  await db.insert(skills).values(DEMO_SKILLS.map((s) => ({ ...s, isDemo: true }))).onConflictDoNothing()
  await db.insert(projects).values(DEMO_PROJECTS.map((p) => ({ ...p, isDemo: true }))).onConflictDoNothing()
  await db.insert(educationEntries).values(DEMO_EDUCATION.map((e) => ({ ...e, isDemo: true })))
  await db.insert(professionalExperiences).values(DEMO_EXPERIENCES.map((e) => ({ ...e, isDemo: true })))
  await db.insert(certifications).values(DEMO_CERTIFICATIONS.map((c) => ({ ...c, isDemo: true })))
  await db.insert(achievements).values(DEMO_ACHIEVEMENTS.map((a) => ({ ...a, isDemo: true })))
  return { inserted: true }
}

/** Supprime uniquement les lignes marquées `is_demo` (vos données réelles ne sont jamais touchées). */
export async function purgeDemoContent(db: Database): Promise<number> {
  let total = 0
  for (const table of TABLES) total += (await db.delete(table).where(eq(table.isDemo, true)).returning({ id: table.id })).length
  return total
}

export async function countDemoRows(db: Database): Promise<number> {
  let total = 0
  for (const table of TABLES) total += (await db.select({ id: table.id }).from(table).where(eq(table.isDemo, true))).length
  return total
}
