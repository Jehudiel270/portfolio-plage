import { z } from 'zod'
import { AFTER_SUBMIT_BEHAVIORS, CONTACT_CHANNEL_MODES, JOURNEY_TABS, NAV_TARGET_IDS, SECTION_IDS, SOCIAL_PLATFORMS } from '../constants'
import { DEFAULT_UI_LABELS, UI_LABEL_KEYS } from '../ui-labels'
import { hexColor, httpUrl, label, optionalUrl, publicIdSchema, text } from './common'

/* --------------------------------- Contenu --------------------------------- */
export const contentSchema = z.object({
  name: label(80), title: label(120), tagline: text(160), intro: text(400),
  aboutTitle: label(80), about: text(4000), publicEmail: z.preprocess((v) => (v === '' ? null : v), z.email().max(200).nullable()),
  location: text(120), availability: text(120),
  avatarUrl: optionalUrl, avatarPublicId: publicIdSchema, resumeUrl: optionalUrl,
  contactTitle: label(120), contactText: text(600), footerNote: text(200),
})
export const DEFAULT_CONTENT: z.infer<typeof contentSchema> = {
  name: 'Votre Nom',
  title: 'Développeur Full-Stack',
  tagline: 'Je conçois des produits web clairs, rapides et soignés.',
  intro: 'Contenu de démonstration : renseignez votre nom, votre titre et votre introduction depuis l’administration.',
  aboutTitle: 'À propos',
  about: 'Texte de démonstration. Présentez ici votre parcours, vos valeurs et votre manière de travailler depuis la page « Textes et liens » de l’administration.\n\nSéparez les paragraphes par une ligne vide.',
  publicEmail: null, location: '', availability: '', avatarUrl: null, avatarPublicId: null, resumeUrl: null,
  contactTitle: 'Travaillons ensemble', contactText: 'Un projet, une question ? Écrivez-moi : je réponds dès que possible.', footerNote: '',
}

export const socialItemSchema = z.object({ platform: z.enum(SOCIAL_PLATFORMS), label: z.string().trim().max(40), url: httpUrl })
export const socialSchema = z.array(socialItemSchema).max(12)
export type SocialItem = z.infer<typeof socialItemSchema>
export const DEFAULT_SOCIAL: SocialItem[] = []

/* ---------------------------------- Thème ---------------------------------- */
export const themeSchema = z.object({
  primary: hexColor, accent: hexColor, sun: hexColor, background: hexColor, surface: hexColor,
  text: hexColor, textMuted: hexColor, seaDeep: hexColor, seaShallow: hexColor, sky: hexColor,
})
export type ThemeSettings = z.infer<typeof themeSchema>
/** Palette « plage de jour » : sable chaud, océan turquoise, touches de corail et de soleil. */
export const DEFAULT_THEME: ThemeSettings = {
  primary: '#0b7285', accent: '#ff6b4a', sun: '#ffb703', background: '#fdf6e9', surface: '#ffffff',
  text: '#0e2a3b', textMuted: '#587486', seaDeep: '#0a6c8a', seaShallow: '#5ed6cf', sky: '#bfe9f5',
}
export const THEME_FIELDS: { key: keyof ThemeSettings; label: string; hint: string }[] = [
  { key: 'primary', label: 'Couleur principale', hint: 'Boutons, liens, éléments actifs' },
  { key: 'accent', label: 'Accent', hint: 'Touches vives : badges, soulignements' },
  { key: 'sun', label: 'Soleil', hint: 'Détails lumineux, étoiles, reflets' },
  { key: 'background', label: 'Fond (sable)', hint: 'Arrière-plan des pages' },
  { key: 'surface', label: 'Cartes', hint: 'Fond des cartes et des panneaux' },
  { key: 'text', label: 'Texte', hint: 'Titres et texte courant' },
  { key: 'textMuted', label: 'Texte secondaire', hint: 'Légendes, dates, aides' },
  { key: 'seaDeep', label: 'Mer profonde', hint: 'Bas de l’accueil, pied de page, vagues' },
  { key: 'seaShallow', label: 'Mer peu profonde', hint: 'Eau claire, reflets' },
  { key: 'sky', label: 'Ciel', hint: 'Haut de l’accueil et horizon' },
]
export const THEME_PRESETS: { name: string; theme: ThemeSettings }[] = [
  { name: 'Plage de jour', theme: DEFAULT_THEME },
  { name: 'Coucher de soleil', theme: { primary: '#b4455a', accent: '#ff7a45', sun: '#ffc857', background: '#fff3e6', surface: '#ffffff', text: '#3a1f2b', textMuted: '#7a5a63', seaDeep: '#5c2a5e', seaShallow: '#ff9a76', sky: '#ffd6a5' } },
  { name: 'Lagon tropical', theme: { primary: '#0f766e', accent: '#f97316', sun: '#facc15', background: '#f0fbf7', surface: '#ffffff', text: '#0b2e2a', textMuted: '#4b6f6a', seaDeep: '#0e7490', seaShallow: '#6ee7d6', sky: '#c8f4ea' } },
  { name: 'Nuit sur la plage', theme: { primary: '#5eead4', accent: '#ff8a65', sun: '#ffd166', background: '#0b1d2a', surface: '#112b3d', text: '#eaf6f8', textMuted: '#9bb7c3', seaDeep: '#04141f', seaShallow: '#0e5a6b', sky: '#17344d' } },
]

/* --------------------------------- Effets ---------------------------------- */
export const effectsSchema = z.object({
  hero3d: z.boolean(),
  waveHeight: z.number().min(0.2).max(2),
  waveSpeed: z.number().min(0).max(2),
  sparkles: z.boolean(),
  maxPixelRatio: z.number().min(1).max(2.5),
  animations: z.boolean(),
})
export type EffectsSettings = z.infer<typeof effectsSchema>
export const DEFAULT_EFFECTS: EffectsSettings = { hero3d: true, waveHeight: 1, waveSpeed: 1, sparkles: true, maxPixelRatio: 1.75, animations: true }

/* -------------------------------- Sections --------------------------------- */
export const sectionConfigSchema = z.object({
  enabled: z.boolean(), title: label(100), intro: text(400),
  emptyBehavior: z.enum(['hide', 'neutral']), emptyText: text(200),
})
export const sectionsSchema = z.object(Object.fromEntries(SECTION_IDS.map((id) => [id, sectionConfigSchema])) as Record<(typeof SECTION_IDS)[number], typeof sectionConfigSchema>)
export type SectionsSettings = z.infer<typeof sectionsSchema>
const section = (title: string, intro: string): z.infer<typeof sectionConfigSchema> => ({ enabled: true, title, intro, emptyBehavior: 'hide', emptyText: 'Contenu bientôt disponible.' })
export const DEFAULT_SECTIONS: SectionsSettings = {
  about: section('À propos', ''),
  projects: section('Projets', 'Une sélection de réalisations, de l’idée à la mise en ligne.'),
  skills: section('Compétences', 'Les technologies et outils que j’utilise au quotidien.'),
  journey: section('Parcours', 'Expériences, formations, certifications et réalisations.'),
  contact: section('Contact', ''),
}

/* ---------------------------------- Parcours --------------------------------- */
const tabConfig = z.object({ enabled: z.boolean(), label: label(40) })
export const journeySchema = z.object({
  tabs: z.object(Object.fromEntries(JOURNEY_TABS.map((t) => [t, tabConfig])) as Record<(typeof JOURNEY_TABS)[number], typeof tabConfig>),
  order: z.array(z.enum(JOURNEY_TABS)).min(1).max(4),
  defaultTab: z.enum(JOURNEY_TABS),
  hiddenAchievementCategories: z.array(z.string().trim().min(1).max(60)).max(30),
})
export type JourneySettings = z.infer<typeof journeySchema>
export const DEFAULT_JOURNEY: JourneySettings = {
  tabs: { experiences: { enabled: true, label: 'Expériences' }, education: { enabled: true, label: 'Formation' }, certifications: { enabled: true, label: 'Certifications' }, achievements: { enabled: true, label: 'Réalisations' } },
  order: ['experiences', 'education', 'certifications', 'achievements'], defaultTab: 'experiences', hiddenAchievementCategories: [],
}

/* --------------------------------- Affichage --------------------------------- */
export const displaySchema = z.object({
  iconStyle: z.enum(['brand', 'mono']),
  showLevels: z.boolean(),
  skillsLayout: z.enum(['grouped', 'flat']),
  projectsPerPage: z.number().int().min(3).max(24),
  timelineOrder: z.enum(['date', 'manual']),
  showTechIcons: z.boolean(),
  explore: z.object({ skills: z.boolean(), projects: z.boolean() }),
})
export type DisplaySettings = z.infer<typeof displaySchema>
export const DEFAULT_DISPLAY: DisplaySettings = { iconStyle: 'brand', showLevels: false, skillsLayout: 'grouped', projectsPerPage: 6, timelineOrder: 'date', showTechIcons: true, explore: { skills: true, projects: true } }

/* ------------------------------- Navigation -------------------------------- */
export const navItemSchema = z.object({ id: z.enum(NAV_TARGET_IDS), label: label(40), visible: z.boolean() })
export const navigationSchema = z.object({ items: z.array(navItemSchema).max(10), showSettings: z.boolean() })
export type NavigationSettings = z.infer<typeof navigationSchema>
export const DEFAULT_NAVIGATION: NavigationSettings = {
  items: [
    { id: 'hero', label: 'Accueil', visible: true }, { id: 'about', label: 'À propos', visible: true }, { id: 'projects', label: 'Projets', visible: true },
    { id: 'skills', label: 'Compétences', visible: true }, { id: 'journey', label: 'Parcours', visible: true }, { id: 'contact', label: 'Contact', visible: true },
  ],
  showSettings: true,
}

/* --------------------------------- Contact --------------------------------- */
const contactField = z.object({ label: label(60), placeholder: text(120), required: z.boolean(), visible: z.boolean() })
const waNumber = z.preprocess(
  (v) => (typeof v === 'string' ? (v.replace(/[^\d]/g, '') || null) : v),
  z.string().regex(/^\d{8,15}$/, 'Numéro au format international, chiffres uniquement (8 à 15)').nullable(),
)
export const contactSchema = z.object({
  pageEnabled: z.boolean(), title: label(120), intro: text(600), channelMode: z.enum(CONTACT_CHANNEL_MODES),
  fields: z.object({ name: contactField, email: contactField, subject: contactField, phone: contactField, message: contactField }),
  submitLabel: label(40), successMessage: text(300), partialMessage: text(300), errorMessage: text(300),
  afterSubmit: z.enum(AFTER_SUBMIT_BEHAVIORS),
  redirectPath: z.preprocess((v) => (v === '' ? null : v), z.string().regex(/^\/(?!\/)[\w\-./?=&#%]*$/, 'Chemin interne attendu (ex. /merci)').max(200).nullable()),
  recipientEmail: z.preprocess((v) => (v === '' ? null : v), z.email().max(200).nullable()),
  emailSubjectTemplate: label(160), emailBodyTemplate: text(4000),
  whatsappNumber: waNumber, whatsappTemplate: text(1000), whatsappButtonLabel: label(60), whatsappAfterLabel: label(60),
  showEmailLink: z.boolean(), retentionDays: z.number().int().min(0).max(3650),
  privacyNotice: text(600), requireConsent: z.boolean(), consentLabel: label(160),
})
export type ContactSettings = z.infer<typeof contactSchema>
export const DEFAULT_CONTACT: ContactSettings = {
  pageEnabled: true, title: 'Contact', intro: 'Décrivez votre besoin en quelques lignes : je vous réponds par e-mail.', channelMode: 'email',
  fields: {
    name: { label: 'Nom', placeholder: 'Votre nom', required: true, visible: true },
    email: { label: 'E-mail', placeholder: 'vous@exemple.com', required: true, visible: true },
    subject: { label: 'Sujet', placeholder: 'Objet de votre message', required: false, visible: false },
    phone: { label: 'Téléphone', placeholder: '+229 …', required: false, visible: false },
    message: { label: 'Message', placeholder: 'Votre message…', required: true, visible: true },
  },
  submitLabel: 'Envoyer le message', successMessage: 'Merci, votre message a bien été envoyé.',
  partialMessage: 'Votre message est enregistré, mais la notification e-mail n’a pas pu partir. Utilisez un autre canal si c’est urgent.',
  errorMessage: 'Le message n’a pas pu être envoyé. Réessayez dans un instant ou utilisez un autre canal.',
  afterSubmit: 'message', redirectPath: null, recipientEmail: null,
  emailSubjectTemplate: 'Nouveau message de {name} via {siteName}', emailBodyTemplate: 'Nom : {name}\nE-mail : {email}\nTéléphone : {phone}\n\n{message}',
  whatsappNumber: null, whatsappTemplate: 'Bonjour, je suis {name}. {message}', whatsappButtonLabel: 'Écrire sur WhatsApp', whatsappAfterLabel: 'Envoyer aussi sur WhatsApp',
  showEmailLink: true, retentionDays: 180,
  privacyNotice: 'Les informations saisies (nom, e-mail, message) servent uniquement à vous répondre. Elles sont conservées {retentionDays} jours puis supprimées, et jamais transmises à des tiers.',
  requireConsent: false, consentLabel: 'J’accepte que mes informations soient utilisées pour me répondre.',
}

export const widgetSchema = z.object({
  enabled: z.boolean(), label: label(40), title: label(60), greeting: text(400), position: z.enum(['bottom-right', 'bottom-left']),
  offerForm: z.boolean(), offerEmail: z.boolean(), offerWhatsapp: z.boolean(), asyncNotice: text(240),
})
export type WidgetSettings = z.infer<typeof widgetSchema>
export const DEFAULT_WIDGET: WidgetSettings = {
  enabled: false, label: 'Contact rapide', title: 'Parlons-en', greeting: 'Bonjour ! Choisissez le canal qui vous convient. Les messages sont lus plus tard : ce n’est pas un chat en temps réel.',
  position: 'bottom-right', offerForm: true, offerEmail: true, offerWhatsapp: true, asyncNotice: 'Message asynchrone : la réponse arrivera par e-mail, pas instantanément.',
}

/* ------------------------- Textes d'interface, SEO, légal ------------------------- */
export const uiSchema = z.record(z.string(), z.string().max(240))
export type UiOverrides = z.infer<typeof uiSchema>

export const seoSchema = z.object({ ogImageUrl: optionalUrl, ogImagePublicId: publicIdSchema, indexable: z.boolean() })
export type SeoSettings = z.infer<typeof seoSchema>
export const DEFAULT_SEO: SeoSettings = { ogImageUrl: null, ogImagePublicId: null, indexable: true }

export const privacySchema = z.object({ enabled: z.boolean(), title: label(100), body: text(6000) })
export type PrivacySettings = z.infer<typeof privacySchema>
export const DEFAULT_PRIVACY: PrivacySettings = {
  enabled: true, title: 'Confidentialité',
  body: 'Ce site ne dépose aucun cookie publicitaire ni outil de suivi.\n\nLorsque vous utilisez le formulaire de contact, votre nom, votre adresse e-mail et votre message sont enregistrés afin que je puisse vous répondre. Ils ne sont partagés avec personne et sont supprimés automatiquement après la durée de conservation indiquée sous le formulaire.\n\nPour demander l’accès ou la suppression de vos données, écrivez-moi via le formulaire de contact.',
}

/* ------------------------------ Regroupement ------------------------------- */
export const SETTINGS_SCHEMAS = {
  content: contentSchema, social: socialSchema, theme: themeSchema, effects: effectsSchema, sections: sectionsSchema, journey: journeySchema,
  display: displaySchema, navigation: navigationSchema, contact: contactSchema, widget: widgetSchema, ui: uiSchema, seo: seoSchema, privacy: privacySchema,
} as const
export type SettingsKey = keyof typeof SETTINGS_SCHEMAS
export const SETTINGS_KEYS = Object.keys(SETTINGS_SCHEMAS) as SettingsKey[]

export interface SiteSettings {
  content: z.infer<typeof contentSchema>; social: SocialItem[]; theme: ThemeSettings; effects: EffectsSettings; sections: SectionsSettings
  journey: JourneySettings; display: DisplaySettings; navigation: NavigationSettings; contact: ContactSettings; widget: WidgetSettings
  ui: UiOverrides; seo: SeoSettings; privacy: PrivacySettings
}

export const DEFAULT_SETTINGS: SiteSettings = {
  content: DEFAULT_CONTENT, social: DEFAULT_SOCIAL, theme: DEFAULT_THEME, effects: DEFAULT_EFFECTS, sections: DEFAULT_SECTIONS, journey: DEFAULT_JOURNEY,
  display: DEFAULT_DISPLAY, navigation: DEFAULT_NAVIGATION, contact: DEFAULT_CONTACT, widget: DEFAULT_WIDGET, ui: {}, seo: DEFAULT_SEO, privacy: DEFAULT_PRIVACY,
}

type Plain = Record<string, unknown>
const isPlain = (v: unknown): v is Plain => typeof v === 'object' && v !== null && !Array.isArray(v)

/** Fusion profonde : les tableaux stockés remplacent les défauts, les objets sont fusionnés clé à clé. */
export function deepMerge<T>(base: T, override: unknown): T {
  if (!isPlain(base) || !isPlain(override)) return override === undefined || override === null ? base : (override as T)
  const out: Plain = { ...base }
  for (const [key, value] of Object.entries(override)) out[key] = key in base ? deepMerge((base as Plain)[key], value) : value
  return out as T
}

/** Lit une section de réglages : défauts + valeurs stockées ; retombe sur les défauts si la valeur stockée est invalide. */
export function resolveSettingsSection<K extends SettingsKey>(key: K, stored: unknown): SiteSettings[K] {
  const base = DEFAULT_SETTINGS[key]
  if (key === 'ui') return pickKnownLabels(stored) as SiteSettings[K]
  const parsed = SETTINGS_SCHEMAS[key].safeParse(deepMerge(base, stored))
  return (parsed.success ? parsed.data : base) as SiteSettings[K]
}

/** Ne conserve que les clés de texte connues (aucune clé arbitraire) et ignore les valeurs vides. */
export function pickKnownLabels(stored: unknown): UiOverrides {
  const out: UiOverrides = {}
  if (!isPlain(stored)) return out
  for (const key of UI_LABEL_KEYS) {
    const value = stored[key]
    if (typeof value === 'string' && value.trim() !== '') out[key] = value.slice(0, 240)
  }
  return out
}

/** Dictionnaire complet des textes : défauts + remplacements validés. */
export function resolveLabels(overrides: UiOverrides | undefined): Record<string, string> {
  return { ...DEFAULT_UI_LABELS, ...pickKnownLabels(overrides) }
}

/** Le champ « message » est toujours visible et obligatoire. */
export function normalizeContactSettings(contact: ContactSettings): ContactSettings {
  return { ...contact, fields: { ...contact.fields, message: { ...contact.fields.message, visible: true, required: true } } }
}
