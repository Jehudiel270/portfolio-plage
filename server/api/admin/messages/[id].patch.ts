import { z } from 'zod'
import { MESSAGE_STATUSES } from '../../../../shared/constants'
import { updateMessageStatus } from '../../../db/repositories/messages'

export default defineEventHandler(async (event) => {
  await requireAdmin(event)
  const { status } = await readBodyWith(event, z.object({ status: z.enum(MESSAGE_STATUSES) }))
  if (!(await updateMessageStatus(useDb(), parseIdParam(event), status))) throw apiError(404, 'NOT_FOUND', 'Message introuvable.')
  return { ok: true }
})
