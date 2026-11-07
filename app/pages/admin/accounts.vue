<script setup lang="ts">
import { ADMIN_MODULES, ADMIN_MODULE_LABELS, type AdminAccess, type AdminModule, type AdminPermissionGrant, type AdminRole } from '#shared/admin-permissions'
import { Button } from '~/components/ui/button'

definePageMeta({ layout: 'admin' })

interface Account {
  id: number
  email: string
  role: AdminRole
  permissions: AdminPermissionGrant[]
  totpEnabled: boolean
  createdAt: string
  lastLoginAt: string | null
}
interface AccountDraft { role: AdminRole; permissions: Record<AdminModule, AdminAccess | ''> }
interface AuditEntry { id: number; actorEmail: string | null; action: string; target: string; details: Record<string, string | number | boolean | null>; createdAt: string }

const session = useAdminSession()
const toasts = useToasts()
const accounts = ref<Account[]>([])
const audit = ref<AuditEntry[]>([])
const drafts = ref<Record<number, AccountDraft>>({})
const canCreateAccounts = ref(false)
const loading = ref(false)
const busy = ref(false)
const form = reactive({ email: '', password: '', role: 'admin' as AdminRole })
const permissions = reactive(Object.fromEntries(ADMIN_MODULES.map((module) => [module, ''])) as Record<AdminModule, AdminAccess | ''>)

const grantsFrom = (grants: AdminPermissionGrant[]): Record<AdminModule, AdminAccess | ''> => {
  const values = Object.fromEntries(ADMIN_MODULES.map((module) => [module, ''])) as Record<AdminModule, AdminAccess | ''>
  for (const grant of grants) values[grant.module] = grant.access
  return values
}
const grantsTo = (values: Record<AdminModule, AdminAccess | ''>): AdminPermissionGrant[] =>
  ADMIN_MODULES.flatMap((module) => values[module] ? [{ module, access: values[module] as AdminAccess }] : [])
const makeDraft = (account: Account): AccountDraft => ({ role: account.role, permissions: grantsFrom(account.permissions) })

async function load(): Promise<void> {
  loading.value = true
  try {
    const [users, logs] = await Promise.all([
      adminFetch<{ items: Account[]; canCreateAccounts: boolean }>('/api/admin/admins'),
      adminFetch<{ items: AuditEntry[] }>('/api/admin/admins/audit'),
    ])
    accounts.value = users.items
    canCreateAccounts.value = users.canCreateAccounts
    audit.value = logs.items
    drafts.value = Object.fromEntries(users.items.map((account) => [account.id, makeDraft(account)]))
  } catch (error) {
    toasts.error(parseApiError(error).message)
  } finally { loading.value = false }
}
onMounted(() => { void load() })

async function createAccount(): Promise<void> {
  busy.value = true
  try {
    await adminFetch('/api/admin/admins', {
      method: 'POST',
      body: { email: form.email, password: form.password, role: form.role, permissions: grantsTo(permissions) },
    })
    Object.assign(form, { email: '', password: '', role: 'admin' })
    for (const module of ADMIN_MODULES) permissions[module] = ''
    toasts.ok('Compte créé. Communiquez les identifiants par un canal sécurisé.')
    await load()
  } catch (error) { toasts.error(parseApiError(error).message) } finally { busy.value = false }
}

async function save(account: Account): Promise<void> {
  const draft = drafts.value[account.id]
  if (!draft) return
  busy.value = true
  try {
    await adminFetch(`/api/admin/admins/${account.id}`, {
      method: 'PATCH',
      body: { role: draft.role, permissions: grantsTo(draft.permissions) },
    })
    toasts.ok('Rôle et autorisations enregistrés. Les sessions de ce compte ont été révoquées.')
    await load()
  } catch (error) { toasts.error(parseApiError(error).message) } finally { busy.value = false }
}

async function remove(account: Account): Promise<void> {
  if (!window.confirm(`Supprimer le compte ${account.email} et révoquer ses sessions ?`)) return
  busy.value = true
  try {
    await adminFetch(`/api/admin/admins/${account.id}`, { method: 'DELETE' })
    toasts.ok('Compte supprimé.')
    await load()
  } catch (error) { toasts.error(parseApiError(error).message) } finally { busy.value = false }
}

const date = (value: string | null): string => value ? new Intl.DateTimeFormat('fr-FR', { dateStyle: 'medium' }).format(new Date(value)) : 'Jamais'
</script>

<template>
  <div class="grid gap-6">
    <AdminPageHeader title="Comptes et accès" description="Gérez les comptes dédiés et limitez chacun aux espaces dont il a besoin. La création est réservée au propriétaire; les autorisations sont toujours contrôlées par l’API." />

    <section v-if="canCreateAccounts" class="admin-card p-6">
      <h2 class="font-display text-xl font-bold">Créer un compte</h2>
      <p class="mt-1 text-sm text-muted">Le compte propriétaire est le seul autorisé à créer des comptes, y compris d’autres super administrateurs.</p>
      <form class="mt-5 grid gap-4 md:grid-cols-3" @submit.prevent="createAccount">
        <AdminField label="Adresse e-mail" for="account-email"><input id="account-email" v-model="form.email" type="email" autocomplete="off" class="admin-input" required></AdminField>
        <AdminField label="Mot de passe temporaire (12 caractères min.)" for="account-password"><input id="account-password" v-model="form.password" type="password" autocomplete="new-password" minlength="12" class="admin-input" required></AdminField>
        <AdminField label="Rôle" for="account-role"><select id="account-role" v-model="form.role" class="admin-input"><option value="admin">Administrateur</option><option value="editor">Éditeur</option><option value="superadmin">Super administrateur</option></select></AdminField>
        <details v-if="form.role !== 'superadmin'" class="admin-disclosure md:col-span-3">
          <summary>Définir les espaces accessibles <span class="text-muted">(optionnel)</span></summary>
          <p class="mt-2 text-sm text-muted">« Lecture » permet de consulter ; « Gestion » autorise les modifications. Sans accès, l’espace n’apparaît pas et l’API le refuse.</p>
          <div class="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
            <label v-for="module in ADMIN_MODULES" :key="module" class="flex items-center justify-between gap-3 rounded-xl border border-line p-3 text-sm">
              <span class="font-semibold">{{ ADMIN_MODULE_LABELS[module] }}</span>
              <select v-model="permissions[module]" class="admin-input !w-auto !py-1.5" :aria-label="`Accès : ${ADMIN_MODULE_LABELS[module]}`">
                <option value="">Aucun</option><option value="read">Lecture</option><option value="write">Gestion</option>
              </select>
            </label>
          </div>
        </details>
        <div class="md:col-span-3"><Button type="submit" :disabled="busy || !form.email || form.password.length < 12">Créer le compte</Button></div>
      </form>
    </section>
    <p v-else class="admin-card p-5 text-sm text-muted">La création de comptes, y compris de super administrateurs, est réservée au compte propriétaire.</p>

    <section class="admin-card p-6">
      <div class="flex flex-wrap items-end justify-between gap-3">
        <div><h2 class="font-display text-xl font-bold">Comptes existants</h2><p class="mt-1 text-sm text-muted">Les changements d’accès invalident immédiatement les sessions de la personne concernée.</p></div>
        <Button size="sm" variant="soft" :disabled="loading" @click="load">Actualiser</Button>
      </div>
      <p v-if="loading && !accounts.length" class="mt-5 text-sm text-muted" role="status">Chargement des comptes…</p>
      <p v-else-if="!accounts.length" class="mt-5 text-sm text-muted">Aucun compte.</p>
      <div v-else class="mt-5 grid gap-3">
        <details v-for="account in accounts" :key="account.id" class="admin-disclosure">
          <summary class="flex flex-wrap items-center gap-3">
            <span class="min-w-0 flex-1 truncate font-bold">{{ account.email }}</span>
            <span class="rounded-full bg-primary/10 px-2.5 py-1 text-xs font-bold text-primary">{{ account.role === 'superadmin' ? 'Super admin' : account.role === 'editor' ? 'Éditeur' : 'Admin' }}</span>
            <span class="text-xs" :class="account.totpEnabled ? 'text-ok' : 'text-warn'">{{ account.totpEnabled ? '2FA active' : '2FA à activer' }}</span>
          </summary>
          <div v-if="drafts[account.id]" class="mt-4 grid gap-4">
            <p class="text-sm text-muted">Dernière connexion : {{ date(account.lastLoginAt) }}. Créé le {{ date(account.createdAt) }}.</p>
            <div class="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
              <label v-for="module in ADMIN_MODULES" :key="module" class="flex items-center justify-between gap-3 rounded-xl border border-line p-3 text-sm">
                <span class="font-semibold">{{ ADMIN_MODULE_LABELS[module] }}</span>
                <select v-model="drafts[account.id]!.permissions[module]" class="admin-input !w-auto !py-1.5" :disabled="account.role === 'superadmin'" :aria-label="`Accès : ${ADMIN_MODULE_LABELS[module]}`">
                  <option value="">Aucun</option><option value="read">Lecture</option><option value="write">Gestion</option>
                </select>
              </label>
            </div>
            <div class="flex flex-wrap items-end gap-3">
              <AdminField label="Rôle" :for="`role-${account.id}`"><select :id="`role-${account.id}`" v-model="drafts[account.id]!.role" class="admin-input" :disabled="account.id === session?.user?.id"><option value="admin">Administrateur</option><option value="editor">Éditeur</option><option value="superadmin">Super administrateur</option></select></AdminField>
              <Button :disabled="busy || account.id === session?.user?.id" @click="save(account)">Enregistrer l’accès</Button>
              <Button v-if="account.id !== session?.user?.id" variant="outline" :disabled="busy" @click="remove(account)">Supprimer</Button>
              <p v-if="account.id === session?.user?.id" class="text-xs text-muted">Votre propre rôle ne peut pas être modifié ici.</p>
            </div>
          </div>
        </details>
      </div>
    </section>

    <details class="admin-disclosure">
      <summary>Journal des comptes et de la sécurité</summary>
      <p class="mt-2 text-sm text-muted">Connexions, comptes et opérations de sécurité ; les changements de contenu éditorial ne sont pas inclus. Aucun mot de passe, code 2FA ou jeton de session n’est journalisé.</p>
      <ol class="mt-4 divide-y divide-line">
        <li v-for="entry in audit" :key="entry.id" class="grid gap-1 py-3 text-sm sm:grid-cols-[1fr_auto]">
          <span><strong>{{ entry.actorEmail ?? 'Compte supprimé' }}</strong> · {{ entry.action }} <span v-if="entry.target">· {{ entry.target }}</span></span>
          <time class="text-xs text-muted">{{ new Intl.DateTimeFormat('fr-FR', { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(entry.createdAt)) }}</time>
        </li>
      </ol>
    </details>
  </div>
</template>
