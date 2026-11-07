import type { CategoryScope, ExperienceType, JourneyTab, NavTargetId, SectionId } from '../constants'
import type { ResolvedIcon } from '../icons'
import type { ImageRef } from '../schemas/common'
import type { ContactSettings, SiteSettings } from '../schemas/settings'

interface Flags {
  id: number
  isDemo: boolean
  /** Vrai uniquement en mode aperçu administrateur : brouillon ou élément masqué. */
  hidden?: boolean
}

/** Technologie citée dans un projet ou une expérience, avec son icône si elle est connue (compétence du même nom ou bibliothèque). */
export interface PublicTech { name: string; icon: ResolvedIcon | null }
export interface PublicCategory { name: string; color: string | null; icon: ResolvedIcon | null }

export interface PublicSkill extends Flags {
  name: string; slug: string; description: string; category: string
  icon: ResolvedIcon | null; color: string | null; proficiency: number | null; featured: boolean; sortOrder: number
}

export interface PublicProject extends Flags {
  title: string; slug: string; shortDescription: string; description: string; problem: string
  features: string[]; category: string; technologies: PublicTech[]
  coverImageUrl: string | null; gallery: ImageRef[]; liveUrl: string | null; repositoryUrl: string | null
  featured: boolean; sortOrder: number; projectDate: string | null; createdAt: string; color: string | null
}

export interface PublicEducation extends Flags {
  title: string; institution: string; degree: string; field: string; description: string
  startDate: string; endDate: string | null; isCurrent: boolean; achievements: string[]
  imageUrl: string | null; url: string | null; featured: boolean; sortOrder: number
}

export interface PublicExperience extends Flags {
  organization: string; role: string; type: ExperienceType; location: string | null
  startDate: string; endDate: string | null; isCurrent: boolean; description: string
  missions: string[]; results: string[]; technologies: PublicTech[]
  imageUrl: string | null; url: string | null; featured: boolean; sortOrder: number
}

export interface PublicCertification extends Flags {
  name: string; issuer: string; category: string; issuedAt: string; expiresAt: string | null
  credentialId: string | null; verificationUrl: string | null; imageUrl: string | null; featured: boolean; sortOrder: number
}

export interface PublicAchievement extends Flags {
  title: string; category: string; description: string; achievedAt: string | null
  linkUrl: string | null; icon: ResolvedIcon | null; imageUrl: string | null; sortOrder: number
}

/** Réglages exposés au navigateur : jamais de destinataire d'e-mail ni de modèles internes. */
export type PublicContactSettings = Omit<ContactSettings, 'recipientEmail' | 'emailSubjectTemplate' | 'emailBodyTemplate'>
export type PublicSettings = Omit<SiteSettings, 'contact' | 'ui'> & { contact: PublicContactSettings; labels: Record<string, string> }

export interface NavEntry { id: NavTargetId; label: string; href: string }

export interface PortfolioMeta {
  source: 'database' | 'demo-fallback'
  databaseConfigured: boolean
  preview: boolean
  generatedAt: string
  emailConfigured: boolean
}

export interface PublicPortfolio {
  meta: PortfolioMeta
  settings: PublicSettings
  /** Sections de contenu affichables (activées et non vides, ou état neutre demandé). */
  sections: SectionId[]
  /** Onglets du parcours disponibles, dans l'ordre choisi. */
  journeyTabs: JourneyTab[]
  nav: NavEntry[]
  categories: Record<CategoryScope, PublicCategory[]>
  skills: PublicSkill[]
  projects: PublicProject[]
  education: PublicEducation[]
  experiences: PublicExperience[]
  certifications: PublicCertification[]
  achievements: PublicAchievement[]
}

export type SelectionKind = 'project' | 'skill' | 'education' | 'experience' | 'certification' | 'achievement'
export interface Selection { kind: SelectionKind; id: number }

export interface ContactResponse {
  ok: true
  stored: boolean
  emailStatus: 'sent' | 'not_configured' | 'failed' | 'skipped'
}
