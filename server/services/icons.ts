import { parseIconValue, type ResolvedIcon } from '../../shared/icons'
import library from '../data/brand-icons.json'

type Row = [slug: string, title: string, hex: string, path: string]
const rows = library as Row[]
const bySlug = new Map(rows.map((r) => [r[0], r]))
const norm = (value: string): string => value.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]+/g, '')
const byName = new Map<string, Row>()
for (const row of rows) { byName.set(norm(row[1]), row); if (!byName.has(norm(row[0]))) byName.set(norm(row[0]), row) }

/** Alias courants → identifiant de la bibliothèque (le titre de marque ne correspond pas toujours au nom d'usage). */
const ALIASES: Record<string, string> = {
  'c++': 'cplusplus', cpp: 'cplusplus', js: 'javascript', ts: 'typescript', html: 'html5', vue: 'vuedotjs', 'vue.js': 'vuedotjs', vuejs: 'vuedotjs',
  next: 'nextdotjs', 'next.js': 'nextdotjs', nextjs: 'nextdotjs', node: 'nodedotjs', nodejs: 'nodedotjs', 'node.js': 'nodedotjs',
  three: 'threedotjs', 'three.js': 'threedotjs', threejs: 'threedotjs', postgres: 'postgresql', mongo: 'mongodb', aws: 'amazonaws',
  tailwind: 'tailwindcss', express: 'express', 'express.js': 'express', java: 'openjdk', golang: 'go', k8s: 'kubernetes', sklearn: 'scikitlearn',
  'scikit-learn': 'scikitlearn', d3: 'd3dotjs', 'd3.js': 'd3dotjs', 'chart.js': 'chartdotjs', 'socket.io': 'socketdotio', 'p5.js': 'p5dotjs', bash: 'gnubash',
  'google cloud': 'googlecloud', gcp: 'googlecloud', vs: 'jetbrains', 'react.js': 'react', reactjs: 'react', 'nuxt.js': 'nuxt', nuxtjs: 'nuxt',
}

export function findBrandIcon(name: string): Extract<ResolvedIcon, { type: 'brand' }> | null {
  const key = name.trim().toLowerCase()
  const slug = ALIASES[key]
  const row = (slug ? bySlug.get(slug) : undefined) ?? byName.get(norm(name))
  return row ? { type: 'brand', slug: row[0], title: row[1], hex: `#${row[2]}`, path: row[3] } : null
}

/** Résout une valeur d'icône stockée (`si:…`, `lucide:…`, URL) en icône affichable ; `null` si inconnue. */
export function resolveIcon(value: string | null | undefined): ResolvedIcon | null {
  const parsed = parseIconValue(value)
  if (!parsed) return null
  if (parsed.kind === 'lucide') return { type: 'lucide', name: parsed.key }
  if (parsed.kind === 'image') return { type: 'image', url: parsed.key }
  const row = bySlug.get(parsed.key)
  return row ? { type: 'brand', slug: row[0], title: row[1], hex: `#${row[2]}`, path: row[3] } : null
}

/** Recherche paginée dans la bibliothèque (sélecteur d'icônes de l'administration). */
export function searchBrandIcons(query: string, offset = 0, limit = 60): { total: number; items: { slug: string; title: string; hex: string; path: string }[] } {
  const q = norm(query)
  const matches = q ? rows.filter((r) => norm(r[1]).includes(q) || r[0].includes(q)) : rows
  return { total: matches.length, items: matches.slice(offset, offset + limit).map(([slug, title, hex, path]) => ({ slug, title, hex: `#${hex}`, path })) }
}

export const brandIconCount = rows.length
