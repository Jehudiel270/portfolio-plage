export default defineEventHandler(async (event) => {
  const query = getQuery(event)
  const wantsPreview = query.preview === '1' || query.preview === 'true'
  // L'aperçu (brouillons, éléments masqués) n'est accordé qu'à un administrateur authentifié.
  const preview = wantsPreview && Boolean(await getAdminSession(event))
  setResponseHeader(event, 'Cache-Control', preview ? 'private, no-store' : 'public, max-age=0, s-maxage=20, stale-while-revalidate=60')
  return getPublicPortfolio(preview)
})
