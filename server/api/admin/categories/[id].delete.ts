import { deleteCategory } from '../../../db/repositories/categories'

export default defineEventHandler(async (event) => {
  await requireAdmin(event)
  const result = await deleteCategory(useDb(), parseIdParam(event))
  if (!result) throw apiError(404, 'NOT_FOUND', 'Catégorie introuvable.')
  invalidatePublicCache()
  return { ok: true, ...result }
})
