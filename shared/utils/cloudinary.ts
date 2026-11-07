export interface CloudinaryTransform {
  width?: number
  height?: number
  crop?: 'limit' | 'fill' | 'fit' | 'scale'
  quality?: 'auto' | 'auto:eco' | 'auto:good'
}

const MARKER = '/image/upload/'

/** Insère des transformations (format/qualité automatiques, redimensionnement) dans une URL Cloudinary ; les autres URL sont inchangées. */
export function optimizeCloudinaryUrl(url: string | null | undefined, options: CloudinaryTransform = {}): string {
  if (!url) return ''
  if (!url.includes('res.cloudinary.com')) return url
  const index = url.indexOf(MARKER)
  if (index === -1) return url
  const parts = ['f_auto', `q_${options.quality ?? 'auto'}`]
  if (options.width) parts.push(`w_${Math.round(options.width)}`)
  if (options.height) parts.push(`h_${Math.round(options.height)}`)
  if (options.width || options.height) parts.push(`c_${options.crop ?? 'limit'}`)
  const head = url.slice(0, index + MARKER.length)
  const tail = url.slice(index + MARKER.length)
  return `${head}${parts.join(',')}/${tail}`
}
