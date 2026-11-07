<script setup lang="ts">
import { ArrowDown, ArrowUp, Plus, Trash2 } from 'lucide-vue-next'
import { CATEGORY_SCOPES, type CategoryScope } from '#shared/constants'
import { Button } from '~/components/ui/button'

definePageMeta({ layout: 'admin' })
const toasts = useToasts()
const { load, byScope, create } = useAdminCategories()
const confirm = ref<{ ask: (o: { title: string; message: string; confirmLabel?: string; danger?: boolean }) => Promise<boolean> } | null>(null)
const scope = ref<CategoryScope>('skills')
const draft = ref('')
const loading = ref(true)
const SCOPES: Record<CategoryScope, string> = { skills: 'Compétences', projects: 'Projets', certifications: 'Certifications', achievements: 'Réalisations' }
onMounted(async () => { try { await load(true) } catch (e) { toasts.error(parseApiError(e).message) } finally { loading.value = false } })
const list = computed(() => byScope(scope.value))

async function add(): Promise<void> {
  const name = draft.value.trim()
  if (!name) return
  try { await create(scope.value, name); draft.value = ''; toasts.ok('Catégorie créée.') } catch (e) { toasts.error(parseApiError(e).message) }
}
async function patch(id: number, body: Record<string, unknown>, silent = false): Promise<void> {
  try { await adminFetch(`/api/admin/categories/${id}`, { method: 'PATCH', body }); if (!silent) toasts.ok('Enregistré.'); await load(true) } catch (e) { toasts.error(parseApiError(e).message); await load(true) }
}
async function move(id: number, direction: -1 | 1): Promise<void> {
  const ordered = [...list.value]
  const index = ordered.findIndex((c) => c.id === id)
  const target = index + direction
  if (target < 0 || target >= ordered.length) return
  ;[ordered[index], ordered[target]] = [ordered[target]!, ordered[index]!]
  await Promise.all(ordered.map((c, i) => (c.sortOrder !== i ? adminFetch(`/api/admin/categories/${c.id}`, { method: 'PATCH', body: { sortOrder: i } }) : null)))
  await load(true)
}
async function remove(id: number, name: string, usage: number): Promise<void> {
  if (!(await confirm.value?.ask({ title: `Supprimer « ${name} » ?`, message: usage ? `${usage} fiche(s) utilisent cette catégorie : elles seront conservées mais sans catégorie.` : 'Cette catégorie n’est utilisée par aucune fiche.', confirmLabel: 'Supprimer', danger: true }))) return
  try { await adminFetch(`/api/admin/categories/${id}`, { method: 'DELETE' }); toasts.ok('Catégorie supprimée.'); await load(true) } catch (e) { toasts.error(parseApiError(e).message) }
}
</script>

<template>
  <div>
    <AdminPageHeader title="Catégories" description="Les listes déroulantes de l’administration et les filtres du site s’appuient sur ces catégories. Renommer une catégorie met à jour toutes les fiches ; la supprimer ne supprime aucune fiche." />
    <div class="mb-5 flex flex-wrap gap-2" role="tablist" aria-label="Type de catégories"><button v-for="s in CATEGORY_SCOPES" :key="s" type="button" role="tab" class="chip !px-5 !py-2" :aria-selected="scope === s" @click="scope = s">{{ SCOPES[s] }}</button></div>
    <section class="admin-card p-5 sm:p-6" role="tabpanel">
      <form class="mb-5 flex flex-wrap gap-2" @submit.prevent="add"><label class="sr-only" for="new-cat">Nouvelle catégorie</label><input id="new-cat" v-model="draft" class="admin-input max-w-sm" maxlength="60" :placeholder="`Nouvelle catégorie (${SCOPES[scope].toLowerCase()})`"><Button type="submit" :disabled="!draft.trim()"><Plus />Ajouter</Button></form>
      <div v-if="loading" class="grid gap-2"><div v-for="n in 3" :key="n" class="admin-skeleton h-16" /></div>
      <p v-else-if="!list.length" class="rounded-xl border border-dashed border-line p-8 text-center text-muted">Aucune catégorie pour l’instant. Créez-en une ici ou directement depuis un formulaire (« ＋ Nouvelle catégorie »).</p>
      <TransitionGroup v-else tag="ul" name="page" class="grid gap-2" role="list">
        <li v-for="(c, index) in list" :key="c.id" class="rounded-xl border border-line p-3">
          <div class="flex flex-wrap items-center gap-3">
            <div class="flex flex-col"><button type="button" class="grid size-6 place-items-center rounded hover:bg-fg/8 disabled:opacity-30" :disabled="index === 0" :aria-label="`Monter ${c.name}`" @click="move(c.id, -1)"><ArrowUp class="size-4" /></button><button type="button" class="grid size-6 place-items-center rounded hover:bg-fg/8 disabled:opacity-30" :disabled="index === list.length - 1" :aria-label="`Descendre ${c.name}`" @click="move(c.id, 1)"><ArrowDown class="size-4" /></button></div>
            <span class="icon-tile size-11"><AdminIcon v-if="c.icon" :value="c.icon" :size="22" /><span v-else class="font-display text-sm font-bold text-primary">{{ c.name.slice(0, 2) }}</span></span>
            <label class="min-w-48 flex-1"><span class="sr-only">Nom de la catégorie</span><input class="admin-input font-semibold" :value="c.name" maxlength="60" @change="patch(c.id, { name: ($event.target as HTMLInputElement).value.trim() })"></label>
            <span class="tag">{{ c.usage }} fiche(s)</span><span v-if="c.isDemo" class="tag tag--demo">démo</span>
            <button type="button" class="grid size-9 place-items-center rounded-lg text-muted hover:bg-danger/12 hover:text-danger" :aria-label="`Supprimer ${c.name}`" @click="remove(c.id, c.name, c.usage)"><Trash2 class="size-4" /></button>
          </div>
          <details class="mt-2 pl-9 text-sm"><summary class="cursor-pointer font-semibold text-primary">Icône et couleur</summary>
            <div class="mt-3 grid gap-3 sm:grid-cols-2"><AdminIconPicker :model-value="c.icon" :public-id="c.iconPublicId" label="Icône de la catégorie" folder="categories" optional @update:model-value="patch(c.id, { icon: $event }, true)" @update:public-id="patch(c.id, { iconPublicId: $event }, true)" /><AdminColorField :model-value="c.color" label="Couleur" optional @update:model-value="patch(c.id, { color: $event })" /></div>
          </details>
        </li>
      </TransitionGroup>
    </section>
    <AdminConfirm ref="confirm" />
  </div>
</template>
