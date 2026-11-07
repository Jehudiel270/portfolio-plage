<script setup lang="ts">
import { ArrowLeft } from 'lucide-vue-next'
import { Button } from '~/components/ui/button'

const portfolio = usePortfolio()
const settings = computed(() => portfolio.value.settings)
if (!settings.value.contact.pageEnabled) throw createError({ statusCode: 404, statusMessage: 'Page introuvable' })
useSeoMeta({ title: () => `${settings.value.contact.title} — ${settings.value.content.name}`, description: () => settings.value.contact.intro })
const hasForm = computed(() => settings.value.contact.channelMode !== 'none')
</script>

<template>
  <div class="container-page grid min-h-svh content-center gap-10 pb-20 pt-32 lg:grid-cols-[1fr_1.15fr] lg:items-start">
    <header class="grid content-start gap-4">
      <Button as-child variant="ghost" size="sm" class="w-fit"><NuxtLink to="/"><ArrowLeft />Retour à l’accueil</NuxtLink></Button>
      <h1 class="text-4xl sm:text-5xl">{{ settings.contact.title }}</h1>
      <p class="max-w-md text-lg text-muted">{{ settings.contact.intro }}</p>
      <ContactChannels />
    </header>
    <section class="card p-6 sm:p-8" aria-label="Formulaire de contact">
      <ContactForm v-if="hasForm" id-prefix="page" />
      <p v-else class="text-muted">Le formulaire est désactivé : utilisez les liens de contact indiqués.</p>
    </section>
  </div>
</template>
