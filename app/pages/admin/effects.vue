<script setup lang="ts">
import { EFFECT_FIELDS } from '~/utils/admin-settings-fields'

definePageMeta({ layout: 'admin' })
await loadAdminSettings()
const { draft, dirty, saving, errors, save, cancel, restoreDefaults } = useSettingsSection('effects')
const effects = draft as Ref<Record<string, number | boolean>>
</script>

<template>
  <div>
    <AdminPageHeader title="Décor 3D" description="L’océan de l’accueil et l’exploration 3D (bouées et bouteilles). Réglages bornés et validés côté serveur ; aucun code ni shader ne peut être envoyé. Les appareils sans WebGL gardent un dégradé CSS." />
    <AdminSettingsCard title="Océan et animations" :dirty="dirty" :saving="saving" show-defaults @save="save" @cancel="cancel" @defaults="restoreDefaults">
      <div class="grid gap-4 sm:grid-cols-2">
        <template v-for="f in EFFECT_FIELDS" :key="f.key">
          <AdminToggle v-if="f.type === 'boolean'" v-model="(effects[f.key] as boolean)" :label="f.label" :hint="f.hint" />
          <AdminField v-else :label="`${f.label} : ${effects[f.key]}`" :for="`e-${f.key}`" :hint="f.hint" :error="errors[f.key]"><input :id="`e-${f.key}`" v-model.number="effects[f.key]" type="range" :min="f.min" :max="f.max" :step="f.step" class="w-full accent-[var(--primary)]"></AdminField>
        </template>
      </div>
    </AdminSettingsCard>
  </div>
</template>
