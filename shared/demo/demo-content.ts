import type { CategoryScope } from '../constants'
import { ENTITY_DEFAULTS } from '../schemas/entities'
import type { AchievementInput, CertificationInput, EducationInput, ExperienceInput, ProjectInput, SkillInput } from '../schemas/entities'

/**
 * Données de DÉMONSTRATION, clairement identifiées (« démo »). Elles servent :
 *  - de contenu de secours tant que DATABASE_URL n'est pas configurée ;
 *  - de jeu d'amorçage optionnel (`pnpm db:seed:demo`), supprimable par `pnpm db:purge:demo`.
 * Aucune information personnelle réelle ne figure ici.
 */
const NOTE = 'Élément de démonstration : remplacez-le depuis l’administration.'

export const DEMO_CATEGORIES: { scope: CategoryScope; name: string; icon: string | null; sortOrder: number }[] = [
  { scope: 'skills', name: 'Interface', icon: 'lucide:Layout', sortOrder: 0 },
  { scope: 'skills', name: '3D et animation', icon: 'lucide:Sparkles', sortOrder: 1 },
  { scope: 'skills', name: 'Serveur et données', icon: 'lucide:Database', sortOrder: 2 },
  { scope: 'skills', name: 'Outils', icon: 'lucide:Wrench', sortOrder: 3 },
  { scope: 'projects', name: 'Site web', icon: null, sortOrder: 0 },
  { scope: 'projects', name: 'Application', icon: null, sortOrder: 1 },
  { scope: 'projects', name: 'Visualisation', icon: null, sortOrder: 2 },
  { scope: 'certifications', name: 'Cloud', icon: null, sortOrder: 0 },
  { scope: 'certifications', name: 'Web', icon: null, sortOrder: 1 },
  { scope: 'certifications', name: 'Diplôme', icon: null, sortOrder: 2 },
  { scope: 'achievements', name: 'Distinction', icon: 'lucide:Trophy', sortOrder: 0 },
  { scope: 'achievements', name: 'Concours', icon: 'lucide:Medal', sortOrder: 1 },
  { scope: 'achievements', name: 'Publication', icon: 'lucide:FileText', sortOrder: 2 },
]

const skill = (name: string, category: string, icon: string, order: number, extra: Partial<SkillInput> = {}): SkillInput => ({
  ...ENTITY_DEFAULTS.skills, name, slug: name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, ''), description: NOTE, category, icon, sortOrder: order, ...extra,
})

export const DEMO_SKILLS: SkillInput[] = [
  skill('TypeScript', 'Interface', 'si:typescript', 1, { featured: true }),
  skill('Vue.js', 'Interface', 'si:vuedotjs', 2, { featured: true }),
  skill('Nuxt', 'Interface', 'si:nuxt', 3),
  skill('Tailwind CSS', 'Interface', 'si:tailwindcss', 4),
  skill('Three.js', '3D et animation', 'si:threedotjs', 5, { featured: true }),
  skill('GSAP', '3D et animation', 'si:gsap', 6),
  skill('Node.js', 'Serveur et données', 'si:nodedotjs', 7),
  skill('PostgreSQL', 'Serveur et données', 'si:postgresql', 8),
  skill('Drizzle ORM', 'Serveur et données', 'si:drizzle', 9),
  skill('Git', 'Outils', 'si:git', 10),
  skill('Docker', 'Outils', 'si:docker', 11),
  skill('Figma', 'Outils', 'si:figma', 12),
]

const project = (n: number, title: string, category: string, techs: string[], extra: Partial<ProjectInput> = {}): ProjectInput => ({
  ...ENTITY_DEFAULTS.projects, title: `${title} (démo)`, slug: `projet-demo-${n}`,
  shortDescription: 'Projet de démonstration : remplacez ce texte par la présentation de votre réalisation.',
  description: `${NOTE}\n\nDécrivez ici le contexte, votre rôle et le résultat obtenu.`,
  problem: 'Quelle difficulté ce projet résolvait-il ? (texte de démonstration)',
  features: ['Fonctionnalité principale (démo)', 'Fonctionnalité secondaire (démo)', 'Détail technique notable (démo)'],
  category, technologies: techs, status: 'published', featured: n <= 2, sortOrder: n, projectDate: `202${3 + (n % 3)}-0${(n % 9) + 1}-15`, ...extra,
})

export const DEMO_PROJECTS: ProjectInput[] = [
  project(1, 'Atlas des marées', 'Site web', ['Nuxt', 'Three.js', 'GSAP']),
  project(2, 'Console de réservation', 'Application', ['Vue.js', 'TypeScript', 'PostgreSQL']),
  project(3, 'Carte des courants', 'Visualisation', ['Three.js', 'TypeScript']),
  project(4, 'Relais de signal', 'Application', ['Node.js', 'Drizzle ORM', 'Docker']),
  project(5, 'Journal de bord', 'Site web', ['Nuxt', 'Tailwind CSS']),
  project(6, 'Phare', 'Application', ['Vue.js', 'Node.js', 'Git']),
]

export const DEMO_EDUCATION: EducationInput[] = [
  { ...ENTITY_DEFAULTS.education, title: 'Cycle préparatoire (démo)', institution: 'Établissement fictif A', degree: 'Cycle préparatoire', field: 'Sciences', description: NOTE, startDate: '2016-09-01', endDate: '2018-06-30', achievements: ['Réalisation de démonstration'], sortOrder: 1 },
  { ...ENTITY_DEFAULTS.education, title: 'Licence (démo)', institution: 'Établissement fictif B', degree: 'Licence', field: 'Informatique', description: NOTE, startDate: '2018-09-01', endDate: '2021-06-30', achievements: ['Projet de fin d’études (démo)'], sortOrder: 2 },
  { ...ENTITY_DEFAULTS.education, title: 'Master (démo)', institution: 'Établissement fictif D', degree: 'Master', field: 'Ingénierie logicielle', description: NOTE, startDate: '2022-09-01', endDate: null, isCurrent: true, sortOrder: 3 },
]

export const DEMO_EXPERIENCES: ExperienceInput[] = [
  { ...ENTITY_DEFAULTS.experiences, organization: 'Organisation fictive 1 (démo)', role: 'Développeur stagiaire', type: 'internship', location: 'Lieu de démonstration', startDate: '2021-06-01', endDate: '2021-09-01', description: NOTE, missions: ['Mission de démonstration'], results: ['Résultat de démonstration'], technologies: ['Vue.js', 'Node.js'], sortOrder: 1 },
  { ...ENTITY_DEFAULTS.experiences, organization: 'Association fictive (démo)', role: 'Responsable communication', type: 'volunteer', startDate: '2022-01-10', endDate: '2023-03-01', description: NOTE, missions: ['Animation de la communauté'], sortOrder: 2 },
  { ...ENTITY_DEFAULTS.experiences, organization: 'Studio fictif (démo)', role: 'Développeur Full-Stack', type: 'job', startDate: '2023-04-01', endDate: null, isCurrent: true, description: NOTE, missions: ['Conception d’interfaces', 'API et base de données'], results: ['Livraison de démonstration'], technologies: ['Nuxt', 'PostgreSQL', 'Three.js'], sortOrder: 3 },
]

export const DEMO_CERTIFICATIONS: CertificationInput[] = [
  { ...ENTITY_DEFAULTS.certifications, name: 'Certification cloud (démo)', issuer: 'Organisme fictif', category: 'Cloud', issuedAt: '2023-05-20', expiresAt: '2027-05-20', sortOrder: 1 },
  { ...ENTITY_DEFAULTS.certifications, name: 'Certification web (démo)', issuer: 'Organisme fictif', category: 'Web', issuedAt: '2022-11-02', sortOrder: 2 },
  { ...ENTITY_DEFAULTS.certifications, name: 'Diplôme de démonstration', issuer: 'Établissement fictif B', category: 'Diplôme', issuedAt: '2021-07-10', sortOrder: 3 },
]

export const DEMO_ACHIEVEMENTS: AchievementInput[] = [
  { ...ENTITY_DEFAULTS.achievements, title: 'Prix de démonstration', category: 'Distinction', description: NOTE, achievedAt: '2022-12-01', icon: 'lucide:Trophy', sortOrder: 1 },
  { ...ENTITY_DEFAULTS.achievements, title: 'Hackathon de démonstration', category: 'Concours', description: NOTE, achievedAt: '2023-03-18', icon: 'lucide:Medal', sortOrder: 2 },
  { ...ENTITY_DEFAULTS.achievements, title: 'Article de démonstration', category: 'Publication', description: NOTE, achievedAt: '2024-01-09', icon: 'lucide:FileText', sortOrder: 3 },
]
