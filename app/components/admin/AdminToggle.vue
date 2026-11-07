<script setup lang="ts">
import { Switch } from '~/components/ui/switch'

const props = defineProps<{ label: string; hint?: string; id?: string }>()
const model = defineModel<boolean>({ default: false })
const uid = props.id ?? `t-${Math.random().toString(36).slice(2, 8)}`
</script>

<template>
  <div class="flex items-start justify-between gap-4 rounded-xl border border-fg/8 bg-fg/[.02] px-4 py-3">
    <label :for="uid" class="min-w-0 cursor-pointer"><span class="block text-sm font-semibold">{{ props.label }}</span><span v-if="props.hint" class="block text-xs text-muted">{{ props.hint }}</span></label>
    <Switch :id="uid" v-model="model" />
  </div>
</template>
