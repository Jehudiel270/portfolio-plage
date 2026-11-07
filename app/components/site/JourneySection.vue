<script setup lang="ts">
import { Award, Briefcase, ExternalLink, GraduationCap, ShieldCheck, Trophy } from 'lucide-vue-next'
import type { JourneyTab } from '#shared/constants'
import { optimizeCloudinaryUrl } from '#shared/utils/cloudinary'
import { safeHref } from '#shared/utils/template'
import { experienceTypeLabel } from '~/utils/admin-labels'
import { formatMonth, formatRange, isExpired } from '~/utils/format'

const portfolio = usePortfolio()
const { t } = useUi()
const selection = useSelection()
const config = computed(() => portfolio.value.settings.sections.journey)
const journey = computed(() => portfolio.value.settings.journey)
const display = computed(() => portfolio.value.settings.display)
const tabs = computed(() => portfolio.value.journeyTabs)
const current = ref<JourneyTab>(tabs.value.includes(journey.value.defaultTab) ? journey.value.defaultTab : (tabs.value[0] ?? 'experiences'))
watch(tabs, (list) => { if (!list.includes(current.value)) current.value = list[0] ?? 'experiences' })
const label = (tab: JourneyTab): string => journey.value.tabs[tab].label
const tabRefs = ref<HTMLElement[]>([])
function onKey(event: KeyboardEvent, index: number): void {
  const next = event.key === 'ArrowRight' ? index + 1 : event.key === 'ArrowLeft' ? index - 1 : event.key === 'Home' ? 0 : event.key === 'End' ? tabs.value.length - 1 : null
  if (next === null) return
  event.preventDefault()
  const target = (next + tabs.value.length) % tabs.value.length
  current.value = tabs.value[target]!
  tabRefs.value[target]?.focus()
}
const logo = (url: string | null): string | null => (url ? optimizeCloudinaryUrl(url, { width: 112, height: 112, crop: 'fit' }) : null)
</script>

<template>
  <section id="journey" class="section section--alt" aria-labelledby="journey-title">
    <div class="container-page">
      <SectionHead id="journey" :title="config.title" :intro="config.intro" />
      <p v-if="!tabs.length" class="card p-6 text-muted">{{ config.emptyText || t('common.empty') }}</p>
      <template v-else>
        <div v-reveal class="mb-8 flex flex-wrap gap-2" role="tablist" :aria-label="t('journey.tabs')">
          <button v-for="(tab, index) in tabs" :id="`tab-${tab}`" :key="tab" :ref="(el) => { if (el) tabRefs[index] = el as HTMLElement }" type="button" role="tab" class="chip !px-5 !py-2" :aria-selected="current === tab" :aria-controls="`panel-${tab}`" :tabindex="current === tab ? 0 : -1" @click="current = tab" @keydown="onKey($event, index)">{{ label(tab) }}</button>
        </div>

        <div v-if="current === 'experiences'" id="panel-experiences" role="tabpanel" aria-labelledby="tab-experiences">
          <ol class="timeline">
            <li v-for="(item, index) in portfolio.experiences" :key="item.id" v-reveal="index * 60" class="relative">
              <span class="timeline__dot" :class="{ 'timeline__dot--now': item.isCurrent }" aria-hidden="true" />
              <article class="card card--link relative p-5 sm:p-6">
                <div class="flex items-start gap-4">
                  <span class="icon-tile size-14"><img v-if="logo(item.imageUrl)" :src="logo(item.imageUrl)!" alt="" class="size-10 object-contain" loading="lazy"><Briefcase v-else class="size-6 text-primary" aria-hidden="true" /></span>
                  <div class="min-w-0 flex-1">
                    <h3 class="text-xl"><button type="button" class="text-left after:absolute after:inset-0 after:content-['']" :aria-label="`${item.role}, ${item.organization} — ${t('common.openCard')}`" @click="selection = { kind: 'experience', id: item.id }">{{ item.role }}</button></h3>
                    <p class="font-semibold text-primary">{{ item.organization }}<span v-if="item.location" class="font-normal text-muted"> · {{ item.location }}</span></p>
                    <p class="mt-1 flex flex-wrap items-center gap-2 text-sm text-muted"><span>{{ formatRange(item.startDate, item.endDate, item.isCurrent, t('common.current')) }}</span><span class="tag">{{ experienceTypeLabel(item.type) }}</span><span v-if="item.isDemo" class="tag tag--demo">{{ t('common.demo') }}</span><span v-if="item.hidden" class="tag tag--draft">{{ t('common.hidden') }}</span></p>
                  </div>
                </div>
                <p v-if="item.description" class="mt-3 line-clamp-3 text-[.97rem] text-fg/80">{{ item.description }}</p>
                <ul v-if="item.technologies.length" class="mt-3 flex flex-wrap gap-1.5" role="list"><li v-for="tech in item.technologies.slice(0, 8)" :key="tech.name" class="tag !bg-fg/6 !text-fg/80"><IconView v-if="display.showTechIcons && tech.icon" :icon="tech.icon" :size="14" :colorize="display.iconStyle === 'brand'" />{{ tech.name }}</li></ul>
              </article>
            </li>
          </ol>
        </div>

        <div v-else-if="current === 'education'" id="panel-education" role="tabpanel" aria-labelledby="tab-education">
          <ol class="timeline">
            <li v-for="(item, index) in portfolio.education" :key="item.id" v-reveal="index * 60" class="relative">
              <span class="timeline__dot" :class="{ 'timeline__dot--now': item.isCurrent }" aria-hidden="true" />
              <article class="card card--link relative p-5 sm:p-6">
                <div class="flex items-start gap-4">
                  <span class="icon-tile size-14"><img v-if="logo(item.imageUrl)" :src="logo(item.imageUrl)!" alt="" class="size-10 object-contain" loading="lazy"><GraduationCap v-else class="size-6 text-primary" aria-hidden="true" /></span>
                  <div class="min-w-0 flex-1">
                    <h3 class="text-xl"><button type="button" class="text-left after:absolute after:inset-0 after:content-['']" :aria-label="`${item.title}, ${item.institution} — ${t('common.openCard')}`" @click="selection = { kind: 'education', id: item.id }">{{ item.title }}</button></h3>
                    <p class="font-semibold text-primary">{{ item.institution }}<span v-if="item.degree" class="font-normal text-muted"> · {{ item.degree }}</span></p>
                    <p class="mt-1 flex flex-wrap items-center gap-2 text-sm text-muted"><span>{{ formatRange(item.startDate, item.endDate, item.isCurrent, t('common.current')) }}</span><span v-if="item.field" class="tag">{{ item.field }}</span><span v-if="item.isDemo" class="tag tag--demo">{{ t('common.demo') }}</span><span v-if="item.hidden" class="tag tag--draft">{{ t('common.hidden') }}</span></p>
                  </div>
                </div>
                <p v-if="item.description" class="mt-3 line-clamp-3 text-[.97rem] text-fg/80">{{ item.description }}</p>
              </article>
            </li>
          </ol>
        </div>

        <ul v-else-if="current === 'certifications'" id="panel-certifications" role="tabpanel" aria-labelledby="tab-certifications" class="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          <li v-for="(item, index) in portfolio.certifications" :key="item.id" v-reveal="(index % 3) * 70" class="card card--link relative flex flex-col gap-3 p-5">
            <div class="flex items-start gap-3">
              <span class="icon-tile size-12"><img v-if="logo(item.imageUrl)" :src="logo(item.imageUrl)!" :alt="`Certificat ${item.name}`" class="size-9 object-contain" loading="lazy"><Award v-else class="size-6 text-accent" aria-hidden="true" /></span>
              <div class="min-w-0"><h3 class="text-lg leading-snug"><button type="button" class="text-left after:absolute after:inset-0 after:content-['']" :aria-label="`${item.name} — ${t('common.openCard')}`" @click="selection = { kind: 'certification', id: item.id }">{{ item.name }}</button></h3><p class="text-sm font-semibold text-primary">{{ item.issuer }}</p></div>
            </div>
            <p class="flex flex-wrap items-center gap-2 text-sm text-muted"><span>{{ t('cert.issuedOn') }} {{ formatMonth(item.issuedAt) }}</span><span v-if="item.category" class="tag">{{ item.category }}</span><span v-if="item.expiresAt && isExpired(item.expiresAt)" class="tag tag--draft">{{ t('cert.expiredOn') }} {{ formatMonth(item.expiresAt) }}</span><span v-if="item.isDemo" class="tag tag--demo">{{ t('common.demo') }}</span></p>
            <a v-if="safeHref(item.verificationUrl)" :href="safeHref(item.verificationUrl)!" target="_blank" rel="noopener noreferrer" class="relative z-10 mt-auto inline-flex w-fit items-center gap-1.5 text-sm font-bold text-primary hover:underline"><ShieldCheck class="size-4" aria-hidden="true" />{{ t('cert.verify') }}<ExternalLink class="size-3.5" aria-hidden="true" /></a>
          </li>
        </ul>

        <ul v-else id="panel-achievements" role="tabpanel" aria-labelledby="tab-achievements" class="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          <li v-for="(item, index) in portfolio.achievements" :key="item.id" v-reveal="(index % 3) * 70" class="card card--link relative flex gap-4 p-5">
            <span class="icon-tile size-12"><IconView v-if="item.icon" :icon="item.icon" :size="24" :colorize="false" class="text-accent" /><img v-else-if="logo(item.imageUrl)" :src="logo(item.imageUrl)!" alt="" class="size-9 object-contain" loading="lazy"><Trophy v-else class="size-6 text-accent" aria-hidden="true" /></span>
            <div class="min-w-0">
              <h3 class="text-lg leading-snug"><button type="button" class="text-left after:absolute after:inset-0 after:content-['']" :aria-label="`${item.title} — ${t('common.openCard')}`" @click="selection = { kind: 'achievement', id: item.id }">{{ item.title }}</button></h3>
              <p class="mt-1 flex flex-wrap items-center gap-2 text-sm text-muted"><span v-if="item.achievedAt">{{ formatMonth(item.achievedAt) }}</span><span v-if="item.category" class="tag">{{ item.category }}</span><span v-if="item.isDemo" class="tag tag--demo">{{ t('common.demo') }}</span></p>
              <p v-if="item.description" class="mt-2 line-clamp-2 text-[.95rem] text-fg/75">{{ item.description }}</p>
            </div>
          </li>
        </ul>
      </template>
    </div>
  </section>
</template>
