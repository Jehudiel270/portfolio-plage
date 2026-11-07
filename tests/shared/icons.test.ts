import { describe, expect, it } from 'vitest'
import { contrastRatio, isValidIconValue, parseIconValue } from '../../shared/icons'
import { DEMO_SKILLS } from '../../shared/demo/demo-content'
import { findBrandIcon, resolveIcon, searchBrandIcons } from '../../server/services/icons'

describe('icônes', () => {
  it('valide les trois formats et refuse le reste', () => {
    for (const ok of [null, '', 'si:typescript', 'lucide:Code', 'https://res.cloudinary.com/x/image/upload/a.png']) expect(isValidIconValue(ok)).toBe(true)
    for (const bad of ['javascript:alert(1)', 'lucide:Inconnue', 'si:Not Valid', 'data:image/svg+xml,<svg onload=alert(1)>', 'ftp://x/y.png']) expect(isValidIconValue(bad)).toBe(false)
    expect(parseIconValue('si:vuedotjs')).toEqual({ kind: 'brand', key: 'vuedotjs' })
  })
  it('retrouve l’icône d’une technologie par son nom d’usage', () => {
    expect(findBrandIcon('Vue.js')?.slug).toBe('vuedotjs')
    expect(findBrandIcon('node')?.slug).toBe('nodedotjs')
    expect(findBrandIcon('C++')?.slug).toBe('cplusplus')
    expect(findBrandIcon('Tailwind CSS')?.slug).toBe('tailwindcss')
    expect(findBrandIcon('Techno inconnue 42')).toBeNull()
  })
  it('résout les icônes stockées (marque, générique, image) et ignore les inconnues', () => {
    expect(resolveIcon('si:typescript')).toMatchObject({ type: 'brand', hex: expect.stringMatching(/^#[0-9a-f]{6}$/i) })
    expect(resolveIcon('lucide:Waves')).toEqual({ type: 'lucide', name: 'Waves' })
    expect(resolveIcon('https://exemple.com/a.png')).toEqual({ type: 'image', url: 'https://exemple.com/a.png' })
    expect(resolveIcon('si:nexistepas')).toBeNull()
    expect(resolveIcon(null)).toBeNull()
  })
  it('toutes les icônes de la démo existent dans la bibliothèque', () => {
    for (const skill of DEMO_SKILLS) expect(resolveIcon(skill.icon), skill.name).not.toBeNull()
  })
  it('recherche paginée et contraste WCAG', () => {
    expect(searchBrandIcons('vue').items.some((i) => i.slug === 'vuedotjs')).toBe(true)
    expect(searchBrandIcons('', 0, 10).items).toHaveLength(10)
    expect(contrastRatio('#000000', '#ffffff')).toBeCloseTo(21, 0)
  })
})
