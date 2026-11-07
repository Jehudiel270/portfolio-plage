import { fileURLToPath } from 'node:url'
import { neon } from '@neondatabase/serverless'
import { drizzle } from 'drizzle-orm/neon-http'
import { migrate } from 'drizzle-orm/neon-http/migrator'

const url = process.env.DATABASE_URL
if (!url) {
  console.error('✖ DATABASE_URL est absente (voir .env.example).')
  process.exit(1)
}

const db = drizzle({ client: neon(url) })
const folder = fileURLToPath(new URL('../drizzle', import.meta.url))
console.log('→ Application des migrations depuis', folder)
await migrate(db, { migrationsFolder: folder })
console.log('✔ Base de données à jour. Configurez NUXT_SUPERADMIN_OWNER_EMAIL puis créez son compte avec pnpm admin:create.')
