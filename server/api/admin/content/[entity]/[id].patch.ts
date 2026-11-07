import { EntityRuleError, parsePatchInput, patchEntity } from '../../../../services/content'

export default defineEventHandler(async (event) => {
  await requireAdmin(event)
  assertBodySize(event, 200_000)
  const key = parseEntityKey(event)
  const id = parseIdParam(event)
  const raw = await readBody(event).catch(() => null)
  const parsed = parsePatchInput(key, raw)
  if (!parsed.success) throw apiError(422, 'VALIDATION_ERROR', 'Certaines valeurs sont invalides.', flattenIssues(parsed.error))
  try {
    const item = await patchEntity(useDb(), key, id, parsed.data as Record<string, unknown>, destroyAssetIfConfigured)
    if (!item) throw apiError(404, 'NOT_FOUND', 'Élément introuvable.')
    invalidatePublicCache()
    return { item }
  } catch (error) {
    if (error instanceof EntityRuleError) throw apiError(422, 'RULE_ERROR', error.message)
    if (typeof error === 'object' && error && 'statusCode' in error) throw error
    throw internalError('content:update', error)
  }
})
