import { listRows } from '../../../../db/repositories/content'

export default defineEventHandler(async (event) => {
  await requireAdmin(event)
  const key = parseEntityKey(event)
  return { items: await listRows(useDb(), key) }
})
