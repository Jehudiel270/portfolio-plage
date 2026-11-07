/** Constantes partagées entre le navigateur, le serveur et les scripts. */

/** Sections de la page d'accueil : 5 + l'accueil = un menu de 6 entrées au maximum. */
export const SECTION_IDS = ['about', 'projects', 'skills', 'journey', 'contact'] as const
export type SectionId = (typeof SECTION_IDS)[number]
export const NAV_TARGET_IDS = ['hero', ...SECTION_IDS] as const
export type NavTargetId = (typeof NAV_TARGET_IDS)[number]

/** « Parcours » regroupe quatre types de contenu sous forme d'onglets. */
export const JOURNEY_TABS = ['experiences', 'education', 'certifications', 'achievements'] as const
export type JourneyTab = (typeof JOURNEY_TABS)[number]

/** Listes de catégories gérées depuis l'administration (listes déroulantes partout). */
export const CATEGORY_SCOPES = ['skills', 'projects', 'certifications', 'achievements'] as const
export type CategoryScope = (typeof CATEGORY_SCOPES)[number]

export const PROJECT_STATUSES = ['draft', 'published'] as const
export const EXPERIENCE_TYPES = ['job', 'internship', 'mission', 'volunteer', 'other'] as const
export type ExperienceType = (typeof EXPERIENCE_TYPES)[number]

export const SOCIAL_PLATFORMS = ['linkedin', 'github', 'gitlab', 'x', 'instagram', 'youtube', 'facebook', 'tiktok', 'behance', 'dribbble', 'malt', 'upwork', 'whatsapp', 'website', 'other'] as const
export type SocialPlatform = (typeof SOCIAL_PLATFORMS)[number]

export const CONTACT_CHANNEL_MODES = ['email', 'whatsapp', 'both', 'none'] as const
export type ContactChannelMode = (typeof CONTACT_CHANNEL_MODES)[number]
export const AFTER_SUBMIT_BEHAVIORS = ['message', 'reset', 'redirect'] as const

export const MESSAGE_STATUSES = ['new', 'read', 'handled'] as const
export type MessageStatus = (typeof MESSAGE_STATUSES)[number]
export const EMAIL_STATUSES = ['sent', 'not_configured', 'failed', 'skipped'] as const
export type EmailStatus = (typeof EMAIL_STATUSES)[number]

/** Variables autorisées dans les modèles d'e-mail / WhatsApp. Rien d'autre n'est interprété. */
export const TEMPLATE_VARIABLES = ['name', 'email', 'phone', 'subject', 'message', 'siteName'] as const
export type TemplateVariable = (typeof TEMPLATE_VARIABLES)[number]

export const MAX_CONTACT_MESSAGE_LENGTH = 4000

/** Icônes génériques (Lucide) proposées en plus de la bibliothèque de marques (Simple Icons) et des icônes personnalisées. */
export const LUCIDE_ICON_NAMES = [
  'Code', 'Code2', 'Terminal', 'Database', 'Server', 'Cloud', 'Cpu', 'Globe', 'Smartphone', 'Monitor', 'Layers', 'Palette', 'PenTool', 'Brush',
  'Camera', 'Video', 'Music', 'Mic', 'Languages', 'BookOpen', 'GraduationCap', 'Award', 'Trophy', 'Medal', 'Star', 'Heart', 'Shield', 'ShieldCheck',
  'Lock', 'Key', 'Rocket', 'Zap', 'Lightbulb', 'Puzzle', 'Wrench', 'Settings', 'BarChart3', 'LineChart', 'PieChart', 'Briefcase', 'Building2', 'Users',
  'MessageCircle', 'Mail', 'Phone', 'MapPin', 'Calendar', 'Clock', 'FileText', 'Folder', 'Package', 'GitBranch', 'Bug', 'Bot', 'Brain', 'Sparkles',
  'Sun', 'Waves', 'Anchor', 'Ship', 'Shell', 'Umbrella', 'Sailboat', 'Fish', 'TreePalm', 'Compass', 'Layout', 'Smile', 'Handshake', 'Megaphone',
  'Target', 'TrendingUp', 'Boxes', 'Workflow', 'Network', 'Scale', 'Calculator', 'Landmark', 'Stethoscope', 'Microscope', 'FlaskConical', 'Dumbbell',
  'Plane', 'Linkedin', 'Github', 'Link',
] as const
export type LucideIconName = (typeof LUCIDE_ICON_NAMES)[number]
