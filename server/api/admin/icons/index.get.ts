import { z } from 'zod'
import { searchBrandIcons } from '../../../services/icons'

/** Recherche dans la bibliothèque d'icônes de technologies (le navigateur n'embarque pas la bibliothèque entière). */
export default defineEventHandler((event) => {
  const query = z.object({ q: z.string().max(60).default(''), offset: z.coerce.number().int().min(0).max(5000).default(0) }).parse(getQuery(event))
  return searchBrandIcons(query.q, query.offset, 60)
})
