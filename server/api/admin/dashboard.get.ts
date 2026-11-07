import { DEFAULT_CONTENT } from '../../../shared/schemas/settings'
import { loadSettings } from '../../db/repositories/settings'
import { loadDashboardStats } from '../../db/repositories/stats'
import { countDemoRows } from '../../services/demo'

export default defineEventHandler(async () => {
  const db = useDb()
  const [stats, settings, demoRows] = await Promise.all([loadDashboardStats(db), loadSettings(db), countDemoRows(db)])
  return {
    stats,
    theme: settings.theme,
    identity: { name: settings.content.name, customized: settings.content.name !== DEFAULT_CONTENT.name },
    demoRows,
    config: {
      database: true,
      cloudinary: isCloudinaryConfigured(),
      smtp: isSmtpConfigured(),
      sessionSecret: useServerConfig().sessionSecret.length >= 32,
      recipient: Boolean(settings.contact.recipientEmail ?? settings.content.publicEmail),
      whatsapp: Boolean(settings.contact.whatsappNumber),
      channelMode: settings.contact.channelMode,
    },
  }
})
