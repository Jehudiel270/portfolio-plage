import { describe, expect, it } from 'vitest'
import { parseCvText } from '../../server/services/cv-parser'

const CV = `
Awa Koffi
Développeuse Full-Stack
awa.koffi@exemple.com | +229 97 00 11 22
Cotonou, Bénin
github.com/awakoffi · linkedin.com/in/awa-koffi

PROFIL
Développeuse passionnée par les interfaces claires et les API robustes.

EXPÉRIENCE PROFESSIONNELLE
Développeuse Full-Stack — Studio Horizon        Mars 2023 – Présent
Cotonou
• Conception d'une application de réservation en Nuxt
• Mise en place d'une API PostgreSQL

Stagiaire développeuse - Agence Atlas   06/2021 - 09/2021
• Intégration de maquettes Figma

FORMATION
Master Ingénierie logicielle — Université d'Abomey-Calavi   2022 – 2024
Licence Informatique, Université d'Abomey-Calavi   2019 - 2022

COMPÉTENCES
Langages : TypeScript, Python, PHP
Outils : Git, Docker, Figma

CERTIFICATIONS
• Certification Cloud - Organisme Exemple (2023)

LANGUES
Français (langue maternelle)
Anglais - B2

PROJETS
Atlas des marées
Application de suivi des marées pour les pêcheurs.
Technologies : Nuxt, Three.js
https://exemple.com/atlas
`

describe('lecture heuristique d’un CV', () => {
  const cv = parseCvText(CV)
  it('détecte l’en-tête, les coordonnées et les liens', () => {
    expect(cv.profile.name).toBe('Awa Koffi')
    expect(cv.profile.title).toBe('Développeuse Full-Stack')
    expect(cv.profile.email).toBe('awa.koffi@exemple.com')
    expect(cv.profile.phone).toContain('97 00 11 22')
    expect(cv.profile.links.map((l) => l.platform)).toEqual(expect.arrayContaining(['github', 'linkedin']))
    expect(cv.profile.about).toContain('interfaces claires')
  })
  it('découpe les expériences avec périodes et puces', () => {
    expect(cv.experiences).toHaveLength(2)
    const [first, second] = cv.experiences
    expect(first).toMatchObject({ title: 'Développeuse Full-Stack', organization: 'Studio Horizon', startDate: '2023-03-01', endDate: null, isCurrent: true })
    expect(first!.bullets).toHaveLength(2)
    expect(second).toMatchObject({ organization: 'Agence Atlas', startDate: '2021-06-01', endDate: '2021-09-01', isCurrent: false })
  })
  it('lit les formations, compétences, certifications, langues et projets', () => {
    expect(cv.education.map((e) => e.startDate)).toEqual(['2022-01-01', '2019-01-01'])
    expect(cv.skills.map((s) => s.name)).toEqual(expect.arrayContaining(['TypeScript', 'Docker', 'Figma']))
    expect(cv.skills.find((s) => s.name === 'Git')?.category).toBe('Outils')
    expect(cv.certifications[0]).toMatchObject({ name: 'Certification Cloud', issuer: 'Organisme Exemple', issuedAt: '2023-01-01' })
    expect(cv.languages.map((l) => l.name)).toEqual(['Français', 'Anglais'])
    expect(cv.projects[0]).toMatchObject({ title: 'Atlas des marées', technologies: ['Nuxt', 'Three.js'], url: 'https://exemple.com/atlas' })
  })
  it('signale ce qui n’a pas été détecté au lieu d’inventer', () => {
    const empty = parseCvText('Un texte sans aucune rubrique.')
    expect(empty.experiences).toEqual([])
    expect(empty.warnings.length).toBeGreaterThan(0)
  })
})
