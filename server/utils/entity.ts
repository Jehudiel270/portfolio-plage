import type { H3Event } from 'h3'
import { z } from 'zod'
import { ENTITY_KEYS, type EntityKey } from '../../shared/schemas/entities'
import { apiError } from './errors'

export function parseEntityKey(event: H3Event): EntityKey {
  const parsed = z.enum(ENTITY_KEYS).safeParse(getRouterParam(event, 'entity'))
  if (!parsed.success) throw apiError(404, 'UNKNOWN_ENTITY', 'Type de contenu inconnu.')
  return parsed.data
}

/** Refuse les corps démesurés avant lecture (protection simple contre les abus). */
export function assertBodySize(event: H3Event, maxBytes: number): void {
  const length = Number.parseInt(getRequestHeader(event, 'content-length') ?? '0', 10)
  if (Number.isFinite(length) && length > maxBytes) throw apiError(413, 'PAYLOAD_TOO_LARGE', 'Requête trop volumineuse.')
}

/** Suppression Cloudinary tolérante : sans configuration Cloudinary, il n'y a rien à nettoyer. */
export async function destroyAssetIfConfigured(publicId: string): Promise<unknown> {
  return isCloudinaryConfigured() ? destroyAsset(publicId) : false
}
