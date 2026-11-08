import { listRows } from '../../../../db/repositories/content'

export default defineEventHandler(async (event) => {
  await requireAdmin(event)
  return { items: await listRows(useDb(), 'projects') }
})
