<script setup lang="ts">
import { Plus } from 'lucide-vue-next'
import type { CategoryScope } from '#shared/constants'
import { Button } from '~/components/ui/button'

/** Liste déroulante des catégories d'une liste, avec création à la volée (évite les fautes de frappe et le désordre). */
const props = defineProps<{ scope: CategoryScope; label: string; id?: string; hint?: string; optional?: boolean }>()
const model = defineModel<string>({ default: '' })
const { load, byScope, create } = useAdminCategories()
const toasts = useToasts()
const creating = ref(false)
const draft = ref('')
const uid = props.id ?? `cat-${Math.random().toString(36).slice(2, 8)}`
onMounted(() => { void load() })
const options = computed(() => { const list = byScope(props.scope).map((c) => c.name); return model.value && !list.includes(model.value) ? [...list, model.value] : list })

async function add(): Promise<void> {
  const name = draft.value.trim()
  if (!name) return
  try {
    const created = await create(props.scope, name)
    model.value = created.name
    creating.value = false
    draft.value = ''
    toasts.ok(`Catégorie « ${created.name} » créée.`)
  } catch (error) { toasts.error(parseApiError(error).message) }
}
function onSelect(value: string): void { if (value === '__new') { creating.value = true } else model.value = value }
</script>

<template>
  <AdminField :label="label" :for="uid" :hint="hint" :optional="optional">
    <div v-if="!creating"><select :id="uid" :value="model" class="admin-input" @change="onSelect(($event.target as HTMLSelectElement).value)"><option value="">— Aucune —</option><option v-for="name in options" :key="name" :value="name">{{ name }}</option><option value="__new">＋ Nouvelle catégorie…</option></select></div>
    <div v-else class="flex gap-2"><input :id="uid" v-model="draft" class="admin-input" maxlength="60" placeholder="Nom de la catégorie" @keydown.enter.prevent="add"><Button type="button" size="sm" @click="add"><Plus />Créer</Button><Button type="button" size="sm" variant="ghost" @click="creating = false">Annuler</Button></div>
  </AdminField>
</template>
