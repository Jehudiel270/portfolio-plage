/** Défense en profondeur : toute route /api/admin/* exige une session valide, sauf connexion, lecture de session et déconnexion. */
const PUBLIC_ADMIN_ROUTES = new Set(['/api/admin/auth/login', '/api/admin/auth/session', '/api/admin/auth/logout'])

export default defineEventHandler(async (event) => {
  const path = getRequestURL(event).pathname
  if (!path.startsWith('/api/admin/') || PUBLIC_ADMIN_ROUTES.has(path)) return
  await requireAdmin(event)
})
