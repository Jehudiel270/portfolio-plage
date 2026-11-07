import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import { ENTITY_DEFAULTS } from '../../shared/schemas/entities'
import { DEFAULT_SETTINGS, type SiteSettings } from '../../shared/schemas/settings'
import type { Database } from '../../server/db/client'
import { createRow } from '../../server/db/repositories/content'
import { saveSettingsSection } from '../../server/db/repositories/settings'
import { buildDemoPortfolio, buildPublicPortfolio, composePortfolio } from '../../server/services/portfolio'
import { createTestDb } from '../helpers/db'

let db: Database
let close: () => Promise<void>
beforeAll(async () => { ;({ db, close } = await createTestDb()) })
afterAll(async () => close())

describe('portfolio public', () => {
  it('le contenu de secours est clairement marqué démo et complet', () => {
    const demo = buildDemoPortfolio({ emailConfigured: false })
    expect(demo.meta.source).toBe('demo-fallback')
    expect(demo.sections).toEqual(['about', 'projects', 'skills', 'journey', 'contact'])
    expect(demo.journeyTabs).toEqual(['experiences', 'education', 'certifications', 'achievements'])
    expect(demo.nav.map((n) => n.id)).toEqual(['hero', 'about', 'projects', 'skills', 'journey', 'contact'])
    expect([...demo.skills, ...demo.projects, ...demo.education].every((x) => x.isDemo)).toBe(true)
    expect(demo.categories.skills.map((c) => c.name)).toContain('Interface')
  })

  it('n’expose jamais le destinataire ni les modèles d’e-mail et fusionne les textes de l’interface', () => {
    const demo = buildDemoPortfolio({ emailConfigured: true })
    const json = JSON.stringify(demo)
    for (const secret of ['recipientEmail', 'emailSubjectTemplate', 'emailBodyTemplate']) expect(json).not.toContain(secret)
    expect(demo.settings.labels['projects.explore']).toBe('Explorer en 3D')
  })

  it('retire du menu les sections désactivées ; le contact pointe vers /contact si la scène finale est retirée', () => {
    const input = { ...DEFAULT_SETTINGS, sections: { ...DEFAULT_SETTINGS.sections, skills: { ...DEFAULT_SETTINGS.sections.skills, enabled: false }, contact: { ...DEFAULT_SETTINGS.sections.contact, enabled: false } } } satisfies SiteSettings
    const base = { categories: [], skills: [], projects: [], education: [], experiences: [], certifications: [], achievements: [] }
    const composed = composePortfolio({ settings: input, ...base, meta: { source: 'database', databaseConfigured: true, preview: false, emailConfigured: false } })
    expect(composed.sections).toEqual(['about'])
    expect(composed.nav.map((n) => [n.id, n.href])).toEqual([['hero', '/'], ['about', '/a-propos'], ['contact', '/contact']])
  })

  it('range les formations par date décroissante, même saisies à l’envers, sauf choix « manuel »', async () => {
    const make = (title: string, startDate: string, sortOrder: number) => createRow(db, 'education', { ...ENTITY_DEFAULTS.education, title, institution: 'École', startDate, sortOrder })
    await make('Récent', '2023-09-01', 0)
    await make('Milieu', '2019-09-01', 1)
    await make('Ancien (saisi en dernier)', '2015-09-01', 2)
    const byDate = await buildPublicPortfolio(db, { preview: false, emailConfigured: false })
    expect(byDate.education.map((e) => e.title)).toEqual(['Récent', 'Milieu', 'Ancien (saisi en dernier)'])
    await saveSettingsSection(db, 'display', { ...DEFAULT_SETTINGS.display, timelineOrder: 'manual' })
    await make('Plus ancien encore', '2010-01-01', -0)
    const manual = await buildPublicPortfolio(db, { preview: false, emailConfigured: false })
    expect(manual.education[0]?.title).toBe('Récent')
    await saveSettingsSection(db, 'display', DEFAULT_SETTINGS.display)
  })

  it('associe une icône aux technologies : compétence du même nom d’abord, sinon bibliothèque', async () => {
    await createRow(db, 'skills', { ...ENTITY_DEFAULTS.skills, name: 'Nuxt', slug: '', icon: 'lucide:Code' })
    await createRow(db, 'projects', { ...ENTITY_DEFAULTS.projects, title: 'P', slug: '', status: 'published', technologies: ['Nuxt', 'Vue.js', 'Inconnu maison'] })
    const live = await buildPublicPortfolio(db, { preview: false, emailConfigured: false })
    const tech = live.projects.find((p) => p.title === 'P')!.technologies
    expect(tech[0]?.icon).toEqual({ type: 'lucide', name: 'Code' })
    expect(tech[1]?.icon).toMatchObject({ type: 'brand', slug: 'vuedotjs' })
    expect(tech[2]?.icon).toBeNull()
  })

  it('lit Neon : brouillons et éléments masqués jamais publics, visibles en aperçu administrateur', async () => {
    await createRow(db, 'projects', { ...ENTITY_DEFAULTS.projects, title: 'Brouillon', slug: '', status: 'draft' })
    await createRow(db, 'skills', { ...ENTITY_DEFAULTS.skills, name: 'Masquée', slug: '', visible: false })
    await createRow(db, 'achievements', { ...ENTITY_DEFAULTS.achievements, title: 'Langue : français', category: 'Langue' })
    await saveSettingsSection(db, 'journey', { ...DEFAULT_SETTINGS.journey, hiddenAchievementCategories: ['langue'] })
    const live = await buildPublicPortfolio(db, { preview: false, emailConfigured: false })
    expect(live.projects.map((p) => p.title)).not.toContain('Brouillon')
    expect(live.skills.map((s) => s.name)).not.toContain('Masquée')
    expect(live.achievements).toHaveLength(0)
    expect(live.journeyTabs).not.toContain('achievements')
    const preview = await buildPublicPortfolio(db, { preview: true, emailConfigured: false })
    expect(preview.projects.find((p) => p.title === 'Brouillon')?.hidden).toBe(true)
    expect(preview.skills.find((s) => s.name === 'Masquée')?.hidden).toBe(true)
  })
})
