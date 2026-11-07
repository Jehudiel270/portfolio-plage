<script setup lang="ts">
import { Menu, SlidersHorizontal, X } from 'lucide-vue-next'
import type { NavEntry } from '#shared/types/portfolio'
import { Switch } from '~/components/ui/switch'

const portfolio = usePortfolio()
const route = useRoute()
const { t } = useUi()
const { reduced, set } = useMotion()
const active = ref('hero')
const solid = ref(false)
const menu = ref<HTMLDialogElement | null>(null)
const settings = ref<HTMLElement | null>(null)
const settingsOpen = ref(false)
const onHome = computed(() => route.path === '/')
const entries = computed(() => portfolio.value.nav)

function go(entry: NavEntry, event: MouseEvent): void {
  menu.value?.close()
  if (!onHome.value || !(entry.href === '/' || entry.href.startsWith('/#'))) return
  event.preventDefault()
  if (entry.id === 'hero') window.scrollTo({ top: 0, behavior: reduced.value ? 'auto' : 'smooth' })
  else document.getElementById(entry.id)?.scrollIntoView({ behavior: reduced.value ? 'auto' : 'smooth', block: 'start' })
}

let observer: IntersectionObserver | null = null
function onScroll(): void { solid.value = window.scrollY > 24 }
function isActive(entry: NavEntry): boolean {
  if (onHome.value) return active.value === entry.id
  return entry.href === route.path || (entry.id === 'projects' && route.path.startsWith('/projets/'))
}
function onDocumentClick(event: MouseEvent): void { if (settingsOpen.value && settings.value && !settings.value.contains(event.target as Node)) settingsOpen.value = false }
function observe(): void {
  observer?.disconnect()
  if (!onHome.value) return
  observer = new IntersectionObserver((list) => { for (const e of list) if (e.isIntersecting) active.value = e.target.id }, { rootMargin: '-42% 0px -52% 0px' })
  for (const entry of entries.value) { const el = document.getElementById(entry.id); if (el) observer.observe(el) }
}
onMounted(() => { onScroll(); window.addEventListener('scroll', onScroll, { passive: true }); document.addEventListener('click', onDocumentClick); observe() })
watch(() => route.path, () => nextTick(observe))
onBeforeUnmount(() => { window.removeEventListener('scroll', onScroll); document.removeEventListener('click', onDocumentClick); observer?.disconnect() })
</script>

<template>
  <header class="site-header" :class="{ 'is-solid': solid || !onHome }">
    <div class="container-page flex h-16 items-center gap-3 sm:h-[4.5rem]">
      <NuxtLink to="/" class="mr-auto truncate rounded-lg font-display text-xl font-bold tracking-tight" @click="go({ id: 'hero', label: '', href: '/' }, $event)">{{ portfolio.settings.content.name }}</NuxtLink>
      <nav :aria-label="t('nav.main')" class="hidden items-center gap-1 lg:flex">
        <NuxtLink v-for="entry in entries" :key="entry.id" :to="entry.href" class="nav-link" :aria-current="isActive(entry) ? 'page' : undefined" @click="go(entry, $event)">{{ entry.label }}</NuxtLink>
      </nav>
      <div v-if="portfolio.settings.navigation.showSettings" ref="settings" class="relative">
        <button type="button" class="grid size-10 place-items-center rounded-full text-fg/80 transition hover:bg-fg/8 hover:text-fg" :aria-expanded="settingsOpen" aria-haspopup="true" :aria-label="t('nav.settings')" @click="settingsOpen = !settingsOpen"><SlidersHorizontal class="size-5" /></button>
        <div v-if="settingsOpen" class="card absolute right-0 top-12 w-64 p-4">
          <label class="flex cursor-pointer items-center justify-between gap-3 text-sm font-semibold"><span>{{ reduced ? t('nav.animationsOff') : t('nav.animationsOn') }}</span><Switch :model-value="!reduced" @update:model-value="set($event ? 'full' : 'reduced')" /></label>
        </div>
      </div>
      <button type="button" class="grid size-10 place-items-center rounded-full transition hover:bg-fg/8 lg:hidden" :aria-label="t('nav.open')" aria-haspopup="dialog" @click="menu?.showModal()"><Menu class="size-6" /></button>
    </div>

    <dialog ref="menu" class="m-0 ml-auto h-svh max-h-none w-[min(22rem,90vw)] border-0 bg-bg p-6 text-fg shadow-2xl backdrop:bg-[rgb(5_20_30/.55)] backdrop:backdrop-blur-sm" :aria-label="t('nav.menu')" @click="(e) => { if (e.target === menu) menu?.close() }">
      <div class="flex items-center justify-between"><span class="font-display text-lg font-bold">{{ t('nav.menu') }}</span><button type="button" class="grid size-10 place-items-center rounded-full hover:bg-fg/8" :aria-label="t('nav.close')" @click="menu?.close()"><X class="size-6" /></button></div>
      <ul class="mt-6 grid gap-1">
        <li v-for="entry in entries" :key="entry.id"><NuxtLink :to="entry.href" class="block rounded-xl px-4 py-3 text-lg font-bold transition hover:bg-primary/8" :class="{ 'bg-primary/10 text-primary': isActive(entry) }" :aria-current="isActive(entry) ? 'page' : undefined" @click="go(entry, $event)">{{ entry.label }}</NuxtLink></li>
      </ul>
    </dialog>
  </header>
</template>
