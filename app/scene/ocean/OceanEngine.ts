import * as THREE from 'three'
import type { ResolvedIcon } from '#shared/icons'
import type { EffectsSettings, ThemeSettings } from '#shared/schemas/settings'
import { SKY_FRAGMENT, SKY_VERTEX, WATER_FRAGMENT, WATER_VERTEX, WAVES } from './shaders'

/* ---------------------------------------------------------------------------
 * Moteur 3D unique du site : un océan stylisé aux couleurs du thème.
 *  - mode « hero »    : décor de l'accueil (mer, ciel, soleil, petit voilier), lié au défilement ;
 *  - mode « explore » : compétences (bouées) ou projets (bouteilles) flottant sur la mer, navigables à la souris/au doigt.
 * Une seule direction visuelle, aucune post-production lourde.
 * ------------------------------------------------------------------------- */

export interface OceanItem { id: number; label: string; color: string | null; icon: ResolvedIcon | null }
export interface OceanOptions {
  canvas: HTMLCanvasElement
  mode: 'hero' | 'explore'
  theme: ThemeSettings
  effects: EffectsSettings
  reduced: boolean
  kind?: 'skills' | 'projects'
  items?: OceanItem[]
  onHover?: (hit: { id: number; x: number; y: number } | null) => void
  onPick?: (id: number) => void
}

const WAVE_DEFS = WAVES.map((w) => {
  const length = Math.hypot(w.dir[0], w.dir[1])
  const k = (2 * Math.PI) / w.length
  return { dx: w.dir[0] / length, dz: w.dir[1] / length, k, amp: w.amp, omega: Math.sqrt(9.81 * k) * 0.5 }
})

/** Même fonction de vagues que le shader : les objets flottants suivent exactement la surface. */
export function waveSample(x: number, z: number, time: number, height: number): { h: number; dx: number; dz: number } {
  let h = 0
  let dx = 0
  let dz = 0
  for (const w of WAVE_DEFS) {
    const phase = (w.dx * x + w.dz * z) * w.k + time * w.omega
    const a = w.amp * height
    h += a * Math.sin(phase)
    const c = a * w.k * Math.cos(phase)
    dx += c * w.dx
    dz += c * w.dz
  }
  return { h, dx, dz }
}

export function webglAvailable(): boolean {
  try { return Boolean(document.createElement('canvas').getContext('webgl2')) } catch { return false }
}

interface Floater { id: number; group: THREE.Group; baseX: number; baseZ: number; phase: number; hover: number; flag?: THREE.Object3D; mat: THREE.MeshStandardMaterial[] }

export class OceanEngine {
  private readonly renderer: THREE.WebGLRenderer
  private readonly scene = new THREE.Scene()
  private readonly camera = new THREE.PerspectiveCamera(50, 1, 0.1, 900)
  private readonly colors = { deep: new THREE.Color(), shallow: new THREE.Color(), sky: new THREE.Color(), sun: new THREE.Color(), accent: new THREE.Color(), primary: new THREE.Color() }
  private readonly uniforms: Record<string, THREE.IUniform>
  private readonly skyUniforms: Record<string, THREE.IUniform>
  private readonly sunDir = new THREE.Vector3(0.35, 0.3, -0.9)
  private readonly floaters: Floater[] = []
  private readonly disposables: { dispose(): void }[] = []
  private readonly raycaster = new THREE.Raycaster()
  private readonly pointer = new THREE.Vector2()
  private readonly hemi = new THREE.HemisphereLight(0xffffff, 0xffffff, 1)
  private readonly sunLight = new THREE.DirectionalLight(0xffffff, 1.4)
  private boat: THREE.Group | null = null
  private frameId = 0
  private last = 0
  private time = 2.5
  private scroll = 0
  private running = false
  private paused = false
  private dirty = true
  private pointerTarget = new THREE.Vector2()
  private pointerSmooth = new THREE.Vector2()
  private theta = 0.45
  private radius = 17
  private height = 8
  private dragging: { x: number; y: number; moved: number } | null = null
  private highlighted: number | null = null
  private hoverId: number | null = null
  private observer: ResizeObserver | null = null
  private readonly cleanups: (() => void)[] = []
  private width = 1
  private heightPx = 1

  constructor(private readonly options: OceanOptions) {
    const { canvas, mode } = options
    this.renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: false, powerPreference: 'default' })
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, options.effects.maxPixelRatio))
    this.renderer.outputColorSpace = THREE.SRGBColorSpace
    this.applyColors(options.theme)

    const waves = WAVE_DEFS.map((w) => new THREE.Vector4(w.dx, w.dz, w.k, w.amp))
    this.uniforms = {
      uTime: { value: 0 }, uHeight: { value: options.effects.waveHeight }, uWave: { value: waves }, uOmega: { value: WAVE_DEFS.map((w) => w.omega) },
      uSparkle: { value: options.effects.sparkles ? 1 : 0 }, uDeep: { value: this.colors.deep }, uShallow: { value: this.colors.shallow },
      uSky: { value: this.colors.sky }, uSun: { value: this.colors.sun }, uSunDir: { value: this.sunDir },
    }
    this.skyUniforms = { uTime: this.uniforms.uTime!, uSky: { value: this.colors.sky }, uSea: { value: this.colors.deep }, uSun: { value: this.colors.sun }, uSunDir: { value: this.sunDir } }

    const water = new THREE.Mesh(new THREE.PlaneGeometry(520, 520, 260, 260).rotateX(-Math.PI / 2), new THREE.ShaderMaterial({ vertexShader: WATER_VERTEX, fragmentShader: WATER_FRAGMENT, uniforms: this.uniforms }))
    water.frustumCulled = false
    const sky = new THREE.Mesh(new THREE.SphereGeometry(420, 32, 16), new THREE.ShaderMaterial({ vertexShader: SKY_VERTEX, fragmentShader: SKY_FRAGMENT, uniforms: this.skyUniforms, side: THREE.BackSide, depthWrite: false }))
    sky.frustumCulled = false
    sky.renderOrder = -1
    this.scene.add(sky, water, this.hemi, this.sunLight)
    this.disposables.push(water.geometry, water.material as THREE.Material, sky.geometry, sky.material as THREE.Material)

    if (mode === 'hero') this.buildBoat()
    else this.buildItems(options.items ?? [], options.kind ?? 'skills')
    this.applyEffects(options.effects)
    this.bind(canvas)
    this.resize()
  }

  /* ------------------------------------ Thème ------------------------------------ */
  private applyColors(theme: ThemeSettings): void {
    this.colors.deep.set(theme.seaDeep)
    this.colors.shallow.set(theme.seaShallow)
    this.colors.sky.set(theme.sky)
    this.colors.sun.set(theme.sun)
    this.colors.accent.set(theme.accent)
    this.colors.primary.set(theme.primary)
    this.hemi.color.copy(this.colors.sky).lerp(new THREE.Color(1, 1, 1), 0.5)
    this.hemi.groundColor.copy(this.colors.deep)
    this.sunLight.color.copy(this.colors.sun).lerp(new THREE.Color(1, 1, 1), 0.55)
  }
  setTheme(theme: ThemeSettings): void { this.applyColors(theme); this.dirty = true }

  applyEffects(effects: EffectsSettings): void {
    Object.assign(this.options.effects, effects)
    this.uniforms.uHeight!.value = effects.waveHeight
    this.uniforms.uSparkle!.value = effects.sparkles ? 1 : 0
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, effects.maxPixelRatio))
    this.dirty = true
  }

  /* ------------------------------------ Décor : voilier ------------------------------------ */
  private buildBoat(): void {
    const hullMat = new THREE.MeshStandardMaterial({ color: this.colors.accent, roughness: 0.55 })
    // Voiles éclairées par elles-mêmes : toujours claires, même à contre-jour (soleil derrière la scène).
    const sailMat = new THREE.MeshStandardMaterial({ color: 0xfff8ec, roughness: 0.85, side: THREE.DoubleSide, emissive: 0xfff1d6, emissiveIntensity: 0.6 })
    const woodMat = new THREE.MeshStandardMaterial({ color: 0x8a5a3c, roughness: 0.7 })
    const boat = new THREE.Group()
    const hull = new THREE.Mesh(new THREE.SphereGeometry(1, 20, 10, 0, Math.PI * 2, Math.PI / 2, Math.PI / 2).scale(1.7, 0.55, 0.62), hullMat)
    const mast = new THREE.Mesh(new THREE.CylinderGeometry(0.035, 0.045, 2.5, 8), woodMat)
    mast.position.set(0.1, 1.25, 0)
    const sail = (pts: number[]): THREE.Mesh => {
      const geometry = new THREE.BufferGeometry()
      geometry.setAttribute('position', new THREE.Float32BufferAttribute(pts, 3))
      geometry.computeVertexNormals()
      return new THREE.Mesh(geometry, sailMat)
    }
    const main = sail([0.14, 0.35, 0, 0.14, 2.35, 0, -1.25, 0.4, 0])
    const jib = sail([0.06, 0.4, 0, 0.06, 2.0, 0, 1.45, 0.38, 0])
    boat.add(hull, mast, main, jib)
    boat.scale.setScalar(1.25)
    this.boat = boat
    this.scene.add(boat)
    this.disposables.push(hullMat, sailMat, woodMat, hull.geometry, mast.geometry, main.geometry, jib.geometry)
  }

  /* ------------------------------------ Mode exploration ------------------------------------ */
  private buildItems(items: OceanItem[], kind: 'skills' | 'projects'): void {
    const perRing = 9
    items.forEach((item, index) => {
      const ring = Math.floor(index / perRing)
      const inRing = Math.min(perRing, items.length - ring * perRing)
      const angle = ((index % perRing) / inRing) * Math.PI * 2 + ring * 0.5
      const radius = 5.2 + ring * 3.4
      const floater = kind === 'skills' ? this.makeBuoy(item) : this.makeBottle(item)
      floater.baseX = Math.cos(angle) * radius
      floater.baseZ = Math.sin(angle) * radius
      floater.phase = index * 1.7
      this.floaters.push(floater)
      this.scene.add(floater.group)
    })
    this.hemi.intensity = 1.1
  }

  private flagTexture(item: OceanItem): THREE.CanvasTexture {
    const size = 160
    const canvas = document.createElement('canvas')
    canvas.width = canvas.height = size
    const ctx = canvas.getContext('2d')!
    ctx.fillStyle = '#ffffff'
    ctx.beginPath(); ctx.roundRect(6, 6, size - 12, size - 12, 28); ctx.fill()
    ctx.lineWidth = 6; ctx.strokeStyle = item.color ?? `#${this.colors.primary.getHexString()}`; ctx.stroke()
    const icon = item.icon
    if (icon?.type === 'brand') {
      ctx.save(); ctx.translate(size * 0.19, size * 0.19); ctx.scale((size * 0.62) / 24, (size * 0.62) / 24)
      ctx.fillStyle = icon.hex; ctx.fill(new Path2D(icon.path)); ctx.restore()
    } else {
      ctx.fillStyle = '#0e2a3b'; ctx.font = '700 64px system-ui, sans-serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'
      ctx.fillText(item.label.split(/\s+/).slice(0, 2).map((w) => w[0]?.toUpperCase() ?? '').join(''), size / 2, size / 2 + 4)
    }
    const texture = new THREE.CanvasTexture(canvas)
    texture.colorSpace = THREE.SRGBColorSpace
    this.disposables.push(texture)
    return texture
  }

  private makeBuoy(item: OceanItem): Floater {
    const group = new THREE.Group()
    const color = new THREE.Color(item.color ?? `#${this.colors.accent.getHexString()}`)
    const bodyMat = new THREE.MeshStandardMaterial({ color, roughness: 0.4 })
    const bandMat = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.4 })
    const poleMat = new THREE.MeshStandardMaterial({ color: 0xf4efe6, roughness: 0.6 })
    const body = new THREE.Mesh(new THREE.SphereGeometry(0.62, 28, 18), bodyMat)
    const band = new THREE.Mesh(new THREE.TorusGeometry(0.63, 0.1, 10, 36).rotateX(Math.PI / 2), bandMat)
    const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.045, 0.045, 1.3, 8), poleMat)
    pole.position.y = 1.2
    const flagMat = new THREE.MeshBasicMaterial({ map: this.flagTexture(item), side: THREE.DoubleSide, transparent: true })
    const flag = new THREE.Mesh(new THREE.PlaneGeometry(0.95, 0.95), flagMat)
    flag.position.set(0, 2.15, 0)
    flag.userData.itemId = item.id
    body.userData.itemId = item.id
    band.userData.itemId = item.id
    group.add(body, band, pole, flag)
    this.disposables.push(bodyMat, bandMat, poleMat, flagMat, body.geometry, band.geometry, pole.geometry, flag.geometry)
    return { id: item.id, group, baseX: 0, baseZ: 0, phase: 0, hover: 0, flag, mat: [bodyMat, bandMat] }
  }

  private makeBottle(item: OceanItem): Floater {
    const group = new THREE.Group()
    const tint = new THREE.Color(item.color ?? `#${this.colors.shallow.getHexString()}`)
    const glassMat = new THREE.MeshStandardMaterial({ color: new THREE.Color(0xd8f6f1).lerp(tint, 0.25), transparent: true, opacity: 0.55, roughness: 0.08, metalness: 0.1 })
    const paperMat = new THREE.MeshStandardMaterial({ color: new THREE.Color(0xfff3d6).lerp(tint, 0.18), roughness: 0.9 })
    const corkMat = new THREE.MeshStandardMaterial({ color: 0xb98a5a, roughness: 0.9 })
    const body = new THREE.Mesh(new THREE.CylinderGeometry(0.36, 0.36, 1.35, 20).rotateZ(Math.PI / 2), glassMat)
    const neck = new THREE.Mesh(new THREE.CylinderGeometry(0.13, 0.28, 0.5, 16).rotateZ(Math.PI / 2), glassMat)
    neck.position.x = 0.9
    const cork = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.1, 0.16, 12).rotateZ(Math.PI / 2), corkMat)
    cork.position.x = 1.22
    const scroll = new THREE.Mesh(new THREE.CylinderGeometry(0.16, 0.16, 0.95, 14).rotateZ(Math.PI / 2), paperMat)
    scroll.position.x = -0.05
    for (const mesh of [body, neck, cork, scroll]) mesh.userData.itemId = item.id
    group.add(body, neck, cork, scroll)
    group.scale.setScalar(1.15)
    this.disposables.push(glassMat, paperMat, corkMat, body.geometry, neck.geometry, cork.geometry, scroll.geometry)
    return { id: item.id, group, baseX: 0, baseZ: 0, phase: 0, hover: 0, mat: [glassMat, paperMat] }
  }

  /* ------------------------------------ Interaction ------------------------------------ */
  private bind(canvas: HTMLCanvasElement): void {
    const listen = <K extends keyof HTMLElementEventMap>(type: K, handler: (event: HTMLElementEventMap[K]) => void, target: HTMLElement = canvas): void => {
      target.addEventListener(type, handler as EventListener, { passive: type !== 'wheel' })
      this.cleanups.push(() => target.removeEventListener(type, handler as EventListener))
    }
    const toNdc = (event: PointerEvent | MouseEvent): void => {
      const rect = canvas.getBoundingClientRect()
      this.pointer.set(((event.clientX - rect.left) / rect.width) * 2 - 1, -((event.clientY - rect.top) / rect.height) * 2 + 1)
    }
    if (this.options.mode === 'hero') {
      const onMove = (event: PointerEvent): void => { this.pointerTarget.set((event.clientX / window.innerWidth - 0.5) * 2, (event.clientY / window.innerHeight - 0.5) * 2) }
      window.addEventListener('pointermove', onMove, { passive: true })
      this.cleanups.push(() => window.removeEventListener('pointermove', onMove))
    } else {
      listen('pointerdown', (e) => { this.dragging = { x: e.clientX, y: e.clientY, moved: 0 }; canvas.setPointerCapture(e.pointerId) })
      listen('pointermove', (e) => {
        toNdc(e)
        if (this.dragging) {
          this.theta -= (e.clientX - this.dragging.x) * 0.006
          this.height = THREE.MathUtils.clamp(this.height + (e.clientY - this.dragging.y) * 0.03, 3.2, 15)
          this.dragging.moved += Math.abs(e.clientX - this.dragging.x) + Math.abs(e.clientY - this.dragging.y)
          this.dragging.x = e.clientX; this.dragging.y = e.clientY
        } else this.updateHover(e)
        this.dirty = true
      })
      listen('pointerup', (e) => {
        const moved = this.dragging?.moved ?? 99
        this.dragging = null
        if (moved < 6) { toNdc(e); const hit = this.pick(); if (hit !== null) this.options.onPick?.(hit) }
      })
      listen('pointerleave', () => { this.setHover(null, 0, 0) })
      listen('wheel', (e) => { e.preventDefault(); this.radius = THREE.MathUtils.clamp(this.radius + e.deltaY * 0.012, 9, 28); this.dirty = true })
      listen('keydown', (e) => { if (e.key === 'ArrowLeft') this.theta += 0.12; if (e.key === 'ArrowRight') this.theta -= 0.12; this.dirty = true })
    }
    this.observer = new ResizeObserver(() => this.resize())
    this.observer.observe(canvas)
  }

  private pick(): number | null {
    this.raycaster.setFromCamera(this.pointer, this.camera)
    const hit = this.raycaster.intersectObjects(this.floaters.map((f) => f.group), true)[0]
    return (hit?.object.userData.itemId as number | undefined) ?? null
  }
  private updateHover(event: PointerEvent): void {
    const id = this.pick()
    const rect = this.options.canvas.getBoundingClientRect()
    this.setHover(id, event.clientX - rect.left, event.clientY - rect.top)
  }
  private setHover(id: number | null, x: number, y: number): void {
    this.options.canvas.classList.toggle('is-hover', id !== null)
    if (id !== this.hoverId) { this.hoverId = id; this.dirty = true }
    this.options.onHover?.(id === null ? null : { id, x, y })
  }

  /** Met en avant un élément (survol clavier ou liste). */
  highlight(id: number | null): void { this.highlighted = id; this.dirty = true }

  setScroll(progress: number): void { this.scroll = THREE.MathUtils.clamp(progress, 0, 1); this.dirty = true }
  setPaused(paused: boolean): void { this.paused = paused }

  /* ------------------------------------ Boucle ------------------------------------ */
  resize(): void {
    const { canvas } = this.options
    this.width = Math.max(1, canvas.clientWidth)
    this.heightPx = Math.max(1, canvas.clientHeight)
    this.renderer.setSize(this.width, this.heightPx, false)
    this.camera.aspect = this.width / this.heightPx
    this.camera.fov = this.camera.aspect < 0.8 ? 66 : 50
    this.camera.updateProjectionMatrix()
    this.dirty = true
  }

  start(): void {
    if (this.running) return
    this.running = true
    this.last = performance.now()
    const loop = (now: number): void => {
      if (!this.running) return
      this.frameId = requestAnimationFrame(loop)
      if (this.paused || document.hidden) { this.last = now; return }
      const dt = Math.min(0.05, (now - this.last) / 1000)
      this.last = now
      this.frame(dt)
    }
    this.frameId = requestAnimationFrame(loop)
  }
  stop(): void { this.running = false; cancelAnimationFrame(this.frameId) }

  private frame(dt: number): void {
    const { reduced, effects, mode } = this.options
    const animate = !reduced
    if (animate) this.time += dt * effects.waveSpeed
    if (!animate && !this.dirty) return
    this.dirty = false
    this.uniforms.uTime!.value = this.time

    if (mode === 'hero') {
      const elevation = THREE.MathUtils.lerp(0.34, 0.07, this.scroll)
      this.sunDir.set(0.38, Math.sin(elevation), -0.92).normalize()
      this.sunLight.position.copy(this.sunDir).multiplyScalar(60)
      this.pointerSmooth.lerp(this.pointerTarget, animate ? Math.min(1, dt * 2.5) : 1)
      this.camera.position.set(this.pointerSmooth.x * 0.9, 2.5 - this.scroll * 0.7 + this.pointerSmooth.y * -0.25, 13 - this.scroll * 3)
      this.camera.lookAt(this.pointerSmooth.x * 0.4, 1.4 + this.scroll * 2.4, -30)
      if (this.boat) {
        // Le voilier dérive dans la moitié droite de l'écran : il ne passe jamais derrière le texte d'accueil.
        const x = animate ? 8.5 + Math.sin(this.time * 0.12) * 4.5 : 9
        const z = -9.5
        const s = waveSample(x, z, this.time, effects.waveHeight)
        this.boat.position.set(x, s.h - 0.18, z)
        this.boat.rotation.set(Math.atan2(s.dz, 1) * 0.8, 0.12, -Math.atan2(s.dx, 1) * 0.8)
      }
    } else {
      this.sunDir.set(0.45, 0.62, -0.5).normalize()
      this.sunLight.position.copy(this.sunDir).multiplyScalar(60)
      if (animate && !this.dragging && this.hoverId === null && this.highlighted === null) this.theta += dt * 0.05
      this.camera.position.set(Math.sin(this.theta) * this.radius, this.height, Math.cos(this.theta) * this.radius)
      this.camera.lookAt(0, 0.9, 0)
      for (const f of this.floaters) {
        const s = waveSample(f.baseX, f.baseZ, this.time, effects.waveHeight)
        const bobX = animate ? Math.sin(this.time * 0.8 + f.phase) * 0.14 : 0
        const bobZ = animate ? Math.cos(this.time * 0.7 + f.phase) * 0.14 : 0
        const target = f.id === this.hoverId || f.id === this.highlighted ? 1 : 0
        f.hover += (target - f.hover) * Math.min(1, dt * 10 + (animate ? 0 : 1))
        f.group.position.set(f.baseX + bobX, s.h - 0.15 + f.hover * 0.25, f.baseZ + bobZ)
        f.group.rotation.set(Math.atan2(s.dz, 1) * 0.9, f.flag ? 0 : this.time * 0.1 + f.phase, -Math.atan2(s.dx, 1) * 0.9)
        f.group.scale.setScalar((f.flag ? 1 : 1.15) * (1 + f.hover * 0.14))
        f.flag?.lookAt(this.camera.position.x, f.group.position.y + 2.15, this.camera.position.z)
        for (const m of f.mat) m.emissive.setScalar(f.hover * 0.28)
      }
      if (!animate) this.dirty = this.floaters.some((f) => Math.abs((f.id === this.hoverId || f.id === this.highlighted ? 1 : 0) - f.hover) > 0.01)
    }
    this.renderer.render(this.scene, this.camera)
  }

  dispose(): void {
    this.stop()
    this.observer?.disconnect()
    for (const clean of this.cleanups) clean()
    for (const d of this.disposables) d.dispose()
    for (const f of this.floaters) f.group.clear()
    this.renderer.dispose()
    this.renderer.forceContextLoss()
  }
}
