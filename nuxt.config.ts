import tailwindcss from '@tailwindcss/vite'

const isProduction = process.env.NODE_ENV === 'production'

export default defineNuxtConfig({
  compatibilityDate: '2025-07-15',
  devtools: { enabled: false },
  modules: ['@nuxt/eslint'],
  css: ['~/assets/css/main.css'],
  // Seuls les fichiers .vue sont des composants (les index.ts des composants ui/* exposent des variantes cva).
  components: [{ path: '~/components', pathPrefix: false, extensions: ['vue'] }],
  typescript: { strict: true, typeCheck: false },

  vite: {
    plugins: [tailwindcss()],
    build: { chunkSizeWarningLimit: 1200 },
    optimizeDeps: { include: ['gsap', 'gsap/ScrollTrigger', 'three'] },
  },

  app: {
    pageTransition: { name: 'page', mode: 'out-in' },
    head: {
      htmlAttrs: { lang: 'fr' },
      meta: [
        { name: 'viewport', content: 'width=device-width, initial-scale=1, viewport-fit=cover' },
        { name: 'theme-color', content: '#fdf6e9' },
        { name: 'color-scheme', content: 'light' },
      ],
      link: [{ rel: 'icon', type: 'image/svg+xml', href: '/favicon.svg' }],
    },
  },

  /*
   * Valeurs privées (serveur uniquement) : jamais exposées au navigateur.
   * Surcharge possible par NUXT_* ; les noms classiques (DATABASE_URL, CLOUDINARY_*, SMTP_*) sont lus par server/utils/env.ts.
   */
  runtimeConfig: {
    databaseUrl: '',
    sessionPassword: '',
    superadminOwnerEmail: '',
    cloudinary: { cloudName: '', apiKey: '', apiSecret: '' },
    smtp: { host: '', port: '', secure: '', user: '', password: '', from: '' },
    public: { siteUrl: '' },
  },

  routeRules: {
    '/**': {
      headers: {
        'X-Content-Type-Options': 'nosniff',
        'Referrer-Policy': 'strict-origin-when-cross-origin',
        'X-Frame-Options': 'SAMEORIGIN',
        'Permissions-Policy': 'camera=(), microphone=(), geolocation=(), payment=()',
        'Cross-Origin-Opener-Policy': 'same-origin',
        ...(isProduction ? { 'Strict-Transport-Security': 'max-age=31536000; includeSubDomains' } : {}),
      },
    },
    // Le back-office est un espace privé rendu côté navigateur, jamais indexé ni mis en cache.
    '/admin/**': { ssr: false, headers: { 'X-Robots-Tag': 'noindex, nofollow', 'Cache-Control': 'no-store' } },
    '/api/admin/**': { headers: { 'Cache-Control': 'no-store' } },
    '/assets/**': { headers: { 'Cache-Control': 'public, max-age=604800' } },
  },
})
