<script setup lang="ts">
import { paragraphs } from '~/utils/format'

const portfolio = usePortfolio()
const privacy = computed(() => portfolio.value.settings.privacy)
if (!privacy.value.enabled) throw createError({ statusCode: 404, statusMessage: 'Page introuvable' })
useSeoMeta({ title: () => `${privacy.value.title} — ${portfolio.value.settings.content.name}`, robots: 'noindex, follow' })
</script>

<template>
  <article class="container-page max-w-3xl pb-24 pt-32">
    <h1 class="text-4xl sm:text-5xl">{{ privacy.title }}</h1>
    <div class="mt-8 grid gap-5 text-[1.05rem] text-fg/85"><p v-for="(text, index) in paragraphs(privacy.body)" :key="index">{{ text }}</p></div>
    <p class="mt-10"><NuxtLink to="/" class="font-bold text-primary underline underline-offset-4">← Retour à l’accueil</NuxtLink></p>
  </article>
</template>
