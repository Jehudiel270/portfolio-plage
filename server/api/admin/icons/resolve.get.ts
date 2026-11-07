import { z } from 'zod'
import { resolveIcon } from '../../../services/icons'

/** Résout des valeurs d'icône (`si:…`, `lucide:…`, URL) pour l'affichage dans l'administration. */
export default defineEventHandler((event) => {
  const { values } = z.object({ values: z.string().max(4000) }).parse(getQuery(event))
  return Object.fromEntries(values.split(',').slice(0, 120).map((v) => [v, resolveIcon(v)]))
})
