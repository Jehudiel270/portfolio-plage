<script setup lang="ts">
import { isHexColor } from '#shared/utils/color'

const props = defineProps<{ label: string; hint?: string; optional?: boolean }>()
const model = defineModel<string | null>({ default: null })
const text = ref(model.value ?? '')
const valid = computed(() => text.value === '' ? props.optional === true : isHexColor(text.value))
watch(model, (value) => { if ((value ?? '') !== text.value && (value === null || isHexColor(value))) text.value = value ?? '' })
function onText(value: string): void {
  text.value = value.startsWith('#') || value === '' ? value : `#${value}`
  if (isHexColor(text.value)) model.value = text.value.toLowerCase()
  else if (text.value === '' && props.optional) model.value = null
}
const uid = `c-${Math.random().toString(36).slice(2, 8)}`
</script>

<template>
  <AdminField :label="props.label" :for="uid" :hint="props.hint" :optional="props.optional" :error="valid ? undefined : 'Format attendu : #RRGGBB (ex. #2ee6ff)'">
    <div class="flex items-center gap-2">
      <input type="color" :value="isHexColor(text) ? text : '#000000'" class="size-10 shrink-0 cursor-pointer rounded-lg border border-fg/15 bg-transparent p-0.5" :aria-label="`${props.label} — sélecteur de couleur`" @input="onText(($event.target as HTMLInputElement).value)">
      <input :id="uid" :value="text" class="admin-input font-mono" maxlength="7" spellcheck="false" autocomplete="off" placeholder="#2ee6ff" :aria-invalid="!valid" @input="onText(($event.target as HTMLInputElement).value)">
    </div>
  </AdminField>
</template>
