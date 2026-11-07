import { describe, expect, it } from 'vitest'
import { base32Decode, base32Encode, decryptSecret, encryptSecret, generateRecoveryCodes, generateTotpSecret, hashRecoveryCode, otpauthUri, totpCode, verifyTotp } from '../../server/utils/totp'

describe('TOTP (RFC 6238)', () => {
  const rfcSecret = base32Encode(Buffer.from('12345678901234567890'))
  it('reproduit le vecteur de test officiel', () => {
    expect(rfcSecret).toBe('GEZDGNBVGY3TQOJQGEZDGNBVGY3TQOJQ')
    expect(totpCode(rfcSecret, 59_000, 30, 8)).toBe('94287082')
    expect(totpCode(rfcSecret, 1_111_111_109_000, 30, 8)).toBe('07081804')
    expect(base32Decode(rfcSecret).toString()).toBe('12345678901234567890')
  })
  it('accepte une fenêtre de ±30 s mais refuse le reste', () => {
    const secret = generateTotpSecret()
    const now = 1_700_000_000_000
    expect(verifyTotp(secret, totpCode(secret, now), now)).toBe(true)
    expect(verifyTotp(secret, totpCode(secret, now - 30_000), now)).toBe(true)
    expect(verifyTotp(secret, totpCode(secret, now - 120_000), now)).toBe(false)
    expect(verifyTotp(secret, '12345', now)).toBe(false)
    expect(verifyTotp(secret, 'abcdef', now)).toBe(false)
  })
  it('chiffre le secret au repos (AES-256-GCM) et refuse une mauvaise clé', () => {
    const secret = generateTotpSecret()
    const sealed = encryptSecret(secret, 'une-cle-serveur-assez-longue-123456789')
    expect(sealed).not.toContain(secret)
    expect(decryptSecret(sealed, 'une-cle-serveur-assez-longue-123456789')).toBe(secret)
    expect(decryptSecret(sealed, 'autre-cle-serveur-assez-longue-1234567')).toBeNull()
    expect(decryptSecret('corrompu', 'x')).toBeNull()
  })
  it('fournit une URI otpauth importable', () => {
    expect(otpauthUri('ABC', 'moi@exemple.com', 'Portfolio')).toBe('otpauth://totp/Portfolio%3Amoi%40exemple.com?secret=ABC&issuer=Portfolio&algorithm=SHA1&digits=6&period=30')
  })
  it('génère des codes de récupération lisibles dont les hachages sont secrets et normalisés', () => {
    const codes = generateRecoveryCodes(10)
    expect(codes).toHaveLength(10)
    expect(codes.every((code) => /^[A-F0-9]{4}(?:-[A-F0-9]{4}){3}$/.test(code))).toBe(true)
    expect(hashRecoveryCode(codes[0]!, 'server-secret')).toBe(hashRecoveryCode(codes[0]!.replace(/-/g, '').toLowerCase(), 'server-secret'))
    expect(hashRecoveryCode(codes[0]!, 'server-secret')).not.toBe(codes[0])
  })
})
