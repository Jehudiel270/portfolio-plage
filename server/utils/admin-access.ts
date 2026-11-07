import { ADMIN_MODULES, hasAdminPermission, type AdminAccess, type AdminModule } from '../../shared/admin-permissions'
import type { AdminContext } from './auth'

const settingsModules: Record<string, AdminModule> = {
  content: 'profile', social: 'profile', theme: 'appearance', effects: 'appearance', sections: 'display',
  journey: 'journey', display: 'display', navigation: 'display', contact: 'contact', widget: 'contact',
  ui: 'labels', seo: 'seo', privacy: 'seo',
}

function moduleForPath(path: string): AdminModule | null {
  if (path === '/api/admin/dashboard') return null
  if (path.startsWith('/api/admin/admins')) return null
  if (path.startsWith('/api/admin/security')) return 'security'
  if (path.startsWith('/api/admin/messages')) return 'messages'
  if (path.startsWith('/api/admin/categories')) return 'categories'
  if (path.startsWith('/api/admin/content/')) {
    const entity = path.split('/')[4]
    if (entity === 'projects') return 'projects'
    if (entity === 'skills') return 'skills'
    if (['education', 'experiences', 'certifications', 'achievements'].includes(entity ?? '')) return 'journey'
  }
  if (path.startsWith('/api/admin/cv/')) return 'journey'
  if (path.startsWith('/api/admin/settings/')) return settingsModules[path.split('/')[4] ?? ''] ?? null
  if (path === '/api/admin/settings') return null
  if (path.startsWith('/api/admin/uploads/')) return 'media'
  if (path.startsWith('/api/admin/email/')) return 'contact'
  if (path.startsWith('/api/admin/icons/')) return 'media'
  if (path.startsWith('/api/admin/demo/')) return null
  return null
}

export function canAccessAdminApi(admin: AdminContext, path: string, method: string): boolean {
  if (admin.role === 'superadmin') return true
  if (!admin.totpEnabled && ['/api/admin/security/2fa/setup', '/api/admin/security/2fa/enable'].includes(path)) return true
  if (path.startsWith('/api/admin/admins') || path.startsWith('/api/admin/demo/')) return false
  const module = moduleForPath(path)
  const access: AdminAccess = ['GET', 'HEAD', 'OPTIONS'].includes(method) ? 'read' : 'write'
  if (module) return hasAdminPermission(admin.role, admin.permissions, module, access)
  if (path === '/api/admin/dashboard' || path === '/api/admin/settings' || path.startsWith('/api/admin/icons/')) {
    return admin.permissions.some((grant) => ADMIN_MODULES.includes(grant.module) && (access === 'read' || grant.access === 'write'))
  }
  return false
}
