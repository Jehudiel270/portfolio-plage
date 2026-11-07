<script setup lang="ts">
import type { ImageRef } from '#shared/schemas/common'
import type { FieldDef, UploadFolder } from '~/utils/admin-entities'

/** Formulaire piloté par la définition des champs (types, libellés, facultatifs) ; la validation reste celle des schémas Zod partagés. */
const props = defineProps<{
  fields: FieldDef[]
  errors: Record<string, string>
  folder: UploadFolder
  suggestions?: Record<string, string[]>
}>()
const model = defineModel<Record<string, unknown>>({ required: true })

const sections = computed(() => {
  const map = new Map<string, FieldDef[]>()
  for (const field of props.fields) map.set(field.section, [...(map.get(field.section) ?? []), field])
  return [...map.entries()]
})
const set = (key: string, value: unknown): void => { model.value[key] = value }
const str = (key: string): string => (model.value[key] == null ? '' : String(model.value[key]))
const list = (key: string): string[] => (Array.isArray(model.value[key]) ? (model.value[key] as string[]) : [])
const uid = (key: string): string => `f-${key}`
function onNumber(key: string, value: string): void { set(key, value === '' ? null : Number(value)) }
</script>

<template>
  <div class="grid gap-8">
    <fieldset v-for="[title, items] in sections" :key="title" class="grid gap-4 border-0 p-0">
      <legend class="mb-1 font-display text-sm font-semibold text-accent">{{ title }}</legend>
      <div class="grid gap-4 sm:grid-cols-2">
        <template v-for="field in items" :key="field.key">
          <div :class="field.wide || ['textarea', 'tags', 'lines', 'image', 'gallery', 'icon'].includes(field.type) ? 'sm:col-span-2' : ''">
            <AdminField v-if="['text', 'url', 'date', 'number'].includes(field.type)" :label="field.label" :for="uid(field.key)" :hint="field.hint" :optional="field.optional" :error="errors[field.key]">
              <input :id="uid(field.key)" :value="str(field.key)" class="admin-input" :type="field.type === 'text' ? 'text' : field.type" :list="field.suggest ? `dl-${field.key}` : undefined" :placeholder="field.placeholder" :inputmode="field.type === 'number' ? 'numeric' : undefined" :aria-invalid="Boolean(errors[field.key])" @input="field.type === 'number' ? onNumber(field.key, ($event.target as HTMLInputElement).value) : set(field.key, ($event.target as HTMLInputElement).value)">
              <datalist v-if="field.suggest" :id="`dl-${field.key}`"><option v-for="s in suggestions?.[field.key] ?? []" :key="s" :value="s" /></datalist>
            </AdminField>
            <AdminField v-else-if="field.type === 'textarea'" :label="field.label" :for="uid(field.key)" :hint="field.hint" :optional="field.optional" :error="errors[field.key]">
              <textarea :id="uid(field.key)" :value="str(field.key)" class="admin-input" :rows="field.rows ?? 4" :aria-invalid="Boolean(errors[field.key])" @input="set(field.key, ($event.target as HTMLTextAreaElement).value)" />
            </AdminField>
            <AdminField v-else-if="field.type === 'select'" :label="field.label" :for="uid(field.key)" :hint="field.hint" :optional="field.optional" :error="errors[field.key]">
              <select :id="uid(field.key)" :value="str(field.key)" class="admin-input" @change="set(field.key, ($event.target as HTMLSelectElement).value)"><option v-for="o in field.options" :key="o.value" :value="o.value">{{ o.label }}</option></select>
            </AdminField>
            <AdminToggle v-else-if="field.type === 'boolean'" :model-value="model[field.key] === true" :label="field.label" :hint="field.hint" @update:model-value="set(field.key, $event)" />
            <AdminColorField v-else-if="field.type === 'color'" :model-value="(model[field.key] as string | null) ?? null" :label="field.label" :hint="field.hint" :optional="field.optional" @update:model-value="set(field.key, $event)" />
            <AdminTagsField v-else-if="field.type === 'tags'" :model-value="list(field.key)" :label="field.label" :hint="field.hint" :optional="field.optional" :error="errors[field.key]" @update:model-value="set(field.key, $event)" />
            <AdminLinesField v-else-if="field.type === 'lines'" :model-value="list(field.key)" :label="field.label" :hint="field.hint" :optional="field.optional" :error="errors[field.key]" @update:model-value="set(field.key, $event)" />
            <AdminImageField v-else-if="field.type === 'image'" :url="(model[field.key] as string | null) ?? null" :public-id="(model[field.publicIdKey ?? ''] as string | null) ?? null" :label="field.label" :folder="folder" :hint="field.hint" :optional="field.optional" :error="errors[field.key]" @update:url="set(field.key, $event)" @update:public-id="field.publicIdKey && set(field.publicIdKey, $event)" />
            <AdminGalleryField v-else-if="field.type === 'gallery'" :model-value="(model[field.key] as ImageRef[] | undefined) ?? []" :label="field.label" :folder="folder" :hint="field.hint" :optional="field.optional" @update:model-value="set(field.key, $event)" />
            <AdminCategorySelect v-else-if="field.type === 'category' && field.scope" :scope="field.scope" :label="field.label" :hint="field.hint" :optional="field.optional" :model-value="str(field.key)" @update:model-value="set(field.key, $event)" />
            <AdminIconPicker v-else-if="field.type === 'icon'" :model-value="(model[field.key] as string | null) ?? null" :public-id="(model[field.publicIdKey ?? ''] as string | null) ?? null" :label="field.label" :folder="folder" :hint="field.hint" :optional="field.optional" :suggest-from="field.suggestFrom ? str(field.suggestFrom) : undefined" @update:model-value="set(field.key, $event)" @update:public-id="field.publicIdKey && set(field.publicIdKey, $event)" />
          </div>
        </template>
      </div>
    </fieldset>
  </div>
</template>
