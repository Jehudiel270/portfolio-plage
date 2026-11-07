import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest'
import { ENTITY_DEFAULTS } from '../../shared/schemas/entities'
import type { Database } from '../../server/db/client'
import { getRow, listRows } from '../../server/db/repositories/content'
import { listCategories } from '../../server/db/repositories/categories'
import { exportCsv, importCsvRows, importRows, runBulk } from '../../server/services/content'
import { parseCsv, toCsv } from '../../server/services/csv'
import { createTestDb } from '../helpers/db'

let db: Database
let close: () => Promise<void>
beforeAll(async () => { ;({ db, close } = await createTestDb()) })
afterAll(async () => close())
const noDestroy = vi.fn(async () => true)

describe('import et actions en masse', () => {
  it('ajoute des compétences en masse avec icône automatique et catégorie créée à la volée', async () => {
    const results = await importRows(db, 'skills', [{ name: 'TypeScript', category: 'Langages' }, { name: 'Vue.js', category: 'Langages' }, { name: 'Savoir-faire maison', category: 'Autres' }], { autoIcons: true })
    expect(results.every((r) => r.ok)).toBe(true)
    const rows = await listRows(db, 'skills')
    expect(rows.map((r) => r.icon)).toEqual(['si:typescript', 'si:vuedotjs', null])
    expect((await listCategories(db, 'skills')).map((c) => c.name).sort()).toEqual(['Autres', 'Langages'])
  })

  it('valide chaque ligne sans rien créer en mode aperçu', async () => {
    const before = (await listRows(db, 'projects')).length
    const results = await importRows(db, 'projects', [{ title: 'Valide' }, { title: '', liveUrl: 'javascript:alert(1)' }], { dryRun: true })
    expect(results.map((r) => r.ok)).toEqual([true, false])
    expect(results[1]?.errors).toBeTruthy()
    expect((await listRows(db, 'projects')).length).toBe(before)
  })

  it('applique publication, mise en avant, catégorie et suppression à plusieurs fiches', async () => {
    const created = await importRows(db, 'projects', [{ title: 'A' }, { title: 'B' }, { title: 'C' }])
    const ids = created.map((r) => r.id!)
    expect((await runBulk(db, 'projects', { action: 'publish', ids }, noDestroy)).affected).toBe(3)
    expect((await getRow(db, 'projects', ids[0]!))?.status).toBe('published')
    await runBulk(db, 'projects', { action: 'hide', ids: [ids[1]!] }, noDestroy)
    expect((await getRow(db, 'projects', ids[1]!))?.status).toBe('draft')
    await runBulk(db, 'projects', { action: 'feature', ids, value: true }, noDestroy)
    expect((await getRow(db, 'projects', ids[2]!))?.featured).toBe(true)
    await runBulk(db, 'projects', { action: 'category', ids, value: 'Site web' }, noDestroy)
    expect((await getRow(db, 'projects', ids[0]!))?.category).toBe('Site web')
    expect((await listCategories(db, 'projects')).map((c) => c.name)).toContain('Site web')
    expect((await runBulk(db, 'projects', { action: 'delete', ids }, noDestroy)).affected).toBe(3)
    await expect(runBulk(db, 'education', { action: 'category', ids: [1], value: 'x' }, noDestroy)).rejects.toThrow()
  })

  it('exporte et réimporte en CSV (listes, booléens) en neutralisant les formules de tableur', async () => {
    const [first] = await importRows(db, 'experiences', [{ organization: 'Studio', role: 'Dev', startDate: '2023-01-01', missions: ['A', 'B'], technologies: ['Nuxt'], isCurrent: true }])
    expect(first?.ok).toBe(true)
    const csv = exportCsv('experiences', await listRows(db, 'experiences'))
    expect(csv.startsWith('\uFEFF')).toBe(true)
    const rows = importCsvRows('experiences', csv)
    expect(rows[0]).toMatchObject({ organization: 'Studio', missions: ['A', 'B'], technologies: ['Nuxt'], isCurrent: true })
    const hostile = toCsv(['t'], [{ t: '=HYPERLINK("http://evil")' }, { t: '-5' }])
    expect(hostile).toContain(`'=HYPERLINK`)
    expect(parseCsv('a;b\r\n"x;y";"he said ""hi"""\r\n')).toEqual([['a', 'b'], ['x;y', 'he said "hi"']])
    expect(Object.keys(ENTITY_DEFAULTS.projects)).toContain('title')
  })
})
