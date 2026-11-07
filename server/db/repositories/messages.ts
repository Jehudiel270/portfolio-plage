import { count, desc, eq, lt } from 'drizzle-orm'
import type { MessageStatus } from '../../../shared/constants'
import type { Database } from '../client'
import { contactMessages } from '../schema'

export type ContactMessageRow = typeof contactMessages.$inferSelect

export async function createMessage(db: Database, input: typeof contactMessages.$inferInsert): Promise<ContactMessageRow> {
  const [row] = await db.insert(contactMessages).values(input).returning()
  if (!row) throw new Error('Enregistrement du message impossible')
  return row
}

export async function listMessages(db: Database, status?: MessageStatus): Promise<ContactMessageRow[]> {
  const query = db.select().from(contactMessages)
  return (status ? query.where(eq(contactMessages.status, status)) : query).orderBy(desc(contactMessages.createdAt), desc(contactMessages.id)).limit(500)
}

export async function updateMessageStatus(db: Database, id: number, status: MessageStatus): Promise<boolean> {
  const rows = await db.update(contactMessages).set({ status, readAt: status === 'new' ? null : new Date() }).where(eq(contactMessages.id, id)).returning({ id: contactMessages.id })
  return rows.length > 0
}

export async function deleteMessage(db: Database, id: number): Promise<boolean> {
  const rows = await db.delete(contactMessages).where(eq(contactMessages.id, id)).returning({ id: contactMessages.id })
  return rows.length > 0
}

/** Politique de conservation : supprime les messages plus anciens que `days` jours (0 = conservation illimitée). */
export async function purgeOldMessages(db: Database, days: number): Promise<number> {
  if (days <= 0) return 0
  const limit = new Date(Date.now() - days * 86_400_000)
  const rows = await db.delete(contactMessages).where(lt(contactMessages.createdAt, limit)).returning({ id: contactMessages.id })
  return rows.length
}

export async function countUnreadMessages(db: Database): Promise<number> {
  const [row] = await db.select({ value: count() }).from(contactMessages).where(eq(contactMessages.status, 'new'))
  return row?.value ?? 0
}

export async function updateEmailStatus(db: Database, id: number, emailStatus: ContactMessageRow['emailStatus']): Promise<void> {
  await db.update(contactMessages).set({ emailStatus }).where(eq(contactMessages.id, id))
}
