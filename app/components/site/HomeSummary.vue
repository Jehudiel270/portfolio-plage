<script setup lang="ts">
import { ArrowRight } from 'lucide-vue-next'
import { optimizeCloudinaryUrl } from '#shared/utils/cloudinary'
import { paragraphs } from '~/utils/format'

const portfolio = usePortfolio()
const content = computed(() => portfolio.value.settings.content)
const projects = computed(() => {
  const visible = portfolio.value.projects.filter((project) => !project.hidden)
  return [...visible.filter((project) => project.featured), ...visible.filter((project) => !project.featured)].slice(0, 3)
})
const skills = computed(() => portfolio.value.skills.filter((skill) => !skill.hidden).slice(0, 8))
</script>

<template>
  <div>
    <section v-if="portfolio.sections.includes('about')" id="about" class="section" aria-labelledby="home-about-title">
      <div class="container-page grid gap-6 md:grid-cols-[1fr_auto] md:items-end">
        <div class="max-w-3xl"><p class="tag mb-4">À propos</p><h2 id="home-about-title" class="text-3xl sm:text-4xl">{{ content.aboutTitle }}</h2><p v-if="paragraphs(content.about)[0]" class="mt-4 max-w-2xl text-lg text-muted">{{ paragraphs(content.about)[0] }}</p></div>
        <NuxtLink to="/a-propos" class="inline-flex items-center gap-2 font-bold text-primary underline-offset-4 hover:underline">En savoir plus <ArrowRight class="size-4" /></NuxtLink>
      </div>
    </section>

    <section v-if="portfolio.sections.includes('projects')" id="projects" class="section section--alt" aria-labelledby="home-projects-title">
      <div class="container-page">
        <div class="section-head"><p class="tag mb-4">Sélection</p><h2 id="home-projects-title">Quelques projets</h2><p>Une sélection de réalisations, de l’idée à la mise en ligne.</p></div>
        <ul v-if="projects.length" class="grid gap-5 md:grid-cols-3" role="list">
          <li v-for="project in projects" :key="project.id" class="card card--link overflow-hidden">
            <NuxtLink :to="`/projets/${project.slug}`" class="block h-full">
              <img v-if="project.coverImageUrl" :src="optimizeCloudinaryUrl(project.coverImageUrl, { width: 720, height: 450, crop: 'fill' })" :alt="`Aperçu de ${project.title}`" width="720" height="450" loading="lazy" class="aspect-[16/10] w-full object-cover">
              <div class="p-5"><p v-if="project.category" class="tag mb-3">{{ project.category }}</p><h3 class="text-xl">{{ project.title }}</h3><p class="mt-2 line-clamp-3 text-sm text-muted">{{ project.shortDescription }}</p></div>
            </NuxtLink>
          </li>
        </ul>
        <div class="mt-6"><NuxtLink to="/projets" class="inline-flex items-center gap-2 font-bold text-primary underline-offset-4 hover:underline">Voir tous les projets <ArrowRight class="size-4" /></NuxtLink></div>
      </div>
    </section>

    <section v-if="portfolio.sections.includes('skills')" id="skills" class="section" aria-labelledby="home-skills-title">
      <div class="container-page">
        <div class="section-head"><p class="tag mb-4">Savoir-faire</p><h2 id="home-skills-title">Compétences principales</h2></div>
        <ul v-if="skills.length" class="flex flex-wrap gap-2.5" role="list">
          <li v-for="skill in skills" :key="skill.id" class="chip !cursor-default !text-fg"><IconView v-if="skill.icon" :icon="skill.icon" :size="18" />{{ skill.name }}</li>
        </ul>
        <NuxtLink to="/competences" class="mt-6 inline-flex items-center gap-2 font-bold text-primary underline-offset-4 hover:underline">Découvrir toutes les compétences <ArrowRight class="size-4" /></NuxtLink>
      </div>
    </section>

    <section v-if="portfolio.sections.includes('journey')" id="journey" class="section section--alt" aria-labelledby="home-journey-title">
      <div class="container-page grid gap-6 md:grid-cols-[1fr_auto] md:items-end">
        <div><p class="tag mb-4">Parcours</p><h2 id="home-journey-title" class="text-3xl sm:text-4xl">Expériences, formation et réalisations</h2><p class="mt-3 text-muted">Un aperçu du parcours et des étapes marquantes.</p></div>
        <NuxtLink to="/parcours" class="inline-flex items-center gap-2 font-bold text-primary underline-offset-4 hover:underline">Voir le parcours <ArrowRight class="size-4" /></NuxtLink>
      </div>
    </section>

    <section id="contact" class="section" aria-labelledby="home-contact-title">
      <div class="container-page card grid gap-6 p-7 sm:p-10 md:grid-cols-[1fr_auto] md:items-center">
        <div><p class="tag mb-4">Contact</p><h2 id="home-contact-title" class="text-3xl sm:text-4xl">Un projet en tête ?</h2><p class="mt-3 max-w-2xl text-muted">Parlons de votre besoin et des prochaines étapes.</p></div>
        <NuxtLink to="/contact" class="inline-flex items-center justify-center gap-2 rounded-full bg-primary px-6 py-3 font-bold text-on-primary shadow-md transition hover:-translate-y-0.5">Me contacter <ArrowRight class="size-4" /></NuxtLink>
      </div>
    </section>
  </div>
</template>
