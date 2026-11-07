<script setup lang="ts">
import { THEME_FIELDS, THEME_PRESETS, type ThemeSettings } from '#shared/schemas/settings'

definePageMeta({ layout: 'admin' })
const { settings } = await loadAdminSettings()
const { draft, dirty, saving, errors, save, cancel, restoreDefaults } = useSettingsSection('theme')
const applyPreset = (theme: ThemeSettings): void => { draft.value = { ...theme } }
</script>

<template>
  <div>
    <AdminPageHeader title="Apparence" description="Une seule palette pilote le site entier : pages, cartes, boutons et décor 3D. Rien n’est publié avant « Enregistrer »." />
    <div class="grid gap-6 xl:grid-cols-[1fr_26rem]">
      <AdminSettingsCard title="Palette de couleurs" description="Valeurs #RRGGBB, validées avant l’enregistrement. Les indicateurs de contraste vous aident à rester lisible." :dirty="dirty" :saving="saving" show-defaults @save="save" @cancel="cancel" @defaults="restoreDefaults">
        <div class="mb-6 flex flex-wrap gap-2" role="group" aria-label="Palettes prédéfinies"><button v-for="p in THEME_PRESETS" :key="p.name" type="button" class="chip" @click="applyPreset(p.theme)">{{ p.name }}</button></div>
        <div class="grid gap-4 sm:grid-cols-2"><AdminColorField v-for="f in THEME_FIELDS" :key="f.key" v-model="draft[f.key]" :label="f.label" :hint="f.hint" /></div>
        <p v-if="Object.keys(errors).length" class="mt-4 text-sm text-danger" role="alert">Certaines couleurs sont invalides.</p>
      </AdminSettingsCard>
      <aside class="grid content-start gap-4 xl:sticky xl:top-6 xl:self-start">
        <section class="admin-card p-4" aria-label="Palette courante"><h2 class="mb-3 font-display text-sm font-bold">Palette (brouillon)</h2><ul class="grid grid-cols-5 gap-1.5"><li v-for="f in THEME_FIELDS" :key="f.key" class="h-9 rounded-lg border border-line" :style="{ background: draft[f.key] }" :title="`${f.label} : ${draft[f.key]}`" /></ul></section>
        <ThemePreview :theme="draft" :effects="settings!.effects" />
      </aside>
    </div>
  </div>
</template>
