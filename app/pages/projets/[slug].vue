<script setup lang="ts">
import { ArrowLeft, Code2, ExternalLink } from 'lucide-vue-next'
import { optimizeCloudinaryUrl } from '#shared/utils/cloudinary'
import { safeHref } from '#shared/utils/template'

const route = useRoute()
const portfolio = usePortfolio()
const slug = computed(() => String(route.params.slug ?? ''))
const project = computed(() => portfolio.value.projects.find((item) => item.slug === slug.value && !item.hidden))
if (!project.value) throw createError({ statusCode: 404, statusMessage: 'Projet introuvable' })
const title = computed(() => project.value?.title ?? 'Projet')
const description = computed(() => project.value?.shortDescription || project.value?.description.slice(0, 155) || '')
const siteName = computed(() => portfolio.value.settings.content.name)
const siteUrl = useRuntimeConfig().public.siteUrl as string
const canonical = computed(() => `${siteUrl.replace(/\/$/, '')}/projets/${encodeURIComponent(slug.value)}`)

useSeoMeta({
  title: () => `${title.value} — ${siteName.value}`,
  description,
  ogType: 'article',
  ogTitle: () => `${title.value} — ${siteName.value}`,
  ogDescription: description,
  ogImage: () => project.value?.coverImageUrl ? optimizeCloudinaryUrl(project.value.coverImageUrl, { width: 1200, height: 630, crop: 'fill' }) : '/og-default.png',
})
useHead(() => ({
  link: siteUrl ? [{ rel: 'canonical', href: canonical.value }] : [],
  script: project.value ? [{
    type: 'application/ld+json',
    innerHTML: JSON.stringify({
      '@context': 'https://schema.org', '@type': 'CreativeWork', name: project.value.title, description: description.value,
      url: canonical.value, image: project.value.coverImageUrl || undefined, dateCreated: project.value.projectDate || undefined,
      keywords: project.value.technologies.map((technology) => technology.name).join(', ') || undefined,
    }).replace(/</g, '\\u003c'),
  }] : [],
}))
</script>

<template>
  <article v-if="project" class="container-page max-w-5xl pb-24 pt-28 sm:pt-36">
    <NuxtLink to="/projets" class="mb-7 inline-flex items-center gap-2 font-bold text-primary underline-offset-4 hover:underline"><ArrowLeft class="size-4" /> Tous les projets</NuxtLink>
    <header>
      <p v-if="project.category" class="tag mb-4">{{ project.category }}</p>
      <h1 class="text-4xl sm:text-6xl">{{ project.title }}</h1>
      <p class="mt-5 max-w-3xl text-xl text-muted">{{ project.shortDescription }}</p>
      <ul v-if="project.technologies.length" class="mt-5 flex flex-wrap gap-2" aria-label="Technologies utilisées">
        <li v-for="technology in project.technologies" :key="technology.name" class="tag"><IconView v-if="technology.icon" :icon="technology.icon" :size="15" />{{ technology.name }}</li>
      </ul>
    </header>
    <img v-if="project.coverImageUrl" :src="optimizeCloudinaryUrl(project.coverImageUrl, { width: 1440, height: 900, crop: 'fill' })" :alt="`Aperçu du projet ${project.title}`" width="1440" height="900" class="mt-9 max-h-[34rem] w-full rounded-3xl object-cover shadow-xl">
    <div class="mt-10 grid gap-10 lg:grid-cols-[minmax(0,1fr)_17rem]">
      <div class="grid content-start gap-8">
        <section v-if="project.problem" class="grid gap-3"><h2 class="text-2xl">Le contexte</h2><p class="whitespace-pre-line text-lg text-fg/85">{{ project.problem }}</p></section>
        <section v-if="project.description" class="grid gap-3"><h2 class="text-2xl">La démarche</h2><p class="whitespace-pre-line text-lg text-fg/85">{{ project.description }}</p></section>
        <section v-if="project.features.length" class="grid gap-3"><h2 class="text-2xl">Fonctionnalités et résultats</h2><ul class="grid gap-3"><li v-for="feature in project.features" :key="feature" class="card p-4">{{ feature }}</li></ul></section>
        <section v-if="project.gallery.length" class="grid gap-4"><h2 class="text-2xl">Galerie</h2><ul class="grid gap-4 sm:grid-cols-2"><li v-for="image in project.gallery" :key="image.publicId ?? image.url"><img :src="optimizeCloudinaryUrl(image.url, { width: 1000, height: 700, crop: 'limit' })" :alt="`Capture du projet ${project.title}`" loading="lazy" class="w-full rounded-2xl border border-line"></li></ul></section>
      </div>
      <aside class="card h-fit p-5"><h2 class="font-display text-lg font-bold">Découvrir le projet</h2><div class="mt-4 grid gap-3">
        <a v-if="safeHref(project.liveUrl)" :href="safeHref(project.liveUrl)!" target="_blank" rel="noopener noreferrer" class="chip justify-center"><ExternalLink class="size-4" />Voir la réalisation</a>
        <a v-if="safeHref(project.repositoryUrl)" :href="safeHref(project.repositoryUrl)!" target="_blank" rel="noopener noreferrer" class="chip justify-center"><Code2 class="size-4" />Voir le code</a>
        <NuxtLink to="/contact" class="chip justify-center">Parler d’un projet similaire</NuxtLink>
      </div></aside>
    </div>
  </article>
</template>
