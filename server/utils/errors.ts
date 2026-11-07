import type { H3Event } from 'h3'
import { z } from 'zod'

export interface ApiErrorData { code: string; details?: unknown }

/** Erreur API structurée : `message` lisible, `data.code` stable, aucun détail interne. */
export function apiError(statusCode: number, code: string, message: string, details?: unknown) {
  return createError({ statusCode, message, data: { code, details } satisfies ApiErrorData })
}

export function flattenIssues(error: z.ZodError): { path: string; message: string }[] {
  return error.issues.map((issue) => ({ path: issue.path.map(String).join('.'), message: issue.message }))
}

/** Lit et valide le corps JSON avec un schéma Zod ; renvoie 422 avec le détail champ par champ. */
export async function readBodyWith<S extends z.ZodType>(event: H3Event, schema: S): Promise<z.output<S>> {
  let raw: unknown
  try {
    raw = await readBody(event)
  } catch {
    throw apiError(400, 'INVALID_JSON', 'Le corps de la requête n’est pas un JSON valide.')
  }
  const result = schema.safeParse(raw)
  if (!result.success) throw apiError(422, 'VALIDATION_ERROR', 'Certaines valeurs sont invalides.', flattenIssues(result.error))
  return result.data
}

export function parseIdParam(event: H3Event, name = 'id'): number {
  const parsed = z.coerce.number().int().positive().safeParse(getRouterParam(event, name))
  if (!parsed.success) throw apiError(400, 'INVALID_ID', 'Identifiant invalide.')
  return parsed.data
}

/** Journalise côté serveur et renvoie une erreur 500 générique (jamais de trace ni de secret côté client). */
export function internalError(scope: string, error: unknown) {
  console.error(`[${scope}]`, error instanceof Error ? error.message : error)
  return apiError(500, 'INTERNAL_ERROR', 'Une erreur interne est survenue.')
}
