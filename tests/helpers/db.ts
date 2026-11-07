import { fileURLToPath } from 'node:url'
import { PGlite } from '@electric-sql/pglite'
import { drizzle } from 'drizzle-orm/pglite'
import { migrate } from 'drizzle-orm/pglite/migrator'
import type { Database } from '../../server/db/client'
import * as schema from '../../server/db/schema'

/** Base PostgreSQL en mémoire (PGlite) avec les migrations réelles du dépôt appliquées. */
export async function createTestDb(): Promise<{ db: Database; close: () => Promise<void> }> {
  const client = new PGlite()
  const db = drizzle(client, { schema })
  await migrate(db, { migrationsFolder: fileURLToPath(new URL('../../drizzle', import.meta.url)) })
  return { db: db as unknown as Database, close: () => client.close() }
}
