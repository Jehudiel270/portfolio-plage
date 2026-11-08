<script setup lang="ts">
import { LoaderCircle, X } from 'lucide-vue-next'
import type { ResolvedIcon } from '#shared/icons'

const props = defineProps<{ label: string; hint?: string; optional?: boolean; placeholder?: string; max?: number; error?: string; iconPreview?: boolean }>()
const model = defineModel<string[]>({ default: () => [] })
const draft = ref('')
const uid = `g-${Math.random().toString(36).slice(2, 8)}`
const icons = ref<Record<string, ResolvedIcon | null>>({})
const lookupError = ref('')
const loadingIcons = ref(false)
let lookupTimer: ReturnType<typeof setTimeout> | undefined
let lookupVersion = 0

watch(() => [...model.value], (names) => {
  if (!props.iconPreview) return
  if (lookupTimer) clearTimeout(lookupTimer)
  const version = ++lookupVersion
  lookupError.value = ''
  loadingIcons.value = false
  if (!names.length) { icons.value = {}; return }
  lookupTimer = setTimeout(async () => {
    loadingIcons.value = true
    try {
      const result = await adminFetch<Record<string, ResolvedIcon | null>>('/api/admin/content/projects/technology-icons', { query: { names: names.join(',') } })
      if (version === lookupVersion) icons.value = result
    } catch (error) {
      if (version === lookupVersion) lookupError.value = parseApiError(error).message
    } finally {
      if (version === lookupVersion) loadingIcons.value = false
    }
  }, 200)
}, { immediate: true })
onBeforeUnmount(() => { if (lookupTimer) clearTimeout(lookupTimer) })

function add(): void {
  const parts = draft.value.split(',').map((p) => p.trim()).filter(Boolean)
  const next = [...model.value]
  for (const part of parts) if (!next.includes(part) && next.length < (props.max ?? 30)) next.push(part)
  model.value = next
  draft.value = ''
}
const remove = (tag: string): void => { model.value = model.value.filter((t) => t !== tag) }
</script>

<template>
  <AdminField :label="props.label" :for="uid" :hint="props.hint ?? 'Validez avec Entrée ou une virgule.'" :optional="props.optional" :error="props.error">
    <div class="admin-input flex flex-wrap items-center gap-1.5 !p-1.5">
      <span v-for="tag in model" :key="tag" class="tag gap-1.5">
        <IconView v-if="iconPreview && icons[tag]" :icon="icons[tag]!" :size="16" />
        <span v-else-if="iconPreview" class="grid size-4 place-items-center rounded bg-fg/10 text-[.6rem] font-bold text-muted" :aria-label="loadingIcons ? `Recherche de l’icône ${tag}` : `Icône non disponible pour ${tag}`">
          <LoaderCircle v-if="loadingIcons" class="size-3 animate-spin" aria-hidden="true" /><template v-else>?</template>
        </span>
        {{ tag }}<button type="button" class="grid size-4 place-items-center rounded-full hover:bg-fg/20" :aria-label="`Retirer ${tag}`" @click="remove(tag)"><X class="size-3" /></button>
      </span>
      <input :id="uid" v-model="draft" class="min-w-24 flex-1 bg-transparent px-2 py-1 text-sm outline-none" :placeholder="props.placeholder ?? 'Ajouter…'" @keydown.enter.prevent="add" @keydown.,.prevent="add" @blur="add">
    </div>
    <p v-if="iconPreview && lookupError" class="mt-1 text-xs text-danger" role="status">Aperçu des icônes indisponible : {{ lookupError }}</p>
  </AdminField>
</template>
