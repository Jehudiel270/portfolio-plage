import type { SocialPlatform } from '../../shared/constants'

/**
 * Lecture heuristique d'un CV (texte brut) : détecte les rubriques, les périodes et les listes.
 * Aucune IA externe : le résultat est une PROPOSITION que l'administrateur relit et corrige avant tout import.
 */
export interface CvEntryDraft {
  title: string
  organization: string
  location: string
  startDate: string
  endDate: string | null
  isCurrent: boolean
  description: string
  bullets: string[]
  needsReview: boolean
}
export interface CvParseResult {
  profile: { name: string; title: string; email: string; phone: string; location: string; about: string; links: { platform: SocialPlatform; url: string }[] }
  experiences: CvEntryDraft[]
  education: CvEntryDraft[]
  skills: { name: string; category: string }[]
  certifications: { name: string; issuer: string; issuedAt: string; needsReview: boolean }[]
  languages: { name: string; level: string }[]
  projects: { title: string; description: string; technologies: string[]; url: string }[]
  warnings: string[]
}

const MONTHS: Record<string, number> = {
  jan: 1, janv: 1, janvier: 1, january: 1, fev: 2, fév: 2, fevr: 2, févr: 2, fevrier: 2, février: 2, feb: 2, february: 2, mar: 3, mars: 3, march: 3,
  avr: 4, avril: 4, apr: 4, april: 4, mai: 5, may: 5, jun: 6, juin: 6, june: 6, jul: 7, juil: 7, juillet: 7, july: 7, aou: 8, aout: 8, août: 8, aug: 8, august: 8,
  sep: 9, sept: 9, septembre: 9, september: 9, oct: 10, octobre: 10, october: 10, nov: 11, novembre: 11, november: 11, dec: 12, déc: 12, decembre: 12, décembre: 12, december: 12,
}
const MONTH_WORDS = '(?:janv?|f[ée]vr?|mars?|avr|avril|mai|juin|juil|juillet|ao[uû]t|sept?|oct|nov|d[ée]c|jan|feb|apr|may|jun|jul|aug|sep|[a-zéû]{3,9})\\.?'
const DATE = `(?:\\d{1,2}[/.]\\d{4}|${MONTH_WORDS}\\s+\\d{4}|(?:19|20)\\d{2})`
const NOW = '(?:pr[ée]sent|present|aujourd[’\']hui|actuel(?:lement)?|en cours|now|current|ce jour|to date)'
const RANGE = new RegExp(`(${DATE})\\s*(?:[-–—]|à|a|to|au|jusqu[’']?à)\\s*(${DATE}|${NOW})`, 'i')
const BULLET = /^\s*[•●▪◦·\-–—*►➢✓>]\s*/

function toIso(token: string): string {
  const t = token.trim().toLowerCase()
  const numeric = /^(\d{1,2})[/.](\d{4})$/.exec(t)
  if (numeric) return `${numeric[2]}-${String(Math.min(12, Math.max(1, Number(numeric[1])))).padStart(2, '0')}-01`
  const named = /^([a-zéû]+)\.?\s+(\d{4})$/.exec(t)
  if (named) {
    const month = MONTHS[named[1]!.normalize('NFD').replace(/[\u0300-\u036f]/g, '')] ?? MONTHS[named[1]!]
    if (month) return `${named[2]}-${String(month).padStart(2, '0')}-01`
    return `${named[2]}-01-01`
  }
  const year = /((?:19|20)\d{2})/.exec(t)
  return year ? `${year[1]}-01-01` : ''
}

const SECTION_PATTERNS: [keyof Omit<CvParseResult, 'profile' | 'warnings'> | 'about' | 'ignore', RegExp][] = [
  ['experiences', /^(exp[ée]riences?( professionnelles?)?|parcours professionnel|work experience|professional experience|employment( history)?|emplois?)$/i],
  ['education', /^(formations?( acad[ée]miques?)?|[ée]ducation|[ée]tudes?|parcours (scolaire|acad[ée]mique)|dipl[oô]mes?( et formations?)?|academic( background)?|studies)$/i],
  ['skills', /^(comp[ée]tences?( techniques?| cl[ée]s)?|skills|technical skills|technologies|outils|stack( technique)?|langages? et technologies|savoir-faire)$/i],
  ['certifications', /^(certifications?|certificats?|licences? et certifications?|attestations?|certifications? et formations? continues?)$/i],
  ['languages', /^(langues?|languages?|compétences linguistiques)$/i],
  ['projects', /^(projets?( personnels?| r[ée]alis[ée]s?)?|projects?|r[ée]alisations?|portfolio)$/i],
  ['about', /^(profil|r[ée]sum[ée]|[àa] propos|about( me)?|summary|objectif( professionnel)?|pr[ée]sentation)$/i],
  ['ignore', /^(centres? d[’']int[ée]r[eê]ts?|loisirs|hobbies|interests|r[ée]f[ée]rences?|informations? compl[ée]mentaires?|associatif|vie associative|b[ée]n[ée]volat)$/i],
]

function detectSection(line: string): (typeof SECTION_PATTERNS)[number][0] | null {
  const clean = line.replace(/[:：_=*#|]/g, '').replace(/\s+/g, ' ').trim()
  if (clean.length < 3 || clean.length > 46) return null
  for (const [name, pattern] of SECTION_PATTERNS) if (pattern.test(clean)) return name
  return null
}

const isBullet = (line: string): boolean => BULLET.test(line)
const stripBullet = (line: string): string => line.replace(BULLET, '').trim()
const SEPARATOR = /\s+[—–|·@]\s+|\s+-\s+|\s+chez\s+|\s+at\s+|\s{3,}/i

function platformOf(url: string): SocialPlatform {
  const host = (() => { try { return new URL(url).hostname.replace(/^www\./, '') } catch { return '' } })()
  const map: [string, SocialPlatform][] = [['linkedin.com', 'linkedin'], ['github.com', 'github'], ['gitlab.com', 'gitlab'], ['x.com', 'x'], ['twitter.com', 'x'], ['instagram.com', 'instagram'], ['youtube.com', 'youtube'], ['behance.net', 'behance'], ['dribbble.com', 'dribbble'], ['malt.fr', 'malt'], ['upwork.com', 'upwork'], ['facebook.com', 'facebook']]
  return map.find(([domain]) => host === domain || host.endsWith(`.${domain}`))?.[1] ?? 'website'
}

const URL_PATTERN = /(?:https?:\/\/|www\.|linkedin\.com\/in\/|github\.com\/)[^\s)>,;]+/gi
function extractLinks(text: string): CvParseResult['profile']['links'] {
  const seen = new Set<string>()
  const links: CvParseResult['profile']['links'] = []
  for (const match of text.matchAll(URL_PATTERN)) {
    const raw = match[0].replace(/[.)]+$/, '')
    const url = /^https?:\/\//i.test(raw) ? raw : `https://${raw}`
    if (seen.has(url)) continue
    seen.add(url)
    links.push({ platform: platformOf(url), url })
  }
  return links.slice(0, 8)
}

/** Découpe un bloc de rubrique en entrées, en s'appuyant sur les lignes contenant une période (ex. « 2021 – 2023 »). */
function parseDatedEntries(lines: string[]): CvEntryDraft[] {
  const anchors = lines.map((l, i) => (RANGE.test(l) ? i : -1)).filter((i) => i >= 0)
  if (!anchors.length) return []
  const starts = anchors.map((a, k) => {
    const floor = k === 0 ? 0 : anchors[k - 1]! + 1
    const line = lines[a]!
    const dateOnly = line.replace(RANGE, '').replace(/[()|,–—-]/g, '').trim().length < 3
    const prev = a - 1
    const before = lines[prev]?.trim() ?? ''
    const beforeBefore = prev - 1 >= floor ? (lines[prev - 1]?.trim() ?? '') : ''
    const prevIsTitle = prev >= floor && before !== '' && !isBullet(before) && before.length <= 110 && !RANGE.test(before) && (beforeBefore === '' || isBullet(beforeBefore) || prev - 1 < floor) && (dateOnly || !SEPARATOR.test(line.replace(RANGE, '')))
    return prevIsTitle ? prev : a
  })
  return anchors.map((a, k): CvEntryDraft => {
    const block = lines.slice(starts[k]!, k + 1 < anchors.length ? starts[k + 1]! : lines.length)
    const range = RANGE.exec(lines[a]!)!
    const endToken = range[2]!
    const isCurrent = new RegExp(`^${NOW}$`, 'i').test(endToken.trim())
    const header: string[] = []
    const bullets: string[] = []
    const prose: string[] = []
    let inBody = false
    for (const raw of block) {
      const line = raw.replace(RANGE, ' ').replace(/\s{2,}/g, '  ').trim()
      if (!line) { if (header.length) inBody = true; continue }
      if (isBullet(raw)) {
        bullets.push(stripBullet(raw))
        inBody = true
      } else if (!inBody && header.length < 3) {
        header.push(line.replace(/^[()|,–—-]+|[()|,–—-]+$/g, '').trim())
      } else {
        prose.push(line)
      }
    }
    const parts = header.flatMap((h) => h.split(SEPARATOR)).map((p) => p.trim()).filter(Boolean)
    const title = parts[0] ?? ''
    const organization = parts[1] ?? ''
    const location = parts[2] && parts[2].length <= 40 ? parts[2] : ''
    const startDate = toIso(range[1]!)
    const endDate = isCurrent ? null : toIso(endToken) || null
    return { title, organization, location, startDate, endDate, isCurrent, description: prose.join(' ').slice(0, 1500), bullets: bullets.slice(0, 20), needsReview: !title || !organization || !startDate }
  }).filter((e) => e.title || e.organization)
}

function parseSkills(lines: string[]): CvParseResult['skills'] {
  const out: CvParseResult['skills'] = []
  const seen = new Set<string>()
  for (const raw of lines) {
    const line = stripBullet(raw)
    if (!line) continue
    const labelled = /^([^:：]{2,40})[:：]\s*(.+)$/.exec(line)
    const category = labelled ? labelled[1]!.trim() : ''
    const items = (labelled ? labelled[2]! : line).split(/[,;•·|/]| - /).map((s) => s.replace(/\(.*?\)/g, '').trim()).filter((s) => s.length >= 1 && s.length <= 40 && s.split(/\s+/).length <= 4)
    for (const name of items) {
      const key = name.toLowerCase()
      if (seen.has(key)) continue
      seen.add(key)
      out.push({ name, category })
    }
  }
  return out.slice(0, 120)
}

function parseCertifications(lines: string[]): CvParseResult['certifications'] {
  return lines.map(stripBullet).filter((l) => l.length > 3).map((line) => {
    const year = /((?:19|20)\d{2})/.exec(line)
    const text = line.replace(/\(?\b(?:19|20)\d{2}\b\)?/, '').replace(/\s{2,}/g, ' ').replace(/[–—-]\s*$/, '').trim()
    const [name = text, issuer = ''] = text.split(SEPARATOR).map((p) => p.trim())
    return { name: name.slice(0, 160), issuer: issuer.slice(0, 160), issuedAt: year ? `${year[1]}-01-01` : '', needsReview: !year || !issuer }
  }).slice(0, 40)
}

function parseLanguages(lines: string[]): CvParseResult['languages'] {
  return lines.map(stripBullet).filter(Boolean).flatMap((l) => (l.includes(',') && !l.includes('(') ? l.split(',') : [l])).map((line) => {
    const m = /^([A-Za-zÀ-ÿ' -]{2,30}?)\s*(?:[-–—:(]\s*(.+?)\)?)?$/.exec(line.trim())
    return m ? { name: m[1]!.trim(), level: (m[2] ?? '').trim() } : null
  }).filter((l): l is { name: string; level: string } => l !== null).slice(0, 12)
}

function parseProjects(lines: string[]): CvParseResult['projects'] {
  const blocks: string[][] = []
  let current: string[] = []
  for (const line of lines) { if (!line.trim()) { if (current.length) blocks.push(current); current = [] } else current.push(line) }
  if (current.length) blocks.push(current)
  return blocks.map((block) => {
    const [first = '', ...rest] = block
    const techLine = rest.find((l) => /^(technologies?|stack|outils|tech)\s*[:：]/i.test(stripBullet(l)))
    const technologies = techLine ? stripBullet(techLine).replace(/^[^:：]+[:：]/, '').split(/[,;|/]/).map((s) => s.trim()).filter(Boolean).slice(0, 15) : []
    const url = extractLinks(block.join(' '))[0]?.url ?? ''
    return { title: stripBullet(first).replace(URL_PATTERN, '').split(SEPARATOR)[0]!.slice(0, 120), description: rest.filter((l) => l !== techLine).map(stripBullet).join(' ').replace(URL_PATTERN, '').slice(0, 800), technologies, url }
  }).filter((p) => p.title).slice(0, 20)
}

export function parseCvText(input: string): CvParseResult {
  const text = input.replace(/\r\n?/g, '\n').replace(/\t/g, '  ').replace(/\u00a0/g, ' ').replace(/[ \u200b]+\n/g, '\n')
  const lines = text.split('\n').map((l) => l.replace(/\s+$/, ''))
  const result: CvParseResult = { profile: { name: '', title: '', email: '', phone: '', location: '', about: '', links: [] }, experiences: [], education: [], skills: [], certifications: [], languages: [], projects: [], warnings: [] }

  const buckets: Record<string, string[]> = { head: [] }
  let current = 'head'
  for (const line of lines) {
    const section = detectSection(line)
    if (section && !RANGE.test(line)) { current = section; buckets[current] ??= []; continue }
    ;(buckets[current] ??= []).push(line)
  }

  // En-tête : coordonnées, nom et titre.
  const head = buckets.head!.filter((l) => l.trim())
  const all = lines.join('\n')
  result.profile.email = /[\w.+-]+@[\w-]+(?:\.[\w-]+)+/.exec(all)?.[0] ?? ''
  result.profile.phone = /(\+?\d[\d\s().-]{7,}\d)/.exec(head.join('\n'))?.[1]?.replace(/\s{2,}/g, ' ').trim() ?? ''
  result.profile.links = extractLinks(all)
  const looksLikeContact = (l: string): boolean => /@|https?:|www\.|\d{4,}|linkedin|github/i.test(l)
  const nameLine = head.find((l) => !looksLikeContact(l) && l.trim().split(/\s+/).length >= 2 && l.trim().split(/\s+/).length <= 5 && l.length <= 50)
  result.profile.name = nameLine?.trim() ?? ''
  const afterName = head.slice(nameLine ? head.indexOf(nameLine) + 1 : 0)
  result.profile.title = afterName.find((l) => !looksLikeContact(l) && l.length <= 90)?.trim() ?? ''
  result.profile.location = head.map((l) => /^(?:adresse\s*[:：]\s*)?([A-ZÉ][\p{L}' -]{2,30},\s*[A-ZÉ][\p{L}' -]{2,30})$/u.exec(l.trim())?.[1]).find(Boolean) ?? ''
  result.profile.about = (buckets.about ?? []).map((l) => l.trim()).filter(Boolean).join(' ').slice(0, 1500)

  const clean = (key: string): string[] => buckets[key] ?? []
  result.experiences = parseDatedEntries(clean('experiences'))
  result.education = parseDatedEntries(clean('education'))
  result.skills = parseSkills(clean('skills'))
  result.certifications = parseCertifications(clean('certifications'))
  result.languages = parseLanguages(clean('languages'))
  result.projects = parseProjects(clean('projects'))

  if (!result.profile.name) result.warnings.push('Le nom n’a pas été détecté.')
  if (!result.experiences.length) result.warnings.push('Aucune expérience n’a été détectée (rubrique ou périodes non reconnues).')
  if (!result.education.length) result.warnings.push('Aucune formation n’a été détectée.')
  if (!result.skills.length) result.warnings.push('Aucune compétence n’a été détectée.')
  if (result.experiences.some((e) => e.needsReview) || result.education.some((e) => e.needsReview)) result.warnings.push('Certaines entrées sont incomplètes : vérifiez-les avant d’importer.')
  return result
}
