import { describe, expect, it } from 'vitest'
import { adminPasswordMinimumLength, isAdminAccountOwner } from '../../shared/admin-permissions'

describe('propriétaire des comptes administrateur', () => {
  it('compare les adresses sans tenir compte des espaces ni de la casse', () => {
    expect(isAdminAccountOwner(' DossouCarrel@Gmail.com ', 'dossoucarrel@gmail.com')).toBe(true)
  })

  it('refuse tout autre compte ou propriétaire non configuré', () => {
    expect(isAdminAccountOwner('admin@example.com', 'dossoucarrel@gmail.com')).toBe(false)
    expect(isAdminAccountOwner('dossoucarrel@gmail.com', '')).toBe(false)
    expect(isAdminAccountOwner(null, 'dossoucarrel@gmail.com')).toBe(false)
  })

  it('assouplit la longueur uniquement pour le propriétaire explicitement configuré', () => {
    expect(adminPasswordMinimumLength(' DossouCarrel@Gmail.com ', 'dossoucarrel@gmail.com')).toBe(10)
    expect(adminPasswordMinimumLength('admin@example.com', 'dossoucarrel@gmail.com')).toBe(12)
    expect(adminPasswordMinimumLength('dossoucarrel@gmail.com', '')).toBe(12)
  })
})
