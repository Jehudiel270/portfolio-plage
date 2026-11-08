import { describe, expect, it } from 'vitest'
import { resolveEntityKey } from '../../server/utils/entity'

describe('entity route parsing', () => {
  it('uses the entity route parameter when the adapter provides it', () => {
    expect(resolveEntityKey('skills', '/api/admin/content/projects')).toBe('skills')
  })

  it('falls back to the API path when the adapter omits the entity parameter', () => {
    expect(resolveEntityKey(undefined, '/api/admin/content/projects')).toBe('projects')
  })

  it('rejects unknown API entity paths', () => {
    expect(resolveEntityKey(undefined, '/api/admin/content/unknown')).toBeNull()
  })
})
