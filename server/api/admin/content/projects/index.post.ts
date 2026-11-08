import { EntityRuleError, createEntity, parseCreateInput } from '../../../../services/content'

export default defineEventHandler(async (event) => {
  await requireAdmin(event)
  assertBodySize(event, 200_000)
  const raw = await readBody(event).catch(() => null)
  const parsed = parseCreateInput('projects', raw)
  if (!parsed.success) throw apiError(422, 'VALIDATION_ERROR', 'Certaines valeurs sont invalides.', flattenIssues(parsed.error))
  try {
    const item = await createEntity(useDb(), 'projects', parsed.data as Record<string, unknown>)
    invalidatePublicCache()
    setResponseStatus(event, 201)
    return { item }
  } catch (error) {
    if (error instanceof EntityRuleError) throw apiError(422, 'RULE_ERROR', error.message)
    throw internalError('content:create', error)
  }
})
