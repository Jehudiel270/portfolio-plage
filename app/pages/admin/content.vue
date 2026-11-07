<script setup lang="ts">
import { Plus, Trash2 } from 'lucide-vue-next'
import { SOCIAL_PLATFORMS } from '#shared/constants'
import { Button } from '~/components/ui/button'

definePageMeta({ layout: 'admin' })
await loadAdminSettings()
const content = useSettingsSection('content')
const social = useSettingsSection('social')
const FIELDS: { key: string; label: string; area?: boolean; rows?: number; hint?: string; wide?: boolean; type?: string }[] = [
  { key: 'name', label: 'Nom affiché' }, { key: 'title', label: 'Titre professionnel' },
  { key: 'tagline', label: 'Slogan d’accueil', wide: true }, { key: 'intro', label: 'Texte d’introduction', area: true, rows: 3, wide: true },
  { key: 'aboutTitle', label: 'Titre de la section « À propos »' }, { key: 'location', label: 'Localisation' },
  { key: 'availability', label: 'Disponibilité', hint: 'Ex. « Disponible pour de nouvelles missions ». Facultatif.' }, { key: 'publicEmail', label: 'Adresse e-mail publique', type: 'email' },
  { key: 'about', label: 'Texte « À propos »', area: true, rows: 7, wide: true, hint: 'Séparez les paragraphes par une ligne vide.' },
  { key: 'resumeUrl', label: 'Lien de téléchargement du CV', type: 'url', hint: 'URL d’un PDF hébergé (facultatif).', wide: true },
  { key: 'contactTitle', label: 'Titre de la section Contact' }, { key: 'footerNote', label: 'Note de pied de page' },
  { key: 'contactText', label: 'Texte de la section Contact', area: true, rows: 3, wide: true },
]
const model = content.draft as Ref<Record<string, string | null>>
const addSocial = (): void => { social.draft.value = [...social.draft.value, { platform: 'github', label: '', url: '' }] }
const removeSocial = (index: number): void => { social.draft.value = social.draft.value.filter((_, i) => i !== index) }
const PLATFORM_LABELS: Record<string, string> = { linkedin: 'LinkedIn', github: 'GitHub', gitlab: 'GitLab', x: 'X', instagram: 'Instagram', youtube: 'YouTube', facebook: 'Facebook', tiktok: 'TikTok', behance: 'Behance', dribbble: 'Dribbble', malt: 'Malt', upwork: 'Upwork', whatsapp: 'WhatsApp', website: 'Site web', other: 'Autre' }
</script>

<template>
  <div class="grid gap-6">
    <AdminPageHeader title="Textes et liens" description="Tous les textes de contenu du site. Aucune information personnelle n’est inventée : les valeurs de démonstration restent identifiables." />
    <AdminSettingsCard title="Identité et textes" :dirty="content.dirty.value" :saving="content.saving.value" show-defaults @save="content.save" @cancel="content.cancel" @defaults="content.restoreDefaults">
      <div class="grid gap-4 sm:grid-cols-2">
        <AdminImageField v-model:url="content.draft.value.avatarUrl" v-model:public-id="content.draft.value.avatarPublicId" label="Photo de profil" folder="profile" optional class="sm:col-span-2" hint="Affichée dans « À propos ». Carré de préférence." />
        <div v-for="f in FIELDS" :key="f.key" :class="f.wide ? 'sm:col-span-2' : ''">
          <AdminField :label="f.label" :for="`c-${f.key}`" :hint="f.hint" :error="content.errors.value[f.key]">
            <textarea v-if="f.area" :id="`c-${f.key}`" v-model="model[f.key]" class="admin-input" :rows="f.rows" />
            <input v-else :id="`c-${f.key}`" v-model="model[f.key]" class="admin-input" :type="f.type ?? 'text'" :aria-invalid="Boolean(content.errors.value[f.key])">
          </AdminField>
        </div>
      </div>
    </AdminSettingsCard>
    <AdminSettingsCard title="Réseaux sociaux et profils professionnels" description="Affichés dans « À propos », le contact et le pied de page. Seules les URL http(s) sont acceptées." :dirty="social.dirty.value" :saving="social.saving.value" @save="social.save" @cancel="social.cancel">
      <ul class="grid gap-3"><li v-for="(item, index) in social.draft.value" :key="index" class="grid gap-2 rounded-xl border border-line p-3 sm:grid-cols-[10rem_1fr_2fr_auto] sm:items-end">
        <AdminField label="Plateforme" :for="`s-p-${index}`"><select :id="`s-p-${index}`" v-model="item.platform" class="admin-input"><option v-for="p in SOCIAL_PLATFORMS" :key="p" :value="p">{{ PLATFORM_LABELS[p] }}</option></select></AdminField>
        <AdminField label="Libellé" optional :for="`s-l-${index}`"><input :id="`s-l-${index}`" v-model="item.label" class="admin-input" maxlength="40"></AdminField>
        <AdminField label="URL" :for="`s-u-${index}`" :error="social.errors.value[`${index}.url`]"><input :id="`s-u-${index}`" v-model="item.url" class="admin-input" type="url" placeholder="https://…" :aria-invalid="Boolean(social.errors.value[`${index}.url`])"></AdminField>
        <button type="button" class="grid size-10 place-items-center rounded-lg text-muted hover:bg-danger/12 hover:text-danger" :aria-label="`Retirer le lien ${index + 1}`" @click="removeSocial(index)"><Trash2 class="size-4" /></button>
      </li></ul>
      <Button class="mt-4" size="sm" variant="soft" :disabled="social.draft.value.length >= 12" @click="addSocial"><Plus />Ajouter un lien</Button>
    </AdminSettingsCard>
  </div>
</template>
