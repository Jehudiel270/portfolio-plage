import { describe, expect, it } from 'vitest'
import { isAdminAccountOwner } from '../../shared/admin-permissions'

describe('propriétaire des comptes administrateur', () => {
  it('compare les adresses sans tenir compte des espaces ni de la casse', () => {
    expect(isAdminAccountOwner(' DossouCarrel@Gmail.com ', 'dossoucarrel@gmail.com')).toBe(true)
  })

  it('refuse tout autre compte ou propriétaire non configuré', () => {
    expect(isAdminAccountOwner('admin@example.com', 'dossoucarrel@gmail.com')).toBe(false)
    expect(isAdminAccountOwner('dossoucarrel@gmail.com', '')).toBe(false)
    expect(isAdminAccountOwner(null, 'dossoucarrel@gmail.com')).toBe(false)
  })
})
