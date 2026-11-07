import type { PublicPortfolio } from '../../../shared/types/portfolio'

/** Tranches de l'API publique : même source que `/api/public/portfolio`, sans appels redondants à la base. */
const SLICES: Record<string, (p: PublicPortfolio) => unknown> = {
  site: (p) => ({ meta: p.meta, settings: p.settings, sections: p.sections }),
  navigation: (p) => p.nav,
  projects: (p) => ({ projects: p.projects, categories: p.categories.projects }),
  skills: (p) => ({ skills: p.skills, categories: p.categories.skills }),
  journey: (p) => ({ tabs: p.journeyTabs, experiences: p.experiences, education: p.education, certifications: p.certifications, achievements: p.achievements }),
  contact: (p) => ({ contact: p.settings.contact, widget: p.settings.widget, social: p.settings.social }),
}

export default defineEventHandler(async (event) => {
  const slice = SLICES[getRouterParam(event, 'section') ?? '']
  if (!slice) throw apiError(404, 'UNKNOWN_SECTION', 'Section inconnue.')
  setResponseHeader(event, 'Cache-Control', 'public, max-age=0, s-maxage=20, stale-while-revalidate=60')
  return slice(await getPublicPortfolio(false))
})
