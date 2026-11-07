import { z } from 'zod'
import { contentSchema, socialItemSchema, socialSchema, deepMerge, DEFAULT_CONTENT } from '../../../../shared/schemas/settings'
import { loadSettings, saveSettingsSection } from '../../../db/repositories/settings'
import { importRows } from '../../../services/content'

const rows = z.array(z.record(z.string(), z.unknown())).max(200).default([])
const bodySchema = z.object({
  profile: z.object({ name: z.string().max(80), title: z.string().max(120), about: z.string().max(4000), publicEmail: z.string().max(200), location: z.string().max(120) }).partial().optional(),
  links: z.array(socialItemSchema).max(12).default([]),
  experiences: rows, education: rows, skills: rows, certifications: rows, achievements: rows, projects: rows,
})

/** Applique la sélection relue par l'administrateur : chaque ligne passe par la même validation qu'une saisie manuelle. */
export default defineEventHandler(async (event) => {
  await requireAdmin(event)
  assertBodySize(event, 2_000_000)
  const body = await readBodyWith(event, bodySchema)
  const db = useDb()
  const report: Record<string, { created: number; failed: { index: number; errors?: Record<string, string> }[] }> = {}
  for (const key of ['experiences', 'education', 'skills', 'certifications', 'achievements', 'projects'] as const) {
    if (!body[key].length) continue
    const results = await importRows(db, key, body[key], { autoIcons: key === 'skills' })
    report[key] = { created: results.filter((r) => r.ok).length, failed: results.filter((r) => !r.ok).map(({ index, errors }) => ({ index, errors })) }
  }
  let profileUpdated = false
  if (body.profile || body.links.length) {
    const settings = await loadSettings(db)
    if (body.profile) {
      const merged = contentSchema.safeParse(deepMerge(settings.content, Object.fromEntries(Object.entries(body.profile).filter(([, v]) => typeof v === 'string' && v.trim() !== ''))))
      if (merged.success && merged.data.name !== DEFAULT_CONTENT.name + '\u0000') { await saveSettingsSection(db, 'content', merged.data); profileUpdated = true }
    }
    if (body.links.length) {
      const known = new Set(settings.social.map((s) => s.url))
      const social = socialSchema.safeParse([...settings.social, ...body.links.filter((l) => !known.has(l.url))].slice(0, 12))
      if (social.success) { await saveSettingsSection(db, 'social', social.data); profileUpdated = true }
    }
  }
  invalidatePublicCache()
  return { ok: true, report, profileUpdated }
})
