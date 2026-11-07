<script setup lang="ts">
import { Download, FileUp, Upload } from 'lucide-vue-next'
import { ENTITY_DEFAULTS, type EntityKey } from '#shared/schemas/entities'
import { Button } from '~/components/ui/button'
import { ENTITY_META } from '~/utils/admin-entities'

/** Ajout rapide (une ligne = un élément) et import/export CSV ou JSON, avec vérification ligne par ligne avant création. */
const props = defineProps<{ entity: EntityKey; mode: 'quick' | 'import' | null }>()
const emit = defineEmits<{ close: []; done: [] }>()
interface RowResult { index: number; ok: boolean; errors?: Record<string, string> }
const meta = computed(() => ENTITY_META[props.entity])
const toasts = useToasts()
const dialog = ref<HTMLDialogElement | null>(null)
const text = ref('')
const csv = ref('')
const fileName = ref('')
const rows = ref<Record<string, unknown>[] | null>(null)
const results = ref<RowResult[] | null>(null)
const busy = ref(false)

watch(() => props.mode, (mode) => {
  if (mode) { text.value = ''; csv.value = ''; fileName.value = ''; rows.value = null; results.value = null; dialog.value?.showModal() } else if (dialog.value?.open) dialog.value.close()
})

function quickRows(): Record<string, unknown>[] {
  const field = meta.value.quickAdd?.field ?? 'title'
  return text.value.split('\n').map((l) => l.trim()).filter(Boolean).map((line) => {
    const [name = '', category = ''] = line.split(/\s*;\s*|\s*\|\s*|\t/)
    return { [field]: name.trim(), ...(category.trim() && 'category' in ENTITY_DEFAULTS[props.entity] ? { category: category.trim() } : {}) }
  })
}
async function onFile(event: Event): Promise<void> {
  const file = (event.target as HTMLInputElement).files?.[0]
  if (!file) return
  fileName.value = file.name
  const content = await file.text()
  results.value = null
  if (file.name.toLowerCase().endsWith('.json')) {
    try { const parsed = JSON.parse(content) as unknown; rows.value = Array.isArray(parsed) ? (parsed as Record<string, unknown>[]) : null; csv.value = ''; if (!rows.value) toasts.error('Le JSON doit être une liste d’objets.') } catch { toasts.error('JSON invalide.') }
  } else { csv.value = content; rows.value = null }
}
const payload = (dryRun: boolean): Record<string, unknown> => ({ ...(props.mode === 'quick' ? { rows: quickRows() } : rows.value ? { rows: rows.value } : { csv: csv.value }), dryRun, autoIcons: props.entity === 'skills' })

async function run(dryRun: boolean): Promise<void> {
  busy.value = true
  try {
    const response = await adminFetch<{ created: number; failed: number; results: RowResult[] }>(`/api/admin/content/${props.entity}/import`, { method: 'POST', body: payload(dryRun) })
    results.value = response.results
    if (!dryRun) { toasts.ok(`${response.created} élément(s) créé(s)${response.failed ? `, ${response.failed} ignoré(s)` : ''}.`); emit('done'); emit('close') }
  } catch (error) { toasts.error(parseApiError(error).message) } finally { busy.value = false }
}

async function download(format: 'csv' | 'json'): Promise<void> {
  try {
    const content = await adminFetch<string>(`/api/admin/content/${props.entity}/export`, { query: { format } })
    const blob = new Blob([typeof content === 'string' ? content : JSON.stringify(content, null, 2)], { type: format === 'csv' ? 'text/csv;charset=utf-8' : 'application/json' })
    const link = document.createElement('a')
    link.href = URL.createObjectURL(blob)
    link.download = `${props.entity}.${format}`
    link.click()
    URL.revokeObjectURL(link.href)
  } catch (error) { toasts.error(parseApiError(error).message) }
}
const template = (): void => {
  const header = Object.keys(ENTITY_DEFAULTS[props.entity]).filter((k) => k !== 'gallery').join(';')
  const link = document.createElement('a')
  link.href = URL.createObjectURL(new Blob([`\uFEFF${header}\r\n`], { type: 'text/csv;charset=utf-8' }))
  link.download = `modele-${props.entity}.csv`
  link.click()
  URL.revokeObjectURL(link.href)
}
const okCount = computed(() => results.value?.filter((r) => r.ok).length ?? 0)
const ready = computed(() => (props.mode === 'quick' ? text.value.trim().length > 0 : Boolean(rows.value?.length || csv.value.trim())))
</script>

<template>
  <dialog ref="dialog" class="m-auto max-h-[92svh] w-[min(46rem,calc(100vw-1rem))] rounded-2xl border border-line bg-surface p-0 text-fg backdrop:bg-[rgb(5_20_30/.55)]" aria-labelledby="bulk-title" @close="emit('close')">
    <div class="flex max-h-[92svh] flex-col">
      <header class="flex items-center justify-between gap-3 border-b border-line px-6 py-4"><h2 id="bulk-title" class="font-display text-lg font-bold">{{ mode === 'quick' ? `Ajout rapide : ${meta.label.toLowerCase()}` : `Importer / exporter : ${meta.label.toLowerCase()}` }}</h2><Button type="button" variant="ghost" size="sm" @click="dialog?.close()">Fermer</Button></header>
      <div class="grid gap-5 overflow-y-auto px-6 py-5">
        <template v-if="mode === 'quick'">
          <p class="text-sm text-muted">{{ meta.quickAdd?.hint }}</p>
          <textarea v-model="text" class="admin-input font-mono" rows="9" :placeholder="entity === 'skills' ? 'TypeScript ; Interface\nVue.js ; Interface\nDocker ; Outils' : 'Un élément par ligne'" aria-label="Liste à ajouter" />
        </template>
        <template v-else>
          <div class="grid gap-3 rounded-xl border border-dashed border-line p-4">
            <p class="text-sm font-semibold">Importer un fichier CSV (séparateur « ; ») ou JSON</p>
            <div class="flex flex-wrap items-center gap-3"><label class="inline-flex cursor-pointer items-center gap-2 rounded-full bg-primary/10 px-4 py-2 text-sm font-bold text-primary transition hover:bg-primary/16"><FileUp class="size-4" />Choisir un fichier<input type="file" accept=".csv,.json,.txt" class="sr-only" @change="onFile"></label><span v-if="fileName" class="text-sm text-muted">{{ fileName }}</span></div>
            <p class="text-xs text-muted">Les colonnes sont celles de l’export. Listes séparées par « | », booléens « true/false ». Chaque ligne est vérifiée avant toute création.</p>
          </div>
          <div class="flex flex-wrap gap-2"><Button type="button" size="sm" variant="soft" @click="download('csv')"><Download />Exporter en CSV</Button><Button type="button" size="sm" variant="soft" @click="download('json')"><Download />Exporter en JSON</Button><Button type="button" size="sm" variant="ghost" @click="template">Télécharger un modèle CSV</Button></div>
        </template>

        <div v-if="results" class="rounded-xl border border-line">
          <p class="border-b border-line px-4 py-2 text-sm font-bold" role="status">{{ okCount }} ligne(s) valide(s) sur {{ results.length }}</p>
          <ul class="max-h-56 divide-y divide-line overflow-y-auto text-sm"><li v-for="r in results" :key="r.index" class="flex gap-3 px-4 py-2"><span class="w-14 shrink-0 font-semibold text-muted">Ligne {{ r.index + 1 }}</span><span v-if="r.ok" class="font-bold text-ok">Valide</span><span v-else class="text-danger"><template v-for="(msg, field) in r.errors" :key="field">{{ field }} : {{ msg }} </template></span></li></ul>
        </div>
      </div>
      <footer class="flex flex-wrap justify-end gap-2 border-t border-line px-6 py-4">
        <Button type="button" variant="outline" :disabled="busy || !ready" @click="run(true)">Vérifier</Button>
        <Button type="button" :disabled="busy || !ready || (results !== null && okCount === 0)" @click="run(false)"><Upload />{{ results ? `Importer ${okCount} ligne(s)` : 'Importer' }}</Button>
      </footer>
    </div>
  </dialog>
</template>
