<script setup lang="ts">
const props = defineProps<{ label: string; for?: string; hint?: string; error?: string; optional?: boolean }>()
</script>

<template>
  <div class="grid content-start gap-1.5">
    <label :for="props.for" class="flex items-center gap-2 text-sm font-semibold">{{ props.label }}<span v-if="props.optional" class="text-xs font-normal text-muted">facultatif</span></label>
    <slot />
    <p v-if="props.hint" class="text-xs text-muted">{{ props.hint }}</p>
    <p v-if="props.error" class="text-xs font-semibold text-danger" role="alert">{{ props.error }}</p>
  </div>
</template>
