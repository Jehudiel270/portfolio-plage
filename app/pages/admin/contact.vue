<script setup lang="ts">
import { Send } from 'lucide-vue-next'
import { buildWhatsAppUrl, renderTemplate } from '#shared/utils/template'
import { Button } from '~/components/ui/button'

definePageMeta({ layout: 'admin' })
const { status } = await loadAdminSettings()
const contact = useSettingsSection('contact')
const toasts = useToasts()
const d = contact.draft
const testTo = ref('')
const testing = ref(false)

const FIELD_KEYS = ['name', 'email', 'phone', 'subject', 'message'] as const
const FIELD_NAMES = { name: 'Nom', email: 'E-mail', phone: 'Téléphone', subject: 'Sujet', message: 'Message' }
const MODES = [
  ['email', 'E-mail : formulaire envoyé côté serveur (SMTP)'],
  ['whatsapp', 'WhatsApp : lien wa.me avec texte prérempli (le visiteur confirme l’envoi)'],
  ['both', 'Les deux : e-mail, puis bouton « Envoyer aussi sur WhatsApp »'],
  ['none', 'Aucun formulaire : uniquement les liens de contact'],
] as const
const waPreview = computed(() => buildWhatsAppUrl(d.value.whatsappNumber, renderTemplate(d.value.whatsappTemplate, { name: 'Alex', message: 'Bonjour !' })))

async function sendTest(): Promise<void> {
  testing.value = true
  try {
    const result = await adminFetch<{ to: string }>('/api/admin/email/test', { method: 'POST', body: { to: testTo.value } })
    toasts.ok(`E-mail de test envoyé à ${result.to}.`)
  } catch (error) {
    toasts.error(parseApiError(error).message)
  } finally {
    testing.value = false
  }
}
</script>

<template>
  <div class="grid gap-6">
    <AdminPageHeader title="Contact, e-mail et WhatsApp" description="Même configuration pour la page /contact, la scène finale et le widget. Les identifiants SMTP restent dans l’environnement du serveur : ils ne sont jamais saisis ici ni renvoyés par l’API." />

    <AdminSettingsCard title="Canaux et formulaire" :dirty="contact.dirty.value" :saving="contact.saving.value" show-defaults @save="contact.save" @cancel="contact.cancel" @defaults="contact.restoreDefaults">
      <div class="grid gap-5">
        <div class="grid gap-4 sm:grid-cols-2">
          <AdminToggle v-model="d.pageEnabled" label="Page dédiée /contact" hint="Désactivée : la page répond 404 et le menu pointe vers la scène finale." class="sm:col-span-2" />
          <AdminField label="Titre" for="c-title"><input id="c-title" v-model="d.title" class="admin-input" maxlength="120"></AdminField>
          <AdminField label="Mode de contact" for="c-mode"><select id="c-mode" v-model="d.channelMode" class="admin-input"><option v-for="[v, l] in MODES" :key="v" :value="v">{{ l }}</option></select></AdminField>
          <AdminField label="Texte d’introduction" for="c-intro" class="sm:col-span-2"><textarea id="c-intro" v-model="d.intro" class="admin-input" rows="2" maxlength="600" /></AdminField>
        </div>

        <fieldset class="grid gap-3 border-0 p-0"><legend class="mb-1 font-display text-sm font-semibold text-accent">Champs du formulaire</legend>
          <div v-for="key in FIELD_KEYS" :key="key" class="grid items-end gap-3 rounded-xl border border-fg/10 p-3 sm:grid-cols-[7rem_1fr_1fr_auto_auto]">
            <p class="pb-2 text-sm font-semibold">{{ FIELD_NAMES[key] }}</p>
            <AdminField label="Libellé" :for="`cf-l-${key}`"><input :id="`cf-l-${key}`" v-model="d.fields[key].label" class="admin-input" maxlength="60"></AdminField>
            <AdminField label="Aide (placeholder)" :for="`cf-p-${key}`"><input :id="`cf-p-${key}`" v-model="d.fields[key].placeholder" class="admin-input" maxlength="120"></AdminField>
            <AdminToggle v-model="d.fields[key].visible" label="Visible" :class="key === 'message' ? 'pointer-events-none opacity-50' : ''" />
            <AdminToggle v-model="d.fields[key].required" label="Obligatoire" :class="key === 'message' ? 'pointer-events-none opacity-50' : ''" />
          </div>
          <p class="text-xs text-muted">Le champ « Message » est toujours visible et obligatoire.</p>
        </fieldset>

        <div class="grid gap-4 sm:grid-cols-2">
          <AdminField label="Texte du bouton d’envoi" for="c-submit"><input id="c-submit" v-model="d.submitLabel" class="admin-input" maxlength="40"></AdminField>
          <AdminField label="Après l’envoi" for="c-after"><select id="c-after" v-model="d.afterSubmit" class="admin-input"><option value="message">Afficher le message de confirmation</option><option value="reset">Vider le formulaire</option><option value="redirect">Rediriger vers une page du site</option></select></AdminField>
          <AdminField v-if="d.afterSubmit === 'redirect'" label="Chemin de redirection" for="c-redirect" hint="Chemin interne uniquement, ex. /merci" :error="contact.errors.value.redirectPath"><input id="c-redirect" v-model="d.redirectPath" class="admin-input" placeholder="/merci"></AdminField>
          <AdminField label="Message de succès" for="c-ok"><input id="c-ok" v-model="d.successMessage" class="admin-input" maxlength="300"></AdminField>
          <AdminField label="Message si l’e-mail n’a pas pu partir" for="c-partial" hint="Le message est tout de même enregistré dans votre boîte de réception."><input id="c-partial" v-model="d.partialMessage" class="admin-input" maxlength="300"></AdminField>
          <AdminField label="Message d’erreur" for="c-err" class="sm:col-span-2"><input id="c-err" v-model="d.errorMessage" class="admin-input" maxlength="300"></AdminField>
        </div>

        <fieldset class="grid gap-4 border-0 p-0 sm:grid-cols-2"><legend class="mb-1 font-display text-sm font-semibold text-accent">E-mail</legend>
          <AdminField label="Adresse destinataire" for="c-rcpt" hint="Privée : jamais exposée dans l’API publique." :error="contact.errors.value.recipientEmail"><input id="c-rcpt" v-model="d.recipientEmail" class="admin-input" type="email" placeholder="vous@exemple.com"></AdminField>
          <AdminField label="Sujet du message" for="c-subj" hint="Variables : {name} {email} {phone} {subject} {message} {siteName}. Rien d’autre n’est interprété."><input id="c-subj" v-model="d.emailSubjectTemplate" class="admin-input" maxlength="160"></AdminField>
          <AdminField label="Modèle du corps" for="c-body" class="sm:col-span-2"><textarea id="c-body" v-model="d.emailBodyTemplate" class="admin-input font-mono" rows="5" maxlength="4000" /></AdminField>
          <AdminToggle v-model="d.showEmailLink" label="Afficher mon adresse publique (mailto)" hint="Renseignée dans « Textes et liens »." class="sm:col-span-2" />
        </fieldset>

        <fieldset class="grid gap-4 border-0 p-0 sm:grid-cols-2"><legend class="mb-1 font-display text-sm font-semibold text-accent">WhatsApp</legend>
          <AdminField label="Numéro (format international)" for="c-wa" hint="Chiffres uniquement, indicatif pays inclus, sans « + » ni espaces. Ex. 22997000000" :error="contact.errors.value.whatsappNumber"><input id="c-wa" v-model="d.whatsappNumber" class="admin-input" inputmode="numeric" placeholder="22997000000"></AdminField>
          <AdminField label="Texte du bouton" for="c-wab"><input id="c-wab" v-model="d.whatsappButtonLabel" class="admin-input" maxlength="60"></AdminField>
          <AdminField label="Texte prérempli" for="c-wat" hint="Mêmes variables que l’e-mail." class="sm:col-span-2"><textarea id="c-wat" v-model="d.whatsappTemplate" class="admin-input" rows="2" maxlength="1000" /></AdminField>
          <AdminField label="Bouton après envoi du formulaire (mode « les deux »)" for="c-waa"><input id="c-waa" v-model="d.whatsappAfterLabel" class="admin-input" maxlength="60"></AdminField>
          <p class="self-end text-xs text-muted">WhatsApp s’ouvre avec le texte prérempli : le visiteur doit confirmer l’envoi lui-même, aucun message n’est envoyé automatiquement.<template v-if="waPreview"> <a :href="waPreview" target="_blank" rel="noopener noreferrer" class="underline">Tester le lien</a>.</template></p>
        </fieldset>

        <fieldset class="grid gap-4 border-0 p-0"><legend class="mb-1 font-display text-sm font-semibold text-primary">Données personnelles et consentement</legend>
          <AdminField label="Mention sous le formulaire" for="c-privacy" hint="Variable : {retentionDays}. Indique au visiteur ce que deviennent ses données."><textarea id="c-privacy" v-model="d.privacyNotice" class="admin-input" rows="3" maxlength="600" /></AdminField>
          <AdminToggle v-model="d.requireConsent" label="Exiger une case de consentement" hint="Le visiteur doit cocher la case pour envoyer son message." />
          <AdminField v-if="d.requireConsent" label="Texte de la case" for="c-consent"><input id="c-consent" v-model="d.consentLabel" class="admin-input" maxlength="160"></AdminField>
        </fieldset>
        <AdminField label="Conservation des messages (jours)" for="c-ret" hint="0 = conservation illimitée. Les messages plus anciens sont supprimés à chaque nouvelle soumission (et par `pnpm db:purge:messages`)." :error="contact.errors.value.retentionDays">
          <input id="c-ret" v-model.number="d.retentionDays" class="admin-input max-w-40" type="number" min="0" max="3650">
        </AdminField>
      </div>
    </AdminSettingsCard>

    <section class="admin-card p-5 sm:p-6">
      <h2 class="font-display text-lg font-semibold">Serveur e-mail (SMTP)</h2>
      <p class="mt-1 text-sm" :class="status?.smtpConfigured ? 'text-ok' : 'text-warn'" role="status">{{ status?.smtpConfigured ? `Configuré (hôte ${status.smtpHost}).` : 'Non configuré : sans SMTP, les messages sont enregistrés mais aucun e-mail ne part (le visiteur en est informé).' }}</p>
      <p class="mt-2 text-xs text-muted">Variables d’environnement du serveur : <code>SMTP_HOST</code>, <code>SMTP_PORT</code>, <code>SMTP_SECURE</code>, <code>SMTP_USER</code>, <code>SMTP_PASSWORD</code>, <code>SMTP_FROM</code>. Les valeurs ne sont jamais affichées.</p>
      <form class="mt-4 flex flex-wrap items-end gap-3" @submit.prevent="sendTest">
        <AdminField label="Envoyer un e-mail de test à" optional for="c-test" class="min-w-64 flex-1"><input id="c-test" v-model="testTo" class="admin-input" type="email" placeholder="Par défaut : le destinataire configuré"></AdminField>
        <Button type="submit" variant="glass" :disabled="testing || !status?.smtpConfigured"><Send />{{ testing ? 'Envoi…' : 'Envoyer le test' }}</Button>
      </form>
    </section>
  </div>
</template>
