<script setup lang="ts">
import type { ResolvedIcon } from '#shared/icons'
import { contrastRatio } from '#shared/icons'
import { optimizeCloudinaryUrl } from '#shared/utils/cloudinary'
import { LUCIDE_MAP } from '~/utils/lucide-map'

/** Affiche une icône résolue : technologie (couleur de marque ou couleur du thème), icône générique ou image personnalisée. */
const props = withDefaults(defineProps<{ icon: ResolvedIcon | null; size?: number; colorize?: boolean; surface?: string; label?: string }>(), { size: 24, colorize: true, surface: '#ffffff', label: undefined })
const brandColor = computed(() => {
  const icon = props.icon
  if (icon?.type !== 'brand' || !props.colorize) return 'currentColor'
  return contrastRatio(icon.hex, props.surface) >= 1.9 ? icon.hex : 'currentColor'
})
const lucide = computed(() => (props.icon?.type === 'lucide' ? (LUCIDE_MAP[props.icon.name] ?? null) : null))
</script>

<template>
  <svg v-if="icon?.type === 'brand'" :width="size" :height="size" viewBox="0 0 24 24" role="img" :aria-label="label ?? icon.title" class="shrink-0"><path :d="icon.path" :fill="brandColor" /></svg>
  <component :is="lucide" v-else-if="lucide" :width="size" :height="size" :aria-label="label" :aria-hidden="label ? undefined : true" class="shrink-0" stroke-width="1.8" />
  <img v-else-if="icon?.type === 'image'" :src="optimizeCloudinaryUrl(icon.url, { width: size * 2, height: size * 2, crop: 'fit' })" :width="size" :height="size" :alt="label ?? ''" loading="lazy" class="shrink-0 object-contain" :style="{ width: `${size}px`, height: `${size}px` }">
</template>
