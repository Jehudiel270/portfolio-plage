/** Directive `v-reveal` : apparition douce au défilement (IntersectionObserver). Sans JavaScript, tout reste visible. */
export default defineNuxtPlugin((nuxtApp) => {
  nuxtApp.vueApp.directive('reveal', {
    created(el: HTMLElement, binding: { value?: number }) {
      el.classList.add('reveal')
      if (binding.value) el.style.setProperty('--reveal-delay', `${binding.value}ms`)
    },
    mounted(el: HTMLElement) {
      if (!('IntersectionObserver' in window)) { el.classList.add('is-visible'); return }
      const observer = new IntersectionObserver((entries) => {
        for (const entry of entries) if (entry.isIntersecting) { el.classList.add('is-visible'); observer.disconnect() }
      }, { threshold: 0.12, rootMargin: '0px 0px -6% 0px' })
      observer.observe(el)
    },
    getSSRProps: () => ({ class: 'reveal' }),
  })
})
