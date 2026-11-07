import { z } from 'zod'
import { UPLOAD_FOLDERS } from '../../../utils/cloudinary'

export default defineEventHandler(async (event) => {
  await requireAdmin(event)
  const { folder } = await readBodyWith(event, z.object({ folder: z.enum(UPLOAD_FOLDERS) }))
  if (!isCloudinaryConfigured()) throw apiError(503, 'CLOUDINARY_NOT_CONFIGURED', 'Cloudinary n’est pas configuré (CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, CLOUDINARY_API_SECRET).')
  return signUpload(folder)
})
