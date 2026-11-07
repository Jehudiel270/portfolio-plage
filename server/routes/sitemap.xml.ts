import { getPublicPortfolio } from '../utils/public-data'

export default defineEventHandler(async (event) => {
  setResponseHeader(event, 'Content-Type', 'application/xml; charset=utf-8')
  const origin = useServerConfig().siteUrl || getRequestURL(event, { xForwardedHost: true, xForwardedProto: true }).origin
  const portfolio = await getPublicPortfolio(false)
  const sections = new Set(portfolio.sections)
  const urls = [
    '/',
    ...(sections.has('about') ? ['/a-propos'] : []),
    ...(sections.has('projects') ? ['/projets', ...portfolio.projects.map((project) => `/projets/${encodeURIComponent(project.slug)}`)] : []),
    ...(sections.has('skills') ? ['/competences'] : []),
    ...(sections.has('journey') ? ['/parcours'] : []),
    ...(portfolio.settings.contact.pageEnabled ? ['/contact'] : []),
    ...(portfolio.settings.privacy.enabled ? ['/confidentialite'] : []),
  ]
  const lastmod = portfolio.meta.generatedAt.slice(0, 10)
  return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls.map((u) => `  <url><loc>${origin}${u}</loc><lastmod>${lastmod}</lastmod></url>`).join('\n')}\n</urlset>\n`
})
