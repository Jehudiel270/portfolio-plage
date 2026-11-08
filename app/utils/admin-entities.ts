import { EXPERIENCE_TYPES, PROJECT_STATUSES, type CategoryScope } from '#shared/constants'
import type { EntityKey } from '#shared/schemas/entities'
import { experienceTypeLabel } from './admin-labels'
import { formatMonth, formatRange } from './format'

export type UploadFolder = 'projects' | 'skills' | 'education' | 'experiences' | 'certifications' | 'achievements' | 'categories' | 'profile' | 'misc'
export type FieldType = 'text' | 'textarea' | 'url' | 'date' | 'boolean' | 'select' | 'category' | 'icon' | 'color' | 'number' | 'tags' | 'lines' | 'image' | 'gallery'
export interface Option { value: string; label: string }

export interface FieldDef {
  key: string
  label: string
  type: FieldType
  section: string
  /** Pour les images et icônes personnalisées : clé de l'identifiant public Cloudinary associé. */
  publicIdKey?: string
  options?: Option[]
  scope?: CategoryScope
  /** Clé d'un autre champ dont la valeur sert à proposer automatiquement une icône (ex. le nom de la compétence). */
  suggestFrom?: string
  hint?: string
  placeholder?: string
  optional?: boolean
  wide?: boolean
  rows?: number
  suggest?: boolean
  iconPreview?: boolean
}

export interface EntityMeta {
  key: EntityKey
  label: string
  singular: string
  description: string
  publication: 'status' | 'visible'
  folder: UploadFolder
  searchKeys: string[]
  filterKey: string
  filterLabel: string
  canFeature: boolean
  /** Types de contenu pour lesquels « Ajout rapide » (une ligne = un élément) est possible. */
  quickAdd: { field: string; hint: string } | null
  title(row: Record<string, unknown>): string
  subtitle(row: Record<string, unknown>): string
  fields: FieldDef[]
}

const opts = (pairs: [string, string][]): Option[] => pairs.map(([value, label]) => ({ value, label }))
const s = (row: Record<string, unknown>, key: string): string => (typeof row[key] === 'string' ? (row[key] as string) : '')
const common = (section = 'Publication'): FieldDef[] => [
  { key: 'featured', label: 'Mise en avant', type: 'boolean', section, hint: 'Priorité visuelle dans la grille.' },
  { key: 'sortOrder', label: 'Ordre manuel', type: 'number', section, hint: 'Plus petit = plus haut. Utilisez aussi les flèches de la liste.' },
]

export const ENTITY_META: Record<EntityKey, EntityMeta> = {
  projects: {
    key: 'projects', label: 'Projets', singular: 'projet', description: 'Chaque projet publié apparaît dans la grille du site (et devient une bouteille dans l’exploration 3D). Les brouillons ne sont jamais publics.',
    publication: 'status', folder: 'projects', searchKeys: ['title', 'category', 'shortDescription'], filterKey: 'category', filterLabel: 'Catégorie', canFeature: true,
    quickAdd: { field: 'title', hint: 'Un titre par ligne : les projets sont créés en brouillon.' },
    title: (r) => s(r, 'title'), subtitle: (r) => [s(r, 'category'), (r.technologies as string[] | undefined)?.slice(0, 3).join(', ')].filter(Boolean).join(' · '),
    fields: [
      { key: 'title', label: 'Titre', type: 'text', section: '01 · Présentation', placeholder: 'Ex. Refonte de la boutique en ligne' },
      { key: 'category', label: 'Catégorie', type: 'category', scope: 'projects', section: '01 · Présentation', optional: true },
      { key: 'shortDescription', label: 'Accroche', type: 'textarea', section: '01 · Présentation', rows: 2, wide: true, optional: true, hint: 'Une phrase claire qui résume le projet (280 caractères max).' },
      { key: 'problem', label: 'Contexte et problématique', type: 'textarea', section: '01 · Présentation', rows: 3, wide: true, optional: true, hint: 'À qui s’adressait le projet et quel besoin devait-il résoudre ?' },
      { key: 'role', label: 'Mon rôle et ma contribution', type: 'textarea', section: '01 · Présentation', rows: 3, wide: true, optional: true, hint: 'Précisez vos responsabilités, votre équipe et les choix dont vous étiez responsable.' },
      { key: 'description', label: 'Démarche et solution', type: 'textarea', section: '01 · Présentation', rows: 6, wide: true, optional: true, hint: 'Racontez les étapes, les choix de conception et les défis techniques.' },
      { key: 'features', label: 'Fonctionnalités clés', type: 'lines', section: '02 · Fonctionnalités et résultats', optional: true, wide: true, hint: 'Une fonctionnalité par ligne. Décrivez ce que la personne peut faire.' },
      { key: 'results', label: 'Résultats et chiffres clés', type: 'lines', section: '02 · Fonctionnalités et résultats', optional: true, wide: true, hint: 'Une réalisation par ligne : temps gagné, utilisateurs, performance, retour client… N’indiquez que des résultats vérifiables.' },
      { key: 'technologies', label: 'Technologies utilisées', type: 'tags', section: '02 · Fonctionnalités et résultats', optional: true, wide: true, iconPreview: true, hint: 'Les icônes apparaissent ici. Elles reprennent celles de vos compétences homonymes, sinon la bibliothèque de marques.' },
      { key: 'coverImageUrl', publicIdKey: 'coverPublicId', label: 'Image principale', type: 'image', section: '03 · Médias', optional: true, wide: true, hint: 'Choisissez une capture représentative : elle sert de couverture et d’aperçu social.' },
      { key: 'gallery', label: 'Galerie d’images', type: 'gallery', section: '03 · Médias', optional: true, wide: true, hint: 'Ajoutez des captures complémentaires pour illustrer les étapes ou les écrans clés.' },
      { key: 'liveUrl', label: 'URL de la démonstration', type: 'url', section: '04 · Liens et classement', optional: true, placeholder: 'https://…' },
      { key: 'repositoryUrl', label: 'URL du dépôt source', type: 'url', section: '04 · Liens et classement', optional: true, placeholder: 'https://github.com/…' },
      { key: 'projectDate', label: 'Date du projet', type: 'date', section: '04 · Liens et classement', optional: true, hint: 'Sert au tri par date.' },
      { key: 'color', label: 'Couleur de la bouteille (3D)', type: 'color', section: '04 · Liens et classement', optional: true },
      { key: 'slug', label: 'Adresse (slug)', type: 'text', section: '04 · Liens et classement', optional: true, hint: 'Générée depuis le titre si vide ; unique.' },
      { key: 'status', label: 'Statut', type: 'select', section: '05 · Publication', options: opts([[PROJECT_STATUSES[0], 'Brouillon (jamais public)'], [PROJECT_STATUSES[1], 'Publié']]) },
      ...common(),
    ],
  },
  skills: {
    key: 'skills', label: 'Compétences', singular: 'compétence', description: 'Technologies et savoir-faire, groupés par catégorie. Chaque compétence peut avoir une icône (bibliothèque, générique ou personnalisée) — ou aucune.',
    publication: 'visible', folder: 'skills', searchKeys: ['name', 'category'], filterKey: 'category', filterLabel: 'Catégorie', canFeature: true,
    quickAdd: { field: 'name', hint: 'Un nom par ligne, ou « Nom ; Catégorie ». L’icône de la technologie est ajoutée automatiquement quand elle existe.' },
    title: (r) => s(r, 'name'), subtitle: (r) => s(r, 'category'),
    fields: [
      { key: 'name', label: 'Nom', type: 'text', section: 'Identité' },
      { key: 'category', label: 'Catégorie', type: 'category', scope: 'skills', section: 'Identité', optional: true },
      { key: 'icon', publicIdKey: 'iconPublicId', label: 'Icône', type: 'icon', suggestFrom: 'name', section: 'Identité', wide: true, optional: true, hint: 'Facultative. Sans icône, les initiales sont affichées.' },
      { key: 'description', label: 'Description', type: 'textarea', section: 'Identité', rows: 3, wide: true, optional: true },
      { key: 'proficiency', label: 'Niveau de maîtrise (0–100)', type: 'number', section: 'Affichage', optional: true, hint: 'Facultatif. Affiché seulement si activé dans « Affichage et menu ».' },
      { key: 'color', label: 'Couleur d’accent', type: 'color', section: 'Affichage', optional: true },
      { key: 'slug', label: 'Adresse (slug)', type: 'text', section: 'Affichage', optional: true },
      { key: 'visible', label: 'Visible publiquement', type: 'boolean', section: 'Publication' },
      ...common(),
    ],
  },
  education: {
    key: 'education', label: 'Formation', singular: 'formation', description: 'Études et formations, affichées en frise chronologique (la plus récente d’abord).',
    publication: 'visible', folder: 'education', searchKeys: ['title', 'institution', 'field'], filterKey: 'field', filterLabel: 'Domaine', canFeature: true, quickAdd: null,
    title: (r) => s(r, 'title'), subtitle: (r) => [s(r, 'institution'), formatRange(s(r, 'startDate'), s(r, 'endDate') || null, r.isCurrent === true)].filter(Boolean).join(' · '),
    fields: [
      { key: 'title', label: 'Intitulé', type: 'text', section: 'Formation' },
      { key: 'institution', label: 'Établissement', type: 'text', section: 'Formation' },
      { key: 'degree', label: 'Diplôme ou type', type: 'text', section: 'Formation', optional: true, placeholder: 'Licence, Master, BTS…' },
      { key: 'field', label: 'Domaine', type: 'text', section: 'Formation', optional: true, suggest: true },
      { key: 'startDate', label: 'Date de début', type: 'date', section: 'Dates' },
      { key: 'endDate', label: 'Date de fin', type: 'date', section: 'Dates', optional: true },
      { key: 'isCurrent', label: 'Formation en cours', type: 'boolean', section: 'Dates' },
      { key: 'description', label: 'Description', type: 'textarea', section: 'Détails', rows: 5, wide: true, optional: true },
      { key: 'achievements', label: 'Réalisations associées', type: 'lines', section: 'Détails', optional: true, wide: true },
      { key: 'imageUrl', publicIdKey: 'imagePublicId', label: 'Logo ou image', type: 'image', section: 'Détails', optional: true, wide: true },
      { key: 'url', label: 'URL officielle', type: 'url', section: 'Détails', optional: true },
      { key: 'visible', label: 'Visible publiquement', type: 'boolean', section: 'Publication' },
      ...common(),
    ],
  },
  experiences: {
    key: 'experiences', label: 'Expériences', singular: 'expérience', description: 'Emplois, stages, missions et engagements, en frise chronologique (la plus récente d’abord).',
    publication: 'visible', folder: 'experiences', searchKeys: ['organization', 'role'], filterKey: 'type', filterLabel: 'Type', canFeature: true, quickAdd: null,
    title: (r) => s(r, 'role'), subtitle: (r) => [s(r, 'organization'), experienceTypeLabel(s(r, 'type')), formatRange(s(r, 'startDate'), s(r, 'endDate') || null, r.isCurrent === true)].filter(Boolean).join(' · '),
    fields: [
      { key: 'role', label: 'Rôle / intitulé', type: 'text', section: 'Poste' },
      { key: 'organization', label: 'Organisation', type: 'text', section: 'Poste' },
      { key: 'type', label: 'Type', type: 'select', section: 'Poste', options: opts([[EXPERIENCE_TYPES[0], 'Emploi'], [EXPERIENCE_TYPES[1], 'Stage'], [EXPERIENCE_TYPES[2], 'Mission'], [EXPERIENCE_TYPES[3], 'Activité associative'], [EXPERIENCE_TYPES[4], 'Autre']]) },
      { key: 'location', label: 'Lieu', type: 'text', section: 'Poste', optional: true },
      { key: 'startDate', label: 'Date de début', type: 'date', section: 'Dates' },
      { key: 'endDate', label: 'Date de fin', type: 'date', section: 'Dates', optional: true },
      { key: 'isCurrent', label: 'Poste en cours', type: 'boolean', section: 'Dates' },
      { key: 'description', label: 'Description', type: 'textarea', section: 'Détails', rows: 4, wide: true, optional: true },
      { key: 'missions', label: 'Missions', type: 'lines', section: 'Détails', optional: true, wide: true },
      { key: 'results', label: 'Résultats', type: 'lines', section: 'Détails', optional: true, wide: true },
      { key: 'technologies', label: 'Technologies et outils', type: 'tags', section: 'Détails', optional: true, wide: true },
      { key: 'imageUrl', publicIdKey: 'imagePublicId', label: 'Logo de l’organisation', type: 'image', section: 'Détails', optional: true, wide: true },
      { key: 'url', label: 'URL', type: 'url', section: 'Détails', optional: true },
      { key: 'visible', label: 'Visible publiquement', type: 'boolean', section: 'Publication' },
      ...common(),
    ],
  },
  certifications: {
    key: 'certifications', label: 'Certifications', singular: 'certification', description: 'Certifications et diplômes. Aucun lien de vérification n’est inventé : renseignez l’URL officielle si l’organisme en fournit une.',
    publication: 'visible', folder: 'certifications', searchKeys: ['name', 'issuer', 'category'], filterKey: 'category', filterLabel: 'Catégorie', canFeature: true, quickAdd: null,
    title: (r) => s(r, 'name'), subtitle: (r) => [s(r, 'issuer'), formatMonth(s(r, 'issuedAt'))].filter(Boolean).join(' · '),
    fields: [
      { key: 'name', label: 'Nom', type: 'text', section: 'Certification' },
      { key: 'issuer', label: 'Organisme émetteur', type: 'text', section: 'Certification' },
      { key: 'category', label: 'Catégorie', type: 'category', scope: 'certifications', section: 'Certification', optional: true },
      { key: 'issuedAt', label: 'Date d’obtention', type: 'date', section: 'Certification' },
      { key: 'expiresAt', label: 'Date d’expiration', type: 'date', section: 'Certification', optional: true },
      { key: 'credentialId', label: 'Identifiant de certification', type: 'text', section: 'Certification', optional: true },
      { key: 'verificationUrl', label: 'URL de vérification officielle', type: 'url', section: 'Vérification', optional: true, wide: true },
      { key: 'imageUrl', publicIdKey: 'imagePublicId', label: 'Image du certificat (public)', type: 'image', section: 'Vérification', optional: true, wide: true, hint: 'Seuls des documents destinés à être publics.' },
      { key: 'visible', label: 'Visible publiquement', type: 'boolean', section: 'Publication' },
      ...common(),
    ],
  },
  achievements: {
    key: 'achievements', label: 'Réalisations', singular: 'réalisation', description: 'Distinctions, concours, publications, langues… Masquez une catégorie entière depuis « Affichage et menu ».',
    publication: 'visible', folder: 'achievements', searchKeys: ['title', 'category'], filterKey: 'category', filterLabel: 'Catégorie', canFeature: false,
    quickAdd: { field: 'title', hint: 'Un titre par ligne, ou « Titre ; Catégorie ».' },
    title: (r) => s(r, 'title'), subtitle: (r) => [s(r, 'category'), formatMonth(s(r, 'achievedAt'))].filter(Boolean).join(' · '),
    fields: [
      { key: 'title', label: 'Titre', type: 'text', section: 'Réalisation' },
      { key: 'category', label: 'Catégorie', type: 'category', scope: 'achievements', section: 'Réalisation', optional: true },
      { key: 'achievedAt', label: 'Date', type: 'date', section: 'Réalisation', optional: true },
      { key: 'description', label: 'Description', type: 'textarea', section: 'Réalisation', rows: 4, wide: true, optional: true },
      { key: 'icon', publicIdKey: 'iconPublicId', label: 'Icône', type: 'icon', section: 'Réalisation', optional: true },
      { key: 'linkUrl', label: 'Lien externe', type: 'url', section: 'Réalisation', optional: true },
      { key: 'imageUrl', publicIdKey: 'imagePublicId', label: 'Image', type: 'image', section: 'Réalisation', optional: true, wide: true },
      { key: 'visible', label: 'Visible publiquement', type: 'boolean', section: 'Publication' },
      { key: 'sortOrder', label: 'Ordre manuel', type: 'number', section: 'Publication' },
    ],
  },
}
