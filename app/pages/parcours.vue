<script setup lang="ts">
const portfolio = usePortfolio()
if (!portfolio.value.sections.includes('journey')) throw createError({ statusCode: 404, statusMessage: 'Page introuvable' })
useSeoMeta({ title: () => `${portfolio.value.settings.sections.journey.title} — ${portfolio.value.settings.content.name}`, description: () => portfolio.value.settings.sections.journey.intro })
</script>

<template><JourneySection /></template>
