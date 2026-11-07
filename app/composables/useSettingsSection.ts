import type { SettingsKey, SiteSettings } from '#shared/schemas/settings'
import { DEFAULT_SETTINGS, SETTINGS_SCHEMAS } from '#shared/schemas/settings'

export interface AdminSettingsStatus { smtpConfigured: boolean; smtpHost: string | null; cloudinaryConfigured: boolean }

const clone = <T>(value: T): T => JSON.parse(JSON.stringify(value)) as T

/** Charge les réglages complets une seule fois (partagés entre les pages d'administration). */
export async function loadAdminSettings(force = false) {
  const settings = useState<SiteSettings | null>('admin-settings', () => null)
  const status = useState<AdminSettingsStatus | null>('admin-settings-status', () => null)
  if (force || !settings.value) {
    const response = await adminFetch<{ settings: SiteSettings; status: AdminSettingsStatus }>('/api/admin/settings')
    settings.value = response.settings
    status.value = response.status
  }
  return { settings, status }
}

/**
 * Édition d'une section de réglages : brouillon local, détection des modifications, enregistrement explicite,
 * annulation et restauration des valeurs par défaut. Rien n'est publié tant que « Enregistrer » n'est pas cliqué.
 */
export function useSettingsSection<K extends SettingsKey>(key: K) {
  const store = useState<SiteSettings | null>('admin-settings', () => null)
  const toasts = useToasts()
  const draft = ref(clone(store.value?.[key] ?? DEFAULT_SETTINGS[key])) as Ref<SiteSettings[K]>
  const saving = ref(false)
  const errors = ref<Record<string, string>>({})
  const saved = computed(() => store.value?.[key] ?? DEFAULT_SETTINGS[key])
  const dirty = computed(() => JSON.stringify(draft.value) !== JSON.stringify(saved.value))

  watch(() => store.value?.[key], (value) => { if (value && !dirty.value) draft.value = clone(value) as SiteSettings[K] })

  async function save(): Promise<boolean> {
    errors.value = {}
    const parsed = SETTINGS_SCHEMAS[key].safeParse(draft.value)
    if (!parsed.success) {
      errors.value = Object.fromEntries(parsed.error.issues.map((i) => [i.path.join('.'), i.message]))
      toasts.error('Certaines valeurs sont invalides : corrigez les champs signalés.')
      return false
    }
    saving.value = true
    try {
      const response = await adminFetch<{ value: SiteSettings[K] }>(`/api/admin/settings/${key}`, { method: 'PUT', body: parsed.data })
      if (store.value) store.value = { ...store.value, [key]: response.value }
      draft.value = clone(response.value)
      toasts.ok('Réglages enregistrés : le site public est à jour.')
      return true
    } catch (error) {
      const parsedError = parseApiError(error)
      errors.value = parsedError.fields
      toasts.error(parsedError.message)
      return false
    } finally {
      saving.value = false
    }
  }

  const cancel = (): void => { draft.value = clone(saved.value) as SiteSettings[K]; errors.value = {} }
  const restoreDefaults = (): void => { draft.value = clone(DEFAULT_SETTINGS[key]) as SiteSettings[K] }
  return { draft, dirty, saving, errors, save, cancel, restoreDefaults, saved }
}
