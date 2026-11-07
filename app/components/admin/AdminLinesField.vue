<script setup lang="ts">
const props = defineProps<{ label: string; hint?: string; optional?: boolean; placeholder?: string; error?: string }>()
const model = defineModel<string[]>({ default: () => [] })
const text = ref(model.value.join('\n'))
watch(model, (value) => { if (value.join('\n') !== text.value.split('\n').map((l) => l.trim()).filter(Boolean).join('\n')) text.value = value.join('\n') })
const uid = `l-${Math.random().toString(36).slice(2, 8)}`
function onInput(value: string): void {
  text.value = value
  model.value = value.split('\n').map((l) => l.trim()).filter(Boolean)
}
</script>

<template>
  <AdminField :label="props.label" :for="uid" :hint="props.hint ?? 'Une entrée par ligne.'" :optional="props.optional" :error="props.error">
    <textarea :id="uid" :value="text" rows="4" class="admin-input" :placeholder="props.placeholder" @input="onInput(($event.target as HTMLTextAreaElement).value)" />
  </AdminField>
</template>
