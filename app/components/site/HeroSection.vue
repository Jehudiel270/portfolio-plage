<script setup lang="ts">
import { ArrowRight, Download } from 'lucide-vue-next'
import { safeHref } from '#shared/utils/template'
import { Button } from '~/components/ui/button'
import type { OceanEngine } from '~/scene/ocean/OceanEngine'

const portfolio = usePortfolio()
const { t } = useUi()
const { reduced } = useMotion()
const content = computed(() => portfolio.value.settings.content)
const canvas = ref<HTMLCanvasElement | null>(null)
const root = ref<HTMLElement | null>(null)
const ready = ref(false)
let engine: OceanEngine | null = null
let trigger: { kill(): void } | null = null
let visibility: IntersectionObserver | null = null

function teardown(): void {
  trigger?.kill(); trigger = null
  visibility?.disconnect(); visibility = null
  engine?.dispose(); engine = null
  ready.value = false
}

/** Décor 3D de l'accueil : océan stylisé relié au défilement (GSAP ScrollTrigger) ; l'accueil reste lisible sans WebGL. */
async function boot(): Promise<void> {
  teardown()
  const effects = portfolio.value.settings.effects
  if (!effects.hero3d || !canvas.value || !root.value) return
  const { OceanEngine, webglAvailable } = await import('~/scene/ocean/OceanEngine')
  if (!webglAvailable() || !canvas.value || !root.value) return
  try {
    engine = new OceanEngine({ canvas: canvas.value, mode: 'hero', theme: portfolio.value.settings.theme, effects: { ...effects }, reduced: reduced.value })
    engine.start()
    ready.value = true
  } catch (error) {
    console.warn('[3D] décor de l’accueil indisponible, repli sur le dégradé CSS :', error)
    teardown()
    return
  }
  visibility = new IntersectionObserver(([entry]) => engine?.setPaused(!entry?.isIntersecting))
  visibility.observe(root.value)
  if (!reduced.value) {
    const [{ default: gsap }, { ScrollTrigger }] = await Promise.all([import('gsap'), import('gsap/ScrollTrigger')])
    gsap.registerPlugin(ScrollTrigger)
    trigger = ScrollTrigger.create({ trigger: root.value, start: 'top top', end: 'bottom top', scrub: true, onUpdate: (self) => engine?.setScroll(self.progress) })
  }
}

onMounted(() => { void boot() })
watch(reduced, () => { void boot() })
watch(() => portfolio.value.settings.effects.hero3d, () => { void boot() })
watch(() => portfolio.value.settings.theme, (theme) => engine?.setTheme(theme), { deep: true })
watch(() => portfolio.value.settings.effects, (effects) => engine?.applyEffects({ ...effects }), { deep: true })
onBeforeUnmount(teardown)

function jump(id: string): void {
  if (id === 'contact' && !portfolio.value.sections.includes('contact')) { void navigateTo('/contact'); return }
  document.getElementById(id)?.scrollIntoView({ behavior: reduced.value ? 'auto' : 'smooth', block: 'start' })
}
const hasProjects = computed(() => portfolio.value.sections.includes('projects'))
</script>

<template>
  <section id="hero" ref="root" class="hero" aria-labelledby="hero-title">
    <div class="hero__sun transition-opacity duration-1000" :class="{ 'opacity-0': ready }" aria-hidden="true" />
    <canvas ref="canvas" class="hero__canvas" :class="{ 'is-ready': ready }" aria-hidden="true" />
    <div class="container-page relative pb-28 pt-8 sm:pb-36">
      <div class="max-w-2xl">
        <p v-reveal class="tag mb-5 !bg-white/60 !text-fg backdrop-blur">{{ content.title }}</p>
        <h1 id="hero-title" v-reveal="80" class="hero-name">{{ content.name }}</h1>
        <p v-reveal="160" class="mt-6 max-w-xl text-xl font-semibold leading-snug sm:text-2xl">{{ content.tagline }}</p>
        <p v-if="content.intro" v-reveal="240" class="mt-3 max-w-xl text-lg text-fg/75">{{ content.intro }}</p>
        <div v-reveal="320" class="mt-9 flex flex-wrap items-center gap-3">
          <Button v-if="hasProjects" size="lg" @click="jump('projects')">{{ t('hero.cta.projects') }}<ArrowRight /></Button>
          <Button size="lg" :variant="hasProjects ? 'glass' : 'default'" @click="jump('contact')">{{ t('hero.cta.contact') }}</Button>
          <Button v-if="safeHref(content.resumeUrl)" as-child size="lg" variant="ghost"><a :href="safeHref(content.resumeUrl)!" target="_blank" rel="noopener noreferrer"><Download />{{ t('hero.resume') }}</a></Button>
        </div>
      </div>
    </div>
    <svg class="wave-divider absolute inset-x-0 bottom-0" viewBox="0 0 1440 120" preserveAspectRatio="none" aria-hidden="true"><path d="M0,70 C180,118 360,12 600,52 C840,92 1000,10 1200,46 C1320,68 1400,60 1440,56 L1440,120 L0,120 Z" fill="var(--bg)" /></svg>
  </section>
</template>
