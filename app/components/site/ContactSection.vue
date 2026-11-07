<script setup lang="ts">
const portfolio = usePortfolio()
const settings = computed(() => portfolio.value.settings)
const content = computed(() => settings.value.content)
const hasForm = computed(() => settings.value.contact.channelMode !== 'none')
</script>

<template>
  <section id="contact" class="section" aria-labelledby="contact-title">
    <div class="container-page grid items-start gap-10 lg:grid-cols-[1fr_1.15fr] lg:gap-16">
      <div>
        <SectionHead id="contact" :title="content.contactTitle" :intro="content.contactText" />
        <ContactChannels v-reveal="100" />
        <p v-if="content.location" v-reveal="160" class="mt-6 text-muted">{{ content.location }}</p>
      </div>
      <div v-if="hasForm" v-reveal="120" class="card p-6 sm:p-8"><ContactForm id-prefix="home" /></div>
    </div>
  </section>
</template>
