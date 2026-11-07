import { sql } from 'drizzle-orm'
import { boolean, check, date, index, integer, jsonb, pgTable, serial, text, timestamp, unique, uuid } from 'drizzle-orm/pg-core'
import type { AdminPermissionGrant, AdminRole } from '../../shared/admin-permissions'
import type { CategoryScope } from '../../shared/constants'
import type { ImageRef } from '../../shared/schemas/common'

/* Colonnes communes ---------------------------------------------------------- */
const createdAt = () => timestamp('created_at', { withTimezone: true }).notNull().defaultNow()
const updatedAt = () => timestamp('updated_at', { withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date())
const isDemo = () => boolean('is_demo').notNull().default(false)
const stringList = (name: string) => jsonb(name).$type<string[]>().notNull().default([])

/* Authentification ------------------------------------------------------------ */
export const adminUsers = pgTable('admin_users', {
  id: serial('id').primaryKey(),
  email: text('email').notNull().unique(),
  passwordHash: text('password_hash').notNull(),
  role: text('role').$type<AdminRole>().notNull().default('admin'),
  permissions: jsonb('permissions').$type<AdminPermissionGrant[]>().notNull().default([]),
  createdAt: createdAt(),
  updatedAt: updatedAt(),
  lastLoginAt: timestamp('last_login_at', { withTimezone: true }),
  /** Secret TOTP chiffré (AES-256-GCM) ; `totp_enabled` n'est vrai qu'après vérification d'un premier code. */
  totpSecret: text('totp_secret'),
  totpEnabled: boolean('totp_enabled').notNull().default(false),
}, (t) => [check('admin_users_role_check', sql`${t.role} in ('superadmin', 'admin', 'editor')`)])

export const adminRecoveryCodes = pgTable('admin_recovery_codes', {
  id: serial('id').primaryKey(),
  adminId: integer('admin_id').notNull().references(() => adminUsers.id, { onDelete: 'cascade' }),
  codeHash: text('code_hash').notNull().unique(),
  usedAt: timestamp('used_at', { withTimezone: true }),
  createdAt: createdAt(),
}, (t) => [index('admin_recovery_codes_admin_idx').on(t.adminId)])

export const adminAuditLogs = pgTable('admin_audit_logs', {
  id: serial('id').primaryKey(),
  actorId: integer('actor_id').references(() => adminUsers.id, { onDelete: 'set null' }),
  action: text('action').notNull(),
  target: text('target').notNull().default(''),
  details: jsonb('details').$type<Record<string, string | number | boolean | null>>().notNull().default({}),
  createdAt: createdAt(),
}, (t) => [index('admin_audit_logs_created_idx').on(t.createdAt), index('admin_audit_logs_actor_idx').on(t.actorId)])

/** Sessions opaques : seul le hachage HMAC du jeton est conservé ; la déconnexion supprime la ligne. */
export const adminSessions = pgTable('admin_sessions', {
  id: uuid('id').primaryKey().defaultRandom(),
  adminId: integer('admin_id').notNull().references(() => adminUsers.id, { onDelete: 'cascade' }),
  tokenHash: text('token_hash').notNull().unique(),
  userAgent: text('user_agent'),
  createdAt: createdAt(),
  lastUsedAt: timestamp('last_used_at', { withTimezone: true }).notNull().defaultNow(),
  expiresAt: timestamp('expires_at', { withTimezone: true }).notNull(),
}, (t) => [index('admin_sessions_admin_idx').on(t.adminId), index('admin_sessions_expires_idx').on(t.expiresAt)])

/* Contenu --------------------------------------------------------------------- */
export const projects = pgTable('projects', {
  id: serial('id').primaryKey(),
  title: text('title').notNull(),
  slug: text('slug').notNull().unique(),
  shortDescription: text('short_description').notNull().default(''),
  description: text('description').notNull().default(''),
  problem: text('problem').notNull().default(''),
  features: stringList('features'),
  category: text('category').notNull().default(''),
  technologies: stringList('technologies'),
  coverImageUrl: text('cover_image_url'),
  coverPublicId: text('cover_public_id'),
  gallery: jsonb('gallery').$type<ImageRef[]>().notNull().default([]),
  liveUrl: text('live_url'),
  repositoryUrl: text('repository_url'),
  status: text('status').$type<'draft' | 'published'>().notNull().default('draft'),
  featured: boolean('featured').notNull().default(false),
  sortOrder: integer('sort_order').notNull().default(0),
  projectDate: date('project_date', { mode: 'string' }),
  color: text('color'),
  isDemo: isDemo(),
  createdAt: createdAt(),
  updatedAt: updatedAt(),
}, (t) => [
  index('projects_status_order_idx').on(t.status, t.sortOrder),
  check('projects_status_check', sql`${t.status} in ('draft', 'published')`),
])

export const skills = pgTable('skills', {
  id: serial('id').primaryKey(),
  name: text('name').notNull(),
  slug: text('slug').notNull().unique(),
  description: text('description').notNull().default(''),
  category: text('category').notNull().default(''),
  icon: text('icon'),
  iconPublicId: text('icon_public_id'),
  color: text('color'),
  proficiency: integer('proficiency'),
  visible: boolean('visible').notNull().default(true),
  featured: boolean('featured').notNull().default(false),
  sortOrder: integer('sort_order').notNull().default(0),
  isDemo: isDemo(),
  createdAt: createdAt(),
  updatedAt: updatedAt(),
}, (t) => [
  index('skills_visible_order_idx').on(t.visible, t.sortOrder),
  check('skills_proficiency_check', sql`${t.proficiency} is null or (${t.proficiency} >= 0 and ${t.proficiency} <= 100)`),
])

export const educationEntries = pgTable('education_entries', {
  id: serial('id').primaryKey(),
  title: text('title').notNull(),
  institution: text('institution').notNull(),
  degree: text('degree').notNull().default(''),
  field: text('field').notNull().default(''),
  description: text('description').notNull().default(''),
  startDate: date('start_date', { mode: 'string' }).notNull(),
  endDate: date('end_date', { mode: 'string' }),
  isCurrent: boolean('is_current').notNull().default(false),
  achievements: stringList('achievements'),
  imageUrl: text('image_url'),
  imagePublicId: text('image_public_id'),
  url: text('url'),
  visible: boolean('visible').notNull().default(true),
  featured: boolean('featured').notNull().default(false),
  sortOrder: integer('sort_order').notNull().default(0),
  isDemo: isDemo(),
  createdAt: createdAt(),
  updatedAt: updatedAt(),
}, (t) => [index('education_visible_order_idx').on(t.visible, t.sortOrder)])

export const professionalExperiences = pgTable('professional_experiences', {
  id: serial('id').primaryKey(),
  organization: text('organization').notNull(),
  role: text('role').notNull(),
  type: text('type').notNull().default('job'),
  location: text('location'),
  startDate: date('start_date', { mode: 'string' }).notNull(),
  endDate: date('end_date', { mode: 'string' }),
  isCurrent: boolean('is_current').notNull().default(false),
  description: text('description').notNull().default(''),
  missions: stringList('missions'),
  results: stringList('results'),
  technologies: stringList('technologies'),
  imageUrl: text('image_url'),
  imagePublicId: text('image_public_id'),
  url: text('url'),
  visible: boolean('visible').notNull().default(true),
  featured: boolean('featured').notNull().default(false),
  sortOrder: integer('sort_order').notNull().default(0),
  isDemo: isDemo(),
  createdAt: createdAt(),
  updatedAt: updatedAt(),
}, (t) => [index('experiences_visible_order_idx').on(t.visible, t.sortOrder)])

export const certifications = pgTable('certifications', {
  id: serial('id').primaryKey(),
  name: text('name').notNull(),
  issuer: text('issuer').notNull(),
  category: text('category').notNull().default(''),
  issuedAt: date('issued_at', { mode: 'string' }).notNull(),
  expiresAt: date('expires_at', { mode: 'string' }),
  credentialId: text('credential_id'),
  verificationUrl: text('verification_url'),
  imageUrl: text('image_url'),
  imagePublicId: text('image_public_id'),
  visible: boolean('visible').notNull().default(true),
  featured: boolean('featured').notNull().default(false),
  sortOrder: integer('sort_order').notNull().default(0),
  isDemo: isDemo(),
  createdAt: createdAt(),
  updatedAt: updatedAt(),
}, (t) => [index('certifications_visible_order_idx').on(t.visible, t.sortOrder)])

export const achievements = pgTable('achievements', {
  id: serial('id').primaryKey(),
  title: text('title').notNull(),
  category: text('category').notNull().default(''),
  description: text('description').notNull().default(''),
  achievedAt: date('achieved_at', { mode: 'string' }),
  linkUrl: text('link_url'),
  icon: text('icon'),
  iconPublicId: text('icon_public_id'),
  imageUrl: text('image_url'),
  imagePublicId: text('image_public_id'),
  visible: boolean('visible').notNull().default(true),
  sortOrder: integer('sort_order').notNull().default(0),
  isDemo: isDemo(),
  createdAt: createdAt(),
  updatedAt: updatedAt(),
}, (t) => [index('achievements_visible_order_idx').on(t.visible, t.sortOrder)])

/** Listes de catégories gérées depuis l'administration (les formulaires proposent des listes déroulantes). */
export const categories = pgTable('categories', {
  id: serial('id').primaryKey(),
  scope: text('scope').$type<CategoryScope>().notNull(),
  name: text('name').notNull(),
  color: text('color'),
  icon: text('icon'),
  iconPublicId: text('icon_public_id'),
  sortOrder: integer('sort_order').notNull().default(0),
  isDemo: isDemo(),
  createdAt: createdAt(),
  updatedAt: updatedAt(),
}, (t) => [
  unique('categories_scope_name_unique').on(t.scope, t.name),
  check('categories_scope_check', sql`${t.scope} in ('skills', 'projects', 'certifications', 'achievements')`),
])

/* Messages privés -------------------------------------------------------------- */
export const contactMessages = pgTable('contact_messages', {
  id: serial('id').primaryKey(),
  name: text('name').notNull().default(''),
  email: text('email'),
  phone: text('phone'),
  subject: text('subject'),
  message: text('message').notNull(),
  source: text('source').$type<'form' | 'widget'>().notNull().default('form'),
  status: text('status').$type<'new' | 'read' | 'handled'>().notNull().default('new'),
  emailStatus: text('email_status').$type<'sent' | 'not_configured' | 'failed' | 'skipped'>().notNull().default('skipped'),
  createdAt: createdAt(),
  readAt: timestamp('read_at', { withTimezone: true }),
}, (t) => [
  index('contact_messages_status_idx').on(t.status, t.createdAt),
  check('contact_messages_status_check', sql`${t.status} in ('new', 'read', 'handled')`),
])

/* Réglages globaux : une seule ligne (id = 1) ----------------------------------- */
export const siteSettings = pgTable('site_settings', {
  id: integer('id').primaryKey().default(1),
  content: jsonb('content').$type<unknown>().notNull().default({}),
  social: jsonb('social').$type<unknown>().notNull().default([]),
  theme: jsonb('theme').$type<unknown>().notNull().default({}),
  effects: jsonb('effects').$type<unknown>().notNull().default({}),
  sections: jsonb('sections').$type<unknown>().notNull().default({}),
  journey: jsonb('journey').$type<unknown>().notNull().default({}),
  display: jsonb('display').$type<unknown>().notNull().default({}),
  navigation: jsonb('navigation').$type<unknown>().notNull().default({}),
  contact: jsonb('contact').$type<unknown>().notNull().default({}),
  widget: jsonb('widget').$type<unknown>().notNull().default({}),
  ui: jsonb('ui').$type<unknown>().notNull().default({}),
  seo: jsonb('seo').$type<unknown>().notNull().default({}),
  privacy: jsonb('privacy').$type<unknown>().notNull().default({}),
  updatedAt: updatedAt(),
}, (t) => [check('site_settings_singleton_check', sql`${t.id} = 1`)])

/* Limitation de fréquence (compatible serverless) -------------------------------- */
export const rateLimits = pgTable('rate_limits', {
  key: text('key').primaryKey(),
  count: integer('count').notNull().default(0),
  windowStart: timestamp('window_start', { withTimezone: true }).notNull().defaultNow(),
})

/** Tables pilotées par le CRUD générique d'administration. */
export const ENTITY_TABLES = {
  projects,
  skills,
  education: educationEntries,
  experiences: professionalExperiences,
  certifications,
  achievements,
} as const
