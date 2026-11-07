/** État de configuration (booléens uniquement, jamais de valeurs ni de secrets). */
export default defineEventHandler(() => ({
  ok: true,
  database: isDatabaseConfigured(),
  cloudinary: isCloudinaryConfigured(),
  smtp: isSmtpConfigured(),
  sessionSecret: useServerConfig().sessionSecret.length >= 32,
}))
