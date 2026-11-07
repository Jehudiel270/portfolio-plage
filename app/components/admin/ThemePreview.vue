<script setup lang="ts">
import { contrastRatio } from '#shared/icons'
import type { EffectsSettings, ThemeSettings } from '#shared/schemas/settings'
import type { OceanEngine } from '~/scene/ocean/OceanEngine'
import { themeToCssVars } from '~/utils/theme'

/** Aperçu en direct : accueil (océan 3D réel + HTML) réagissant au brouillon de palette, sans rien enregistrer. */
const props = defineProps<{ theme: ThemeSettings; effects: EffectsSettings }>()
const canvas = ref<HTMLCanvasElement | null>(null)
const failed = ref(false)
const style = computed(() => themeToCssVars(props.theme))
let engine: OceanEngine | null = null
onMounted(async () => {
  try {
    const { OceanEngine, webglAvailable } = await import('~/scene/ocean/OceanEngine')
    if (!webglAvailable() || !canvas.value) { failed.value = true; return }
    engine = new OceanEngine({ canvas: canvas.value, mode: 'hero', theme: props.theme, effects: { ...props.effects }, reduced: false })
    engine.start()
  } catch { failed.value = true }
})
watch(() => props.theme, (theme) => engine?.setTheme(theme), { deep: true })
onBeforeUnmount(() => engine?.dispose())
const checks = computed(() => [
  ['Texte sur fond', contrastRatio(props.theme.text, props.theme.background)],
  ['Texte secondaire sur fond', contrastRatio(props.theme.textMuted, props.theme.background)],
  ['Couleur principale sur cartes', contrastRatio(props.theme.primary, props.theme.surface)],
] as const)
</script>

<template>
  <div class="grid gap-3">
    <div class="overflow-hidden rounded-2xl border border-line" :style="{ ...style, background: 'var(--bg)', color: 'var(--fg)' }">
      <div class="relative aspect-[16/10] overflow-hidden" :style="{ background: 'linear-gradient(180deg, var(--sky), var(--sea-shallow) 70%, var(--sea-deep))' }">
        <canvas ref="canvas" class="absolute inset-0 size-full" aria-label="Aperçu 3D de la palette" role="img" />
        <p v-if="failed" class="absolute inset-0 grid place-items-center p-4 text-center text-xs" style="color: var(--fg)">Aperçu 3D indisponible (WebGL) : l’aperçu HTML reste valable.</p>
        <div class="absolute inset-x-0 bottom-0 grid gap-1 p-4"><p class="font-display text-2xl font-bold" style="color: var(--fg)">Votre Nom</p><p class="text-sm font-semibold" style="color: var(--fg)">Développeur Full-Stack</p></div>
      </div>
      <div class="grid gap-3 p-4" :style="{ background: 'var(--bg)' }">
        <div class="flex flex-wrap gap-2"><span class="rounded-full px-4 py-1.5 text-xs font-bold" :style="{ background: 'var(--primary)', color: 'var(--on-primary)' }">Bouton principal</span><span class="rounded-full px-4 py-1.5 text-xs font-bold" :style="{ background: 'var(--accent)', color: 'var(--on-accent)' }">Accent</span><span class="rounded-full border px-4 py-1.5 text-xs font-bold" :style="{ borderColor: 'var(--primary)', color: 'var(--primary)' }">Contour</span></div>
        <div class="rounded-xl border p-3" :style="{ background: 'var(--surface)', borderColor: 'var(--line)' }"><p class="text-sm font-bold" style="color: var(--fg)">Carte d’exemple</p><p class="text-xs" style="color: var(--fg-muted)">Texte secondaire, dates et légendes.</p></div>
        <div class="h-2 rounded-full" :style="{ background: 'linear-gradient(90deg, var(--primary), var(--accent), var(--sun))' }" />
      </div>
    </div>
    <ul class="grid gap-1.5 text-xs" aria-label="Contrastes d’accessibilité"><li v-for="[name, ratio] in checks" :key="name" class="flex items-center justify-between rounded-lg bg-fg/5 px-3 py-1.5"><span>{{ name }}</span><span class="font-bold" :class="ratio >= 4.5 ? 'text-ok' : ratio >= 3 ? 'text-warn' : 'text-danger'">{{ ratio.toFixed(1) }} : 1 {{ ratio >= 4.5 ? '✓ lisible' : ratio >= 3 ? '⚠ limite' : '✗ trop faible' }}</span></li></ul>
  </div>
</template>
