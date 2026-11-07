import { z } from 'zod'
import { reorderRows } from '../../../../db/repositories/content'

export default defineEventHandler(async (event) => {
  await requireAdmin(event)
  const key = parseEntityKey(event)
  const { ids } = await readBodyWith(event, z.object({ ids: z.array(z.number().int().positive()).min(1).max(500) }))
  await reorderRows(useDb(), key, ids)
  invalidatePublicCache()
  return { ok: true }
})
