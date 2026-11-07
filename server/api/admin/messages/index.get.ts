import { z } from 'zod'
import { MESSAGE_STATUSES } from '../../../../shared/constants'
import { listMessages } from '../../../db/repositories/messages'

export default defineEventHandler(async (event) => {
  const query = z.object({ status: z.enum(MESSAGE_STATUSES).optional() }).safeParse(getQuery(event))
  if (!query.success) throw apiError(400, 'INVALID_QUERY', 'Filtre invalide.')
  return { items: await listMessages(useDb(), query.data.status) }
})
