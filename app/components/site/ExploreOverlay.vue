<script setup lang="ts">
import { List, X } from 'lucide-vue-next'
import { Button } from '~/components/ui/button'
import type { OceanEngine, OceanItem } from '~/scene/ocean/OceanEngine'

/** « Explorer en 3D » : plein écran, sans les textes de la page. Les éléments flottent sur la mer ; la liste reste accessible au clavier. */
const portfolio = usePortfolio()
const { t } = useUi()
const { reduced } = useMotion()
const explore = useExplore()
const selection = useSelection()
const dialog = ref<HTMLDialogElement | null>(null)
const canvas = ref<HTMLCanvasElement | null>(null)
const loading = ref(true)
const unsupported = ref(false)
const tooltip = ref<{ label: string; x: number; y: number } | null>(null)
let engine: OceanEngine | null = null

const items = computed<OceanItem[]>(() => (explore.value === 'projects'
  ? portfolio.value.projects.map((p) => ({ id: p.id, label: p.title, color: p.color, icon: null }))
  : portfolio.value.skills.map((s) => ({ id: s.id, label: s.name, color: s.color, icon: s.icon }))))
const title = computed(() => (explore.value === 'projects' ? t('explore.projects') : t('explore.skills')))
const labelOf = (id: number): string => items.value.find((i) => i.id === id)?.label ?? ''

function open(id: number): void { selection.value = { kind: explore.value === 'projects' ? 'project' : 'skill', id } }
function close(): void { dialog.value?.close() }
function toList(): void {
  const target = explore.value === 'projects' ? 'projects' : 'skills'
  close()
  nextTick(() => document.getElementById(target)?.scrollIntoView({ behavior: reduced.value ? 'auto' : 'smooth' }))
}

async function start(): Promise<void> {
  loading.value = true
  unsupported.value = false
  await nextTick()
  const { OceanEngine, webglAvailable } = await import('~/scene/ocean/OceanEngine')
  if (!canvas.value || !explore.value) return
  if (!webglAvailable()) { unsupported.value = true; loading.value = false; return }
  try {
    engine = new OceanEngine({
      canvas: canvas.value, mode: 'explore', kind: explore.value, theme: portfolio.value.settings.theme, effects: { ...portfolio.value.settings.effects }, reduced: reduced.value, items: items.value,
      onHover: (hit) => { tooltip.value = hit ? { label: labelOf(hit.id), x: hit.x, y: hit.y } : null },
      onPick: open,
    })
    engine.start()
  } catch (error) {
    console.warn('[3D] exploration indisponible :', error)
    unsupported.value = true
  }
  loading.value = false
}
function stop(): void { engine?.dispose(); engine = null; tooltip.value = null }

watch(explore, async (kind) => {
  await nextTick()
  const el = dialog.value
  if (!el) return
  if (kind && !el.open) { el.showModal(); document.documentElement.classList.add('modal-open'); await start() }
  if (!kind && el.open) el.close()
})
function onClosed(): void { stop(); document.documentElement.classList.remove('modal-open'); explore.value = null }
watch(() => portfolio.value.settings.theme, (theme) => engine?.setTheme(theme), { deep: true })
onBeforeUnmount(stop)
</script>

<template>
  <dialog ref="dialog" class="explore" :aria-label="t('explore.title')" @close="onClosed">
    <canvas v-if="explore" ref="canvas" class="explore__canvas" :aria-label="title" tabindex="-1" />
    <div class="pointer-events-none absolute inset-x-0 top-0 flex flex-wrap items-start justify-between gap-3 p-4 sm:p-6">
      <div class="card pointer-events-auto max-w-md px-5 py-3"><h2 class="font-display text-xl font-bold">{{ title }}</h2><p class="text-sm text-muted">{{ t('explore.hint') }}</p></div>
      <div class="pointer-events-auto flex gap-2"><Button variant="glass" @click="toList"><List />{{ t('explore.list') }}</Button><Button @click="close"><X />{{ t('explore.quit') }}</Button></div>
    </div>
    <p v-if="loading" class="absolute inset-0 grid place-items-center text-lg font-bold text-fg/70" role="status">{{ t('explore.loading') }}</p>
    <p v-if="unsupported" class="card absolute left-1/2 top-1/2 max-w-sm -translate-x-1/2 -translate-y-1/2 p-6 text-center" role="alert">{{ t('explore.unsupported') }}</p>
    <div v-if="tooltip" class="pointer-events-none absolute z-10 -translate-x-1/2 rounded-full bg-white px-3.5 py-1.5 text-sm font-bold text-[#0e2a3b] shadow-lg" :style="{ left: `${tooltip.x}px`, top: `${Math.max(12, tooltip.y - 46)}px` }">{{ tooltip.label }}</div>
    <ul class="absolute inset-x-0 bottom-0 flex max-h-40 flex-wrap justify-center gap-2 overflow-y-auto bg-white/85 p-4 opacity-0 backdrop-blur transition-opacity focus-within:opacity-100" :aria-label="title">
      <li v-for="item in items" :key="item.id"><button type="button" class="chip" @focus="engine?.highlight(item.id)" @blur="engine?.highlight(null)" @click="open(item.id)">{{ item.label }}</button></li>
    </ul>
  </dialog>
</template>
