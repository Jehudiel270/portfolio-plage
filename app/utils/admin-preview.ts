import type { EntityKey } from '#shared/schemas/entities'
import { DEFAULT_SETTINGS, resolveLabels } from '#shared/schemas/settings'
import type { PublicPortfolio, PublicSettings, Selection } from '#shared/types/portfolio'

const emptySettings = (): PublicSettings => {
  const { recipientEmail: _r, emailSubjectTemplate: _s, emailBodyTemplate: _b, ...contact } = DEFAULT_SETTINGS.contact
  const { ui: _ui, ...rest } = DEFAULT_SETTINGS
  return { ...rest, contact, labels: resolveLabels({}) }
}
const KIND: Record<EntityKey, Selection['kind']> = { projects: 'project', skills: 'skill', education: 'education', experiences: 'experience', certifications: 'certification', achievements: 'achievement' }

/** Portfolio minimal contenant uniquement l'élément en cours d'édition : permet de prévisualiser la fiche publique avant publication. */
export function buildPreview(entity: EntityKey, data: Record<string, unknown>, icon: unknown = null): { portfolio: PublicPortfolio; selection: Selection } {
  const technologies = Array.isArray(data.technologies) ? (data.technologies as string[]).map((name) => ({ name, icon: null })) : undefined
  const item = { ...data, ...(technologies ? { technologies } : {}), icon, id: -1, isDemo: false, hidden: true, createdAt: new Date().toISOString() }
  const portfolio: PublicPortfolio = {
    meta: { source: 'database', databaseConfigured: true, preview: true, generatedAt: new Date().toISOString(), emailConfigured: false },
    settings: emptySettings(), sections: [], journeyTabs: [], nav: [], categories: { skills: [], projects: [], certifications: [], achievements: [] },
    skills: [], projects: [], education: [], experiences: [], certifications: [], achievements: [],
  }
  ;(portfolio[entity] as unknown[]).push(item)
  return { portfolio, selection: { kind: KIND[entity], id: -1 } }
}
