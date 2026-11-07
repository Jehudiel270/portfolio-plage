import { loadSettings } from '../db/repositories/settings'

export default defineEventHandler(async (event) => {
  setResponseHeader(event, 'Content-Type', 'text/plain; charset=utf-8')
  const origin = useServerConfig().siteUrl || getRequestURL(event, { xForwardedHost: true, xForwardedProto: true }).origin
  const indexable = isDatabaseConfigured() ? (await loadSettings(useDb()).catch(() => null))?.seo.indexable ?? true : true
  return indexable
    ? `User-agent: *\nAllow: /\nDisallow: /admin\nDisallow: /api/\n\nSitemap: ${origin}/sitemap.xml\n`
    : 'User-agent: *\nDisallow: /\n'
})
