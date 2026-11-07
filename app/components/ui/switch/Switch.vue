<script setup lang="ts">
import type { HTMLAttributes } from 'vue'
import { SwitchRoot, SwitchThumb } from 'reka-ui'
import { cn } from '~/utils/cn'

const props = defineProps<{ disabled?: boolean; class?: HTMLAttributes['class']; id?: string }>()
const model = defineModel<boolean>({ default: false })
</script>

<template>
  <SwitchRoot :id="props.id" v-model="model" data-slot="switch" :disabled="props.disabled" :class="cn('inline-flex h-6 w-11 shrink-0 cursor-pointer items-center rounded-full border border-line bg-fg/18 p-0.5 outline-none transition data-[state=checked]:bg-primary focus-visible:ring-4 focus-visible:ring-accent/25 disabled:cursor-not-allowed disabled:opacity-50', props.class)">
    <SwitchThumb class="pointer-events-none block size-5 rounded-full bg-white shadow transition-transform data-[state=checked]:translate-x-5 data-[state=checked]:bg-white" />
  </SwitchRoot>
</template>
