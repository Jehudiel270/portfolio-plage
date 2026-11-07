import { createCipheriv, createDecipheriv, createHash, createHmac, randomBytes, timingSafeEqual } from 'node:crypto'

/** TOTP (RFC 6238) sans dépendance : compatible Google Authenticator, Authy, 1Password, Aegis… */
const ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567'

export function base32Encode(buffer: Uint8Array): string {
  let bits = 0
  let value = 0
  let out = ''
  for (const byte of buffer) {
    value = (value << 8) | byte
    bits += 8
    while (bits >= 5) { out += ALPHABET[(value >>> (bits - 5)) & 31]; bits -= 5 }
  }
  if (bits > 0) out += ALPHABET[(value << (5 - bits)) & 31]
  return out
}

export function base32Decode(input: string): Buffer {
  let bits = 0
  let value = 0
  const bytes: number[] = []
  for (const char of input.replace(/=+$/, '').toUpperCase().replace(/\s/g, '')) {
    const index = ALPHABET.indexOf(char)
    if (index === -1) continue
    value = (value << 5) | index
    bits += 5
    if (bits >= 8) { bytes.push((value >>> (bits - 8)) & 255); bits -= 8 }
  }
  return Buffer.from(bytes)
}

export const generateTotpSecret = (): string => base32Encode(randomBytes(20))

export function generateRecoveryCodes(count = 10): string[] {
  return Array.from({ length: count }, () => randomBytes(8).toString('hex').toUpperCase().match(/.{1,4}/g)!.join('-'))
}

export function hashRecoveryCode(code: string, serverSecret: string): string {
  return createHmac('sha256', serverSecret).update(`recovery:${code.replace(/-/g, '').toUpperCase()}`).digest('hex')
}

export function totpCode(secret: string, atMs = Date.now(), stepSeconds = 30, digits = 6): string {
  const counter = Math.floor(atMs / 1000 / stepSeconds)
  const message = Buffer.alloc(8)
  message.writeBigUInt64BE(BigInt(counter))
  const hmac = createHmac('sha1', base32Decode(secret)).update(message).digest()
  const offset = hmac[hmac.length - 1]! & 0xf
  const binary = ((hmac[offset]! & 0x7f) << 24) | (hmac[offset + 1]! << 16) | (hmac[offset + 2]! << 8) | hmac[offset + 3]!
  return String(binary % 10 ** digits).padStart(digits, '0')
}

/** Accepte le code courant et celui des fenêtres voisines (±30 s) pour tolérer le décalage d'horloge. */
export function verifyTotp(secret: string, code: string, atMs = Date.now(), window = 1): boolean {
  const clean = code.replace(/\s/g, '')
  if (!/^\d{6}$/.test(clean)) return false
  let ok = false
  for (let drift = -window; drift <= window; drift += 1) {
    const expected = Buffer.from(totpCode(secret, atMs + drift * 30_000))
    const given = Buffer.from(clean)
    if (expected.length === given.length && timingSafeEqual(expected, given)) ok = true
  }
  return ok
}

export const otpauthUri = (secret: string, account: string, issuer: string): string =>
  `otpauth://totp/${encodeURIComponent(`${issuer}:${account}`)}?secret=${secret}&issuer=${encodeURIComponent(issuer)}&algorithm=SHA1&digits=6&period=30`

/** Chiffrement du secret au repos (AES-256-GCM), clé dérivée du secret de session du serveur. */
const keyFrom = (serverSecret: string): Buffer => createHash('sha256').update(`totp:${serverSecret}`).digest()

export function encryptSecret(secret: string, serverSecret: string): string {
  const iv = randomBytes(12)
  const cipher = createCipheriv('aes-256-gcm', keyFrom(serverSecret), iv)
  const data = Buffer.concat([cipher.update(secret, 'utf8'), cipher.final()])
  return [iv, cipher.getAuthTag(), data].map((b) => b.toString('base64url')).join('.')
}

export function decryptSecret(payload: string, serverSecret: string): string | null {
  try {
    const [iv, tag, data] = payload.split('.').map((p) => Buffer.from(p, 'base64url'))
    const decipher = createDecipheriv('aes-256-gcm', keyFrom(serverSecret), iv!)
    decipher.setAuthTag(tag!)
    return Buffer.concat([decipher.update(data!), decipher.final()]).toString('utf8')
  } catch {
    return null
  }
}
