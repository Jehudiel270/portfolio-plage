<script setup lang="ts">
import type { ResolvedIcon } from '#shared/icons'

/** Affiche une icône stockée (`si:…`, `lucide:…`, URL) dans l'administration. */
const props = withDefaults(defineProps<{ value: string | null | undefined; size?: number }>(), { size: 22 })
const icon = ref<ResolvedIcon | null>(null)
watchEffect(async () => { icon.value = props.value ? ((await resolveIconsForAdmin([props.value]))[props.value] ?? null) : null })
</script>

<template><IconView :icon="icon" :size="size" :surface="'#ffffff'" /></template>
