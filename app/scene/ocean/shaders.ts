/** Shaders GLSL de l'océan stylisé (eau, ciel). Une seule direction visuelle : douce, claire, aux couleurs du thème. */

export const WAVES = [
  { dir: [1.0, 0.25], length: 15, amp: 0.34 },
  { dir: [-0.45, 0.9], length: 9, amp: 0.2 },
  { dir: [0.75, -0.55], length: 5.2, amp: 0.12 },
  { dir: [0.15, 1.0], length: 2.7, amp: 0.06 },
] as const

export const WATER_VERTEX = /* glsl */ `
uniform float uTime;
uniform float uHeight;
uniform vec4 uWave[4];
uniform float uOmega[4];
varying vec3 vWorld;
varying vec3 vNormalW;
varying float vH;
void main() {
  vec3 p = position;
  float h = 0.0; float dx = 0.0; float dz = 0.0;
  for (int i = 0; i < 4; i++) {
    float a = uWave[i].w * uHeight;
    float phase = dot(uWave[i].xy, p.xz) * uWave[i].z + uTime * uOmega[i];
    h += a * sin(phase);
    float c = a * uWave[i].z * cos(phase);
    dx += c * uWave[i].x;
    dz += c * uWave[i].y;
  }
  p.y += h;
  vH = h / (0.75 * max(uHeight, 0.05));
  vec4 world = modelMatrix * vec4(p, 1.0);
  vWorld = world.xyz;
  vNormalW = normalize(vec3(-dx, 1.0, -dz));
  gl_Position = projectionMatrix * viewMatrix * world;
}`

export const WATER_FRAGMENT = /* glsl */ `
uniform float uTime;
uniform float uSparkle;
uniform vec3 uDeep;
uniform vec3 uShallow;
uniform vec3 uSky;
uniform vec3 uSun;
uniform vec3 uSunDir;
varying vec3 vWorld;
varying vec3 vNormalW;
varying float vH;
float hash(vec2 p) { p = fract(p * vec2(123.34, 456.21)); p += dot(p, p + 45.32); return fract(p.x * p.y); }
float noise(vec2 p) { vec2 i = floor(p); vec2 f = fract(p); f = f * f * (3.0 - 2.0 * f); return mix(mix(hash(i), hash(i + vec2(1, 0)), f.x), mix(hash(i + vec2(0, 1)), hash(i + vec2(1, 1)), f.x), f.y); }
void main() {
  vec3 viewDir = normalize(cameraPosition - vWorld);
  vec3 n = normalize(vNormalW + vec3(noise(vWorld.xz * 1.7 + uTime * 0.25) - 0.5, 0.0, noise(vWorld.xz * 1.9 - uTime * 0.2) - 0.5) * 0.12);
  float fresnel = pow(1.0 - max(dot(n, viewDir), 0.0), 3.0);
  float depthMix = clamp(vH * 0.5 + 0.55, 0.0, 1.0);
  vec3 base = mix(uDeep, uShallow, depthMix * 0.75 + 0.1);
  vec3 reflected = reflect(-viewDir, n);
  vec3 horizon = mix(uSky, vec3(1.0), 0.4);
  vec3 skyColor = mix(horizon, uSky, clamp(reflected.y * 1.6, 0.0, 1.0));
  vec3 col = mix(base, skyColor, clamp(fresnel * 0.85 + 0.06, 0.0, 1.0));
  float sunAlign = max(dot(reflected, normalize(uSunDir)), 0.0);
  col += uSun * (pow(sunAlign, 260.0) * 2.0 + pow(sunAlign, 28.0) * 0.18);
  float glitter = step(0.972, noise(vWorld.xz * 6.5 + uTime * 0.7)) * pow(sunAlign, 6.0);
  col += uSun * glitter * 1.4 * uSparkle;
  float foam = smoothstep(0.62, 0.98, vH + (noise(vWorld.xz * 3.2 + uTime * 0.3) - 0.5) * 0.35);
  col = mix(col, vec3(1.0), foam * 0.5);
  float dist = length(vWorld - cameraPosition);
  col = mix(col, horizon, smoothstep(38.0, 190.0, dist));
  gl_FragColor = vec4(col, 1.0);
  #include <colorspace_fragment>
}`

export const SKY_VERTEX = /* glsl */ `
varying vec3 vDir;
void main() {
  vDir = normalize(position);
  vec4 p = projectionMatrix * mat4(mat3(modelViewMatrix)) * vec4(position, 1.0);
  gl_Position = p.xyww;
}`

export const SKY_FRAGMENT = /* glsl */ `
uniform float uTime;
uniform vec3 uSky;
uniform vec3 uSea;
uniform vec3 uSun;
uniform vec3 uSunDir;
varying vec3 vDir;
float hash(vec2 p) { p = fract(p * vec2(123.34, 456.21)); p += dot(p, p + 45.32); return fract(p.x * p.y); }
float noise(vec2 p) { vec2 i = floor(p); vec2 f = fract(p); f = f * f * (3.0 - 2.0 * f); return mix(mix(hash(i), hash(i + vec2(1, 0)), f.x), mix(hash(i + vec2(0, 1)), hash(i + vec2(1, 1)), f.x), f.y); }
float fbm(vec2 p) { float v = 0.0; float a = 0.5; for (int i = 0; i < 4; i++) { v += a * noise(p); p *= 2.05; a *= 0.5; } return v; }
void main() {
  vec3 d = normalize(vDir);
  vec3 horizon = mix(uSky, vec3(1.0), 0.45);
  vec3 zenith = mix(uSky, uSea, 0.28);
  vec3 col = mix(horizon, zenith, smoothstep(0.0, 0.62, d.y));
  float sunDot = max(dot(d, normalize(uSunDir)), 0.0);
  col += uSun * (pow(sunDot, 36.0) * 0.42 + pow(sunDot, 7.0) * 0.12);
  col = mix(col, uSun, smoothstep(0.99935, 0.99975, sunDot));
  float cloudMask = smoothstep(0.02, 0.2, d.y) * (1.0 - smoothstep(0.45, 0.8, d.y));
  float clouds = smoothstep(0.52, 0.82, fbm(d.xz / (d.y + 0.32) * 0.9 + vec2(uTime * 0.012, 0.0)));
  col = mix(col, vec3(1.0), clouds * cloudMask * 0.62);
  gl_FragColor = vec4(col, 1.0);
  #include <colorspace_fragment>
}`
