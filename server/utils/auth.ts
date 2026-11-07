import type { H3Event } from 'h3'
import type { AdminPermissionGrant } from '../../shared/admin-permissions'
import { findValidSession, touchSession, deleteSessionByHash, createSession } from '../db/repositories/admin'
import { apiError } from './errors'
import { canAccessAdminApi } from './admin-access'

const SESSION_TTL_SECONDS = 7 * 24 * 3600
const SESSION_IDLE_TTL_MS = 60 * 60_000

export interface AdminContext {
  sessionId: string
  adminId: number
  email: string
  role: 'superadmin' | 'admin' | 'editor'
  permissions: AdminPermissionGrant[]
  totpEnabled: boolean
}

declare module 'h3' {
  interface H3EventContext { admin?: AdminContext | null }
}

function secret(): string {
  const value = useServerConfig().sessionSecret
  if (value.length < 32) throw apiError(503, 'SESSION_SECRET_MISSING', 'NUXT_SESSION_PASSWORD doit contenir au moins 32 caractères.')
  return value
}

const isHttps = (event: H3Event): boolean => getRequestProtocol(event, { xForwardedProto: true }) === 'https'
/** Le préfixe __Host- impose Secure + chemin « / » + aucun domaine : utilisé dès que la connexion est en HTTPS. */
const cookieName = (secure: boolean): string => (secure ? '__Host-portfolio_admin' : 'portfolio_admin')
export const hashSessionToken = (token: string): string => hmacHex(secret(), `session:${token}`)
export const csrfTokenFor = (sessionId: string): string => hmacHex(secret(), `csrf:${sessionId}`)

export async function startAdminSession(event: H3Event, admin: { id: number }): Promise<string> {
  const token = randomToken(32)
  const secure = isHttps(event)
  const session = await createSession(useDb(), {
    adminId: admin.id,
    tokenHash: hashSessionToken(token),
    expiresAt: new Date(Date.now() + SESSION_TTL_SECONDS * 1000),
    userAgent: getRequestHeader(event, 'user-agent'),
  })
  setCookie(event, cookieName(secure), token, { httpOnly: true, secure, sameSite: 'strict', path: '/', maxAge: SESSION_TTL_SECONDS })
  return session.id
}

function readToken(event: H3Event): string | undefined {
  return getCookie(event, cookieName(true)) ?? getCookie(event, cookieName(false))
}

/** Session administrateur courante (ou `null`). Le résultat est mémorisé pour la durée de la requête. */
export async function getAdminSession(event: H3Event): Promise<AdminContext | null> {
  if (event.context.admin !== undefined) return event.context.admin
  const token = readToken(event)
  let context: AdminContext | null = null
  if (token && isDatabaseConfigured()) {
    const found = await findValidSession(useDb(), hashSessionToken(token))
    if (found) {
      const idleFor = Date.now() - found.session.lastUsedAt.getTime()
      if (idleFor > SESSION_IDLE_TTL_MS) await endAdminSession(event)
      else {
        context = {
          sessionId: found.session.id, adminId: found.admin.id, email: found.admin.email,
          role: found.admin.role, permissions: found.admin.permissions, totpEnabled: found.admin.totpEnabled,
        }
        if (idleFor > 5 * 60_000) await touchSession(useDb(), found.session.id)
      }
    }
  }
  event.context.admin = context
  return context
}

/** Exige un administrateur authentifié ; pour les méthodes qui modifient des données, impose aussi l'origine et le jeton CSRF. */
export async function requireAdmin(event: H3Event): Promise<AdminContext> {
  const admin = await getAdminSession(event)
  if (!admin) throw apiError(401, 'UNAUTHENTICATED', 'Authentification requise.')
  const path = getRequestURL(event).pathname
  if (useServerConfig().isProduction && !admin.totpEnabled && ![
    '/api/admin/security/2fa/setup', '/api/admin/security/2fa/enable',
  ].includes(path)) {
    throw apiError(403, 'TOTP_SETUP_REQUIRED', 'Activez la vérification en deux étapes avant d’utiliser l’administration.')
  }
  if (!canAccessAdminApi(admin, path, event.method)) throw apiError(403, 'ADMIN_PERMISSION_REQUIRED', 'Votre compte ne dispose pas de l’autorisation requise.')
  if (!['GET', 'HEAD', 'OPTIONS'].includes(event.method)) assertSameOriginAndCsrf(event, admin)
  return admin
}

export function assertSameOriginAndCsrf(event: H3Event, admin: AdminContext): void {
  const origin = getRequestHeader(event, 'origin')
  if (origin) {
    const host = getRequestURL(event, { xForwardedHost: true }).host
    let originHost = ''
    try { originHost = new URL(origin).host } catch { /* origine invalide */ }
    if (originHost !== host) throw apiError(403, 'BAD_ORIGIN', 'Origine de la requête refusée.')
  }
  const sent = getRequestHeader(event, 'x-csrf-token') ?? ''
  if (!sent || !safeEqual(sent, csrfTokenFor(admin.sessionId))) throw apiError(403, 'BAD_CSRF', 'Jeton CSRF invalide ou manquant.')
}

export async function endAdminSession(event: H3Event): Promise<void> {
  const token = readToken(event)
  if (token && isDatabaseConfigured()) await deleteSessionByHash(useDb(), hashSessionToken(token))
  const secure = isHttps(event)
  deleteCookie(event, cookieName(secure), { httpOnly: true, secure, sameSite: 'strict', path: '/' })
  event.context.admin = null
}

/** Identifiant de limitation anonymisé : on ne stocke jamais l'adresse IP en clair. */
export function rateLimitKey(event: H3Event, scope: string, extra = ''): string {
  const ip = getRequestIP(event, { xForwardedFor: true }) ?? 'inconnue'
  return `${scope}:${sha256Hex(`${ip}|${extra}`)}`
}

/* Appareil de confiance : cookie signé posé après une connexion réussie. Il exempte le propriétaire du plafond de tentatives
 * par compte, afin que quelqu'un qui connaît son adresse e-mail ne puisse pas l'empêcher de se connecter. */
const DEVICE_TTL_SECONDS = 180 * 24 * 3600
const deviceCookie = (secure: boolean): string => (secure ? '__Host-portfolio_device' : 'portfolio_device')

export function issueTrustedDevice(event: H3Event, adminId: number): void {
  const secure = isHttps(event)
  const expires = Math.floor(Date.now() / 1000) + DEVICE_TTL_SECONDS
  const payload = `${adminId}.${expires}`
  setCookie(event, deviceCookie(secure), `${payload}.${hmacHex(secret(), `device:${payload}`)}`, { httpOnly: true, secure, sameSite: 'strict', path: '/', maxAge: DEVICE_TTL_SECONDS })
}

export function isTrustedDevice(event: H3Event, adminId: number): boolean {
  const value = getCookie(event, deviceCookie(true)) ?? getCookie(event, deviceCookie(false))
  const [id, expires, signature] = value?.split('.') ?? []
  if (!id || !expires || !signature || Number(id) !== adminId || Number(expires) < Date.now() / 1000) return false
  return safeEqual(signature, hmacHex(secret(), `device:${id}.${expires}`))
}

export const serverSecret = (): string => secret()
