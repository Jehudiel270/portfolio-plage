<script setup lang="ts">
const portfolio = usePortfolio()
if (!portfolio.value.sections.includes('skills')) throw createError({ statusCode: 404, statusMessage: 'Page introuvable' })
useSeoMeta({ title: () => `${portfolio.value.settings.sections.skills.title} — ${portfolio.value.settings.content.name}`, description: () => portfolio.value.settings.sections.skills.intro })
</script>

<template><SkillsSection /></template>
