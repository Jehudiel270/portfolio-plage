import { z } from 'zod'
import type { ResolvedIcon } from '../../../../../shared/icons'
import { skills } from '../../../../db/schema'
import { findBrandIcon, resolveIcon } from '../../../../services/icons'
import { useDb } from '../../../../utils/db'

/** Reprend les mêmes icônes que les fiches publiques pendant la saisie des technologies. */
export default defineEventHandler(async (event) => {
  const { names } = z.object({ names: z.string().max(1300) }).parse(getQuery(event))
  const wanted = [...new Set(names.split(',').map((name) => name.trim()).filter(Boolean))].slice(0, 30)
  if (!wanted.length) return {}

  const wantedByKey = new Set(wanted.map((name) => name.toLowerCase()))
  const rows = await useDb().select({ name: skills.name, icon: skills.icon }).from(skills)
  const own = new Map(rows.filter((row) => wantedByKey.has(row.name.trim().toLowerCase())).map((row) => [row.name.trim().toLowerCase(), resolveIcon(row.icon)]))
  const result: Record<string, ResolvedIcon | null> = {}
  for (const name of wanted) result[name] = own.get(name.toLowerCase()) ?? findBrandIcon(name)
  return result
})
