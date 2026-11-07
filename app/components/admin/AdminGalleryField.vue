<script setup lang="ts">
import { ImagePlus, Loader2, X } from 'lucide-vue-next'
import { optimizeCloudinaryUrl } from '#shared/utils/cloudinary'
import type { ImageRef } from '#shared/schemas/common'
import type { UploadFolder } from '~/utils/admin-entities'
import { Button } from '~/components/ui/button'

const props = defineProps<{ label: string; folder: UploadFolder; hint?: string; optional?: boolean; max?: number }>()
const model = defineModel<ImageRef[]>({ default: () => [] })
const toasts = useToasts()
const busy = ref(false)
const input = ref<HTMLInputElement | null>(null)
const fresh = new Set<string>()

async function uploadOne(file: File): Promise<ImageRef | null> {
  if (!/^image\/(jpeg|png|webp|avif|gif)$/.test(file.type) || file.size > 8 * 1024 * 1024) { toasts.error(`« ${file.name} » : format ou taille non pris en charge (8 Mo max).`); return null }
  const sign = await adminFetch<{ apiKey: string; signature: string; timestamp: number; folder: string; allowed_formats: string; uploadUrl: string }>('/api/admin/uploads/sign', { method: 'POST', body: { folder: props.folder } })
  const body = new FormData()
  body.append('file', file); body.append('api_key', sign.apiKey); body.append('timestamp', String(sign.timestamp)); body.append('signature', sign.signature); body.append('folder', sign.folder); body.append('allowed_formats', sign.allowed_formats)
  const response = await fetch(sign.uploadUrl, { method: 'POST', body })
  const result = (await response.json()) as { secure_url?: string; public_id?: string; error?: { message: string } }
  if (!response.ok || !result.secure_url || !result.public_id) throw new Error(result.error?.message ?? 'Échec du téléversement')
  fresh.add(result.public_id)
  return { url: result.secure_url, publicId: result.public_id }
}

async function onPick(event: Event): Promise<void> {
  const files = [...((event.target as HTMLInputElement).files ?? [])].slice(0, (props.max ?? 12) - model.value.length)
  if (input.value) input.value.value = ''
  if (!files.length) return
  busy.value = true
  try {
    const added: ImageRef[] = []
    for (const file of files) { const ref = await uploadOne(file); if (ref) added.push(ref) }
    model.value = [...model.value, ...added]
    if (added.length) toasts.ok(`${added.length} image(s) ajoutée(s). Enregistrez la fiche pour les conserver.`)
  } catch (error) {
    toasts.error(parseApiError(error).message)
  } finally {
    busy.value = false
  }
}

async function remove(item: ImageRef): Promise<void> {
  model.value = model.value.filter((i) => i !== item)
  if (item.publicId && fresh.has(item.publicId)) {
    fresh.delete(item.publicId)
    await adminFetch('/api/admin/uploads/delete', { method: 'POST', body: { publicId: item.publicId } }).catch(() => undefined)
  }
}
</script>

<template>
  <AdminField :label="props.label" :hint="props.hint" :optional="props.optional">
    <div class="grid gap-3 rounded-xl border border-dashed border-fg/15 p-3">
      <ul v-if="model.length" class="grid grid-cols-2 gap-2 sm:grid-cols-4">
        <li v-for="item in model" :key="item.url" class="group relative">
          <img :src="optimizeCloudinaryUrl(item.url, { width: 240, crop: 'limit' })" alt="Image de la galerie" class="aspect-video w-full rounded-lg border border-fg/10 object-cover">
          <button type="button" class="absolute right-1 top-1 grid size-6 place-items-center rounded-full bg-black/70 text-white opacity-0 transition focus:opacity-100 group-hover:opacity-100" aria-label="Retirer cette image" @click="remove(item)"><X class="size-3.5" /></button>
        </li>
      </ul>
      <div><Button type="button" size="sm" variant="glass" :disabled="busy || model.length >= (props.max ?? 12)" @click="input?.click()"><component :is="busy ? Loader2 : ImagePlus" :class="{ 'animate-spin': busy }" />{{ busy ? 'Téléversement…' : 'Ajouter des images' }}</Button></div>
      <input ref="input" type="file" multiple accept="image/jpeg,image/png,image/webp,image/avif,image/gif" class="sr-only" tabindex="-1" @change="onPick">
    </div>
  </AdminField>
</template>
