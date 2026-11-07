import { sql } from 'drizzle-orm'
import type { Database } from '../client'
import { rateLimits } from '../schema'

/**
 * Compteur à fenêtre fixe, atomique (un seul upsert) et partagé entre instances serverless.
 * Retourne le nombre de tentatives dans la fenêtre courante, celle-ci incluse.
 */
export async function hitRateLimit(db: Database, key: string, windowSeconds: number): Promise<number> {
  const expired = sql`${rateLimits.windowStart} < now() - (${windowSeconds}::int * interval '1 second')`
  const [row] = await db
    .insert(rateLimits)
    .values({ key, count: 1 })
    .onConflictDoUpdate({
      target: rateLimits.key,
      set: {
        count: sql`case when ${expired} then 1 else ${rateLimits.count} + 1 end`,
        windowStart: sql`case when ${expired} then now() else ${rateLimits.windowStart} end`,
      },
    })
    .returning({ count: rateLimits.count })
  return row?.count ?? 1
}

export async function resetRateLimit(db: Database, key: string): Promise<void> {
  await db.delete(rateLimits).where(sql`${rateLimits.key} = ${key}`)
}

/** Nettoyage opportuniste des compteurs périmés (au-delà de 24 h). */
export async function purgeStaleRateLimits(db: Database): Promise<void> {
  await db.delete(rateLimits).where(sql`${rateLimits.windowStart} < now() - interval '24 hours'`)
}
