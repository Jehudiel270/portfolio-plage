import type { SmtpConfig } from '../services/mailer'

/** Configuration serveur : la configuration runtime Nuxt est prioritaire, puis les variables classiques (DATABASE_URL, CLOUDINARY_*, SMTP_*). */
export interface ServerConfig {
  databaseUrl: string
  sessionSecret: string
  cloudinary: { cloudName: string; apiKey: string; apiSecret: string }
  smtp: SmtpConfig
  siteUrl: string
  isProduction: boolean
}

const first = (...values: (string | undefined)[]): string => values.find((v) => typeof v === 'string' && v.length > 0) ?? ''

export function useServerConfig(): ServerConfig {
  const rc = useRuntimeConfig()
  const env = process.env
  const smtpPort = Number.parseInt(first(rc.smtp.port, env.SMTP_PORT, '587'), 10)
  return {
    databaseUrl: first(rc.databaseUrl, env.DATABASE_URL),
    sessionSecret: first(rc.sessionPassword, env.NUXT_SESSION_PASSWORD),
    cloudinary: {
      cloudName: first(rc.cloudinary.cloudName, env.CLOUDINARY_CLOUD_NAME),
      apiKey: first(rc.cloudinary.apiKey, env.CLOUDINARY_API_KEY),
      apiSecret: first(rc.cloudinary.apiSecret, env.CLOUDINARY_API_SECRET),
    },
    smtp: {
      host: first(rc.smtp.host, env.SMTP_HOST),
      port: Number.isFinite(smtpPort) ? smtpPort : 587,
      secure: first(rc.smtp.secure, env.SMTP_SECURE).toLowerCase() === 'true',
      user: first(rc.smtp.user, env.SMTP_USER),
      password: first(rc.smtp.password, env.SMTP_PASSWORD),
      from: first(rc.smtp.from, env.SMTP_FROM),
    },
    siteUrl: first(rc.public.siteUrl as string, env.NUXT_PUBLIC_SITE_URL),
    isProduction: process.env.NODE_ENV === 'production',
  }
}

export const isDatabaseConfigured = (): boolean => useServerConfig().databaseUrl.length > 0
export const isCloudinaryConfigured = (): boolean => {
  const c = useServerConfig().cloudinary
  return Boolean(c.cloudName && c.apiKey && c.apiSecret)
}
export const isSmtpConfigured = (): boolean => {
  const s = useServerConfig().smtp
  return Boolean(s.host && s.from)
}
