import { getRow } from '../../../../db/repositories/content'

export default defineEventHandler(async (event) => {
  await requireAdmin(event)
  const item = await getRow(useDb(), parseEntityKey(event), parseIdParam(event))
  if (!item) throw apiError(404, 'NOT_FOUND', 'Élément introuvable.')
  return { item }
})
