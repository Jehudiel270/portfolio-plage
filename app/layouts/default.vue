<script setup lang="ts">
import { optimizeCloudinaryUrl } from '#shared/utils/cloudinary'
import { themeToCss } from '~/utils/theme'

const portfolio = usePortfolio()
const error = useState('portfolio-error', () => '')
const { t } = useUi()
const route = useRoute()
const content = computed(() => portfolio.value?.settings.content)
const seo = computed(() => portfolio.value?.settings.seo)
const siteUrl = useRuntimeConfig().public.siteUrl as string
const canonical = computed(() => (siteUrl ? `${siteUrl.replace(/\/$/, '')}${route.path === '/' ? '' : route.path}` : undefined))
const ogImage = computed(() => {
  const url = seo.value?.ogImageUrl
  const absolute = url ? optimizeCloudinaryUrl(url, { width: 1200, height: 630, crop: 'fill' }) : '/og-default.png'
  return absolute.startsWith('http') || !siteUrl ? absolute : `${siteUrl.replace(/\/$/, '')}${absolute}`
})

useHead(() => ({
  style: portfolio.value ? [{ key: 'site-theme', innerHTML: themeToCss(portfolio.value.settings.theme) }] : [],
  link: canonical.value ? [{ rel: 'canonical', href: canonical.value }] : [],
  noscript: [{ innerHTML: '<style>.reveal{opacity:1!important;transform:none!important}.hero__canvas{display:none}</style>' }],
  script: content.value ? [{ type: 'application/ld+json', innerHTML: JSON.stringify({ '@context': 'https://schema.org', '@type': 'Person', name: content.value.name, jobTitle: content.value.title, description: content.value.tagline || content.value.intro, url: siteUrl || undefined, sameAs: portfolio.value.settings.social.map((s) => s.url) }).replace(/</g, '\\u003c') }] : [],
}))
useSeoMeta({
  title: () => (content.value ? `${content.value.name} — ${content.value.title}` : 'Portfolio'),
  description: () => content.value?.tagline || content.value?.intro || '',
  ogTitle: () => (content.value ? `${content.value.name} — ${content.value.title}` : 'Portfolio'),
  ogDescription: () => content.value?.tagline || content.value?.intro || '',
  ogType: 'website', ogImage: () => ogImage.value, twitterCard: 'summary_large_image', twitterImage: () => ogImage.value,
  robots: () => (seo.value?.indexable === false ? 'noindex, nofollow' : 'index, follow'),
})
function skip(): void {
  const first = portfolio.value.sections[0]
  document.getElementById(first ?? 'contenu')?.scrollIntoView()
  document.getElementById('contenu')?.focus({ preventScroll: true })
}
</script>

<template>
  <div v-if="portfolio">
    <a href="#contenu" class="skip-link" @click.prevent="skip">{{ t('nav.skip') }}</a>
    <SiteHeader />
    <main id="contenu" tabindex="-1" class="outline-none"><slot /></main>
    <SiteFooter />
    <ContactWidget />
    <DemoBanner />
    <DetailModal />
    <ExploreOverlay />
  </div>
  <div v-else class="grid min-h-svh place-items-center p-8 text-center">
    <div class="card max-w-md p-8"><h1 class="text-2xl">Le portfolio est momentanément indisponible</h1><p class="mt-3 text-muted">{{ error || 'Les données n’ont pas pu être chargées.' }} Réessayez dans un instant.</p></div>
  </div>
</template>
