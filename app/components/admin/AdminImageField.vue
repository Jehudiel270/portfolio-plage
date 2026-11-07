<script setup lang="ts">
import { ImagePlus, Loader2, Trash2 } from 'lucide-vue-next'
import { optimizeCloudinaryUrl } from '#shared/utils/cloudinary'
import type { UploadFolder } from '~/utils/admin-entities'
import { Button } from '~/components/ui/button'

/** Téléversement direct vers Cloudinary avec signature serveur (le secret n'atteint jamais le navigateur). */
const props = defineProps<{ label: string; folder: UploadFolder; hint?: string; optional?: boolean; error?: string }>()
const url = defineModel<string | null>('url', { default: null })
const publicId = defineModel<string | null>('publicId', { default: null })
const toasts = useToasts()
const busy = ref(false)
const localPreview = ref<string | null>(null)
const external = ref('')
const input = ref<HTMLInputElement | null>(null)
const freshUploads = new Set<string>()
const MAX_BYTES = 8 * 1024 * 1024

const shown = computed(() => localPreview.value ?? (url.value ? optimizeCloudinaryUrl(url.value, { width: 480, crop: 'limit' }) : null))

async function upload(file: File): Promise<void> {
  if (!/^image\/(jpeg|png|webp|avif|gif)$/.test(file.type)) { toasts.error('Format non pris en charge (JPEG, PNG, WebP, AVIF ou GIF).'); return }
  if (file.size > MAX_BYTES) { toasts.error('Image trop lourde (8 Mo maximum).'); return }
  busy.value = true
  localPreview.value = URL.createObjectURL(file)
  try {
    const sign = await adminFetch<{ apiKey: string; signature: string; timestamp: number; folder: string; allowed_formats: string; uploadUrl: string }>('/api/admin/uploads/sign', { method: 'POST', body: { folder: props.folder } })
    const body = new FormData()
    body.append('file', file)
    body.append('api_key', sign.apiKey)
    body.append('timestamp', String(sign.timestamp))
    body.append('signature', sign.signature)
    body.append('folder', sign.folder)
    body.append('allowed_formats', sign.allowed_formats)
    const response = await fetch(sign.uploadUrl, { method: 'POST', body })
    const result = (await response.json()) as { secure_url?: string; public_id?: string; error?: { message: string } }
    if (!response.ok || !result.secure_url || !result.public_id) throw new Error(result.error?.message ?? 'Échec du téléversement')
    await discardFresh()
    url.value = result.secure_url
    publicId.value = result.public_id
    freshUploads.add(result.public_id)
    toasts.ok('Image téléversée. Enregistrez la fiche pour la conserver.')
  } catch (error) {
    localPreview.value = null
    toasts.error(parseApiError(error).message)
  } finally {
    busy.value = false
  }
}

/** Supprime de Cloudinary une image téléversée dans cette session mais jamais enregistrée (le serveur vérifie qu'elle n'est pas référencée). */
async function discardFresh(): Promise<void> {
  const current = publicId.value
  if (current && freshUploads.has(current)) {
    freshUploads.delete(current)
    await adminFetch('/api/admin/uploads/delete', { method: 'POST', body: { publicId: current } }).catch(() => undefined)
  }
}

async function remove(): Promise<void> {
  await discardFresh()
  url.value = null
  publicId.value = null
  localPreview.value = null
}

function useExternal(): void {
  const value = external.value.trim()
  if (!/^https?:\/\//i.test(value)) { toasts.error('Collez une URL http(s) complète.'); return }
  url.value = value
  publicId.value = null
  localPreview.value = null
  external.value = ''
}
function onPick(event: Event): void {
  const file = (event.target as HTMLInputElement).files?.[0]
  if (file) void upload(file)
  if (input.value) input.value.value = ''
}
</script>

<template>
  <AdminField :label="props.label" :hint="props.hint" :optional="props.optional" :error="props.error">
    <div class="grid gap-3 rounded-xl border border-dashed border-fg/15 p-3">
      <div v-if="shown" class="flex items-start gap-3">
        <img :src="shown" alt="Aperçu de l’image" class="h-24 max-w-48 rounded-lg border border-fg/10 bg-black/30 object-contain">
        <div class="grid gap-2">
          <Button type="button" size="sm" variant="glass" :disabled="busy" @click="input?.click()"><ImagePlus />Remplacer</Button>
          <Button type="button" size="sm" variant="ghost" :disabled="busy" @click="remove"><Trash2 />Retirer</Button>
        </div>
      </div>
      <div v-else class="flex flex-wrap items-center gap-3">
        <Button type="button" size="sm" variant="glass" :disabled="busy" @click="input?.click()"><component :is="busy ? Loader2 : ImagePlus" :class="{ 'animate-spin': busy }" />{{ busy ? 'Téléversement…' : 'Téléverser une image' }}</Button>
        <span class="text-xs text-muted">JPEG, PNG, WebP, AVIF ou GIF · 8 Mo max</span>
      </div>
      <div v-if="busy && shown" class="flex items-center gap-2 text-xs text-muted"><Loader2 class="size-3.5 animate-spin" />Téléversement vers Cloudinary…</div>
      <details class="text-xs text-muted"><summary class="cursor-pointer font-semibold">Ou utiliser l’URL d’une image existante</summary>
        <div class="mt-2 flex gap-2"><input v-model="external" class="admin-input" placeholder="https://…" inputmode="url" @keydown.enter.prevent="useExternal"><Button type="button" size="sm" variant="glass" @click="useExternal">Utiliser</Button></div>
      </details>
      <input ref="input" type="file" accept="image/jpeg,image/png,image/webp,image/avif,image/gif" class="sr-only" tabindex="-1" @change="onPick">
    </div>
  </AdminField>
</template>
