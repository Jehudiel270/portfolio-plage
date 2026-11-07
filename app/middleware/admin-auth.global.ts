import { adminPageModule, hasAdminPermission } from '#shared/admin-permissions'

/** Protège toutes les pages /admin (hors connexion). Les routes API vérifient de toute façon la session côté serveur. */
export default defineNuxtRouteMiddleware(async (to) => {
  if (!to.path.startsWith('/admin') || to.path === '/admin/login') return
  const session = useAdminSession()
  if (!session.value) await refreshAdminSession()
  if (!session.value?.authenticated) return navigateTo('/admin/login')
  if (session.value.user?.role === 'superadmin') return
  const module = adminPageModule(to.path)
  const totpSetup = session.value.totpRequired && session.value.user?.totpEnabled === false
  if (module && !(totpSetup && module === 'security') && !hasAdminPermission(session.value.user?.role, session.value.user?.permissions, module, 'read')) return navigateTo('/admin')
  if (to.path.startsWith('/admin/admins')) return navigateTo('/admin')
  if (totpSetup && to.path !== '/admin/security') return navigateTo('/admin/security?setup=1')
})
