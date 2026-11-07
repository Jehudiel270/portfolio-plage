import { z } from 'zod'
import { cleanupOrphanedAssets } from '../../../services/content'

/** Supprime une image téléversée mais abandonnée — uniquement si aucune fiche ne la référence encore. */
export default defineEventHandler(async (event) => {
  await requireAdmin(event)
  const { publicId } = await readBodyWith(event, z.object({ publicId: z.string().min(3).max(300).regex(/^portfolio\/[\w\-./]+$/) }))
  const removed = await cleanupOrphanedAssets(useDb(), [publicId], destroyAssetIfConfigured)
  return { ok: true, removed: removed.length > 0 }
})
