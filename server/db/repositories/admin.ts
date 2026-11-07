import { and, count, desc, eq, gt, lt, ne, sql } from 'drizzle-orm'
import { DEFAULT_ADMIN_PERMISSIONS, type AdminPermissionGrant, type AdminRole } from '../../../shared/admin-permissions'
import type { Database } from '../client'
import { adminAuditLogs, adminRecoveryCodes, adminSessions, adminUsers } from '../schema'

export type AdminUserRow = typeof adminUsers.$inferSelect

export async function findAdminByEmail(db: Database, email: string): Promise<AdminUserRow | null> {
  const [row] = await db.select().from(adminUsers).where(eq(adminUsers.email, email.trim().toLowerCase())).limit(1)
  return row ?? null
}

export async function countAdmins(db: Database): Promise<number> {
  const [row] = await db.select({ value: count() }).from(adminUsers)
  return row?.value ?? 0
}

export async function createAdmin(db: Database, input: { email: string; passwordHash: string; role?: AdminRole; permissions?: AdminPermissionGrant[] }): Promise<AdminUserRow> {
  const firstAdmin = (await countAdmins(db)) === 0
  const role = input.role ?? (firstAdmin ? 'superadmin' : 'admin')
  const permissions = input.permissions ?? (role === 'superadmin' ? DEFAULT_ADMIN_PERMISSIONS : [{ module: 'security' as const, access: 'write' as const }])
  const [row] = await db.insert(adminUsers).values({ email: input.email.trim().toLowerCase(), passwordHash: input.passwordHash, role, permissions }).returning()
  if (!row) throw new Error('Création de l’administrateur impossible')
  return row
}

export async function touchLastLogin(db: Database, id: number): Promise<void> {
  await db.update(adminUsers).set({ lastLoginAt: new Date(), updatedAt: new Date() }).where(eq(adminUsers.id, id))
}

export async function createSession(db: Database, input: { adminId: number; tokenHash: string; expiresAt: Date; userAgent?: string | null }) {
  const [row] = await db.insert(adminSessions).values({ adminId: input.adminId, tokenHash: input.tokenHash, expiresAt: input.expiresAt, userAgent: input.userAgent?.slice(0, 300) ?? null }).returning()
  if (!row) throw new Error('Création de session impossible')
  return row
}

/** Session valide (non expirée) et administrateur associé, à partir du hachage du jeton. */
export async function findValidSession(db: Database, tokenHash: string) {
  const [row] = await db
    .select({ session: adminSessions, admin: adminUsers })
    .from(adminSessions)
    .innerJoin(adminUsers, eq(adminSessions.adminId, adminUsers.id))
    .where(and(eq(adminSessions.tokenHash, tokenHash), gt(adminSessions.expiresAt, new Date())))
    .limit(1)
  return row ?? null
}

export async function touchSession(db: Database, id: string): Promise<void> {
  await db.update(adminSessions).set({ lastUsedAt: new Date() }).where(eq(adminSessions.id, id))
}

export async function deleteSessionByHash(db: Database, tokenHash: string): Promise<void> {
  await db.delete(adminSessions).where(eq(adminSessions.tokenHash, tokenHash))
}

export async function deleteSessionsForAdmin(db: Database, adminId: number): Promise<void> {
  await db.delete(adminSessions).where(eq(adminSessions.adminId, adminId))
}

export async function purgeExpiredSessions(db: Database): Promise<void> {
  await db.delete(adminSessions).where(lt(adminSessions.expiresAt, new Date()))
}

export async function findAdminById(db: Database, id: number): Promise<AdminUserRow | null> {
  const [row] = await db.select().from(adminUsers).where(eq(adminUsers.id, id)).limit(1)
  return row ?? null
}

export async function updateAdminPassword(db: Database, id: number, passwordHash: string): Promise<void> {
  await db.update(adminUsers).set({ passwordHash, updatedAt: new Date() }).where(eq(adminUsers.id, id))
}

export async function setAdminTotp(db: Database, id: number, input: { secret: string | null; enabled: boolean }): Promise<void> {
  await db.update(adminUsers).set({ totpSecret: input.secret, totpEnabled: input.enabled, updatedAt: new Date() }).where(eq(adminUsers.id, id))
}

export async function listAdminUsers(db: Database) {
  return db.select({
    id: adminUsers.id, email: adminUsers.email, role: adminUsers.role, permissions: adminUsers.permissions,
    totpEnabled: adminUsers.totpEnabled, createdAt: adminUsers.createdAt, lastLoginAt: adminUsers.lastLoginAt,
  }).from(adminUsers).orderBy(adminUsers.id)
}

export async function updateAdminAccess(db: Database, id: number, input: { role: AdminRole; permissions: AdminPermissionGrant[] }): Promise<{ row: AdminUserRow | null; lastSuperadmin: boolean }> {
  const current = await findAdminById(db, id)
  if (!current) return { row: null, lastSuperadmin: false }
  if (current.role === 'superadmin' && input.role !== 'superadmin') {
    const [row] = await db.select({ value: count() }).from(adminUsers).where(eq(adminUsers.role, 'superadmin'))
    if ((row?.value ?? 0) <= 1) return { row: null, lastSuperadmin: true }
  }
  const [row] = await db.update(adminUsers).set({ ...input, updatedAt: new Date() }).where(eq(adminUsers.id, id)).returning()
  if (row && (row.role !== current.role || JSON.stringify(row.permissions) !== JSON.stringify(current.permissions))) {
    await deleteSessionsForAdmin(db, id)
  }
  return { row: row ?? null, lastSuperadmin: false }
}

export async function deleteAdminUser(db: Database, id: number): Promise<{ deleted: boolean; lastSuperadmin: boolean }> {
  const target = await findAdminById(db, id)
  if (!target) return { deleted: false, lastSuperadmin: false }
  if (target.role === 'superadmin' && await db.select({ id: adminUsers.id }).from(adminUsers).where(eq(adminUsers.role, 'superadmin')).then((rows) => rows.length) <= 1) {
    return { deleted: false, lastSuperadmin: true }
  }
  await db.delete(adminUsers).where(eq(adminUsers.id, id))
  return { deleted: true, lastSuperadmin: false }
}

export async function addAdminRecoveryCodes(db: Database, adminId: number, hashes: string[]): Promise<void> {
  await db.delete(adminRecoveryCodes).where(eq(adminRecoveryCodes.adminId, adminId))
  if (hashes.length) await db.insert(adminRecoveryCodes).values(hashes.map((codeHash) => ({ adminId, codeHash })))
}

export async function consumeAdminRecoveryCode(db: Database, adminId: number, codeHash: string): Promise<boolean> {
  const rows = await db.update(adminRecoveryCodes).set({ usedAt: new Date() })
    .where(and(eq(adminRecoveryCodes.adminId, adminId), eq(adminRecoveryCodes.codeHash, codeHash), sql`${adminRecoveryCodes.usedAt} is null`))
    .returning({ id: adminRecoveryCodes.id })
  return rows.length === 1
}

export async function writeAdminAuditLog(db: Database, input: {
  actorId: number | null
  action: string
  target?: string
  details?: Record<string, string | number | boolean | null>
}): Promise<void> {
  await db.insert(adminAuditLogs).values({ actorId: input.actorId, action: input.action, target: input.target ?? '', details: input.details ?? {} })
  await db.delete(adminAuditLogs).where(sql`${adminAuditLogs.createdAt} < now() - interval '365 days'`)
}

export async function listAdminAuditLogs(db: Database, limit = 100) {
  return db.select({
    id: adminAuditLogs.id, actorId: adminAuditLogs.actorId, actorEmail: adminUsers.email,
    action: adminAuditLogs.action, target: adminAuditLogs.target, details: adminAuditLogs.details, createdAt: adminAuditLogs.createdAt,
  }).from(adminAuditLogs).leftJoin(adminUsers, eq(adminAuditLogs.actorId, adminUsers.id))
    .orderBy(desc(adminAuditLogs.createdAt)).limit(Math.min(Math.max(limit, 1), 200))
}

export async function listAdminSessions(db: Database, adminId: number) {
  return db.select({ id: adminSessions.id, userAgent: adminSessions.userAgent, createdAt: adminSessions.createdAt, lastUsedAt: adminSessions.lastUsedAt, expiresAt: adminSessions.expiresAt })
    .from(adminSessions).where(and(eq(adminSessions.adminId, adminId), gt(adminSessions.expiresAt, new Date()))).orderBy(desc(adminSessions.lastUsedAt))
}

/** Révoque toutes les sessions de l'administrateur sauf la courante. */
export async function deleteOtherSessions(db: Database, adminId: number, keepSessionId: string): Promise<number> {
  const rows = await db.delete(adminSessions).where(and(eq(adminSessions.adminId, adminId), ne(adminSessions.id, keepSessionId))).returning({ id: adminSessions.id })
  return rows.length
}
