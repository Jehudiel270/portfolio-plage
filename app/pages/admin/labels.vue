<script setup lang="ts">
import { DEFAULT_UI_LABELS, UI_LABEL_GROUPS, UI_LABEL_KEYS } from '#shared/ui-labels'

definePageMeta({ layout: 'admin' })
await loadAdminSettings()
const { draft, dirty, saving, save, cancel, restoreDefaults } = useSettingsSection('ui')
const query = ref('')
const groups = computed(() => {
  const claimed = new Set<string>()
  return UI_LABEL_GROUPS.map((group) => {
    const keys = UI_LABEL_KEYS.filter((k) => !claimed.has(k) && (group.prefix ? k.startsWith(group.prefix) : true) && (!query.value || k.includes(query.value.toLowerCase()) || DEFAULT_UI_LABELS[k].toLowerCase().includes(query.value.toLowerCase())))
    keys.forEach((k) => claimed.add(k))
    return { ...group, keys }
  }).filter((g) => g.keys.length)
})
const value = (key: string): string => draft.value[key] ?? ''
function set(key: string, text: string): void { draft.value = Object.fromEntries([...Object.entries(draft.value).filter(([k]) => k !== key), ...(text.trim() ? [[key, text] as [string, string]] : [])]) }
</script>

<template>
  <div>
    <AdminPageHeader title="Textes de l’interface" description="Chaque libellé du site (boutons, filtres, messages…) est modifiable. Laissez un champ vide pour garder le texte par défaut, affiché en grisé." />
    <AdminSettingsCard title="Libellés" :dirty="dirty" :saving="saving" show-defaults @save="save" @cancel="cancel" @defaults="restoreDefaults">
      <label class="mb-6 block"><span class="sr-only">Filtrer les libellés</span><input v-model="query" type="search" class="admin-input" placeholder="Filtrer (ex. « projet », « fermer »)…"></label>
      <div class="grid gap-8">
        <fieldset v-for="group in groups" :key="group.title" class="grid gap-3 border-0 p-0"><legend class="mb-1 font-display text-sm font-bold text-primary">{{ group.title }}</legend>
          <div class="grid gap-3 sm:grid-cols-2"><AdminField v-for="key in group.keys" :key="key" :label="key" :for="`l-${key}`"><input :id="`l-${key}`" class="admin-input" :value="value(key)" :placeholder="DEFAULT_UI_LABELS[key]" maxlength="240" @input="set(key, ($event.target as HTMLInputElement).value)"></AdminField></div>
        </fieldset>
        <p v-if="!groups.length" class="text-sm text-muted">Aucun libellé ne correspond.</p>
      </div>
    </AdminSettingsCard>
  </div>
</template>
