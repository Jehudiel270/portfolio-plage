import { eq } from 'drizzle-orm'
import { normalizeContactSettings, resolveSettingsSection, SETTINGS_KEYS, type SettingsKey, type SiteSettings } from '../../../shared/schemas/settings'
import type { Database } from '../client'
import { siteSettings } from '../schema'

/** Lit les réglages (défauts + valeurs stockées validées). Sans ligne en base, retourne les défauts. */
export async function loadSettings(db: Database): Promise<SiteSettings> {
  const [row] = await db.select().from(siteSettings).where(eq(siteSettings.id, 1)).limit(1)
  const stored = (row ?? {}) as Record<string, unknown>
  const settings = Object.fromEntries(SETTINGS_KEYS.map((key) => [key, resolveSettingsSection(key, stored[key])])) as unknown as SiteSettings
  settings.contact = normalizeContactSettings(settings.contact)
  return settings
}

/** Enregistre une section (déjà validée) dans l'unique ligne `id = 1`. */
export async function saveSettingsSection(db: Database, key: SettingsKey, value: unknown): Promise<void> {
  const values = { [key]: value } as Partial<typeof siteSettings.$inferInsert>
  await db.insert(siteSettings).values({ id: 1, ...values }).onConflictDoUpdate({ target: siteSettings.id, set: { ...values, updatedAt: new Date() } })
}

export async function getSettingsUpdatedAt(db: Database): Promise<Date | null> {
  const [row] = await db.select({ updatedAt: siteSettings.updatedAt }).from(siteSettings).where(eq(siteSettings.id, 1)).limit(1)
  return row?.updatedAt ?? null
}
