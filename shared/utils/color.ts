/** Convertit `#rrggbb` en composantes normalisées [0..1] (valeurs attendues par les uniforms GLSL). */
export function hexToRgb01(hex: string): [number, number, number] {
  const clean = hex.replace('#', '')
  const value = Number.parseInt(clean.length === 3 ? clean.split('').map((c) => c + c).join('') : clean, 16)
  if (Number.isNaN(value)) return [1, 1, 1]
  return [((value >> 16) & 255) / 255, ((value >> 8) & 255) / 255, (value & 255) / 255]
}

export function isHexColor(value: string): boolean {
  return /^#[0-9a-fA-F]{6}$/.test(value)
}

/** Ajoute un canal alpha à une couleur hexadécimale (`rgba(...)`). */
export function hexToRgba(hex: string, alpha: number): string {
  const [r, g, b] = hexToRgb01(hex)
  return `rgba(${Math.round(r * 255)}, ${Math.round(g * 255)}, ${Math.round(b * 255)}, ${alpha})`
}
