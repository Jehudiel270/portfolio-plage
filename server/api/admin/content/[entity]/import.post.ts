import { z } from 'zod'
import { importCsvRows, importRows } from '../../../../services/content'

const bodySchema = z.object({
  rows: z.array(z.record(z.string(), z.unknown())).max(500).optional(),
  csv: z.string().max(2_000_000).optional(),
  dryRun: z.boolean().default(false),
  autoIcons: z.boolean().default(false),
})

/** Import en masse (JSON ou CSV) : `dryRun` valide chaque ligne sans rien créer, pour un aperçu avant validation. */
export default defineEventHandler(async (event) => {
  await requireAdmin(event)
  assertBodySize(event, 3_000_000)
  const key = parseEntityKey(event)
  const body = await readBodyWith(event, bodySchema)
  const rows = body.rows ?? (body.csv ? importCsvRows(key, body.csv) : [])
  if (!rows.length) throw apiError(422, 'EMPTY_IMPORT', 'Aucune ligne à importer.')
  if (rows.length > 500) throw apiError(422, 'TOO_MANY_ROWS', 'Import limité à 500 lignes à la fois.')
  const results = await importRows(useDb(), key, rows, { dryRun: body.dryRun, autoIcons: body.autoIcons })
  if (!body.dryRun) invalidatePublicCache()
  return { ok: true, dryRun: body.dryRun, created: results.filter((r) => r.ok).length, failed: results.filter((r) => !r.ok).length, results }
})
