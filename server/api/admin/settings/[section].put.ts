import { normalizeContactSettings, pickKnownLabels, SETTINGS_KEYS, SETTINGS_SCHEMAS, type SettingsKey } from '../../../../shared/schemas/settings'
import { saveSettingsSection } from '../../../db/repositories/settings'

export default defineEventHandler(async (event) => {
  await requireAdmin(event)
  assertBodySize(event, 100_000)
  const section = getRouterParam(event, 'section') as SettingsKey
  if (!SETTINGS_KEYS.includes(section)) throw apiError(404, 'UNKNOWN_SECTION', 'Section de réglages inconnue.')
  let value = await readBodyWith(event, SETTINGS_SCHEMAS[section])
  if (section === 'contact') value = normalizeContactSettings(value as never)
  if (section === 'ui') value = pickKnownLabels(value)
  await saveSettingsSection(useDb(), section, value)
  invalidatePublicCache()
  return { ok: true, section, value }
})
