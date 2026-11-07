<script setup lang="ts">
import type { HTMLAttributes } from 'vue'
import { Label, type LabelProps } from 'reka-ui'
import { cn } from '~/utils/cn'

const props = defineProps<LabelProps & { class?: HTMLAttributes['class'] }>()
</script>

<template>
  <Label data-slot="label" :for="props.for" :as="props.as" :as-child="props.asChild" :class="cn('text-sm font-semibold leading-none text-fg', props.class)">
    <slot />
  </Label>
</template>
