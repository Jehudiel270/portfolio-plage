<script setup lang="ts">
import type { HTMLAttributes } from 'vue'
import { cn } from '~/utils/cn'

const props = defineProps<{ class?: HTMLAttributes['class'] }>()
const model = defineModel<string>()
</script>

<template>
  <textarea v-model="model" data-slot="textarea" :class="cn('min-h-32 w-full rounded-xl border border-line bg-surface px-4 py-3 text-[.95rem] text-fg outline-none transition placeholder:text-muted/70 hover:border-primary/40 focus-visible:border-primary focus-visible:ring-4 focus-visible:ring-primary/15 aria-invalid:border-danger disabled:opacity-50', props.class)" />
</template>
