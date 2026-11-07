/** Vérifie la présence des variables d'environnement (sans jamais afficher leur valeur). */
const rows: [string, boolean, string][] = [
  ['DATABASE_URL', Boolean(process.env.DATABASE_URL), 'obligatoire'],
  ['NUXT_SESSION_PASSWORD (≥ 32 car.)', (process.env.NUXT_SESSION_PASSWORD ?? '').length >= 32, 'obligatoire'],
  ['NUXT_SUPERADMIN_OWNER_EMAIL', Boolean(process.env.NUXT_SUPERADMIN_OWNER_EMAIL?.trim()), 'obligatoire'],
  ['CLOUDINARY_CLOUD_NAME', Boolean(process.env.CLOUDINARY_CLOUD_NAME), 'images'],
  ['CLOUDINARY_API_KEY', Boolean(process.env.CLOUDINARY_API_KEY), 'images'],
  ['CLOUDINARY_API_SECRET', Boolean(process.env.CLOUDINARY_API_SECRET), 'images'],
  ['SMTP_HOST', Boolean(process.env.SMTP_HOST), 'e-mail'],
  ['SMTP_FROM', Boolean(process.env.SMTP_FROM), 'e-mail'],
]
for (const [name, ok, scope] of rows) console.log(`${ok ? '✔' : '✖'} ${name.padEnd(36)} ${scope}`)
process.exitCode = rows.some(([, ok, scope]) => !ok && scope === 'obligatoire') ? 1 : 0
