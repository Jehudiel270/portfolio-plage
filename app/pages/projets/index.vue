<script setup lang="ts">
const portfolio = usePortfolio()
if (!portfolio.value.sections.includes('projects')) throw createError({ statusCode: 404, statusMessage: 'Page introuvable' })
useSeoMeta({ title: () => `${portfolio.value.settings.sections.projects.title} — ${portfolio.value.settings.content.name}`, description: () => portfolio.value.settings.sections.projects.intro })
</script>

<template><ProjectsSection /></template>
