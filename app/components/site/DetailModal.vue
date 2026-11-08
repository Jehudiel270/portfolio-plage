<script setup lang="ts">
import { ExternalLink, ShieldCheck, X } from 'lucide-vue-next'
import { DEFAULT_UI_LABELS } from '#shared/ui-labels'
import { optimizeCloudinaryUrl } from '#shared/utils/cloudinary'
import { safeHref } from '#shared/utils/template'
import type { PublicPortfolio, Selection } from '#shared/types/portfolio'
import { Button } from '~/components/ui/button'
import { experienceTypeLabel } from '~/utils/admin-labels'
import { formatMonth, formatRange, initials, isExpired, paragraphs } from '~/utils/format'

/** Fiche détaillée unique pour tous les types de contenu (aussi utilisée par l'administration pour l'aperçu avant publication). */
const props = defineProps<{ portfolio?: PublicPortfolio; selection?: Selection | null }>()
const emit = defineEmits<{ close: [] }>()
const site = usePortfolio()
const shared = useSelection()
const dialog = ref<HTMLDialogElement | null>(null)
const data = computed(() => props.portfolio ?? site.value ?? null)
const current = computed<Selection | null>(() => (props.selection !== undefined ? props.selection : shared.value))
const label = (key: keyof typeof DEFAULT_UI_LABELS): string => data.value?.settings.labels[key] ?? DEFAULT_UI_LABELS[key]
const iconStyle = computed(() => data.value?.settings.display.iconStyle ?? 'brand')

const entity = computed(() => {
  const p = data.value
  const s = current.value
  if (!p || !s) return null
  switch (s.kind) {
    case 'project': return { kind: 'project' as const, item: p.projects.find((x) => x.id === s.id) }
    case 'skill': return { kind: 'skill' as const, item: p.skills.find((x) => x.id === s.id) }
    case 'education': return { kind: 'education' as const, item: p.education.find((x) => x.id === s.id) }
    case 'experience': return { kind: 'experience' as const, item: p.experiences.find((x) => x.id === s.id) }
    case 'certification': return { kind: 'certification' as const, item: p.certifications.find((x) => x.id === s.id) }
    case 'achievement': return { kind: 'achievement' as const, item: p.achievements.find((x) => x.id === s.id) }
  }
  return null
})
const img = (url: string | null | undefined, width = 1100): string => optimizeCloudinaryUrl(url, { width, crop: 'limit' })

watch(() => entity.value?.item, async (item) => {
  await nextTick()
  const el = dialog.value
  if (!el) return
  if (item && !el.open) { el.showModal(); document.documentElement.classList.add('modal-open') }
  if (!item && el.open) el.close()
}, { immediate: true, flush: 'post' })

function onClosed(): void {
  if (!document.querySelector('dialog[open].explore')) document.documentElement.classList.remove('modal-open')
  if (props.selection === undefined) shared.value = null
  emit('close')
}
</script>

<template>
  <dialog ref="dialog" class="detail" aria-labelledby="detail-title" @close="onClosed" @click="(e) => { if (e.target === dialog) dialog?.close() }">
    <article v-if="entity?.item" class="detail-card relative max-h-[calc(100svh-1.5rem)] overflow-y-auto p-6 sm:p-9">
      <button type="button" class="absolute right-4 top-4 z-10 grid size-10 place-items-center rounded-full bg-fg/8 transition hover:bg-fg/15" :aria-label="label('common.close')" @click="dialog?.close()"><X class="size-5" /></button>

      <template v-if="entity.kind === 'project'">
        <img v-if="entity.item.coverImageUrl" :src="img(entity.item.coverImageUrl)" :alt="`Aperçu du projet ${entity.item.title}`" class="mb-6 max-h-80 w-full rounded-2xl object-cover">
        <div class="flex flex-wrap items-center gap-2"><span v-if="entity.item.category" class="tag">{{ entity.item.category }}</span><span v-if="entity.item.isDemo" class="tag tag--demo">{{ label('common.demo') }}</span><span v-if="entity.item.hidden" class="tag tag--draft">{{ label('common.draft') }}</span></div>
        <h2 id="detail-title" class="mt-3 pr-10 text-3xl sm:text-4xl">{{ entity.item.title }}</h2>
        <p v-if="entity.item.shortDescription" class="mt-3 text-lg text-fg/85">{{ entity.item.shortDescription }}</p>
        <div v-if="entity.item.description" class="mt-5 grid gap-3 text-fg/80"><p v-for="(t, i) in paragraphs(entity.item.description)" :key="i">{{ t }}</p></div>
        <template v-if="entity.item.problem"><h3 class="mt-7 text-lg text-primary">{{ label('projects.problem') }}</h3><p class="mt-1 text-fg/80">{{ entity.item.problem }}</p></template>
        <template v-if="entity.item.role"><h3 class="mt-7 text-lg text-primary">Mon rôle</h3><p class="mt-1 whitespace-pre-line text-fg/80">{{ entity.item.role }}</p></template>
        <template v-if="entity.item.features.length"><h3 class="mt-7 text-lg text-primary">{{ label('projects.features') }}</h3><ul class="mt-2 grid list-disc gap-1.5 pl-5 text-fg/80"><li v-for="f in entity.item.features" :key="f">{{ f }}</li></ul></template>
        <template v-if="entity.item.results.length"><h3 class="mt-7 text-lg text-primary">Résultats</h3><ul class="mt-2 grid gap-2 sm:grid-cols-2"><li v-for="result in entity.item.results" :key="result" class="card p-3 font-semibold">{{ result }}</li></ul></template>
        <template v-if="entity.item.technologies.length"><h3 class="mt-7 text-lg text-primary">{{ label('projects.tech') }}</h3><ul class="mt-2 flex flex-wrap gap-2" role="list"><li v-for="tech in entity.item.technologies" :key="tech.name" class="tag !text-[.85rem]"><IconView v-if="tech.icon" :icon="tech.icon" :size="16" :colorize="iconStyle === 'brand'" />{{ tech.name }}</li></ul></template>
        <div v-if="entity.item.gallery.length" class="mt-7 grid grid-cols-2 gap-2.5 sm:grid-cols-3"><img v-for="g in entity.item.gallery" :key="g.url" :src="img(g.url, 480)" alt="Capture du projet" class="aspect-video w-full rounded-xl object-cover" loading="lazy"></div>
        <div class="mt-8 flex flex-wrap gap-3">
          <Button v-if="safeHref(entity.item.liveUrl)" as-child><a :href="safeHref(entity.item.liveUrl)!" target="_blank" rel="noopener noreferrer">{{ label('projects.demo') }}<ExternalLink /></a></Button>
          <Button v-if="safeHref(entity.item.repositoryUrl)" as-child variant="outline"><a :href="safeHref(entity.item.repositoryUrl)!" target="_blank" rel="noopener noreferrer">{{ label('projects.code') }}<ExternalLink /></a></Button>
        </div>
      </template>

      <template v-else-if="entity.kind === 'skill'">
        <div class="flex items-center gap-5">
          <span class="icon-tile size-20"><IconView v-if="entity.item.icon" :icon="entity.item.icon" :size="44" :colorize="iconStyle === 'brand'" class="text-primary" /><span v-else class="font-display text-2xl font-bold text-primary">{{ initials(entity.item.name) }}</span></span>
          <div><span v-if="entity.item.category" class="tag">{{ entity.item.category }}</span><h2 id="detail-title" class="mt-1.5 pr-10 text-3xl">{{ entity.item.name }}</h2></div>
        </div>
        <p v-if="entity.item.description" class="mt-5 text-fg/80">{{ entity.item.description }}</p>
        <div v-if="entity.item.proficiency !== null" class="mt-6"><div class="flex justify-between text-sm font-semibold"><span class="text-muted">{{ label('skills.level') }}</span><span>{{ entity.item.proficiency }} %</span></div><div class="mt-1.5 h-2 overflow-hidden rounded-full bg-fg/10"><div class="h-full rounded-full bg-gradient-to-r from-primary to-accent" :style="{ width: `${entity.item.proficiency}%` }" /></div></div>
      </template>

      <template v-else-if="entity.kind === 'education'">
        <img v-if="entity.item.imageUrl" :src="img(entity.item.imageUrl)" :alt="`Illustration ${entity.item.institution}`" class="mb-6 max-h-64 w-full rounded-2xl object-cover">
        <div class="flex flex-wrap items-center gap-2"><span class="tag">{{ formatRange(entity.item.startDate, entity.item.endDate, entity.item.isCurrent, label('common.current')) }}</span><span v-if="entity.item.field" class="tag">{{ entity.item.field }}</span><span v-if="entity.item.isDemo" class="tag tag--demo">{{ label('common.demo') }}</span></div>
        <h2 id="detail-title" class="mt-3 pr-10 text-3xl">{{ entity.item.title }}</h2>
        <p class="mt-1 text-lg font-semibold text-primary">{{ entity.item.institution }}<template v-if="entity.item.degree"> · {{ entity.item.degree }}</template></p>
        <div v-if="entity.item.description" class="mt-5 grid gap-3 text-fg/80"><p v-for="(t, i) in paragraphs(entity.item.description)" :key="i">{{ t }}</p></div>
        <template v-if="entity.item.achievements.length"><h3 class="mt-7 text-lg text-primary">{{ label('journey.achievements') }}</h3><ul class="mt-2 grid list-disc gap-1.5 pl-5 text-fg/80"><li v-for="a in entity.item.achievements" :key="a">{{ a }}</li></ul></template>
        <Button v-if="safeHref(entity.item.url)" as-child variant="outline" class="mt-7"><a :href="safeHref(entity.item.url)!" target="_blank" rel="noopener noreferrer">{{ label('journey.officialPage') }}<ExternalLink /></a></Button>
      </template>

      <template v-else-if="entity.kind === 'experience'">
        <img v-if="entity.item.imageUrl" :src="img(entity.item.imageUrl, 400)" :alt="`Logo ${entity.item.organization}`" class="mb-6 max-h-28 rounded-xl object-contain">
        <div class="flex flex-wrap items-center gap-2"><span class="tag">{{ formatRange(entity.item.startDate, entity.item.endDate, entity.item.isCurrent, label('common.current')) }}</span><span class="tag">{{ experienceTypeLabel(entity.item.type) }}</span><span v-if="entity.item.location" class="tag">{{ entity.item.location }}</span><span v-if="entity.item.isDemo" class="tag tag--demo">{{ label('common.demo') }}</span></div>
        <h2 id="detail-title" class="mt-3 pr-10 text-3xl">{{ entity.item.role }}</h2>
        <p class="mt-1 text-lg font-semibold text-primary">{{ entity.item.organization }}</p>
        <div v-if="entity.item.description" class="mt-5 grid gap-3 text-fg/80"><p v-for="(t, i) in paragraphs(entity.item.description)" :key="i">{{ t }}</p></div>
        <template v-if="entity.item.missions.length"><h3 class="mt-7 text-lg text-primary">{{ label('journey.missions') }}</h3><ul class="mt-2 grid list-disc gap-1.5 pl-5 text-fg/80"><li v-for="m in entity.item.missions" :key="m">{{ m }}</li></ul></template>
        <template v-if="entity.item.results.length"><h3 class="mt-7 text-lg text-primary">{{ label('journey.results') }}</h3><ul class="mt-2 grid list-disc gap-1.5 pl-5 text-fg/80"><li v-for="r in entity.item.results" :key="r">{{ r }}</li></ul></template>
        <ul v-if="entity.item.technologies.length" class="mt-7 flex flex-wrap gap-2" role="list"><li v-for="tech in entity.item.technologies" :key="tech.name" class="tag !text-[.85rem]"><IconView v-if="tech.icon" :icon="tech.icon" :size="16" :colorize="iconStyle === 'brand'" />{{ tech.name }}</li></ul>
        <Button v-if="safeHref(entity.item.url)" as-child variant="outline" class="mt-7"><a :href="safeHref(entity.item.url)!" target="_blank" rel="noopener noreferrer">{{ label('journey.organization') }}<ExternalLink /></a></Button>
      </template>

      <template v-else-if="entity.kind === 'certification'">
        <img v-if="entity.item.imageUrl" :src="img(entity.item.imageUrl)" :alt="`Certificat ${entity.item.name}`" class="mb-6 max-h-72 w-full rounded-2xl object-contain">
        <div class="flex flex-wrap items-center gap-2"><span v-if="entity.item.category" class="tag">{{ entity.item.category }}</span><span class="tag">{{ label('cert.issuedOn') }} {{ formatMonth(entity.item.issuedAt) }}</span><span v-if="entity.item.expiresAt" class="tag" :class="{ 'tag--draft': isExpired(entity.item.expiresAt) }">{{ isExpired(entity.item.expiresAt) ? label('cert.expiredOn') : label('cert.validUntil') }} {{ formatMonth(entity.item.expiresAt) }}</span><span v-if="entity.item.isDemo" class="tag tag--demo">{{ label('common.demo') }}</span></div>
        <h2 id="detail-title" class="mt-3 pr-10 text-3xl">{{ entity.item.name }}</h2>
        <p class="mt-1 text-lg font-semibold text-primary">{{ entity.item.issuer }}</p>
        <p v-if="entity.item.credentialId" class="mt-3 text-sm text-muted">{{ label('cert.id') }} : <span class="font-bold text-fg">{{ entity.item.credentialId }}</span></p>
        <Button v-if="safeHref(entity.item.verificationUrl)" as-child class="mt-7"><a :href="safeHref(entity.item.verificationUrl)!" target="_blank" rel="noopener noreferrer"><ShieldCheck />{{ label('cert.verify') }}<ExternalLink /></a></Button>
        <p v-else class="mt-7 text-sm text-muted">{{ label('cert.noVerify') }}</p>
      </template>

      <template v-else>
        <img v-if="entity.item.imageUrl" :src="img(entity.item.imageUrl)" :alt="entity.item.title" class="mb-6 max-h-64 w-full rounded-2xl object-cover">
        <div class="flex flex-wrap items-center gap-2"><span v-if="entity.item.category" class="tag">{{ entity.item.category }}</span><span v-if="entity.item.achievedAt" class="tag">{{ formatMonth(entity.item.achievedAt) }}</span><span v-if="entity.item.isDemo" class="tag tag--demo">{{ label('common.demo') }}</span></div>
        <h2 id="detail-title" class="mt-3 pr-10 text-3xl">{{ entity.item.title }}</h2>
        <div v-if="entity.item.description" class="mt-5 grid gap-3 text-fg/80"><p v-for="(t, i) in paragraphs(entity.item.description)" :key="i">{{ t }}</p></div>
        <Button v-if="safeHref(entity.item.linkUrl)" as-child variant="outline" class="mt-7"><a :href="safeHref(entity.item.linkUrl)!" target="_blank" rel="noopener noreferrer">{{ label('journey.learnMore') }}<ExternalLink /></a></Button>
      </template>
    </article>
  </dialog>
</template>
