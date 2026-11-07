import { listRows } from '../../../../db/repositories/content'
import { exportCsv, exportColumns } from '../../../../services/content'

export default defineEventHandler(async (event) => {
  await requireAdmin(event)
  const key = parseEntityKey(event)
  const rows = await listRows(useDb(), key)
  const csv = getQuery(event).format !== 'json'
  setResponseHeader(event, 'Content-Type', csv ? 'text/csv; charset=utf-8' : 'application/json; charset=utf-8')
  setResponseHeader(event, 'Content-Disposition', `attachment; filename="${key}.${csv ? 'csv' : 'json'}"`)
  if (csv) return exportCsv(key, rows)
  const columns = exportColumns(key)
  return JSON.stringify(rows.map((row) => Object.fromEntries(columns.map((c) => [c, row[c]]))), null, 2)
})
