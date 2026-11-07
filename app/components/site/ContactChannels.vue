<script setup lang="ts">
import { ExternalLink, Mail, MessageCircle } from 'lucide-vue-next'
import { buildWhatsAppUrl, renderTemplate, safeHref } from '#shared/utils/template'
import { Button } from '~/components/ui/button'

const portfolio = usePortfolio()
const settings = computed(() => portfolio.value.settings)
const email = computed(() => (settings.value.contact.showEmailLink ? settings.value.content.publicEmail : null))
const whatsappUrl = computed(() => (['whatsapp', 'both'].includes(settings.value.contact.channelMode) ? buildWhatsAppUrl(settings.value.contact.whatsappNumber, renderTemplate(settings.value.contact.whatsappTemplate, { name: 'visiteur', siteName: settings.value.content.name })) : null))
</script>

<template>
  <div v-if="email || whatsappUrl || settings.social.length" class="flex flex-wrap items-center gap-2.5">
    <Button v-if="email" as-child variant="soft" size="sm"><a :href="`mailto:${email}`"><Mail />{{ email }}</a></Button>
    <Button v-if="whatsappUrl" as-child variant="soft" size="sm"><a :href="whatsappUrl" target="_blank" rel="noopener noreferrer"><MessageCircle />{{ settings.contact.whatsappButtonLabel }}</a></Button>
    <template v-for="item in settings.social" :key="item.url"><Button v-if="safeHref(item.url)" as-child variant="ghost" size="sm"><a :href="safeHref(item.url)!" target="_blank" rel="noopener noreferrer">{{ item.label || item.platform }}<ExternalLink /></a></Button></template>
  </div>
</template>
