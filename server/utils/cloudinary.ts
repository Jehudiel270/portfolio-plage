import { v2 as cloudinary } from 'cloudinary'

export const UPLOAD_FOLDERS = ['projects', 'skills', 'education', 'experiences', 'certifications', 'achievements', 'categories', 'profile', 'misc'] as const
export type UploadFolder = (typeof UPLOAD_FOLDERS)[number]
export const ALLOWED_FORMATS = 'jpg,jpeg,png,webp,avif,gif,svg'
export const CLOUDINARY_ROOT_FOLDER = 'portfolio-plage'

export function cloudinaryFolder(folder: UploadFolder): string {
  return `${CLOUDINARY_ROOT_FOLDER}/${folder}`
}

function configure() {
  const { cloudName, apiKey, apiSecret } = useServerConfig().cloudinary
  cloudinary.config({ cloud_name: cloudName, api_key: apiKey, api_secret: apiSecret, secure: true })
  return { cloudName, apiKey, apiSecret }
}

/** Signature d'envoi : le secret reste sur le serveur, le navigateur reçoit uniquement la signature. */
export function signUpload(folder: UploadFolder) {
  const { cloudName, apiKey, apiSecret } = configure()
  const timestamp = Math.round(Date.now() / 1000)
  const params = { allowed_formats: ALLOWED_FORMATS, folder: cloudinaryFolder(folder), timestamp }
  const signature = cloudinary.utils.api_sign_request(params, apiSecret)
  return { cloudName, apiKey, signature, ...params, uploadUrl: `https://api.cloudinary.com/v1_1/${cloudName}/image/upload` }
}

export async function destroyAsset(publicId: string): Promise<boolean> {
  if (!publicId.startsWith(`${CLOUDINARY_ROOT_FOLDER}/`) && !publicId.startsWith('portfolio/')) return false
  configure()
  const result = await cloudinary.uploader.destroy(publicId, { invalidate: true, resource_type: 'image' })
  return result.result === 'ok'
}
