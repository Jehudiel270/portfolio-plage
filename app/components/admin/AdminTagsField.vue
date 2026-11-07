<script setup lang="ts">
import { X } from 'lucide-vue-next'

const props = defineProps<{ label: string; hint?: string; optional?: boolean; placeholder?: string; max?: number; error?: string }>()
const model = defineModel<string[]>({ default: () => [] })
const draft = ref('')
const uid = `g-${Math.random().toString(36).slice(2, 8)}`

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
      <span v-for="tag in model" :key="tag" class="tag gap-1">{{ tag }}<button type="button" class="grid size-4 place-items-center rounded-full hover:bg-fg/20" :aria-label="`Retirer ${tag}`" @click="remove(tag)"><X class="size-3" /></button></span>
      <input :id="uid" v-model="draft" class="min-w-24 flex-1 bg-transparent px-2 py-1 text-sm outline-none" :placeholder="props.placeholder ?? 'Ajouter…'" @keydown.enter.prevent="add" @keydown.,.prevent="add" @blur="add">
    </div>
  </AdminField>
</template>
