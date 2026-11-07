import { removeEntity } from '../../../../services/content'

export default defineEventHandler(async (event) => {
  await requireAdmin(event)
  const deleted = await removeEntity(useDb(), parseEntityKey(event), parseIdParam(event), destroyAssetIfConfigured)
  if (!deleted) throw apiError(404, 'NOT_FOUND', 'Élément introuvable.')
  invalidatePublicCache()
  return { ok: true }
})
