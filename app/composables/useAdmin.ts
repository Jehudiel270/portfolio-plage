import type { AdminPermissionGrant } from '#shared/admin-permissions'

export interface AdminSession {
  authenticated: boolean
  databaseConfigured?: boolean
  totpRequired?: boolean
  passwordMinLength?: number
  user?: { id?: number; email: string; role: string; permissions?: AdminPermissionGrant[]; totpEnabled?: boolean }
  csrfToken?: string
}

export const useAdminSession = () => useState<AdminSession | null>('admin-session', () => null)

/** Appel d'API d'administration : cookie de session + jeton CSRF (en-tête) pour les méthodes qui modifient des données. */
export interface AdminFetchOptions { method?: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE'; body?: object; query?: Record<string, unknown> }

export function adminFetch<T>(url: string, options: AdminFetchOptions = {}): Promise<T> {
  const session = useAdminSession()
  // URL dynamiques : on évite l'inférence de routes typées de Nitro (profondeur de types excessive).
  const call = $fetch as unknown as (target: string, init: Record<string, unknown>) => Promise<T>
  return call(url, { ...options, headers: { 'x-csrf-token': session.value?.csrfToken ?? '' } })
}

export interface ParsedApiError { message: string; code?: string; fields: Record<string, string> }

export function parseApiError(error: unknown): ParsedApiError {
  const payload = (error as { data?: { message?: string; data?: { code?: string; details?: { path: string; message: string }[] } } })?.data
  const fields: Record<string, string> = {}
  for (const detail of payload?.data?.details ?? []) if (detail?.path && !fields[detail.path]) fields[detail.path] = detail.message
  const fallback = error instanceof Error ? error.message : 'Une erreur est survenue.'
  return { message: payload?.message ?? fallback, code: payload?.data?.code, fields }
}

export async function refreshAdminSession(): Promise<AdminSession> {
  const session = useAdminSession()
  try {
    session.value = await $fetch<AdminSession>('/api/admin/auth/session')
  } catch {
    session.value = { authenticated: false }
  }
  return session.value
}

export async function adminLogout(): Promise<void> {
  try { await adminFetch('/api/admin/auth/logout', { method: 'POST' }) } catch { /* la session est de toute façon vidée localement */ }
  useAdminSession().value = { authenticated: false }
  await navigateTo('/admin/login')
}

/* Notifications ------------------------------------------------------------------- */
export interface Toast { id: number; tone: 'ok' | 'error' | 'info'; text: string }
let toastId = 0

export function useToasts() {
  const toasts = useState<Toast[]>('admin-toasts', () => [])
  function push(text: string, tone: Toast['tone'] = 'ok'): void {
    const id = (toastId += 1)
    toasts.value = [...toasts.value, { id, tone, text }]
    setTimeout(() => { toasts.value = toasts.value.filter((t) => t.id !== id) }, tone === 'error' ? 7000 : 4000)
  }
  return { toasts, push, ok: (t: string) => push(t, 'ok'), error: (t: string) => push(t, 'error') }
}
