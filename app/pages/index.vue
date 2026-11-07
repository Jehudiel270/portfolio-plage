<script setup lang="ts">
onMounted(() => {
  const hash = window.location.hash.slice(1)
  if (hash) setTimeout(() => document.getElementById(hash)?.scrollIntoView(), 120)
})
</script>

<template>
  <div>
    <HeroSection />
    <HomeSummary />
  </div>
</template>
