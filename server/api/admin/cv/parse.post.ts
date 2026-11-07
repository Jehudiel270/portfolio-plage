import { hitRateLimit } from '../../../db/repositories/rate-limit'
import { CvExtractError, extractCvText } from '../../../services/cv-extract'
import { parseCvText } from '../../../services/cv-parser'

/** Analyse un CV (PDF, DOCX, TXT ou texte collé) et renvoie une PROPOSITION de contenu. Rien n'est stocké ni importé ici. */
export default defineEventHandler(async (event) => {
  const admin = await requireAdmin(event)
  if ((await hitRateLimit(useDb(), `cv:${admin.adminId}`, 600)) > 12) throw apiError(429, 'TOO_MANY_REQUESTS', 'Trop d’analyses : patientez quelques minutes.')
  assertBodySize(event, 6_000_000)
  const form = await readMultipartFormData(event)
  let text = ''
  const file = form?.find((part) => part.name === 'file' && part.filename)
  const pasted = form?.find((part) => part.name === 'text')
  try {
    if (file?.filename) text = await extractCvText({ name: file.filename, data: file.data })
    else if (pasted) text = pasted.data.toString('utf8').slice(0, 60_000)
  } catch (error) {
    if (error instanceof CvExtractError) throw apiError(422, 'CV_UNSUPPORTED', error.message)
    throw apiError(422, 'CV_UNREADABLE', 'Ce fichier n’a pas pu être lu. Essayez de coller le texte du CV.')
  }
  if (text.trim().length < 40) throw apiError(422, 'CV_EMPTY', 'Aucun texte exploitable : s’il s’agit d’un PDF scanné (image), collez le texte du CV à la place.')
  return { ok: true, characters: text.length, result: parseCvText(text) }
})
