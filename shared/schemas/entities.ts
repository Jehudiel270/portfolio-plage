import { z } from 'zod'
import { EXPERIENCE_TYPES, PROJECT_STATUSES, type CategoryScope } from '../constants'
import { isValidIconValue } from '../icons'
import { imageRefSchema, label, optionalDate, optionalHex, optionalText, optionalUrl, publicIdSchema, slugSchema, stringList, text } from './common'

export const ENTITY_KEYS = ['projects', 'skills', 'education', 'experiences', 'certifications', 'achievements'] as const
export type EntityKey = (typeof ENTITY_KEYS)[number]

const sortOrder = z.number().int().min(0).max(100000)
/** Icône : `si:slug`, `lucide:Nom`, URL d'image personnalisée ou vide. */
export const iconValue = z.preprocess((v) => (typeof v === 'string' && v.trim() === '' ? null : v), z.string().max(2048).nullable().refine(isValidIconValue, 'Icône invalide'))

export const projectSchema = z.object({
  title: label(120), slug: slugSchema, shortDescription: text(280), description: text(8000), problem: text(2000),
  features: stringList(20, 200), category: text(60), technologies: stringList(30, 40),
  coverImageUrl: optionalUrl, coverPublicId: publicIdSchema, gallery: z.array(imageRefSchema).max(12),
  liveUrl: optionalUrl, repositoryUrl: optionalUrl, status: z.enum(PROJECT_STATUSES), featured: z.boolean(), sortOrder,
  projectDate: optionalDate, color: optionalHex,
})

export const skillSchema = z.object({
  name: label(80), slug: slugSchema, description: text(600), category: text(60),
  icon: iconValue, iconPublicId: publicIdSchema, color: optionalHex,
  proficiency: z.preprocess((v) => (v === '' ? null : v), z.number().int().min(0).max(100).nullable()),
  visible: z.boolean(), featured: z.boolean(), sortOrder,
})

export const educationSchema = z.object({
  title: label(160), institution: label(160), degree: text(160), field: text(120), description: text(4000),
  startDate: z.iso.date(), endDate: optionalDate, isCurrent: z.boolean(), achievements: stringList(20, 240),
  imageUrl: optionalUrl, imagePublicId: publicIdSchema, url: optionalUrl, visible: z.boolean(), featured: z.boolean(), sortOrder,
})

export const experienceSchema = z.object({
  organization: label(160), role: label(160), type: z.enum(EXPERIENCE_TYPES), location: optionalText(120),
  startDate: z.iso.date(), endDate: optionalDate, isCurrent: z.boolean(), description: text(4000),
  missions: stringList(20, 300), results: stringList(20, 300), technologies: stringList(30, 40),
  imageUrl: optionalUrl, imagePublicId: publicIdSchema, url: optionalUrl, visible: z.boolean(), featured: z.boolean(), sortOrder,
})

export const certificationSchema = z.object({
  name: label(160), issuer: label(160), category: text(60), issuedAt: z.iso.date(), expiresAt: optionalDate,
  credentialId: optionalText(120), verificationUrl: optionalUrl, imageUrl: optionalUrl, imagePublicId: publicIdSchema,
  visible: z.boolean(), featured: z.boolean(), sortOrder,
})

export const achievementSchema = z.object({
  title: label(160), category: text(60), description: text(2000), achievedAt: optionalDate, linkUrl: optionalUrl,
  icon: iconValue, iconPublicId: publicIdSchema, imageUrl: optionalUrl, imagePublicId: publicIdSchema, visible: z.boolean(), sortOrder,
})

export const ENTITY_SCHEMAS = {
  projects: projectSchema, skills: skillSchema, education: educationSchema, experiences: experienceSchema,
  certifications: certificationSchema, achievements: achievementSchema,
} as const

export type ProjectInput = z.infer<typeof projectSchema>
export type SkillInput = z.infer<typeof skillSchema>
export type EducationInput = z.infer<typeof educationSchema>
export type ExperienceInput = z.infer<typeof experienceSchema>
export type CertificationInput = z.infer<typeof certificationSchema>
export type AchievementInput = z.infer<typeof achievementSchema>

/** Valeurs par défaut à la création (et pour initialiser les formulaires d'administration). */
export const ENTITY_DEFAULTS = {
  projects: { title: '', slug: '', shortDescription: '', description: '', problem: '', features: [], category: '', technologies: [], coverImageUrl: null, coverPublicId: null, gallery: [], liveUrl: null, repositoryUrl: null, status: 'draft', featured: false, sortOrder: 0, projectDate: null, color: null } satisfies ProjectInput,
  skills: { name: '', slug: '', description: '', category: '', icon: null, iconPublicId: null, color: null, proficiency: null, visible: true, featured: false, sortOrder: 0 } satisfies SkillInput,
  education: { title: '', institution: '', degree: '', field: '', description: '', startDate: '', endDate: null, isCurrent: false, achievements: [], imageUrl: null, imagePublicId: null, url: null, visible: true, featured: false, sortOrder: 0 } satisfies Omit<EducationInput, 'startDate'> & { startDate: string },
  experiences: { organization: '', role: '', type: 'job', location: null, startDate: '', endDate: null, isCurrent: false, description: '', missions: [], results: [], technologies: [], imageUrl: null, imagePublicId: null, url: null, visible: true, featured: false, sortOrder: 0 } satisfies Omit<ExperienceInput, 'startDate'> & { startDate: string },
  certifications: { name: '', issuer: '', category: '', issuedAt: '', expiresAt: null, credentialId: null, verificationUrl: null, imageUrl: null, imagePublicId: null, visible: true, featured: false, sortOrder: 0 } satisfies Omit<CertificationInput, 'issuedAt'> & { issuedAt: string },
  achievements: { title: '', category: '', description: '', achievedAt: null, linkUrl: null, icon: null, iconPublicId: null, imageUrl: null, imagePublicId: null, visible: true, sortOrder: 0 } satisfies AchievementInput,
} as const

/** Champs contenant une image Cloudinary (URL + identifiant public) par entité. */
export const ENTITY_IMAGE_FIELDS: Record<EntityKey, { url: string; publicId: string }[]> = {
  projects: [{ url: 'coverImageUrl', publicId: 'coverPublicId' }],
  skills: [{ url: 'icon', publicId: 'iconPublicId' }],
  education: [{ url: 'imageUrl', publicId: 'imagePublicId' }],
  experiences: [{ url: 'imageUrl', publicId: 'imagePublicId' }],
  certifications: [{ url: 'imageUrl', publicId: 'imagePublicId' }],
  achievements: [{ url: 'imageUrl', publicId: 'imagePublicId' }, { url: 'icon', publicId: 'iconPublicId' }],
}

export const ENTITY_PUBLICATION_FIELD: Record<EntityKey, 'status' | 'visible'> = {
  projects: 'status', skills: 'visible', education: 'visible', experiences: 'visible', certifications: 'visible', achievements: 'visible',
}

/** Entités dont le champ `category` est piloté par la liste de catégories de l'administration. */
export const ENTITY_CATEGORY_SCOPE: Partial<Record<EntityKey, CategoryScope>> = {
  skills: 'skills', projects: 'projects', certifications: 'certifications', achievements: 'achievements',
}

/* ------------------------------- Catégories ------------------------------- */
export const categoryInputSchema = z.object({
  scope: z.enum(['skills', 'projects', 'certifications', 'achievements']),
  name: label(60),
  color: optionalHex,
  icon: iconValue,
  iconPublicId: publicIdSchema,
  sortOrder,
})
export type CategoryInput = z.infer<typeof categoryInputSchema>

/* --------------------------- Actions en masse --------------------------- */
export const bulkActionSchema = z.discriminatedUnion('action', [
  z.object({ action: z.literal('publish'), ids: z.array(z.number().int().positive()).min(1).max(500) }),
  z.object({ action: z.literal('hide'), ids: z.array(z.number().int().positive()).min(1).max(500) }),
  z.object({ action: z.literal('feature'), ids: z.array(z.number().int().positive()).min(1).max(500), value: z.boolean() }),
  z.object({ action: z.literal('category'), ids: z.array(z.number().int().positive()).min(1).max(500), value: text(60) }),
  z.object({ action: z.literal('delete'), ids: z.array(z.number().int().positive()).min(1).max(500) }),
])
export type BulkAction = z.infer<typeof bulkActionSchema>
