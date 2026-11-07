import { deleteMessage } from '../../../db/repositories/messages'

export default defineEventHandler(async (event) => {
  await requireAdmin(event)
  if (!(await deleteMessage(useDb(), parseIdParam(event)))) throw apiError(404, 'NOT_FOUND', 'Message introuvable.')
  return { ok: true }
})
