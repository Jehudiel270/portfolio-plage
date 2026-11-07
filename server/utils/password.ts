import { randomBytes, scrypt as scryptCallback, timingSafeEqual, type ScryptOptions } from 'node:crypto'

const KEY_LENGTH = 64
const COST = { N: 32768, r: 8, p: 1 }
const MAX_MEMORY = 128 * 1024 * 1024

function derive(password: string, salt: Buffer, length: number, options: ScryptOptions): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    scryptCallback(password.normalize('NFKC'), salt, length, { ...options, maxmem: MAX_MEMORY }, (error, key) => (error ? reject(error) : resolve(key)))
  })
}

/** Hachage scrypt salé : `scrypt$N$r$p$sel$clé`. Les mots de passe ne sont jamais stockés ni journalisés. */
export async function hashPassword(password: string): Promise<string> {
  const salt = randomBytes(16)
  const key = await derive(password, salt, KEY_LENGTH, COST)
  return `scrypt$${COST.N}$${COST.r}$${COST.p}$${salt.toString('base64url')}$${key.toString('base64url')}`
}

export async function verifyPassword(password: string, stored: string): Promise<boolean> {
  const [scheme, n, r, p, saltPart, keyPart] = stored.split('$')
  if (scheme !== 'scrypt' || !saltPart || !keyPart) return false
  const expected = Buffer.from(keyPart, 'base64url')
  const actual = await derive(password, Buffer.from(saltPart, 'base64url'), expected.length, { N: Number(n), r: Number(r), p: Number(p) })
  return actual.length === expected.length && timingSafeEqual(actual, expected)
}

let dummyHash: Promise<string> | null = null
/** Hachage factice pour égaliser le temps de réponse quand l'e-mail est inconnu. */
export function getDummyHash(): Promise<string> {
  dummyHash ??= hashPassword(randomBytes(12).toString('hex'))
  return dummyHash
}

const COMMON = new Set(['password', 'motdepasse', '123456789012', 'azertyuiopqs', 'qwertyuiopas', 'administrateur', 'passwordpassword'])

/** Retourne un message d'erreur, ou `null` si le mot de passe est acceptable. */
export function validatePasswordStrength(password: string, minimumLength = 12): string | null {
  if (password.length < minimumLength) return `Le mot de passe doit contenir au moins ${minimumLength} caractères.`
  if (password.length > 200) return 'Le mot de passe est trop long (200 caractères maximum).'
  if (COMMON.has(password.toLowerCase()) || /^(.)\1+$/.test(password)) return 'Ce mot de passe est trop prévisible.'
  const classes = [/[a-z]/, /[A-Z]/, /\d/, /[^A-Za-z0-9]/].filter((re) => re.test(password)).length
  if (classes < 2) return 'Mélangez au moins deux types de caractères (lettres, chiffres, symboles).'
  return null
}
