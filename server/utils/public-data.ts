import type { PublicPortfolio } from '../../shared/types/portfolio'
import { buildDemoPortfolio, buildPublicPortfolio } from '../services/portfolio'

/**
 * Cache mémoire très court de la réponse publique (20 s), invalidé à chaque enregistrement d'administration.
 * Sur un hébergement à plusieurs instances, chacune a son propre cache : au pire 20 s de décalage.
 */
const TTL_MS = 20_000
let cached: { value: Promise<PublicPortfolio>; at: number } | null = null

export async function getPublicPortfolio(preview: boolean): Promise<PublicPortfolio> {
  if (!isDatabaseConfigured()) return buildDemoPortfolio({ emailConfigured: isSmtpConfigured() })
  const options = { preview, emailConfigured: isSmtpConfigured() }
  if (preview) return buildPublicPortfolio(useDb(), options)
  if (cached && Date.now() - cached.at < TTL_MS) return cached.value
  const value = buildPublicPortfolio(useDb(), options)
  cached = { value, at: Date.now() }
  value.catch(() => { if (cached?.value === value) cached = null })
  return value
}

/** À appeler après toute écriture : le prochain visiteur relit Neon. */
export function invalidatePublicCache(): void {
  cached = null
}
