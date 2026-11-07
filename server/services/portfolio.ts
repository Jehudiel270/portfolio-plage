import { asc, eq } from 'drizzle-orm'
import { CATEGORY_SCOPES, JOURNEY_TABS, SECTION_IDS, type CategoryScope, type JourneyTab, type NavTargetId, type SectionId } from '../../shared/constants'
import { DEMO_ACHIEVEMENTS, DEMO_CATEGORIES, DEMO_CERTIFICATIONS, DEMO_EDUCATION, DEMO_EXPERIENCES, DEMO_PROJECTS, DEMO_SKILLS } from '../../shared/demo/demo-content'
import type { ResolvedIcon } from '../../shared/icons'
import { DEFAULT_SETTINGS, normalizeContactSettings, resolveLabels, type SiteSettings } from '../../shared/schemas/settings'
import type {
  NavEntry, PortfolioMeta, PublicAchievement, PublicCategory, PublicCertification, PublicEducation, PublicExperience, PublicPortfolio,
  PublicProject, PublicSettings, PublicSkill, PublicTech,
} from '../../shared/types/portfolio'
import type { Database } from '../db/client'
import { listCategories, type CategoryRow } from '../db/repositories/categories'
import { loadSettings } from '../db/repositories/settings'
import { achievements, certifications, educationEntries, professionalExperiences, projects, skills } from '../db/schema'
import { findBrandIcon, resolveIcon } from './icons'

type SkillRow = typeof skills.$inferSelect
type ProjectRow = typeof projects.$inferSelect
type EducationRow = typeof educationEntries.$inferSelect
type ExperienceRow = typeof professionalExperiences.$inferSelect
type CertificationRow = typeof certifications.$inferSelect
type AchievementRow = typeof achievements.$inferSelect

export interface PortfolioInput {
  settings: SiteSettings
  categories: Pick<CategoryRow, 'scope' | 'name' | 'color' | 'icon' | 'sortOrder'>[]
  skills: SkillRow[]; projects: ProjectRow[]; education: EducationRow[]; experiences: ExperienceRow[]; certifications: CertificationRow[]; achievements: AchievementRow[]
  meta: Omit<PortfolioMeta, 'generatedAt'>
}

const iso = (date: Date): string => date.toISOString()
const hide = (visible: boolean): true | undefined => (visible ? undefined : true)

/** Une technologie reçoit l'icône de la compétence du même nom (personnalisable), sinon celle de la bibliothèque. */
function techResolver(skillRows: SkillRow[]): (names: string[]) => PublicTech[] {
  const own = new Map(skillRows.map((s) => [s.name.trim().toLowerCase(), resolveIcon(s.icon)]))
  return (names) => names.map((name): PublicTech => ({ name, icon: own.get(name.trim().toLowerCase()) ?? findBrandIcon(name) }))
}

const dateDesc = (a: string | null, b: string | null): number => (b ?? '').localeCompare(a ?? '')

/** Réglages exposés au navigateur : ni destinataire, ni modèles d'e-mail, ni surcharges brutes (textes déjà fusionnés dans `labels`). */
export function toPublicSettings(settings: SiteSettings): PublicSettings {
  const { recipientEmail: _r, emailSubjectTemplate: _s, emailBodyTemplate: _b, ...contact } = normalizeContactSettings(settings.contact)
  const { ui, ...rest } = settings
  return { ...rest, contact, labels: resolveLabels(ui) }
}

export function computeJourneyTabs(settings: SiteSettings, counts: Record<JourneyTab, number>, preview: boolean): JourneyTab[] {
  return settings.journey.order.filter((tab) => JOURNEY_TABS.includes(tab) && (settings.journey.tabs[tab].enabled || preview) && counts[tab] > 0)
}

export function computeSections(settings: SiteSettings, counts: Record<SectionId, number>, preview: boolean): SectionId[] {
  return SECTION_IDS.filter((id) => {
    const config = settings.sections[id]
    if (!config.enabled && !preview) return false
    if (id === 'contact') return true
    if (id === 'about') return settings.content.about.trim().length > 0 || preview
    return counts[id] > 0 || config.emptyBehavior === 'neutral'
  })
}

export function computeNav(settings: SiteSettings, sections: SectionId[]): NavEntry[] {
  const available = new Set<NavTargetId>(['hero', ...sections])
  const entries: NavEntry[] = []
  for (const item of settings.navigation.items) {
    if (!item.visible) continue
    if (item.id === 'contact' && !available.has('contact')) {
      if (settings.contact.pageEnabled) entries.push({ id: 'contact', label: item.label, href: '/contact' })
      continue
    }
    if (item.id === 'contact' && !settings.contact.pageEnabled) continue
    if (available.has(item.id)) {
      const routes: Record<NavTargetId, string> = {
        hero: '/', about: '/a-propos', projects: '/projets', skills: '/competences', journey: '/parcours', contact: '/contact',
      }
      entries.push({ id: item.id, label: item.label, href: routes[item.id] })
    }
  }
  return entries
}

export function composePortfolio(input: PortfolioInput): PublicPortfolio {
  const { settings, meta } = input
  const preview = meta.preview
  const tech = techResolver(input.skills)
  const byDate = settings.display.timelineOrder === 'date'

  const publicSkills: PublicSkill[] = input.skills.map((r) => ({
    id: r.id, isDemo: r.isDemo, hidden: hide(r.visible), name: r.name, slug: r.slug, description: r.description, category: r.category,
    icon: resolveIcon(r.icon), color: r.color, proficiency: r.proficiency, featured: r.featured, sortOrder: r.sortOrder,
  }))
  const publicProjects: PublicProject[] = input.projects.map((r) => ({
    id: r.id, isDemo: r.isDemo, hidden: hide(r.status === 'published'), title: r.title, slug: r.slug, shortDescription: r.shortDescription, description: r.description, problem: r.problem,
    features: r.features, category: r.category, technologies: tech(r.technologies), coverImageUrl: r.coverImageUrl, gallery: r.gallery, liveUrl: r.liveUrl,
    repositoryUrl: r.repositoryUrl, featured: r.featured, sortOrder: r.sortOrder, projectDate: r.projectDate, createdAt: iso(r.createdAt), color: r.color,
  }))
  const education: PublicEducation[] = input.education.map((r) => ({
    id: r.id, isDemo: r.isDemo, hidden: hide(r.visible), title: r.title, institution: r.institution, degree: r.degree, field: r.field, description: r.description,
    startDate: r.startDate, endDate: r.isCurrent ? null : r.endDate, isCurrent: r.isCurrent, achievements: r.achievements, imageUrl: r.imageUrl, url: r.url, featured: r.featured, sortOrder: r.sortOrder,
  }))
  const experiences: PublicExperience[] = input.experiences.map((r) => ({
    id: r.id, isDemo: r.isDemo, hidden: hide(r.visible), organization: r.organization, role: r.role, type: r.type as PublicExperience['type'], location: r.location,
    startDate: r.startDate, endDate: r.isCurrent ? null : r.endDate, isCurrent: r.isCurrent, description: r.description, missions: r.missions, results: r.results,
    technologies: tech(r.technologies), imageUrl: r.imageUrl, url: r.url, featured: r.featured, sortOrder: r.sortOrder,
  }))
  const certs: PublicCertification[] = input.certifications.map((r) => ({
    id: r.id, isDemo: r.isDemo, hidden: hide(r.visible), name: r.name, issuer: r.issuer, category: r.category, issuedAt: r.issuedAt, expiresAt: r.expiresAt,
    credentialId: r.credentialId, verificationUrl: r.verificationUrl, imageUrl: r.imageUrl, featured: r.featured, sortOrder: r.sortOrder,
  }))
  const hiddenCategories = new Set(settings.journey.hiddenAchievementCategories.map((c) => c.toLowerCase()))
  const achievementsOut: PublicAchievement[] = input.achievements
    .filter((r) => preview || !hiddenCategories.has(r.category.toLowerCase()))
    .map((r) => ({ id: r.id, isDemo: r.isDemo, hidden: hide(r.visible), title: r.title, category: r.category, description: r.description, achievedAt: r.achievedAt, linkUrl: r.linkUrl, icon: resolveIcon(r.icon), imageUrl: r.imageUrl, sortOrder: r.sortOrder }))

  // Ordre chronologique : le plus récent d'abord, quelle que soit la date de saisie (sauf choix « manuel » dans l'administration).
  if (byDate) {
    education.sort((a, b) => Number(b.isCurrent) - Number(a.isCurrent) || dateDesc(a.startDate, b.startDate))
    experiences.sort((a, b) => Number(b.isCurrent) - Number(a.isCurrent) || dateDesc(a.startDate, b.startDate))
    certs.sort((a, b) => dateDesc(a.issuedAt, b.issuedAt))
    achievementsOut.sort((a, b) => dateDesc(a.achievedAt, b.achievedAt))
  }

  const journeyCounts: Record<JourneyTab, number> = { experiences: experiences.length, education: education.length, certifications: certs.length, achievements: achievementsOut.length }
  const journeyTabs = computeJourneyTabs(settings, journeyCounts, preview)
  const sectionCounts: Record<SectionId, number> = { about: 0, projects: publicProjects.length, skills: publicSkills.length, journey: journeyTabs.length, contact: 0 }
  const sections = computeSections(settings, sectionCounts, preview)

  const categoriesOut = Object.fromEntries(CATEGORY_SCOPES.map((scope) => [scope, categoryList(scope, input.categories, { skills: publicSkills, projects: publicProjects, certifications: certs, achievements: achievementsOut })])) as Record<CategoryScope, PublicCategory[]>

  return {
    meta: { ...meta, generatedAt: new Date().toISOString() }, settings: toPublicSettings(settings), sections, journeyTabs, nav: computeNav(settings, sections),
    categories: categoriesOut, skills: publicSkills, projects: publicProjects, education, experiences, certifications: certs, achievements: achievementsOut,
  }
}

/** Catégories ordonnées de l'administration, complétées par celles rencontrées dans les fiches (jamais de filtre manquant). */
function categoryList(scope: CategoryScope, rows: PortfolioInput['categories'], used: Record<CategoryScope, { category: string }[]>): PublicCategory[] {
  const list: PublicCategory[] = rows.filter((r) => r.scope === scope).sort((a, b) => a.sortOrder - b.sortOrder).map((r) => ({ name: r.name, color: r.color, icon: resolveIcon(r.icon) }))
  const known = new Set(list.map((c) => c.name))
  for (const item of used[scope]) if (item.category && !known.has(item.category)) { known.add(item.category); list.push({ name: item.category, color: null, icon: null }) }
  return list
}

export interface BuildOptions { preview: boolean; emailConfigured: boolean }

/** Charge le contenu publié depuis Neon (ou tout, en aperçu administrateur) et compose la réponse publique. */
export async function buildPublicPortfolio(db: Database, options: BuildOptions): Promise<PublicPortfolio> {
  const { preview } = options
  const [settings, categoryRows, skillRows, projectRows, educationRows, experienceRows, certificationRows, achievementRows] = await Promise.all([
    loadSettings(db), listCategories(db),
    db.select().from(skills).where(preview ? undefined : eq(skills.visible, true)).orderBy(asc(skills.sortOrder), asc(skills.id)),
    db.select().from(projects).where(preview ? undefined : eq(projects.status, 'published')).orderBy(asc(projects.sortOrder), asc(projects.id)),
    db.select().from(educationEntries).where(preview ? undefined : eq(educationEntries.visible, true)).orderBy(asc(educationEntries.sortOrder), asc(educationEntries.id)),
    db.select().from(professionalExperiences).where(preview ? undefined : eq(professionalExperiences.visible, true)).orderBy(asc(professionalExperiences.sortOrder), asc(professionalExperiences.id)),
    db.select().from(certifications).where(preview ? undefined : eq(certifications.visible, true)).orderBy(asc(certifications.sortOrder), asc(certifications.id)),
    db.select().from(achievements).where(preview ? undefined : eq(achievements.visible, true)).orderBy(asc(achievements.sortOrder), asc(achievements.id)),
  ])
  return composePortfolio({
    settings, categories: categoryRows, skills: skillRows, projects: projectRows, education: educationRows, experiences: experienceRows,
    certifications: certificationRows, achievements: achievementRows,
    meta: { source: 'database', databaseConfigured: true, preview, emailConfigured: options.emailConfigured },
  })
}

/** Contenu de secours clairement identifié « démo » lorsque DATABASE_URL n'est pas configurée. */
export function buildDemoPortfolio(options: { emailConfigured: boolean }): PublicPortfolio {
  const stamp = new Date('2026-01-01T00:00:00.000Z')
  const withMeta = <T extends object>(items: T[]) => items.map((item, index) => ({ ...item, id: index + 1, isDemo: true, createdAt: stamp, updatedAt: stamp }))
  return composePortfolio({
    settings: { ...DEFAULT_SETTINGS, contact: { ...DEFAULT_SETTINGS.contact, channelMode: 'none' } },
    categories: DEMO_CATEGORIES.map((c) => ({ ...c, color: null })),
    skills: withMeta(DEMO_SKILLS) as SkillRow[], projects: withMeta(DEMO_PROJECTS) as ProjectRow[], education: withMeta(DEMO_EDUCATION) as EducationRow[],
    experiences: withMeta(DEMO_EXPERIENCES) as ExperienceRow[], certifications: withMeta(DEMO_CERTIFICATIONS) as CertificationRow[], achievements: withMeta(DEMO_ACHIEVEMENTS) as AchievementRow[],
    meta: { source: 'demo-fallback', databaseConfigured: false, preview: false, emailConfigured: options.emailConfigured },
  })
}

export type { ResolvedIcon }
