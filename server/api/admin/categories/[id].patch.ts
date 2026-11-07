import { categoryInputSchema } from '../../../../shared/schemas/entities'
import { updateCategory } from '../../../db/repositories/categories'

export default defineEventHandler(async (event) => {
  await requireAdmin(event)
  const patch = await readBodyWith(event, categoryInputSchema.omit({ scope: true }).partial())
  try {
    const item = await updateCategory(useDb(), parseIdParam(event), patch)
    if (!item) throw apiError(404, 'NOT_FOUND', 'Catégorie introuvable.')
    invalidatePublicCache()
    return { item }
  } catch (error) {
    if (typeof error === 'object' && error && 'statusCode' in error) throw error
    throw apiError(409, 'CONFLICT', 'Une catégorie porte déjà ce nom dans cette liste.')
  }
})
