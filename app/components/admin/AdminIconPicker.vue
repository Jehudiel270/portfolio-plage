<script setup lang="ts">
import { ImageOff, Search, Sparkles, X } from 'lucide-vue-next'
import { LUCIDE_ICON_NAMES } from '#shared/constants'
import { Button } from '~/components/ui/button'
import { LUCIDE_MAP } from '~/utils/lucide-map'
import type { UploadFolder } from '~/utils/admin-entities'

/** Sélecteur d'icône : technologies (bibliothèque), icônes génériques ou icône/image personnalisée — ou aucune. */
const props = defineProps<{ label: string; folder: UploadFolder; hint?: string; optional?: boolean; suggestFrom?: string }>()
const model = defineModel<string | null>({ default: null })
const publicId = defineModel<string | null>('publicId', { default: null })
const toasts = useToasts()
const dialog = ref<HTMLDialogElement | null>(null)
const tab = ref<'brand' | 'lucide' | 'custom'>('brand')
const query = ref('')
const result = ref<{ total: number; items: { slug: string; title: string; hex: string; path: string }[] }>({ total: 0, items: [] })
const loading = ref(false)
const custom = ref<string | null>(null)
const customId = ref<string | null>(null)
let timer: ReturnType<typeof setTimeout> | undefined

async function search(offset = 0): Promise<void> {
  loading.value = true
  try {
    const page = await adminFetch<typeof result.value>('/api/admin/icons', { query: { q: query.value, offset } })
    result.value = offset ? { total: page.total, items: [...result.value.items, ...page.items] } : page
  } finally { loading.value = false }
}
watch(query, () => { clearTimeout(timer); timer = setTimeout(() => void search(), 220) })
function open(): void { custom.value = model.value?.startsWith('http') ? model.value : null; customId.value = publicId.value; dialog.value?.showModal(); void search() }
function choose(value: string | null, id: string | null = null): void { model.value = value; publicId.value = id; dialog.value?.close() }
function applyCustom(): void { if (custom.value) choose(custom.value, customId.value) }

async function suggest(): Promise<void> {
  const name = props.suggestFrom?.trim()
  if (!name) { toasts.error('Renseignez d’abord le nom.'); return }
  const found = await adminFetch<typeof result.value>('/api/admin/icons', { query: { q: name } })
  const exact = found.items.find((i) => i.title.toLowerCase() === name.toLowerCase()) ?? found.items[0]
  if (exact) { choose(`si:${exact.slug}`); toasts.ok(`Icône « ${exact.title} » proposée.`) } else toasts.error('Aucune icône connue pour ce nom : choisissez-en une ou téléversez la vôtre.')
}
</script>

<template>
  <AdminField :label="label" :hint="hint" :optional="optional">
    <div class="flex flex-wrap items-center gap-3 rounded-xl border border-line bg-surface p-3">
      <span class="icon-tile size-14"><AdminIcon v-if="model" :value="model" :size="32" /><ImageOff v-else class="size-5 text-muted" aria-hidden="true" /></span>
      <div class="flex flex-wrap gap-2">
        <Button type="button" size="sm" variant="soft" @click="open">{{ model ? 'Changer l’icône' : 'Choisir une icône' }}</Button>
        <Button v-if="suggestFrom !== undefined" type="button" size="sm" variant="ghost" @click="suggest"><Sparkles />Proposer d’après le nom</Button>
        <Button v-if="model" type="button" size="sm" variant="ghost" @click="choose(null)"><X />Aucune</Button>
      </div>
    </div>

    <dialog ref="dialog" class="m-auto w-[min(46rem,calc(100vw-1rem))] max-h-[90svh] rounded-2xl border border-line bg-surface p-0 text-fg backdrop:bg-[rgb(5_20_30/.55)]" aria-label="Choisir une icône">
      <div class="flex max-h-[90svh] flex-col">
        <header class="flex items-center justify-between gap-3 border-b border-line px-5 py-4"><h2 class="font-display text-lg font-bold">Choisir une icône</h2><Button type="button" variant="ghost" size="sm" @click="dialog?.close()">Fermer</Button></header>
        <div class="flex flex-wrap gap-2 px-5 pt-4" role="tablist">
          <button type="button" role="tab" class="chip" :aria-selected="tab === 'brand'" @click="tab = 'brand'">Technologies</button>
          <button type="button" role="tab" class="chip" :aria-selected="tab === 'lucide'" @click="tab = 'lucide'">Génériques</button>
          <button type="button" role="tab" class="chip" :aria-selected="tab === 'custom'" @click="tab = 'custom'">Personnalisée</button>
        </div>
        <div class="overflow-y-auto px-5 py-4">
          <template v-if="tab === 'brand'">
            <label class="relative block"><span class="sr-only">Rechercher une technologie</span><Search class="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted" /><input v-model="query" class="admin-input !pl-9" type="search" placeholder="Vue, Python, Docker…" autofocus></label>
            <ul class="mt-4 grid grid-cols-3 gap-2 sm:grid-cols-5" role="list">
              <li v-for="icon in result.items" :key="icon.slug"><button type="button" class="flex h-full w-full flex-col items-center gap-2 rounded-xl border border-line p-3 text-xs font-semibold transition hover:border-primary hover:bg-primary/5" :aria-label="icon.title" @click="choose(`si:${icon.slug}`)"><svg width="28" height="28" viewBox="0 0 24 24" aria-hidden="true"><path :d="icon.path" :fill="icon.hex" /></svg><span class="line-clamp-1">{{ icon.title }}</span></button></li>
            </ul>
            <p v-if="!result.items.length && !loading" class="py-6 text-center text-sm text-muted">Aucune technologie trouvée : essayez une icône générique ou téléversez la vôtre.</p>
            <div v-if="result.items.length < result.total" class="mt-4 text-center"><Button type="button" size="sm" variant="outline" :disabled="loading" @click="search(result.items.length)">Afficher plus ({{ result.total - result.items.length }})</Button></div>
          </template>
          <ul v-else-if="tab === 'lucide'" class="grid grid-cols-4 gap-2 sm:grid-cols-6" role="list">
            <li v-for="name in LUCIDE_ICON_NAMES" :key="name"><button type="button" class="grid w-full place-items-center gap-1.5 rounded-xl border border-line p-3 text-[.7rem] font-semibold transition hover:border-primary hover:bg-primary/5" :aria-label="name" @click="choose(`lucide:${name}`)"><component :is="LUCIDE_MAP[name]" v-if="LUCIDE_MAP[name]" class="size-6 text-primary" aria-hidden="true" />{{ name }}</button></li>
          </ul>
          <div v-else class="grid gap-4">
            <AdminImageField v-model:url="custom" v-model:public-id="customId" label="Votre icône ou image" :folder="folder" hint="PNG, SVG, WebP… Carré de préférence, fond transparent." />
            <div><Button type="button" :disabled="!custom" @click="applyCustom">Utiliser cette icône</Button></div>
          </div>
        </div>
      </div>
    </dialog>
  </AdminField>
</template>
