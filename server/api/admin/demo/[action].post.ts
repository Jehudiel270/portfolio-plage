import { purgeDemoContent, seedDemoContent } from '../../../services/demo'

export default defineEventHandler(async (event) => {
  await requireAdmin(event)
  const action = getRouterParam(event, 'action')
  const db = useDb()
  if (action === 'seed') {
    const result = await seedDemoContent(db)
    invalidatePublicCache()
    return { ok: true, ...result }
  }
  if (action === 'purge') {
    const removed = await purgeDemoContent(db)
    invalidatePublicCache()
    return { ok: true, removed }
  }
  throw apiError(404, 'UNKNOWN_ACTION', 'Action inconnue.')
})
