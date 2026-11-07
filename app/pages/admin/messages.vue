<script setup lang="ts">
import { Check, CheckCheck, Mail, MailOpen, Trash2 } from 'lucide-vue-next'
import type { MessageStatus } from '#shared/constants'
import { Button } from '~/components/ui/button'

definePageMeta({ layout: 'admin' })
interface Message { id: number; name: string; email: string | null; phone: string | null; subject: string | null; message: string; source: 'form' | 'widget'; status: MessageStatus; emailStatus: 'sent' | 'not_configured' | 'failed' | 'skipped'; createdAt: string }
const toasts = useToasts()
const filter = ref<MessageStatus | 'all'>('all')
const items = ref<Message[]>([])
const loading = ref(true)
const error = ref('')
const confirm = ref<{ ask: (o: { title: string; message: string; confirmLabel?: string; danger?: boolean }) => Promise<boolean> } | null>(null)

async function load(): Promise<void> {
  loading.value = true
  try { items.value = (await adminFetch<{ items: Message[] }>('/api/admin/messages')).items } catch (e) { error.value = parseApiError(e).message } finally { loading.value = false }
}
onMounted(load)
const shown = computed(() => items.value.filter((m) => filter.value === 'all' || m.status === filter.value))
const count = (s: MessageStatus): number => items.value.filter((m) => m.status === s).length
const date = (iso: string): string => new Intl.DateTimeFormat('fr-FR', { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(iso))
const EMAIL_LABELS = { sent: ['E-mail envoyé', 'ok'], not_configured: ['E-mail non configuré', 'warn'], failed: ['Échec d’envoi', 'danger'], skipped: ['Sans e-mail', 'muted'] } as const

async function setStatus(message: Message, status: MessageStatus): Promise<void> {
  try { await adminFetch(`/api/admin/messages/${message.id}`, { method: 'PATCH', body: { status } }); message.status = status } catch (e) { toasts.error(parseApiError(e).message) }
}
async function open(message: Message, event: Event): Promise<void> {
  if ((event.target as HTMLDetailsElement).open && message.status === 'new') await setStatus(message, 'read')
}
async function remove(message: Message): Promise<void> {
  if (!(await confirm.value?.ask({ title: 'Supprimer ce message ?', message: `Le message de ${message.name || 'visiteur'} sera définitivement supprimé.`, confirmLabel: 'Supprimer', danger: true }))) return
  try { await adminFetch(`/api/admin/messages/${message.id}`, { method: 'DELETE' }); items.value = items.value.filter((m) => m.id !== message.id); toasts.ok('Message supprimé.') } catch (e) { toasts.error(parseApiError(e).message) }
}
</script>

<template>
  <div>
    <AdminPageHeader title="Messages reçus" description="Messages du formulaire et du widget (asynchrones). Visibles uniquement ici : jamais exposés par l’API publique. La durée de conservation se règle dans « Canaux et e-mail »." />
    <div class="mb-4 flex flex-wrap gap-2" role="group" aria-label="Filtrer les messages">
      <button type="button" class="chip" :aria-pressed="filter === 'all'" @click="filter = 'all'">Tous ({{ items.length }})</button>
      <button type="button" class="chip" :aria-pressed="filter === 'new'" @click="filter = 'new'">Nouveaux ({{ count('new') }})</button>
      <button type="button" class="chip" :aria-pressed="filter === 'read'" @click="filter = 'read'">Lus ({{ count('read') }})</button>
      <button type="button" class="chip" :aria-pressed="filter === 'handled'" @click="filter = 'handled'">Traités ({{ count('handled') }})</button>
    </div>
    <p v-if="error" class="rounded-xl border border-danger/40 bg-danger/10 p-4 text-sm text-danger" role="alert">{{ error }}</p>
    <p v-else-if="loading" class="text-sm text-muted" role="status">Chargement…</p>
    <p v-else-if="!shown.length" class="admin-card p-8 text-center text-muted">Aucun message {{ filter === 'all' ? '' : 'dans cette catégorie' }}.</p>
    <ul v-else class="grid gap-3" role="list">
      <li v-for="m in shown" :key="m.id" class="admin-card">
        <details class="group" @toggle="open(m, $event)">
          <summary class="flex cursor-pointer flex-wrap items-center gap-x-3 gap-y-1 p-4">
            <component :is="m.status === 'new' ? Mail : MailOpen" class="size-4 shrink-0" :class="m.status === 'new' ? 'text-accent' : 'text-muted'" aria-hidden="true" />
            <span class="font-semibold" :class="{ 'text-accent': m.status === 'new' }">{{ m.name || 'Visiteur anonyme' }}</span>
            <span class="min-w-0 flex-1 truncate text-sm text-muted">{{ m.subject || m.message }}</span>
            <Badge :tone="EMAIL_LABELS[m.emailStatus][1]">{{ EMAIL_LABELS[m.emailStatus][0] }}</Badge>
            <Badge tone="muted">{{ m.source === 'widget' ? 'Widget' : 'Formulaire' }}</Badge>
            <time class="text-xs text-muted" :datetime="m.createdAt">{{ date(m.createdAt) }}</time>
          </summary>
          <div class="border-t border-fg/10 p-4">
            <dl class="mb-3 grid gap-1 text-sm sm:grid-cols-2"><div v-if="m.email"><dt class="inline text-muted">E-mail : </dt><dd class="inline"><a :href="`mailto:${m.email}`" class="underline">{{ m.email }}</a></dd></div><div v-if="m.phone"><dt class="inline text-muted">Téléphone : </dt><dd class="inline">{{ m.phone }}</dd></div><div v-if="m.subject"><dt class="inline text-muted">Sujet : </dt><dd class="inline">{{ m.subject }}</dd></div></dl>
            <p class="whitespace-pre-wrap rounded-xl bg-fg/[.04] p-4 text-sm leading-relaxed">{{ m.message }}</p>
            <div class="mt-4 flex flex-wrap gap-2">
              <Button size="sm" variant="glass" :disabled="m.status === 'handled'" @click="setStatus(m, 'handled')"><CheckCheck />Marquer comme traité</Button>
              <Button size="sm" variant="ghost" :disabled="m.status === 'read'" @click="setStatus(m, 'read')"><Check />Marquer comme lu</Button>
              <Button size="sm" variant="ghost" :disabled="m.status === 'new'" @click="setStatus(m, 'new')"><Mail />Marquer comme non lu</Button>
              <Button size="sm" variant="ghost" class="ml-auto text-danger" @click="remove(m)"><Trash2 />Supprimer</Button>
            </div>
          </div>
        </details>
      </li>
    </ul>
    <AdminConfirm ref="confirm" />
  </div>
</template>
