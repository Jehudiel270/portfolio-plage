<script setup lang="ts">
import { Mail, MessageCircle, MessageSquare, Send, X } from 'lucide-vue-next'
import { buildWhatsAppUrl, renderTemplate } from '#shared/utils/template'
import { Button } from '~/components/ui/button'

const portfolio = usePortfolio()
const route = useRoute()
const open = ref(false)
const showForm = ref(false)
const trigger = ref<HTMLElement | null>(null)
const widget = computed(() => portfolio.value.settings.widget)
const contact = computed(() => portfolio.value.settings.contact)
const visible = computed(() => widget.value.enabled && !route.path.startsWith('/contact'))
const canForm = computed(() => widget.value.offerForm && ['email', 'both'].includes(contact.value.channelMode))
const email = computed(() => (widget.value.offerEmail ? portfolio.value.settings.content.publicEmail : null))
const whatsapp = computed(() => (widget.value.offerWhatsapp && ['whatsapp', 'both'].includes(contact.value.channelMode) ? buildWhatsAppUrl(contact.value.whatsappNumber, renderTemplate(contact.value.whatsappTemplate, { name: 'visiteur', siteName: portfolio.value.settings.content.name })) : null))
function close(): void { open.value = false; showForm.value = false; trigger.value?.focus() }
function onKey(event: KeyboardEvent): void { if (event.key === 'Escape' && open.value) close() }
onMounted(() => document.addEventListener('keydown', onKey))
onBeforeUnmount(() => document.removeEventListener('keydown', onKey))
</script>

<template>
  <div v-if="visible" class="fixed bottom-4 z-40" :class="widget.position === 'bottom-left' ? 'left-4' : 'right-4'">
    <section v-if="open" id="quick-contact" class="card mb-3 w-[min(22rem,calc(100vw-2rem))] p-5" role="dialog" aria-label="Contact rapide">
      <div class="flex items-start justify-between gap-3"><h2 class="font-display text-lg font-bold">{{ widget.title }}</h2><button type="button" class="grid size-8 place-items-center rounded-full hover:bg-fg/8" aria-label="Fermer" @click="close"><X class="size-4" /></button></div>
      <p class="mt-2 text-sm text-muted">{{ widget.greeting }}</p>
      <div v-if="!showForm" class="mt-4 grid gap-2">
        <Button v-if="canForm" size="sm" @click="showForm = true"><Send />Écrire un message</Button>
        <Button v-if="email" as-child variant="soft" size="sm"><a :href="`mailto:${email}`"><Mail />{{ email }}</a></Button>
        <Button v-if="whatsapp" as-child variant="soft" size="sm"><a :href="whatsapp" target="_blank" rel="noopener noreferrer"><MessageCircle />{{ contact.whatsappButtonLabel }}</a></Button>
        <Button v-if="contact.pageEnabled" as-child variant="ghost" size="sm"><NuxtLink to="/contact" @click="close">Ouvrir la page contact</NuxtLink></Button>
      </div>
      <div v-else class="mt-4"><ContactForm source="widget" id-prefix="widget" /><button type="button" class="mt-3 text-sm font-semibold text-primary hover:underline" @click="showForm = false">← Autres moyens de contact</button></div>
    </section>
    <Button ref="trigger" class="shadow-xl" :aria-expanded="open" aria-controls="quick-contact" @click="open ? close() : (open = true)"><MessageSquare />{{ widget.label }}</Button>
  </div>
</template>
