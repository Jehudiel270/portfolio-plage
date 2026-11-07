<script setup lang="ts">
import { ArrowUp } from 'lucide-vue-next'
import { safeHref } from '#shared/utils/template'

const portfolio = usePortfolio()
const route = useRoute()
const { t } = useUi()
const { reduced } = useMotion()
const settings = computed(() => portfolio.value.settings)
const year = new Date().getFullYear()
const top = (): void => { if (route.path === '/') window.scrollTo({ top: 0, behavior: reduced.value ? 'auto' : 'smooth' }); else void navigateTo('/') }
</script>

<template>
  <footer class="site-footer">
    <svg class="wave-divider" viewBox="0 0 1440 120" preserveAspectRatio="none" aria-hidden="true" style="transform: scaleY(-1); margin-top: -1px; margin-bottom: 0"><path d="M0,70 C180,118 360,12 600,52 C840,92 1000,10 1200,46 C1320,68 1400,60 1440,56 L1440,120 L0,120 Z" fill="var(--bg)" /></svg>
    <div class="container-page grid gap-8 pb-10 pt-6 md:grid-cols-[1.4fr_1fr_1fr]">
      <div><p class="font-display text-2xl font-bold">{{ settings.content.name }}</p><p class="mt-1 opacity-80">{{ settings.content.title }}</p><p v-if="settings.content.footerNote" class="mt-3 max-w-sm text-sm opacity-75">{{ settings.content.footerNote }}</p></div>
      <nav :aria-label="t('nav.main')"><p class="mb-3 text-sm font-bold opacity-70">{{ t('nav.menu') }}</p><ul class="grid gap-2 text-[.97rem]"><li v-for="entry in portfolio.nav" :key="entry.id"><NuxtLink :to="entry.href">{{ entry.label }}</NuxtLink></li></ul></nav>
      <div><p class="mb-3 text-sm font-bold opacity-70">{{ t('about.links') }}</p>
        <ul class="grid gap-2 text-[.97rem]"><li v-for="item in settings.social" :key="item.url"><a :href="safeHref(item.url) ?? '#'" target="_blank" rel="noopener noreferrer">{{ item.label || item.platform }}</a></li><li v-if="settings.content.publicEmail && settings.contact.showEmailLink"><a :href="`mailto:${settings.content.publicEmail}`">{{ settings.content.publicEmail }}</a></li></ul></div>
    </div>
    <div class="border-t border-white/15"><div class="container-page flex flex-wrap items-center justify-between gap-3 py-5 text-sm opacity-85">
      <p>© {{ year }} {{ settings.content.name }} · {{ t('footer.rights') }}<template v-if="settings.privacy.enabled"> · <NuxtLink to="/confidentialite">{{ t('footer.privacy') }}</NuxtLink></template></p>
      <button type="button" class="inline-flex items-center gap-2 rounded-full border border-white/30 px-4 py-1.5 font-bold transition hover:bg-white/10" @click="top"><ArrowUp class="size-4" aria-hidden="true" />{{ t('footer.top') }}</button>
    </div></div>
  </footer>
</template>
