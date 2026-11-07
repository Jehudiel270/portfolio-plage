/** Utilitaires communs aux scripts (exécutés avec `tsx --env-file=.env`). */
import { createDb, type Database } from '../server/db/client'

export function requireDatabase(): Database {
  const url = process.env.DATABASE_URL
  if (!url) {
    console.error('✖ DATABASE_URL est absente. Copiez .env.example en .env puis renseignez la chaîne de connexion Neon.')
    process.exit(1)
  }
  return createDb(url)
}
