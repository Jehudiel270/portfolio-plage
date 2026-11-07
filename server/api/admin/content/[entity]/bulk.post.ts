import { bulkActionSchema } from '../../../../../shared/schemas/entities'
import { EntityRuleError, runBulk } from '../../../../services/content'

export default defineEventHandler(async (event) => {
  await requireAdmin(event)
  const key = parseEntityKey(event)
  const action = await readBodyWith(event, bulkActionSchema)
  try {
    const result = await runBulk(useDb(), key, action, destroyAssetIfConfigured)
    invalidatePublicCache()
    return { ok: true, ...result }
  } catch (error) {
    if (error instanceof EntityRuleError) throw apiError(422, 'RULE_ERROR', error.message)
    throw internalError('content:bulk', error)
  }
})
