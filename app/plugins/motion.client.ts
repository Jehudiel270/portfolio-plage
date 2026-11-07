/** Applique la préférence d'animation dès le démarrage (système + choix mémorisé du visiteur). */
export default defineNuxtPlugin(() => {
  const { preference, reduced, systemReduced } = useMotion()
  const query = window.matchMedia('(prefers-reduced-motion: reduce)')
  systemReduced.value = query.matches
  query.addEventListener('change', () => { systemReduced.value = query.matches })
  const stored = localStorage.getItem('portfolio:motion')
  if (stored === 'reduced' || stored === 'full') preference.value = stored
  watchEffect(() => document.documentElement.classList.toggle('no-anim', reduced.value))
})
