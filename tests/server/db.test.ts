import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import { ENTITY_DEFAULTS } from '../../shared/schemas/entities'
import { DEFAULT_SETTINGS } from '../../shared/schemas/settings'
import type { Database } from '../../server/db/client'
import { createRow, deleteRow, getRow, listRows, publicIdsOfRow, reorderRows, updateRow } from '../../server/db/repositories/content'
import { deleteCategory, ensureCategory, listCategories, updateCategory } from '../../server/db/repositories/categories'
import {
  addAdminRecoveryCodes, consumeAdminRecoveryCode, createAdmin, createSession, deleteAdminUser, deleteSessionByHash,
  findAdminByEmail, findValidSession, updateAdminAccess,
} from '../../server/db/repositories/admin'
import { createMessage, listMessages, purgeOldMessages, updateMessageStatus } from '../../server/db/repositories/messages'
import { hitRateLimit } from '../../server/db/repositories/rate-limit'
import { loadSettings, saveSettingsSection } from '../../server/db/repositories/settings'
import { loadDashboardStats } from '../../server/db/repositories/stats'
import { siteSettings } from '../../server/db/schema'
import { createTestDb } from '../helpers/db'

let db: Database
let close: () => Promise<void>

beforeAll(async () => {
  ;({ db, close } = await createTestDb())
})
afterAll(async () => close())

describe('migrations et contenu', () => {
  it('crée un projet avec slug unique et ne publie pas les brouillons', async () => {
    const a = await createRow(db, 'projects', { ...ENTITY_DEFAULTS.projects, title: 'Mon projet', slug: '', status: 'draft' })
    const b = await createRow(db, 'projects', { ...ENTITY_DEFAULTS.projects, title: 'Mon projet', slug: '', status: 'published' })
    expect(a.slug).toBe('mon-projet')
    expect(b.slug).toBe('mon-projet-2')
    const publicRows = await listRows(db, 'projects', { publicOnly: true })
    expect(publicRows.map((r) => r.id)).toEqual([b.id])
    expect((await listRows(db, 'projects')).length).toBe(2)
  })

  it('met à jour, réordonne et supprime', async () => {
    const rows = await listRows(db, 'projects')
    const ids = rows.map((r) => r.id).reverse()
    await reorderRows(db, 'projects', ids)
    expect((await listRows(db, 'projects')).map((r) => r.id)).toEqual(ids)
    const updated = await updateRow(db, 'projects', ids[0]!, { featured: true, title: 'Nouveau titre' })
    expect(updated?.featured).toBe(true)
    expect(await deleteRow(db, 'projects', ids[0]!)).toBe(true)
    expect(await getRow(db, 'projects', ids[0]!)).toBeNull()
  })

  it('gère les catégories : création unique, renommage en cascade, suppression sans perte de fiche', async () => {
    const created = await ensureCategory(db, 'skills', 'Interface')
    expect((await ensureCategory(db, 'skills', 'Interface'))?.id).toBe(created?.id)
    const skill = await createRow(db, 'skills', { ...ENTITY_DEFAULTS.skills, name: 'Vue', slug: '', category: 'Interface' })
    await updateCategory(db, created!.id, { name: 'Front-end' })
    expect((await getRow(db, 'skills', skill.id))?.category).toBe('Front-end')
    expect((await listCategories(db, 'skills')).map((c) => c.name)).toEqual(['Front-end'])
    expect(await deleteCategory(db, created!.id)).toEqual({ detached: 1 })
    expect((await getRow(db, 'skills', skill.id))?.category).toBe('')
    expect(await ensureCategory(db, 'projects', '   ')).toBeNull()
  })

  it('référence les images Cloudinary (champs + galerie)', async () => {
    const row = await createRow(db, 'projects', { ...ENTITY_DEFAULTS.projects, title: 'Img', slug: '', coverPublicId: 'portfolio/a', gallery: [{ url: 'https://x.test/b.jpg', publicId: 'portfolio/b' }] })
    expect(publicIdsOfRow('projects', row).sort()).toEqual(['portfolio/a', 'portfolio/b'])
  })
})

describe('réglages, auth, messages, limitation', () => {
  it('garantit un seul ensemble de réglages cohérent', async () => {
    expect((await loadSettings(db)).theme.accent).toBe(DEFAULT_SETTINGS.theme.accent)
    await saveSettingsSection(db, 'theme', { ...DEFAULT_SETTINGS.theme, accent: '#ff0000' })
    await saveSettingsSection(db, 'theme', { ...DEFAULT_SETTINGS.theme, accent: '#00ff00' })
    expect((await loadSettings(db)).theme.accent).toBe('#00ff00')
    expect((await db.select().from(siteSettings)).length).toBe(1)
    await expect(db.insert(siteSettings).values({ id: 2 })).rejects.toThrow()
  })

  it('crée un administrateur et une session invalidable', async () => {
    const admin = await createAdmin(db, { email: 'Admin@Example.com', passwordHash: 'hash' })
    expect(admin.role).toBe('superadmin')
    expect((await findAdminByEmail(db, 'admin@example.com'))?.id).toBe(admin.id)
    await createSession(db, { adminId: admin.id, tokenHash: 'abc', expiresAt: new Date(Date.now() + 60_000) })
    expect((await findValidSession(db, 'abc'))?.admin.email).toBe('admin@example.com')
    await createSession(db, { adminId: admin.id, tokenHash: 'old', expiresAt: new Date(Date.now() - 1000) })
    expect(await findValidSession(db, 'old')).toBeNull()
    await deleteSessionByHash(db, 'abc')
    expect(await findValidSession(db, 'abc')).toBeNull()
  })

  it('protège le dernier super administrateur, révoque les sessions lors d’un changement de droits et consomme un code de secours une fois', async () => {
    const root = await findAdminByEmail(db, 'admin@example.com')
    expect(root?.role).toBe('superadmin')
    const editor = await createAdmin(db, {
      email: 'editor@example.com', passwordHash: 'hash', role: 'editor',
      permissions: [{ module: 'projects', access: 'read' }, { module: 'security', access: 'write' }],
    })
    await createSession(db, { adminId: editor.id, tokenHash: 'editor-session', expiresAt: new Date(Date.now() + 60_000) })
    const updated = await updateAdminAccess(db, editor.id, {
      role: 'admin', permissions: [{ module: 'skills', access: 'write' }, { module: 'security', access: 'write' }],
    })
    expect(updated.row?.permissions).toHaveLength(2)
    expect(await findValidSession(db, 'editor-session')).toBeNull()
    expect((await updateAdminAccess(db, root!.id, { role: 'admin', permissions: [] })).lastSuperadmin).toBe(true)
    expect((await deleteAdminUser(db, root!.id)).lastSuperadmin).toBe(true)
    await addAdminRecoveryCodes(db, editor.id, ['hash-once'])
    expect(await consumeAdminRecoveryCode(db, editor.id, 'hash-once')).toBe(true)
    expect(await consumeAdminRecoveryCode(db, editor.id, 'hash-once')).toBe(false)
  })

  it('stocke, marque et purge les messages', async () => {
    const m = await createMessage(db, { name: 'A', email: 'a@b.co', message: 'Bonjour le monde', source: 'form', emailStatus: 'not_configured' })
    expect(m.status).toBe('new')
    expect(await updateMessageStatus(db, m.id, 'read')).toBe(true)
    expect((await listMessages(db, 'read')).length).toBe(1)
    expect(await purgeOldMessages(db, 0)).toBe(0)
    expect(await purgeOldMessages(db, 1)).toBe(0)
  })

  it('limite la fréquence par fenêtre', async () => {
    expect(await hitRateLimit(db, 'k', 60)).toBe(1)
    expect(await hitRateLimit(db, 'k', 60)).toBe(2)
    expect(await hitRateLimit(db, 'k', 60)).toBe(3)
    expect(await hitRateLimit(db, 'autre', 60)).toBe(1)
  })

  it('calcule les statistiques du tableau de bord à partir des données réelles', async () => {
    await createRow(db, 'projects', { ...ENTITY_DEFAULTS.projects, title: 'Publié', slug: '', status: 'published' })
    const stats = await loadDashboardStats(db)
    expect(stats.projectsPublished).toBe(1)
    expect(stats.projectsDraft).toBe(2)
    expect(stats.unreadMessages).toBe(0)
    expect(stats.lastModifiedAt).not.toBeNull()
  })
})
