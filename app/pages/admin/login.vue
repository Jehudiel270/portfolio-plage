<script setup lang="ts">
import { LogIn } from 'lucide-vue-next'
import { Button } from '~/components/ui/button'

definePageMeta({ layout: false })
useHead({ title: 'Connexion — administration', meta: [{ name: 'robots', content: 'noindex, nofollow' }] })

const session = useAdminSession()
const email = ref('')
const password = ref('')
const busy = ref(false)
const error = ref('')
const code = ref('')
const needsCode = ref(false)

onMounted(async () => {
  await refreshAdminSession()
  if (session.value?.authenticated) await navigateTo('/admin')
})

async function submit(): Promise<void> {
  error.value = ''
  busy.value = true
  try {
    const response = await $fetch<{ totpRequired: boolean; passwordMinLength: number; user: NonNullable<typeof session.value>['user']; csrfToken: string }>('/api/admin/auth/login', {
      method: 'POST',
      body: { email: email.value, password: password.value, ...(code.value ? (/^\d{6}$/.test(code.value) ? { code: code.value } : { recoveryCode: code.value }) : {}) },
    })
    session.value = { authenticated: true, databaseConfigured: true, totpRequired: response.totpRequired, passwordMinLength: response.passwordMinLength, user: response.user, csrfToken: response.csrfToken }
    code.value = ''
    password.value = ''
    await navigateTo(response.totpRequired && response.user?.totpEnabled === false ? '/admin/security?setup=1' : '/admin')
  } catch (e) {
    const parsed = parseApiError(e)
    if (parsed.code === 'TOTP_REQUIRED') { needsCode.value = true; error.value = ''; return }
    error.value = parsed.code === 'DATABASE_NOT_CONFIGURED' ? 'La base de données n’est pas configurée : renseignez DATABASE_URL puis exécutez les migrations (voir le README).' : parsed.message
  } finally {
    busy.value = false
  }
}
</script>

<template>
  <div class="admin-theme grid min-h-svh place-items-center bg-gradient-to-b from-sky to-bg p-4">
    <form class="admin-card w-full max-w-md p-8 shadow-xl" novalidate @submit.prevent="submit">
      <h1 class="font-display text-3xl font-bold">Administration</h1>
      <p class="mt-1 text-sm text-muted">Espace réservé : connectez-vous pour gérer le portfolio.</p>
      <div class="mt-6 grid gap-4">
        <AdminField label="E-mail" for="login-email"><input id="login-email" v-model="email" class="admin-input" type="email" autocomplete="username" required autofocus></AdminField>
        <AdminField label="Mot de passe" for="login-password"><input id="login-password" v-model="password" class="admin-input" type="password" autocomplete="current-password" required></AdminField>
        <AdminField v-if="needsCode" label="Code de vérification ou de récupération" for="login-code" hint="Code de l’application ou l’un de vos codes de secours."><input id="login-code" v-model="code" class="admin-input text-center font-mono tracking-widest" inputmode="text" autocomplete="one-time-code" maxlength="24" required autofocus></AdminField>
        <p v-if="error" class="rounded-xl border border-danger/40 bg-danger/10 p-3 text-sm text-danger" role="alert">{{ error }}</p>
        <Button type="submit" :disabled="busy || !email || !password"><LogIn />{{ busy ? 'Connexion…' : 'Se connecter' }}</Button>
      </div>
      <p class="mt-6 text-xs text-muted">Aucun compte par défaut : le premier administrateur se crée en ligne de commande (<code>pnpm admin:create</code>).</p>
    </form>
  </div>
</template>
