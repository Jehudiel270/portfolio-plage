import type { PublicPortfolio } from '#shared/types/portfolio'

/** Charge les données publiques avant le rendu (serveur) ; l'aperçu administrateur (?preview=1) est rechargé à chaque visite. */
export default defineNuxtRouteMiddleware(async (to) => {
  if (to.path.startsWith('/admin')) return
  const state = useState<PublicPortfolio | null>('portfolio', () => null)
  const loadedAs = useState('portfolio-key', () => '')
  const error = useState('portfolio-error', () => '')
  const preview = to.query.preview === '1'
  const wanted = preview ? 'preview' : 'live'
  if (state.value && loadedAs.value === wanted && !preview) return
  try {
    state.value = await useRequestFetch()<PublicPortfolio>('/api/public/portfolio', { query: preview ? { preview: '1' } : {} })
    loadedAs.value = wanted
    error.value = ''
  } catch (e) {
    error.value = e instanceof Error ? e.message : 'Erreur de chargement'
  }
})
