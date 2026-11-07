<script setup lang="ts">
import { AlertTriangle, CheckCircle2, ExternalLink, FlaskConical, Trash2 } from 'lucide-vue-next'
import { THEME_FIELDS, type ThemeSettings } from '#shared/schemas/settings'
import { Button } from '~/components/ui/button'

definePageMeta({ layout: 'admin' })
interface Dashboard {
  stats: { projectsPublished: number; projectsDraft: number; skillsTotal: number; skillsVisible: number; educationCount: number; experiencesCount: number; certificationsCount: number; achievementsCount: number; unreadMessages: number; lastModifiedAt: string | null }
  theme: ThemeSettings
  identity: { name: string; customized: boolean }
  demoRows: number
  config: { database: boolean; cloudinary: boolean; smtp: boolean; sessionSecret: boolean; recipient: boolean; whatsapp: boolean; channelMode: string }
}
const toasts = useToasts()
const data = ref<Dashboard | null>(null)
const error = ref('')
const busy = ref(false)
const confirm = ref<{ ask: (o: { title: string; message: string; confirmLabel?: string; danger?: boolean }) => Promise<boolean> } | null>(null)

async function load(): Promise<void> {
  try { data.value = await adminFetch<Dashboard>('/api/admin/dashboard') } catch (e) { error.value = parseApiError(e).message }
}
onMounted(load)

async function demo(action: 'seed' | 'purge'): Promise<void> {
  if (action === 'purge' && !(await confirm.value?.ask({ title: 'Supprimer les données de démonstration ?', message: 'Seuls les éléments marqués « démo » seront supprimés. Vos données réelles ne sont pas touchées.', confirmLabel: 'Supprimer la démo', danger: true }))) return
  busy.value = true
  try {
    await adminFetch(`/api/admin/demo/${action}`, { method: 'POST' })
    toasts.ok(action === 'seed' ? 'Données de démonstration insérées.' : 'Données de démonstration supprimées.')
    await load()
  } catch (e) { toasts.error(parseApiError(e).message) } finally { busy.value = false }
}

const date = (iso: string | null): string => (iso ? new Intl.DateTimeFormat('fr-FR', { dateStyle: 'long', timeStyle: 'short' }).format(new Date(iso)) : 'Aucune modification')
const cards = computed(() => data.value ? [
  { label: 'Projets publiés', value: data.value.stats.projectsPublished, to: '/admin/projects' },
  { label: 'Projets en brouillon', value: data.value.stats.projectsDraft, to: '/admin/projects' },
  { label: 'Compétences', value: data.value.stats.skillsTotal, hint: `${data.value.stats.skillsVisible} visibles`, to: '/admin/skills' },
  { label: 'Étapes de parcours', value: data.value.stats.educationCount, to: '/admin/education' },
  { label: 'Expériences', value: data.value.stats.experiencesCount, to: '/admin/experiences' },
  { label: 'Certifications', value: data.value.stats.certificationsCount, to: '/admin/certifications' },
  { label: 'Réalisations', value: data.value.stats.achievementsCount, to: '/admin/achievements' },
  { label: 'Messages non lus', value: data.value.stats.unreadMessages, to: '/admin/messages' },
] : [])
const checks = computed(() => data.value ? [
  { label: 'Base de données Neon', ok: data.value.config.database, help: 'DATABASE_URL' },
  { label: 'Secret de session', ok: data.value.config.sessionSecret, help: 'NUXT_SESSION_PASSWORD (32 caractères minimum)' },
  { label: 'Cloudinary (images)', ok: data.value.config.cloudinary, help: 'CLOUDINARY_CLOUD_NAME / API_KEY / API_SECRET' },
  { label: 'Envoi d’e-mails (SMTP)', ok: data.value.config.smtp, help: 'SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASSWORD, SMTP_FROM' },
  { label: 'Destinataire des messages', ok: data.value.config.recipient, help: 'Page « Canaux et e-mail »' },
  { label: 'Numéro WhatsApp', ok: data.value.config.whatsapp, help: 'Page « Canaux et e-mail » (facultatif)' },
] : [])
</script>

<template>
  <div>
    <AdminPageHeader title="Tableau de bord" :description="data ? `Bienvenue. Dernière modification du site : ${date(data.stats.lastModifiedAt)}.` : ''">
      <template #actions><Button as-child variant="outline" size="sm"><a href="/?preview=1" target="_blank" rel="noopener">Aperçu du site<ExternalLink /></a></Button></template>
    </AdminPageHeader>
    <p v-if="error" class="rounded-xl border border-danger/40 bg-danger/10 p-4 text-sm text-danger" role="alert">{{ error }}</p>
    <p v-else-if="!data" class="text-sm text-muted" role="status">Chargement…</p>
    <div v-else class="grid gap-6">
      <p v-if="!data.identity.customized" class="flex items-start gap-3 rounded-xl border border-warn/40 bg-warn/10 p-4 text-sm text-warn"><AlertTriangle class="mt-0.5 size-4 shrink-0" />Votre nom et vos textes sont encore ceux de démonstration : personnalisez-les dans <NuxtLink to="/admin/content" class="underline">Textes et liens</NuxtLink>.</p>
      <section class="grid grid-cols-2 gap-3 md:grid-cols-4" aria-label="Chiffres clés">
        <NuxtLink v-for="card in cards" :key="card.label" :to="card.to" class="admin-card p-4 transition hover:border-accent/50"><p class="font-display text-3xl font-bold">{{ card.value }}</p><p class="text-sm font-semibold">{{ card.label }}</p><p v-if="card.hint" class="text-xs text-muted">{{ card.hint }}</p></NuxtLink>
      </section>
      <div class="grid gap-6 lg:grid-cols-2">
        <section class="admin-card p-5"><h2 class="font-display text-lg font-semibold">Palette actuelle</h2>
          <ul class="mt-4 grid grid-cols-3 gap-3 sm:grid-cols-4"><li v-for="f in THEME_FIELDS" :key="f.key" class="grid gap-1.5"><span class="h-10 rounded-lg border border-fg/15" :style="{ background: data.theme[f.key] }" /><span class="text-[.7rem] font-semibold leading-tight">{{ f.label }}</span><span class="font-mono text-[.65rem] text-muted">{{ data.theme[f.key] }}</span></li></ul>
          <Button as-child variant="glass" size="sm" class="mt-4"><NuxtLink to="/admin/appearance">Modifier l’apparence</NuxtLink></Button>
        </section>
        <section class="admin-card p-5"><h2 class="font-display text-lg font-semibold">État de la configuration</h2>
          <ul class="mt-4 grid gap-2"><li v-for="c in checks" :key="c.label" class="flex items-start gap-3 text-sm"><component :is="c.ok ? CheckCircle2 : AlertTriangle" class="mt-0.5 size-4 shrink-0" :class="c.ok ? 'text-ok' : 'text-warn'" /><span><span class="font-semibold">{{ c.label }}</span><span class="block text-xs text-muted">{{ c.ok ? 'Configuré' : `À renseigner : ${c.help}` }}</span></span></li></ul>
        </section>
      </div>
      <section class="admin-card p-5"><h2 class="font-display text-lg font-semibold">Données de démonstration</h2>
        <p class="mt-1 text-sm text-muted">{{ data.demoRows ? `${data.demoRows} élément(s) de démonstration présents (marqués « démo » sur le site).` : 'Aucune donnée de démonstration. Vous pouvez en insérer pour voir toutes les scènes remplies, puis les supprimer en un clic.' }}</p>
        <div class="mt-4 flex flex-wrap gap-2"><Button size="sm" variant="glass" :disabled="busy || data.demoRows > 0" @click="demo('seed')"><FlaskConical />Insérer la démo</Button><Button size="sm" variant="ghost" :disabled="busy || data.demoRows === 0" @click="demo('purge')"><Trash2 />Supprimer la démo</Button></div>
      </section>
    </div>
    <AdminConfirm ref="confirm" />
  </div>
</template>
