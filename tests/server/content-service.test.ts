import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest'
import { ENTITY_DEFAULTS } from '../../shared/schemas/entities'
import type { Database } from '../../server/db/client'
import { createRow, getRow } from '../../server/db/repositories/content'
import { EntityRuleError, applyEntityRules, cleanupOrphanedAssets, parseCreateInput, parsePatchInput, patchEntity, removeEntity } from '../../server/services/content'
import { createTestDb } from '../helpers/db'

let db: Database
let close: () => Promise<void>
beforeAll(async () => { ;({ db, close } = await createTestDb()) })
afterAll(async () => close())

describe('CRUD générique', () => {
  it('génère le slug à la création et conserve les champs omis à la modification', async () => {
    const parsed = parseCreateInput('projects', { title: 'Mon Grand Projet' })
    expect(parsed.success && (parsed.data as { slug: string }).slug).toBe('mon-grand-projet')
    const row = await createRow(db, 'projects', { ...ENTITY_DEFAULTS.projects, title: 'A', slug: '', shortDescription: 'conservée', status: 'published' })
    const patch = parsePatchInput('projects', { featured: true })
    expect(patch.success).toBe(true)
    await patchEntity(db, 'projects', row.id, (patch.success ? patch.data : {}) as Record<string, unknown>, async () => true)
    const after = await getRow(db, 'projects', row.id)
    expect(after).toMatchObject({ featured: true, shortDescription: 'conservée', status: 'published' })
  })

  it('applique les règles de dates et « en cours »', () => {
    expect(() => applyEntityRules('education', { startDate: '2022-01-01', endDate: '2021-01-01' })).toThrow(EntityRuleError)
    expect(applyEntityRules('experiences', { startDate: '2022-01-01', endDate: '2023-01-01', isCurrent: true }).endDate).toBeNull()
    expect(() => applyEntityRules('certifications', { issuedAt: '2022-01-01', expiresAt: '2020-01-01' })).toThrow(EntityRuleError)
  })

  it('supprime l’image Cloudinary remplacée, sauf si une autre fiche la référence encore', async () => {
    const shared = 'portfolio/projects/partagee'
    const a = await createRow(db, 'projects', { ...ENTITY_DEFAULTS.projects, title: 'P1', slug: '', coverImageUrl: 'https://res.cloudinary.com/x/image/upload/v1/a.jpg', coverPublicId: shared })
    await createRow(db, 'projects', { ...ENTITY_DEFAULTS.projects, title: 'P2', slug: '', coverImageUrl: 'https://res.cloudinary.com/x/image/upload/v1/a.jpg', coverPublicId: shared })
    const destroy = vi.fn(async () => true)
    await patchEntity(db, 'projects', a.id, { coverImageUrl: null, coverPublicId: null }, destroy)
    expect(destroy).not.toHaveBeenCalled()
    const lone = await createRow(db, 'projects', { ...ENTITY_DEFAULTS.projects, title: 'P3', slug: '', coverImageUrl: 'https://res.cloudinary.com/x/image/upload/v1/b.jpg', coverPublicId: 'portfolio/projects/seule' })
    expect(await removeEntity(db, 'projects', lone.id, destroy)).toBe(true)
    expect(destroy).toHaveBeenCalledWith('portfolio/projects/seule')
    expect(await cleanupOrphanedAssets(db, [shared], destroy)).toEqual([])
  })
})
