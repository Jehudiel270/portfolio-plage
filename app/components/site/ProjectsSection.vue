<script setup lang="ts">
import { Code2, ExternalLink, Waves } from 'lucide-vue-next'
import { optimizeCloudinaryUrl } from '#shared/utils/cloudinary'
import { safeHref } from '#shared/utils/template'
import type { PublicProject } from '#shared/types/portfolio'
import { Button } from '~/components/ui/button'

const portfolio = usePortfolio()
const { t } = useUi()
const explore = useExplore()
const config = computed(() => portfolio.value.settings.sections.projects)
const display = computed(() => portfolio.value.settings.display)
const filter = ref<string | null>(null)
const order = ref<'priority' | 'date' | 'category'>('priority')
const shown = ref(display.value.projectsPerPage)
const canExplore = ref(false)
onMounted(async () => { const { webglAvailable } = await import('~/scene/ocean/OceanEngine'); canExplore.value = webglAvailable() })

const categories = computed(() => portfolio.value.categories.projects.filter((c) => portfolio.value.projects.some((p) => p.category === c.name)))
const list = computed(() => {
  const items = portfolio.value.projects.filter((p) => !filter.value || p.category === filter.value)
  if (order.value === 'date') return [...items].sort((a, b) => (b.projectDate ?? b.createdAt).localeCompare(a.projectDate ?? a.createdAt))
  if (order.value === 'category') return [...items].sort((a, b) => a.category.localeCompare(b.category) || a.sortOrder - b.sortOrder)
  return items
})
watch([filter, order], () => { shown.value = display.value.projectsPerPage })
const visible = computed(() => list.value.slice(0, shown.value))
const imageOf = (p: PublicProject): string | null => (p.coverImageUrl ? optimizeCloudinaryUrl(p.coverImageUrl, { width: 760, height: 475, crop: 'fill' }) : null)
const ORDERS = computed(() => [['priority', t('projects.sort.priority')], ['date', t('projects.sort.date')], ['category', t('projects.sort.category')]] as const)
</script>

<template>
  <section id="projects" class="section section--alt" aria-labelledby="projects-title">
    <div class="container-page">
      <SectionHead id="projects" :title="config.title" :intro="config.intro" />
      <div v-if="portfolio.projects.length" v-reveal class="mb-8 flex flex-wrap items-center gap-x-6 gap-y-3">
        <div v-if="categories.length > 1" class="flex flex-wrap gap-2" role="group" :aria-label="t('common.filterBy')">
          <button type="button" class="chip" :aria-pressed="filter === null" @click="filter = null">{{ t('common.all') }}</button>
          <button v-for="c in categories" :key="c.name" type="button" class="chip" :aria-pressed="filter === c.name" @click="filter = c.name"><IconView v-if="c.icon" :icon="c.icon" :size="15" :colorize="false" />{{ c.name }}</button>
        </div>
        <div v-if="portfolio.projects.length > 2" class="ml-auto flex flex-wrap items-center gap-2 text-sm text-muted" role="group" :aria-label="t('projects.sort')">
          <span>{{ t('projects.sort') }}</span>
          <button v-for="[value, label] in ORDERS" :key="value" type="button" class="chip !py-1" :aria-pressed="order === value" @click="order = value">{{ label }}</button>
        </div>
        <Button v-if="display.explore.projects && canExplore" variant="soft" size="sm" @click="explore = 'projects'"><Waves />{{ t('projects.explore') }}</Button>
      </div>

      <p v-if="!portfolio.projects.length" class="card p-6 text-muted">{{ config.emptyText || t('common.empty') }}</p>
      <ul v-else class="grid gap-6 sm:grid-cols-2 lg:grid-cols-3" role="list">
        <li v-for="(project, index) in visible" :key="project.id" v-reveal="(index % 3) * 80" class="card card--link relative flex flex-col overflow-hidden">
          <div class="relative aspect-[16/10] overflow-hidden bg-gradient-to-br from-sea-shallow/50 to-primary/25">
            <img v-if="imageOf(project)" :src="imageOf(project)!" :alt="`Aperçu du projet ${project.title}`" class="size-full object-cover transition duration-500 hover:scale-[1.03]" loading="lazy" width="760" height="475">
            <span v-else class="grid size-full place-items-center font-display text-6xl font-bold text-primary/35" aria-hidden="true">{{ project.title.slice(0, 1) }}</span>
            <span v-if="project.isDemo || project.hidden" class="absolute left-3 top-3 flex gap-1.5"><span v-if="project.isDemo" class="tag tag--demo">{{ t('common.demo') }}</span><span v-if="project.hidden" class="tag tag--draft">{{ t('common.draft') }}</span></span>
          </div>
          <div class="flex flex-1 flex-col gap-3 p-5">
            <span v-if="project.category" class="tag w-fit">{{ project.category }}</span>
            <h3 class="text-xl">
              <NuxtLink :to="`/projets/${project.slug}`" class="text-left after:absolute after:inset-0 after:content-['']" :aria-label="`${project.title} — voir l’étude de cas`">{{ project.title }}</NuxtLink>
            </h3>
            <p class="line-clamp-3 text-[.97rem] text-muted">{{ project.shortDescription }}</p>
            <ul v-if="project.technologies.length" class="mt-auto flex flex-wrap gap-1.5 pt-1" role="list">
              <li v-for="tech in project.technologies.slice(0, 6)" :key="tech.name" class="tag !bg-fg/6 !text-fg/80" :title="tech.name"><IconView v-if="display.showTechIcons && tech.icon" :icon="tech.icon" :size="14" :colorize="display.iconStyle === 'brand'" />{{ tech.name }}</li>
            </ul>
            <div v-if="safeHref(project.liveUrl) || safeHref(project.repositoryUrl)" class="relative z-10 flex gap-4 pt-1 text-sm font-bold text-primary">
              <a v-if="safeHref(project.liveUrl)" :href="safeHref(project.liveUrl)!" target="_blank" rel="noopener noreferrer" class="inline-flex items-center gap-1.5 hover:underline"><ExternalLink class="size-4" aria-hidden="true" />{{ t('projects.demo') }}</a>
              <a v-if="safeHref(project.repositoryUrl)" :href="safeHref(project.repositoryUrl)!" target="_blank" rel="noopener noreferrer" class="inline-flex items-center gap-1.5 hover:underline"><Code2 class="size-4" aria-hidden="true" />{{ t('projects.code') }}</a>
            </div>
          </div>
        </li>
      </ul>
      <p v-if="portfolio.projects.length && !list.length" class="text-muted">{{ t('common.noResult') }}</p>
      <div v-if="list.length > shown" class="mt-10 text-center"><Button variant="outline" @click="shown += display.projectsPerPage">{{ t('common.loadMore') }}</Button></div>
    </div>
  </section>
</template>
