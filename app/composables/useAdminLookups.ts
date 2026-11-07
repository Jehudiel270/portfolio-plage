import type { CategoryScope } from '#shared/constants'
import type { ResolvedIcon } from '#shared/icons'

export interface AdminCategory { id: number; scope: CategoryScope; name: string; color: string | null; icon: string | null; iconPublicId: string | null; sortOrder: number; usage: number; isDemo: boolean }

/** Catégories (partagées entre les écrans d'administration, rechargées après chaque modification). */
export function useAdminCategories() {
  const items = useState<AdminCategory[]>('admin-categories', () => [])
  const loaded = useState('admin-categories-loaded', () => false)
  async function load(force = false): Promise<void> {
    if (loaded.value && !force) return
    items.value = (await adminFetch<{ items: AdminCategory[] }>('/api/admin/categories')).items
    loaded.value = true
  }
  const byScope = (scope: CategoryScope): AdminCategory[] => items.value.filter((c) => c.scope === scope)
  async function create(scope: CategoryScope, name: string): Promise<AdminCategory> {
    const { item } = await adminFetch<{ item: AdminCategory }>('/api/admin/categories', { method: 'POST', body: { scope, name, color: null, icon: null, iconPublicId: null, sortOrder: 0 } })
    await load(true)
    return items.value.find((c) => c.id === item.id) ?? item
  }
  return { items, load, byScope, create }
}

const resolved = new Map<string, ResolvedIcon | null>()
/** Résout des valeurs d'icône pour l'affichage dans l'administration (une requête groupée, résultats mémorisés). */
export async function resolveIconsForAdmin(values: (string | null | undefined)[]): Promise<Record<string, ResolvedIcon | null>> {
  const wanted = [...new Set(values.filter((v): v is string => Boolean(v)))]
  const missing = wanted.filter((v) => !resolved.has(v))
  if (missing.length) {
    const result = await adminFetch<Record<string, ResolvedIcon | null>>('/api/admin/icons/resolve', { query: { values: missing.join(',') } })
    for (const v of missing) resolved.set(v, result[v] ?? null)
  }
  return Object.fromEntries(wanted.map((v) => [v, resolved.get(v) ?? null]))
}
