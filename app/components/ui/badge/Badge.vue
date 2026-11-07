<script setup lang="ts">
import type { HTMLAttributes } from 'vue'
import { cn } from '~/utils/cn'

const props = defineProps<{ tone?: 'default' | 'ok' | 'warn' | 'danger' | 'muted'; class?: HTMLAttributes['class'] }>()
const tones = {
  default: 'border-primary/30 bg-primary/10 text-primary',
  ok: 'border-ok/30 bg-ok/10 text-ok',
  warn: 'border-warn/35 bg-warn/10 text-warn',
  danger: 'border-danger/35 bg-danger/10 text-danger',
  muted: 'border-line bg-fg/5 text-muted',
}
</script>

<template>
  <span data-slot="badge" :class="cn('inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-xs font-semibold', tones[props.tone ?? 'default'], props.class)"><slot /></span>
</template>
