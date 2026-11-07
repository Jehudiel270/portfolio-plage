export const ADMIN_MODULES = [
  'projects',
  'skills',
  'journey',
  'categories',
  'profile',
  'appearance',
  'display',
  'labels',
  'seo',
  'contact',
  'messages',
  'security',
  'media',
] as const

export type AdminModule = typeof ADMIN_MODULES[number]
export type AdminAccess = 'read' | 'write'
export type AdminPermissionGrant = { module: AdminModule; access: AdminAccess }
export type AdminRole = 'superadmin' | 'admin' | 'editor'

export function isAdminAccountOwner(actorEmail: string | null | undefined, ownerEmail: string | null | undefined): boolean {
  const owner = ownerEmail?.trim().toLowerCase()
  return Boolean(owner && actorEmail?.trim().toLowerCase() === owner)
}

export function adminPasswordMinimumLength(email: string | null | undefined, ownerEmail: string | null | undefined): number {
  return isAdminAccountOwner(email, ownerEmail) ? 10 : 12
}

export const ADMIN_MODULE_LABELS: Record<AdminModule, string> = {
  projects: 'Projets',
  skills: 'Compétences',
  journey: 'Parcours',
  categories: 'Catégories',
  profile: 'Profil et contenus',
  appearance: 'Apparence',
  display: 'Affichage et navigation',
  labels: 'Textes de l’interface',
  seo: 'SEO et confidentialité',
  contact: 'Canaux de contact',
  messages: 'Messages reçus',
  security: 'Sécurité du compte',
  media: 'Médiathèque',
}

export const DEFAULT_ADMIN_PERMISSIONS: AdminPermissionGrant[] = ADMIN_MODULES.map((module) => ({ module, access: 'write' }))

export function hasAdminPermission(
  role: string | undefined,
  grants: readonly AdminPermissionGrant[] | undefined,
  module: AdminModule,
  access: AdminAccess,
): boolean {
  if (role === 'superadmin') return true
  const grant = grants?.find((item) => item.module === module)
  return grant?.access === 'write' || (access === 'read' && grant?.access === 'read')
}

export function adminPageModule(path: string): AdminModule | null {
  if (path.startsWith('/admin/projects')) return 'projects'
  if (path.startsWith('/admin/skills')) return 'skills'
  if (/^\/admin\/(experiences|education|certifications|achievements|import-cv)/.test(path)) return 'journey'
  if (path.startsWith('/admin/categories')) return 'categories'
  if (path.startsWith('/admin/content')) return 'profile'
  if (path.startsWith('/admin/appearance') || path.startsWith('/admin/effects')) return 'appearance'
  if (path.startsWith('/admin/display')) return 'display'
  if (path.startsWith('/admin/labels')) return 'labels'
  if (path.startsWith('/admin/seo')) return 'seo'
  if (path.startsWith('/admin/contact')) return 'contact'
  if (path.startsWith('/admin/messages')) return 'messages'
  if (path.startsWith('/admin/security')) return 'security'
  return null
}
