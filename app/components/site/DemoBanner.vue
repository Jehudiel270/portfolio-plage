<script setup lang="ts">
const portfolio = usePortfolio()
const message = computed(() => {
  const meta = portfolio.value.meta
  if (meta.preview) return 'Aperçu administrateur : brouillons et éléments masqués visibles.'
  if (meta.source === 'demo-fallback') return 'Mode démonstration : base de données non configurée, contenu d’exemple.'
  return ''
})
</script>

<template>
  <p v-if="message" role="status" class="fixed bottom-3 left-3 z-40 max-w-[calc(100vw-1.5rem)] rounded-full border border-warn/35 bg-surface px-4 py-1.5 text-xs font-bold text-warn shadow-lg">{{ message }}</p>
</template>
