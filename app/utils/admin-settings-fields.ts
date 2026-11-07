export interface EffectField { key: string; label: string; type: 'range' | 'boolean'; min?: number; max?: number; step?: number; hint?: string }

export const EFFECT_FIELDS: EffectField[] = [
  { key: 'hero3d', label: 'Océan 3D sur l’accueil', type: 'boolean', hint: 'Désactivé : l’accueil garde un dégradé ciel/mer en CSS, sans WebGL.' },
  { key: 'waveHeight', label: 'Hauteur des vagues', type: 'range', min: 0.2, max: 2, step: 0.1, hint: '1 = calme. Vaut aussi pour l’exploration 3D.' },
  { key: 'waveSpeed', label: 'Vitesse des vagues', type: 'range', min: 0, max: 2, step: 0.1, hint: '0 = mer figée.' },
  { key: 'sparkles', label: 'Reflets du soleil sur l’eau', type: 'boolean' },
  { key: 'maxPixelRatio', label: 'Résolution maximale', type: 'range', min: 1, max: 2.5, step: 0.25, hint: 'Plus bas = plus fluide sur écrans haute densité.' },
  { key: 'animations', label: 'Animations d’apparition au défilement', type: 'boolean', hint: 'Le visiteur peut toujours les réduire depuis les réglages d’affichage.' },
]
