import { createHash, createHmac, randomBytes, timingSafeEqual } from 'node:crypto'

export const randomToken = (bytes = 32): string => randomBytes(bytes).toString('base64url')
export const hmacHex = (secret: string, value: string): string => createHmac('sha256', secret).update(value).digest('hex')
export const sha256Hex = (value: string): string => createHash('sha256').update(value).digest('hex')

export function safeEqual(a: string, b: string): boolean {
  const left = Buffer.from(a)
  const right = Buffer.from(b)
  return left.length === right.length && timingSafeEqual(left, right)
}
