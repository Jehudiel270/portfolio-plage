import { describe, expect, it } from 'vitest'
import type { AdminContext } from '../../server/utils/auth'
import { canAccessAdminApi } from '../../server/utils/admin-access'

const editor: AdminContext = {
  sessionId: 'session', adminId: 2, email: 'editor@example.com', role: 'editor', totpEnabled: true,
  permissions: [{ module: 'projects', access: 'read' }, { module: 'skills', access: 'write' }, { module: 'security', access: 'write' }],
}

describe('admin module authorization', () => {
  it('separates reading from modifying content by module', () => {
    expect(canAccessAdminApi(editor, '/api/admin/content/projects', 'GET')).toBe(true)
    expect(canAccessAdminApi(editor, '/api/admin/content/projects/technology-icons', 'GET')).toBe(true)
    expect(canAccessAdminApi(editor, '/api/admin/content/projects/technology-icons', 'POST')).toBe(false)
    expect(canAccessAdminApi(editor, '/api/admin/content/projects', 'POST')).toBe(false)
    expect(canAccessAdminApi(editor, '/api/admin/content/skills', 'PATCH')).toBe(true)
    expect(canAccessAdminApi(editor, '/api/admin/messages', 'GET')).toBe(false)
  })

  it('reserves account management and demo purges for super administrators', () => {
    expect(canAccessAdminApi(editor, '/api/admin/admins', 'GET')).toBe(false)
    expect(canAccessAdminApi(editor, '/api/admin/demo/purge', 'POST')).toBe(false)
    expect(canAccessAdminApi({ ...editor, role: 'superadmin' }, '/api/admin/admins', 'DELETE')).toBe(true)
  })
})
