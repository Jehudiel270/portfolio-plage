<script setup lang="ts">
import { ArrowDown, ArrowUp, Eye, EyeOff, FileUp, ListPlus, Pencil, Plus, Search, Star, Tag, Trash2 } from 'lucide-vue-next'
import { ENTITY_DEFAULTS, ENTITY_SCHEMAS, type EntityKey } from '#shared/schemas/entities'
import { optimizeCloudinaryUrl } from '#shared/utils/cloudinary'
import type { PublicPortfolio, Selection } from '#shared/types/portfolio'
import { slugify } from '#shared/utils/slug'
import { Button } from '~/components/ui/button'
import { ENTITY_META } from '~/utils/admin-entities'
import { buildPreview } from '~/utils/admin-preview'

/** Gestion complète d'un type de contenu : liste, recherche, filtres, sélection multiple et actions en masse, import/export, édition, aperçu, suppression confirmée. */
const props = defineProps<{ entity: EntityKey }>()
type Row = Record<string, unknown> & { id: number }
const meta = computed(() => ENTITY_META[props.entity])
const toasts = useToasts()
const { load: loadCategories, byScope } = useAdminCategories()
const confirm = ref<{ ask: (o: { title: string; message: string; confirmLabel?: string; danger?: boolean }) => Promise<boolean> } | null>(null)
const items = ref<Row[]>([])
const loading = ref(true)
const loadError = ref('')
const query = ref('')
const filter = ref('')
const publication = ref<'all' | 'on' | 'off'>('all')
const selected = ref<Set<number>>(new Set())
const bulkCategory = ref('')
const bulkMode = ref<'quick' | 'import' | null>(null)
const editor = ref<HTMLDialogElement | null>(null)
const editingId = ref<number | 'new' | null>(null)
const form = ref<Record<string, unknown>>({})
const errors = ref<Record<string, string>>({})
const saving = ref(false)
const preview = ref<{ portfolio: PublicPortfolio; selection: Selection } | null>(null)

const isOn = (row: Row): boolean => (meta.value.publication === 'status' ? row.status === 'published' : row.visible === true)
function clone<T>(value: T): T { return JSON.parse(JSON.stringify(value)) as T }
const categoryScope = computed(() => meta.value.fields.find((f) => f.type === 'category')?.scope ?? null)

async function load(): Promise<void> {
  loading.value = true
  loadError.value = ''
  try {
    items.value = (await adminFetch<{ items: Row[] }>(`/api/admin/content/${props.entity}`)).items
    selected.value = new Set()
    await loadCategories(true)
  } catch (error) { loadError.value = parseApiError(error).message } finally { loading.value = false }
}
watch(() => props.entity, () => { query.value = ''; filter.value = ''; publication.value = 'all'; void load() }, { immediate: true })

const filters = computed(() => [...new Set(items.value.map((r) => String(r[meta.value.filterKey] ?? '')).filter(Boolean))].sort())
const suggestions = computed(() => Object.fromEntries(meta.value.fields.filter((f) => f.suggest).map((f) => [f.key, [...new Set(items.value.map((r) => String(r[f.key] ?? '')).filter(Boolean))]])))
const filtering = computed(() => Boolean(query.value || filter.value || publication.value !== 'all'))
const visibleItems = computed(() => items.value.filter((r) => {
  if (filter.value && String(r[meta.value.filterKey] ?? '') !== filter.value) return false
  if (publication.value === 'on' && !isOn(r)) return false
  if (publication.value === 'off' && isOn(r)) return false
  const q = query.value.trim().toLowerCase()
  return !q || meta.value.searchKeys.some((k) => String(r[k] ?? '').toLowerCase().includes(q))
}))
const allSelected = computed(() => visibleItems.value.length > 0 && visibleItems.value.every((r) => selected.value.has(r.id)))
function toggleAll(): void { selected.value = allSelected.value ? new Set() : new Set(visibleItems.value.map((r) => r.id)) }
function toggleOne(id: number): void { const next = new Set(selected.value); if (next.has(id)) next.delete(id); else next.add(id); selected.value = next }

function openEditor(row: Row | null): void {
  errors.value = {}
  editingId.value = row ? row.id : 'new'
  form.value = row ? clone(row) : { ...clone(ENTITY_DEFAULTS[props.entity]), sortOrder: Math.max(-1, ...items.value.map((r) => Number(r.sortOrder) || 0)) + 1 }
  editor.value?.showModal()
}
const closeEditor = (): void => { editor.value?.close(); editingId.value = null }

const payload = (): Record<string, unknown> => {
  const data: Record<string, unknown> = Object.fromEntries(Object.keys(ENTITY_DEFAULTS[props.entity]).map((k) => [k, form.value[k]]))
  if ((props.entity === 'projects' || props.entity === 'skills') && !data.slug) data.slug = slugify(String(data.title ?? data.name ?? ''))
  if (data.isCurrent === true) data.endDate = null
  return data
}
function validate(): boolean {
  const result = ENTITY_SCHEMAS[props.entity].safeParse(payload())
  errors.value = {}
  if (result.success) return true
  for (const issue of result.error.issues) if (!errors.value[issue.path.join('.')]) errors.value[issue.path.join('.')] = issue.message
  toasts.error('Certains champs sont invalides ou manquants : corrigez-les puis réessayez.')
  void nextTick(() => document.querySelector<HTMLElement>('[aria-invalid="true"]')?.scrollIntoView({ block: 'center', behavior: 'smooth' }))
  return false
}
async function save(): Promise<void> {
  if (!validate()) return
  saving.value = true
  try {
    const creating = editingId.value === 'new'
    await adminFetch(creating ? `/api/admin/content/${props.entity}` : `/api/admin/content/${props.entity}/${editingId.value}`, { method: creating ? 'POST' : 'PATCH', body: payload() })
    toasts.ok(creating ? 'Créé avec succès.' : 'Modifications enregistrées.')
    closeEditor()
    await load()
  } catch (error) { const parsed = parseApiError(error); errors.value = parsed.fields; toasts.error(parsed.message) } finally { saving.value = false }
}
async function patch(row: Row, body: Record<string, unknown>, message: string): Promise<void> {
  try { await adminFetch(`/api/admin/content/${props.entity}/${row.id}`, { method: 'PATCH', body }); toasts.ok(message); await load() } catch (error) { toasts.error(parseApiError(error).message) }
}
const togglePublication = (row: Row): Promise<void> => meta.value.publication === 'status'
  ? patch(row, { status: isOn(row) ? 'draft' : 'published' }, isOn(row) ? 'Repassé en brouillon.' : 'Publié.')
  : patch(row, { visible: !isOn(row) }, isOn(row) ? 'Masqué du site public.' : 'Visible sur le site public.')

async function move(row: Row, direction: -1 | 1): Promise<void> {
  const list = [...items.value]
  const index = list.findIndex((r) => r.id === row.id)
  const target = index + direction
  if (target < 0 || target >= list.length) return
  ;[list[index], list[target]] = [list[target]!, list[index]!]
  items.value = list
  try { await adminFetch(`/api/admin/content/${props.entity}/reorder`, { method: 'POST', body: { ids: list.map((r) => r.id) } }) } catch (error) { toasts.error(parseApiError(error).message); await load() }
}
async function remove(row: Row): Promise<void> {
  if (!(await confirm.value?.ask({ title: `Supprimer ce ${meta.value.singular} ?`, message: `« ${meta.value.title(row)} » sera définitivement supprimé, ainsi que ses images Cloudinary non utilisées ailleurs. Cette action est irréversible.`, confirmLabel: 'Supprimer', danger: true }))) return
  try { await adminFetch(`/api/admin/content/${props.entity}/${row.id}`, { method: 'DELETE' }); toasts.ok('Supprimé.'); await load() } catch (error) { toasts.error(parseApiError(error).message) }
}

type Bulk = { action: 'publish' | 'hide' | 'delete' } | { action: 'feature'; value: boolean } | { action: 'category'; value: string }
async function bulk(action: Bulk, message: string): Promise<void> {
  const ids = [...selected.value]
  if (!ids.length) return
  if (action.action === 'delete' && !(await confirm.value?.ask({ title: `Supprimer ${ids.length} élément(s) ?`, message: 'La suppression est définitive (images Cloudinary non utilisées ailleurs comprises).', confirmLabel: 'Tout supprimer', danger: true }))) return
  try {
    const response = await adminFetch<{ affected: number }>(`/api/admin/content/${props.entity}/bulk`, { method: 'POST', body: { ...action, ids } })
    toasts.ok(`${message} (${response.affected})`)
    await load()
  } catch (error) { toasts.error(parseApiError(error).message) }
}
const applyCategory = async (): Promise<void> => { if (bulkCategory.value) { await bulk({ action: 'category', value: bulkCategory.value }, 'Catégorie appliquée'); bulkCategory.value = '' } }
const thumb = (row: Row): string | null => (typeof row.coverImageUrl === 'string' && row.coverImageUrl ? optimizeCloudinaryUrl(row.coverImageUrl, { width: 112, height: 112, crop: 'fill' }) : typeof row.imageUrl === 'string' && row.imageUrl ? optimizeCloudinaryUrl(row.imageUrl, { width: 112, height: 112, crop: 'fill' }) : null)
const showPreview = async (): Promise<void> => {
  const data = payload()
  const icon = typeof data.icon === 'string' && data.icon ? ((await resolveIconsForAdmin([data.icon]))[data.icon] ?? null) : null
  preview.value = buildPreview(props.entity, data, icon)
}
</script>

<template>
  <div>
    <AdminPageHeader :title="meta.label" :description="meta.description">
      <template #actions>
        <Button v-if="meta.quickAdd" variant="soft" @click="bulkMode = 'quick'"><ListPlus />Ajout rapide</Button>
        <Button variant="soft" @click="bulkMode = 'import'"><FileUp />Importer / exporter</Button>
        <Button @click="openEditor(null)"><Plus />Nouveau</Button>
      </template>
    </AdminPageHeader>

    <div class="mb-4 flex flex-wrap items-center gap-2">
      <label class="relative min-w-52 flex-1"><span class="sr-only">Rechercher</span><Search class="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted" aria-hidden="true" /><input v-model="query" type="search" class="admin-input !pl-9" placeholder="Rechercher…"></label>
      <label><span class="sr-only">{{ meta.filterLabel }}</span><select v-model="filter" class="admin-input"><option value="">{{ meta.filterLabel }} : toutes</option><option v-for="f in filters" :key="f" :value="f">{{ f }}</option></select></label>
      <label><span class="sr-only">Publication</span><select v-model="publication" class="admin-input"><option value="all">Tous les statuts</option><option value="on">{{ meta.publication === 'status' ? 'Publiés' : 'Visibles' }}</option><option value="off">{{ meta.publication === 'status' ? 'Brouillons' : 'Masqués' }}</option></select></label>
    </div>

    <Transition name="page">
      <div v-if="selected.size" class="sticky top-2 z-20 mb-3 flex flex-wrap items-center gap-2 rounded-2xl border border-primary/30 bg-surface p-3 shadow-lg" role="region" aria-label="Actions sur la sélection">
        <span class="px-2 text-sm font-bold">{{ selected.size }} sélectionné(s)</span>
        <Button size="sm" variant="soft" @click="bulk({ action: 'publish' }, meta.publication === 'status' ? 'Publié(s)' : 'Rendu(s) visible(s)')"><Eye />{{ meta.publication === 'status' ? 'Publier' : 'Afficher' }}</Button>
        <Button size="sm" variant="soft" @click="bulk({ action: 'hide' }, meta.publication === 'status' ? 'Repassé(s) en brouillon' : 'Masqué(s)')"><EyeOff />{{ meta.publication === 'status' ? 'Brouillon' : 'Masquer' }}</Button>
        <Button v-if="meta.canFeature" size="sm" variant="soft" @click="bulk({ action: 'feature', value: true }, 'Mis en avant')"><Star />Mettre en avant</Button>
        <div v-if="categoryScope" class="flex items-center gap-1.5"><label class="sr-only" for="bulk-cat">Catégorie à appliquer</label><select id="bulk-cat" v-model="bulkCategory" class="admin-input !w-44 !py-1.5"><option value="">Catégorie…</option><option v-for="c in byScope(categoryScope)" :key="c.id" :value="c.name">{{ c.name }}</option></select><Button size="sm" variant="soft" :disabled="!bulkCategory" @click="applyCategory"><Tag />Appliquer</Button></div>
        <Button size="sm" variant="ghost" class="ml-auto text-danger" @click="bulk({ action: 'delete' }, 'Supprimé(s)')"><Trash2 />Supprimer</Button>
        <Button size="sm" variant="ghost" @click="selected = new Set()">Désélectionner</Button>
      </div>
    </Transition>

    <p v-if="loadError" class="rounded-xl border border-danger/35 bg-danger/10 p-4 text-sm text-danger" role="alert">{{ loadError }}</p>
    <div v-else-if="loading" class="grid gap-2" role="status" aria-label="Chargement"><div v-for="n in 4" :key="n" class="admin-skeleton h-[4.5rem]" /></div>
    <div v-else-if="!items.length" class="admin-card grid place-items-center gap-3 p-10 text-center"><svg width="64" height="40" viewBox="0 0 64 40" aria-hidden="true"><path d="M0 28c8-8 16-8 24 0s16 8 24 0 12-6 16-2v14H0z" fill="var(--primary)" opacity=".25" /><path d="M0 34c8-6 16-6 24 0s16 6 24 0 12-4 16-1v7H0z" fill="var(--primary)" opacity=".5" /><circle cx="48" cy="10" r="6" fill="var(--sun)" /></svg><p class="font-bold">Aucun élément pour le moment</p><p class="max-w-sm text-sm text-muted">Créez le premier, ajoutez-en plusieurs d’un coup{{ meta.quickAdd ? ' avec l’ajout rapide' : '' }}, ou importez votre CV depuis « Import de CV ».</p><div class="flex flex-wrap justify-center gap-2"><Button @click="openEditor(null)"><Plus />Nouveau</Button><Button v-if="meta.quickAdd" variant="soft" @click="bulkMode = 'quick'"><ListPlus />Ajout rapide</Button></div></div>
    <template v-else>
      <div class="mb-2 flex items-center gap-3 px-1 text-sm text-muted"><label class="flex cursor-pointer items-center gap-2 font-semibold"><input type="checkbox" class="size-4 accent-[var(--primary)]" :checked="allSelected" @change="toggleAll"><span>Tout sélectionner</span></label><span v-if="filtering">· Filtres actifs : le réordonnancement est désactivé ({{ visibleItems.length }} / {{ items.length }})</span></div>
      <TransitionGroup tag="ul" name="page" class="grid gap-2" role="list">
        <li v-for="row in visibleItems" :key="row.id" class="admin-card admin-card--hover flex flex-wrap items-center gap-3 p-3 sm:flex-nowrap" :class="{ 'ring-2 ring-primary/40': selected.has(row.id) }">
          <input type="checkbox" class="size-4 shrink-0 accent-[var(--primary)]" :checked="selected.has(row.id)" :aria-label="`Sélectionner ${meta.title(row)}`" @change="toggleOne(row.id)">
          <div class="flex flex-col"><button type="button" class="grid size-6 place-items-center rounded-md text-muted hover:bg-fg/8 hover:text-fg disabled:opacity-30" :disabled="filtering || items[0]?.id === row.id" :aria-label="`Monter ${meta.title(row)}`" @click="move(row, -1)"><ArrowUp class="size-4" /></button><button type="button" class="grid size-6 place-items-center rounded-md text-muted hover:bg-fg/8 hover:text-fg disabled:opacity-30" :disabled="filtering || items[items.length - 1]?.id === row.id" :aria-label="`Descendre ${meta.title(row)}`" @click="move(row, 1)"><ArrowDown class="size-4" /></button></div>
          <span class="icon-tile size-12"><img v-if="thumb(row)" :src="thumb(row)!" alt="" class="size-full object-cover" loading="lazy"><AdminIcon v-else-if="typeof row.icon === 'string' && row.icon" :value="row.icon as string" :size="26" /><span v-else class="font-display text-sm font-bold text-primary" aria-hidden="true">{{ meta.title(row).slice(0, 2) }}</span></span>
          <div class="min-w-0 flex-1">
            <p class="flex flex-wrap items-center gap-2 font-bold"><span class="truncate">{{ meta.title(row) || '(sans titre)' }}</span><Badge :tone="isOn(row) ? 'ok' : 'muted'">{{ isOn(row) ? (meta.publication === 'status' ? 'Publié' : 'Visible') : (meta.publication === 'status' ? 'Brouillon' : 'Masqué') }}</Badge><Badge v-if="row.featured === true" tone="warn"><Star class="size-3" />En avant</Badge><Badge v-if="row.isDemo === true" tone="warn">démo</Badge></p>
            <p class="truncate text-sm text-muted">{{ meta.subtitle(row) }}</p>
          </div>
          <div class="flex shrink-0 items-center gap-1">
            <button v-if="meta.canFeature" type="button" class="grid size-9 place-items-center rounded-lg hover:bg-fg/8" :class="row.featured === true ? 'text-warn' : 'text-muted'" :aria-pressed="row.featured === true" :aria-label="`Mise en avant : ${meta.title(row)}`" @click="patch(row, { featured: row.featured !== true }, row.featured === true ? 'Retiré de la mise en avant.' : 'Mis en avant.')"><Star class="size-4" /></button>
            <button type="button" class="grid size-9 place-items-center rounded-lg text-muted hover:bg-fg/8 hover:text-fg" :aria-label="`${isOn(row) ? 'Masquer' : 'Publier'} ${meta.title(row)}`" @click="togglePublication(row)"><component :is="isOn(row) ? EyeOff : Eye" class="size-4" /></button>
            <Button size="sm" variant="soft" @click="openEditor(row)"><Pencil />Modifier</Button>
            <button type="button" class="grid size-9 place-items-center rounded-lg text-muted hover:bg-danger/12 hover:text-danger" :aria-label="`Supprimer ${meta.title(row)}`" @click="remove(row)"><Trash2 class="size-4" /></button>
          </div>
        </li>
      </TransitionGroup>
      <p v-if="filtering && !visibleItems.length" class="mt-4 text-sm text-muted">Aucun résultat pour ces filtres.</p>
    </template>

    <dialog ref="editor" class="m-auto max-h-[94svh] w-[min(56rem,calc(100vw-1rem))] rounded-2xl border border-line bg-surface p-0 text-fg backdrop:bg-[rgb(5_20_30/.55)]" aria-labelledby="editor-title" @cancel.prevent="closeEditor">
      <form class="flex max-h-[94svh] flex-col" novalidate @submit.prevent="save">
        <header class="flex items-center justify-between gap-3 border-b border-line px-6 py-4"><h2 id="editor-title" class="font-display text-lg font-bold">{{ editingId === 'new' ? `Nouveau : ${meta.singular}` : `Modifier : ${meta.title(form)}` }}</h2><Button type="button" variant="ghost" size="sm" @click="closeEditor">Fermer</Button></header>
        <div class="overflow-y-auto px-6 py-5"><AdminSchemaForm v-model="form" :fields="meta.fields" :errors="errors" :folder="meta.folder" :suggestions="suggestions" /></div>
        <footer class="flex flex-wrap items-center justify-end gap-2 border-t border-line px-6 py-4"><Button type="button" variant="ghost" @click="closeEditor">Annuler</Button><Button type="button" variant="outline" @click="showPreview"><Eye />Prévisualiser</Button><Button type="submit" :disabled="saving">{{ saving ? 'Enregistrement…' : 'Enregistrer' }}</Button></footer>
      </form>
    </dialog>
    <AdminBulkDialog :entity="entity" :mode="bulkMode" @close="bulkMode = null" @done="load" />
    <DetailModal v-if="preview" :portfolio="preview.portfolio" :selection="preview.selection" @close="preview = null" />
    <AdminConfirm ref="confirm" />
  </div>
</template>
