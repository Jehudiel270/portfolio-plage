import { describe, expect, it } from 'vitest'
import { hashPassword, validatePasswordStrength, verifyPassword } from '../../server/utils/password'

describe('mots de passe', () => {
  it('hache avec sel et vérifie en temps constant', async () => {
    const a = await hashPassword('Un-mot-de-passe-solide-42')
    const b = await hashPassword('Un-mot-de-passe-solide-42')
    expect(a).not.toBe(b)
    expect(a.startsWith('scrypt$')).toBe(true)
    expect(await verifyPassword('Un-mot-de-passe-solide-42', a)).toBe(true)
    expect(await verifyPassword('autre-mot-de-passe', a)).toBe(false)
    expect(await verifyPassword('x', 'format-invalide')).toBe(false)
  })
  it('refuse les mots de passe faibles', () => {
    expect(validatePasswordStrength('court')).toMatch(/12 caractères/)
    expect(validatePasswordStrength('Abcdefg3.0x')).toMatch(/12 caractères/)
    expect(validatePasswordStrength('Abcdefg3.0x', 10)).toBeNull()
    expect(validatePasswordStrength('Abcde3.0x', 10)).toMatch(/10 caractères/)
    expect(validatePasswordStrength('aaaaaaaaaaaaaaaa')).toBeTruthy()
    expect(validatePasswordStrength('motdepasse')).toBeTruthy()
    expect(validatePasswordStrength('Un-bon-mot-de-passe-2026')).toBeNull()
  })
})
