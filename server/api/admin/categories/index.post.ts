import { categoryInputSchema } from '../../../../shared/schemas/entities'
import { createCategory, listCategories } from '../../../db/repositories/categories'

export default defineEventHandler(async (event) => {
  await requireAdmin(event)
  const input = await readBodyWith(event, categoryInputSchema)
  const db = useDb()
  const last = (await listCategories(db, input.scope)).at(-1)
  const item = await createCategory(db, { ...input, sortOrder: input.sortOrder || (last ? last.sortOrder + 1 : 0) })
  invalidatePublicCache()
  setResponseStatus(event, 201)
  return { item }
})
