<script setup lang="ts">
defineProps<{ id: string; title: string; intro?: string }>()
</script>

<template>
  <header v-reveal class="section-head">
    <h2 :id="`${id}-title`">{{ title }}</h2>
    <p v-if="intro">{{ intro }}</p>
    <slot />
  </header>
</template>
