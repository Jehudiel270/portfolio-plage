import { loadSettings } from '../../../db/repositories/settings'
import { DEFAULT_SETTINGS, resolveSettingsSection, SETTINGS_KEYS } from '../../../../shared/schemas/settings'

const sectionModules = {
  content: 'profile', social: 'profile', theme: 'appearance', effects: 'appearance', sections: 'display',
  journey: 'journey', display: 'display', navigation: 'display', contact: 'contact', widget: 'contact',
  ui: 'labels', seo: 'seo', privacy: 'seo',
} as const

/** Réglages complets (destinataire, modèles…) : réservés à l'administration. */
export default defineEventHandler(async (event) => {
  const admin = await requireAdmin(event)
  const settings = await loadSettings(useDb())
  const smtp = useServerConfig().smtp
  const visibleSettings = Object.fromEntries(SETTINGS_KEYS.map((key) => {
    const allowed = admin.role === 'superadmin' || admin.permissions.some((grant) => grant.module === sectionModules[key])
    return [key, resolveSettingsSection(key, allowed ? settings[key] : DEFAULT_SETTINGS[key])]
  }))
  return {
    settings: visibleSettings,
    status: {
      smtpConfigured: isSmtpConfigured(),
      smtpHost: admin.role === 'superadmin' || admin.permissions.some((grant) => grant.module === 'contact') ? smtp.host || null : null,
      cloudinaryConfigured: admin.role === 'superadmin' || admin.permissions.some((grant) => grant.module === 'media') ? isCloudinaryConfigured() : false,
    },
  }
})
