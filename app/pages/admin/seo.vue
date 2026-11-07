<script setup lang="ts">
definePageMeta({ layout: 'admin' })
await loadAdminSettings()
const seo = useSettingsSection('seo')
const privacy = useSettingsSection('privacy')
</script>

<template>
  <div class="grid gap-6">
    <AdminPageHeader title="SEO et confidentialité" description="Aperçu de partage (WhatsApp, LinkedIn…), indexation par les moteurs de recherche et page de confidentialité liée au formulaire de contact." />
    <AdminSettingsCard title="Référencement et partage" description="Le titre et la description viennent de vos textes (nom, titre, slogan). Le plan du site (/sitemap.xml) et robots.txt sont générés automatiquement." :dirty="seo.dirty.value" :saving="seo.saving.value" show-defaults @save="seo.save" @cancel="seo.cancel" @defaults="seo.restoreDefaults">
      <div class="grid gap-4">
        <AdminToggle v-model="seo.draft.value.indexable" label="Autoriser l’indexation par les moteurs de recherche" hint="Désactivé : le site demande à ne pas être référencé (noindex + robots.txt)." />
        <AdminImageField v-model:url="seo.draft.value.ogImageUrl" v-model:public-id="seo.draft.value.ogImagePublicId" label="Image de partage (1200 × 630)" folder="profile" optional hint="Sans image, une illustration plage par défaut est utilisée." />
      </div>
    </AdminSettingsCard>
    <AdminSettingsCard title="Page de confidentialité" description="Page /confidentialite, liée sous le formulaire de contact et dans le pied de page. Adaptez-la à votre situation (durée de conservation réglée dans « Canaux et e-mail »)." :dirty="privacy.dirty.value" :saving="privacy.saving.value" show-defaults @save="privacy.save" @cancel="privacy.cancel" @defaults="privacy.restoreDefaults">
      <div class="grid gap-4">
        <AdminToggle v-model="privacy.draft.value.enabled" label="Activer la page de confidentialité" />
        <AdminField label="Titre" for="p-title"><input id="p-title" v-model="privacy.draft.value.title" class="admin-input" maxlength="100"></AdminField>
        <AdminField label="Texte" for="p-body" hint="Séparez les paragraphes par une ligne vide."><textarea id="p-body" v-model="privacy.draft.value.body" class="admin-input" rows="10" maxlength="6000" /></AdminField>
      </div>
    </AdminSettingsCard>
  </div>
</template>
