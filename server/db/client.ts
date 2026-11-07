import { neon } from '@neondatabase/serverless'
import { drizzle } from 'drizzle-orm/neon-http'
import type { PgDatabase, PgQueryResultHKT } from 'drizzle-orm/pg-core'
import * as schema from './schema'

/** Type de base de données indépendant du pilote (Neon HTTP en production, PGlite en test). */
export type Database = PgDatabase<PgQueryResultHKT, typeof schema>

/** Crée un client Drizzle sur Neon (HTTP, adapté aux environnements serverless). Jamais appelé côté navigateur. */
export function createDb(connectionString: string): Database {
  const client = neon(connectionString)
  return drizzle({ client, schema })
}

export { schema }
