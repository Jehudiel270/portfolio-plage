import { listCategories, countCategoryUsage } from '../../../db/repositories/categories'

export default defineEventHandler(async () => {
  const db = useDb()
  const rows = await listCategories(db)
  const items = await Promise.all(rows.map(async (row) => ({ ...row, usage: await countCategoryUsage(db, row.scope, row.name) })))
  return { items }
})
