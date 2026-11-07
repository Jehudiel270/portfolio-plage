import { z } from 'zod'

const emptyToNull = (value: unknown) => (typeof value === 'string' && value.trim() === '' ? null : value)

export const hexColor = z
  .string()
  .trim()
  .regex(/^#[0-9a-fA-F]{6}$/, 'Couleur hexadécimale attendue (#RRGGBB)')
  .transform((v) => v.toLowerCase())

/** URL http(s) uniquement : `javascript:` et consorts sont refusés. */
export const httpUrl = z.url({ protocol: /^https?$/, message: 'URL http(s) valide attendue' }).max(2048)

export const optionalUrl = z.preprocess(emptyToNull, httpUrl.nullable())
export const optionalHex = z.preprocess(emptyToNull, hexColor.nullable())
export const optionalDate = z.preprocess(emptyToNull, z.iso.date('Date au format AAAA-MM-JJ attendue').nullable())
export const optionalText = (max: number) => z.preprocess(emptyToNull, z.string().trim().max(max).nullable())
export const publicIdSchema = z.preprocess(emptyToNull, z.string().max(300).regex(/^[\w\-./]+$/, 'Identifiant Cloudinary invalide').nullable())

export const slugSchema = z
  .string()
  .trim()
  .toLowerCase()
  .min(1)
  .max(80)
  .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, 'Slug invalide (lettres minuscules, chiffres et tirets)')

export const stringList = (maxItems: number, maxLength: number) =>
  z.array(z.string().trim().min(1).max(maxLength)).max(maxItems)

export const imageRefSchema = z.object({ url: httpUrl, publicId: publicIdSchema })
export type ImageRef = z.infer<typeof imageRefSchema>

export const idParam = z.coerce.number().int().positive()

export const label = (max = 60) => z.string().trim().min(1).max(max)
export const text = (max: number) => z.string().trim().max(max)
