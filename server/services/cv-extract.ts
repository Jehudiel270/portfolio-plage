const MAX_BYTES = 5 * 1024 * 1024

export class CvExtractError extends Error {}

/** Extrait le texte d'un CV (PDF, DOCX, TXT/MD). Le fichier n'est jamais stocké : il est lu en mémoire puis oublié. */
export async function extractCvText(file: { name: string; data: Uint8Array }): Promise<string> {
  if (file.data.byteLength > MAX_BYTES) throw new CvExtractError('Fichier trop volumineux (5 Mo maximum).')
  const name = file.name.toLowerCase()
  if (name.endsWith('.pdf')) {
    const { extractText, getDocumentProxy } = await import('unpdf')
    const pdf = await getDocumentProxy(new Uint8Array(file.data))
    if (pdf.numPages > 12) throw new CvExtractError('Ce PDF compte trop de pages pour un CV (12 maximum).')
    const { text } = await extractText(pdf, { mergePages: true })
    return text
  }
  if (name.endsWith('.docx')) {
    const mammoth = await import('mammoth')
    const { value } = await mammoth.extractRawText({ buffer: Buffer.from(file.data) })
    return value
  }
  if (name.endsWith('.txt') || name.endsWith('.md')) return new TextDecoder('utf-8').decode(file.data)
  throw new CvExtractError('Format non pris en charge : utilisez un PDF, un DOCX ou un fichier texte.')
}
