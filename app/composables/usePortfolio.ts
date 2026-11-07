import type { PublicPortfolio, Selection } from '#shared/types/portfolio'

/** Données publiques du portfolio, chargées par le middleware `portfolio.global` (Neon via l'API serveur). */
export const usePortfolio = (): ComputedRef<PublicPortfolio> => {
  const state = useState<PublicPortfolio | null>('portfolio', () => null)
  return computed(() => state.value as PublicPortfolio)
}

/** Textes de l'interface : valeurs par défaut + remplacements saisis dans l'administration. */
export function useUi() {
  const portfolio = usePortfolio()
  const t = (key: string, vars: Record<string, string | number> = {}): string => {
    let value = portfolio.value?.settings.labels[key] ?? key
    for (const [name, replacement] of Object.entries(vars)) value = value.replaceAll(`{${name}}`, String(replacement))
    return value
  }
  return { t }
}

export const useSelection = () => useState<Selection | null>('selection', () => null)
export const useExplore = () => useState<'skills' | 'projects' | null>('explore', () => null)

/** Préférence d'animation : « auto » suit le système ; l'utilisateur peut forcer réduit ou complet (mémorisé). */
export function useMotion() {
  const preference = useState<'auto' | 'reduced' | 'full'>('motion', () => 'auto')
  const systemReduced = useState('motion-system', () => false)
  const portfolio = usePortfolio()
  const reduced = computed(() => preference.value === 'reduced' || (preference.value === 'auto' && systemReduced.value) || portfolio.value?.settings.effects.animations === false)
  function set(value: 'auto' | 'reduced' | 'full'): void {
    preference.value = value
    if (import.meta.client) localStorage.setItem('portfolio:motion', value)
  }
  return { preference, reduced, set, systemReduced }
}
