<script setup lang="ts">
const portfolio = usePortfolio()
if (!portfolio.value.sections.includes('about')) throw createError({ statusCode: 404, statusMessage: 'Page introuvable' })
useSeoMeta({ title: () => `${portfolio.value.settings.content.aboutTitle} — ${portfolio.value.settings.content.name}`, description: () => portfolio.value.settings.content.about.slice(0, 155) })
</script>

<template><AboutSection /></template>
