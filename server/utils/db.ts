import { createDb, type Database } from '../db/client'
import { apiError } from './errors'

let cached: { url: string; db: Database } | null = null

/** Client base de données (Neon). Lève une erreur 503 explicite si DATABASE_URL est absente. */
export function useDb(): Database {
  const { databaseUrl } = useServerConfig()
  if (!databaseUrl) throw apiError(503, 'DATABASE_NOT_CONFIGURED', 'La base de données n’est pas configurée (variable DATABASE_URL).')
  if (!cached || cached.url !== databaseUrl) cached = { url: databaseUrl, db: createDb(databaseUrl) }
  return cached.db
}
