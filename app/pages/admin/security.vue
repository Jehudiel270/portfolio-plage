<script setup lang="ts">
import { KeyRound, LogOut, ShieldCheck, ShieldOff, Smartphone } from 'lucide-vue-next'
import { Button } from '~/components/ui/button'

definePageMeta({ layout: 'admin' })
const toasts = useToasts()
const session = useAdminSession()
const enabled = computed(() => Boolean(session.value?.user?.totpEnabled))
const pwd = reactive({ current: '', next: '', confirm: '', code: '' })
const setup = ref<{ secret: string; qrSvg: string } | null>(null)
const code = ref('')
const setupPassword = ref('')
const recoveryCodes = ref<string[]>([])
const disable = reactive({ password: '', code: '' })
const sessions = ref<{ id: string; userAgent: string | null; createdAt: string; lastUsedAt: string; current: boolean }[]>([])
const busy = ref(false)

const loadSessions = async (): Promise<void> => { sessions.value = (await adminFetch<{ items: typeof sessions.value }>('/api/admin/security/sessions')).items }
onMounted(() => { if (enabled.value) void loadSessions() })
const date = (iso: string): string => new Intl.DateTimeFormat('fr-FR', { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(iso))
const device = (ua: string | null): string => (ua ? (/Firefox/.test(ua) ? 'Firefox' : /Edg/.test(ua) ? 'Edge' : /Chrome/.test(ua) ? 'Chrome' : /Safari/.test(ua) ? 'Safari' : 'Navigateur') + (/Mobile|Android|iPhone/.test(ua) ? ' (mobile)' : '') : 'Appareil inconnu')
const qrSrc = computed(() => (setup.value ? `data:image/svg+xml;utf8,${encodeURIComponent(setup.value.qrSvg)}` : ''))

async function run(task: () => Promise<void>): Promise<void> { busy.value = true; try { await task() } catch (e) { toasts.error(parseApiError(e).message) } finally { busy.value = false } }
const changePassword = (): Promise<void> => run(async () => {
  if (pwd.next !== pwd.confirm) { toasts.error('Les deux nouveaux mots de passe ne correspondent pas.'); return }
  const r = await adminFetch<{ revokedSessions: number }>('/api/admin/security/password', { method: 'POST', body: { current: pwd.current, next: pwd.next, ...(enabled.value ? { code: pwd.code } : {}) } })
  Object.assign(pwd, { current: '', next: '', confirm: '', code: '' })
  toasts.ok(`Mot de passe modifié. ${r.revokedSessions} autre(s) session(s) déconnectée(s).`)
  await loadSessions()
})
const startSetup = (): Promise<void> => run(async () => { setup.value = await adminFetch<{ secret: string; qrSvg: string }>('/api/admin/security/2fa/setup', { method: 'POST', body: { password: setupPassword.value } }) })
const enable = (): Promise<void> => run(async () => {
  const result = await adminFetch<{ recoveryCodes: string[] }>('/api/admin/security/2fa/enable', { method: 'POST', body: { code: code.value, password: setupPassword.value } })
  if (session.value?.user) session.value = { ...session.value, user: { ...session.value.user, totpEnabled: true } }
  setup.value = null; code.value = ''; setupPassword.value = ''
  recoveryCodes.value = result.recoveryCodes
  toasts.ok('Vérification en deux étapes activée. Enregistrez vos codes de récupération.')
  await loadSessions()
})
const turnOff = (): Promise<void> => run(async () => {
  await adminFetch('/api/admin/security/2fa/disable', { method: 'POST', body: { ...disable } })
  if (session.value?.user) session.value = { ...session.value, user: { ...session.value.user, totpEnabled: false } }
  Object.assign(disable, { password: '', code: '' })
  toasts.ok('Vérification en deux étapes désactivée.')
})
const revokeOthers = (): Promise<void> => run(async () => { const r = await adminFetch<{ revoked: number }>('/api/admin/security/sessions/revoke-others', { method: 'POST' }); toasts.ok(`${r.revoked} session(s) déconnectée(s).`); await loadSessions() })
</script>

<template>
  <div class="grid gap-6">
    <AdminPageHeader title="Sécurité" description="Protégez l’accès : mot de passe solide, vérification en deux étapes (application d’authentification) et contrôle des sessions ouvertes." />

    <section class="admin-card p-6"><div class="flex flex-wrap items-center gap-3"><span class="icon-tile size-12" :class="enabled ? '!bg-ok/12' : '!bg-warn/12'"><component :is="enabled ? ShieldCheck : ShieldOff" class="size-6" :class="enabled ? 'text-ok' : 'text-warn'" /></span><div><h2 class="font-display text-lg font-bold">Vérification en deux étapes</h2><p class="text-sm" :class="enabled ? 'text-ok' : 'text-warn'" role="status">{{ enabled ? 'Activée : un code à 6 chiffres est demandé à chaque connexion.' : 'Désactivée : activez-la pour qu’un mot de passe volé ne suffise pas.' }}</p></div></div>
      <form v-if="!enabled && !setup" class="mt-4 flex flex-wrap items-end gap-3" @submit.prevent="startSetup"><AdminField label="Mot de passe actuel" for="setup-password"><input id="setup-password" v-model="setupPassword" type="password" autocomplete="current-password" class="admin-input" required></AdminField><Button type="submit" :disabled="busy || !setupPassword"><Smartphone />Configurer la 2FA</Button></form>
      <div v-if="setup" class="mt-5 grid gap-5 md:grid-cols-[auto_1fr]"><img :src="qrSrc" alt="QR code à scanner avec votre application d’authentification" width="200" height="200" class="rounded-xl border border-line bg-white p-2"><div class="grid content-start gap-3"><p class="text-sm">1. Scannez le QR code avec Google Authenticator, Authy, 1Password, Aegis…<br>2. Saisissez le code à 6 chiffres affiché.</p><p class="text-xs text-muted">Saisie manuelle : <code class="select-all break-all font-bold text-fg">{{ setup.secret }}</code></p>
        <form class="flex flex-wrap items-end gap-3" @submit.prevent="enable"><AdminField label="Code à 6 chiffres" for="totp-code"><input id="totp-code" v-model="code" class="admin-input w-40 text-center font-mono tracking-widest" inputmode="numeric" autocomplete="one-time-code" maxlength="8" required></AdminField><Button type="submit" :disabled="busy || code.length < 6 || !setupPassword">Vérifier et activer</Button></form></div></div>
      <section v-if="recoveryCodes.length" class="mt-5 rounded-2xl border border-warn/40 bg-warn/8 p-5" aria-labelledby="recovery-title">
        <h3 id="recovery-title" class="font-bold">Codes de récupération — affichés une seule fois</h3>
        <p class="mt-1 text-sm text-muted">Conservez-les dans un gestionnaire de mots de passe. Chaque code ne fonctionne qu’une fois. Quitter cette page les efface de l’écran.</p>
        <ul class="mt-3 grid grid-cols-2 gap-2 font-mono text-sm sm:grid-cols-5"><li v-for="item in recoveryCodes" :key="item" class="rounded-lg bg-surface px-3 py-2 text-center">{{ item }}</li></ul>
        <Button class="mt-4" size="sm" variant="outline" @click="recoveryCodes = []">J’ai enregistré les codes</Button>
      </section>
      <form v-if="enabled" class="mt-5 grid gap-3 sm:grid-cols-[1fr_1fr_auto] sm:items-end" @submit.prevent="turnOff"><AdminField label="Mot de passe" for="d-pwd"><input id="d-pwd" v-model="disable.password" type="password" class="admin-input" autocomplete="current-password" required></AdminField><AdminField label="Code actuel" for="d-code"><input id="d-code" v-model="disable.code" class="admin-input font-mono" inputmode="numeric" maxlength="8" required></AdminField><Button type="submit" variant="outline" :disabled="busy">Désactiver</Button></form></section>

    <section class="admin-card p-6"><div class="flex items-center gap-3"><span class="icon-tile size-12"><KeyRound class="size-6 text-primary" /></span><h2 class="font-display text-lg font-bold">Changer le mot de passe</h2></div>
      <form class="mt-4 grid gap-4 sm:grid-cols-3" @submit.prevent="changePassword"><AdminField label="Mot de passe actuel" for="p-cur"><input id="p-cur" v-model="pwd.current" type="password" class="admin-input" autocomplete="current-password" required></AdminField><AdminField label="Nouveau (12 caractères min.)" for="p-new"><input id="p-new" v-model="pwd.next" type="password" class="admin-input" autocomplete="new-password" minlength="12" required></AdminField><AdminField label="Confirmation" for="p-conf"><input id="p-conf" v-model="pwd.confirm" type="password" class="admin-input" autocomplete="new-password" required></AdminField>
        <AdminField v-if="enabled" label="Code de vérification actuel" for="p-code"><input id="p-code" v-model="pwd.code" class="admin-input font-mono" inputmode="numeric" autocomplete="one-time-code" maxlength="8" required></AdminField>
        <div class="sm:col-span-3"><Button type="submit" :disabled="busy || !pwd.current || pwd.next.length < 12">Modifier le mot de passe</Button><span class="ml-3 text-sm text-muted">Les autres sessions seront déconnectées.</span></div></form></section>

    <section class="admin-card p-6"><div class="flex flex-wrap items-center justify-between gap-3"><h2 class="font-display text-lg font-bold">Sessions ouvertes</h2><Button size="sm" variant="soft" :disabled="busy || sessions.length < 2" @click="revokeOthers"><LogOut />Déconnecter les autres appareils</Button></div>
      <ul class="mt-4 divide-y divide-line"><li v-for="s in sessions" :key="s.id" class="flex flex-wrap items-center gap-3 py-3 text-sm"><span class="font-bold">{{ device(s.userAgent) }}</span><Badge v-if="s.current" tone="ok">cet appareil</Badge><span class="text-muted">Connecté le {{ date(s.createdAt) }} · dernière activité {{ date(s.lastUsedAt) }}</span></li></ul></section>
  </div>
</template>
