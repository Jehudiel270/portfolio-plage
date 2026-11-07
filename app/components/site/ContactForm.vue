<script setup lang="ts">
import { CircleAlert, CircleCheck, Send, TriangleAlert } from 'lucide-vue-next'
import { contactPayloadSchema, validateContactAgainstConfig, type ContactPayload } from '#shared/schemas/contact'
import type { ContactResponse } from '#shared/types/portfolio'
import { buildWhatsAppUrl, isSafeInternalPath, renderTemplate } from '#shared/utils/template'
import { Button } from '~/components/ui/button'
import { Input } from '~/components/ui/input'
import { Label } from '~/components/ui/label'
import { Textarea } from '~/components/ui/textarea'

const props = withDefaults(defineProps<{ source?: 'form' | 'widget'; idPrefix?: string }>(), { source: 'form', idPrefix: 'contact' })
const portfolio = usePortfolio()
const { t } = useUi()
const settings = computed(() => portfolio.value.settings)
const config = computed(() => settings.value.contact)
const form = reactive({ name: '', email: '', phone: '', subject: '', message: '', website: '' })
const consent = ref(false)
const startedAt = ref(0)
const errors = ref<Record<string, string>>({})
const state = ref<'idle' | 'sending' | 'sent' | 'partial' | 'error'>('idle')
const feedback = ref('')
const FIELD_ORDER = ['name', 'email', 'phone', 'subject'] as const
const visibleFields = computed(() => FIELD_ORDER.filter((key) => config.value.fields[key].visible))
const mode = computed(() => config.value.channelMode)
const serverForm = computed(() => mode.value === 'email' || mode.value === 'both')
const templateValues = computed(() => ({ name: form.name || 'visiteur', email: form.email, phone: form.phone, subject: form.subject, message: form.message, siteName: settings.value.content.name }))
const whatsappUrl = computed(() => buildWhatsAppUrl(config.value.whatsappNumber, renderTemplate(config.value.whatsappTemplate, templateValues.value)))
const privacyText = computed(() => config.value.privacyNotice.replaceAll('{retentionDays}', config.value.retentionDays > 0 ? String(config.value.retentionDays) : 'sans limite de'))
onMounted(() => { startedAt.value = Date.now() })

async function submit(): Promise<void> {
  errors.value = {}
  const payload: ContactPayload = contactPayloadSchema.parse({ ...form, consent: consent.value, source: props.source, startedAt: startedAt.value })
  const problems = validateContactAgainstConfig(payload, config.value)
  if (problems.length) { errors.value = Object.fromEntries(problems.map((p) => [p.field, p.field === 'consent' ? t('contact.consent.required') : p.message])); return }
  if (payload.message.length < 5) { errors.value = { message: 'Votre message est trop court (5 caractères minimum).' }; return }
  state.value = 'sending'
  try {
    const result = await $fetch<ContactResponse>('/api/contact', { method: 'POST', body: payload })
    state.value = result.emailStatus === 'sent' || result.emailStatus === 'skipped' ? 'sent' : 'partial'
    feedback.value = state.value === 'sent' ? config.value.successMessage : config.value.partialMessage
    if (config.value.afterSubmit === 'redirect' && isSafeInternalPath(config.value.redirectPath) && state.value === 'sent') await navigateTo(config.value.redirectPath)
    else if (config.value.afterSubmit === 'reset') Object.assign(form, { name: '', email: '', phone: '', subject: '', message: '', website: '' })
  } catch (error) {
    const data = (error as { data?: { data?: { code?: string; details?: { path: string; message: string }[] } } }).data?.data
    if (data?.code === 'VALIDATION_ERROR' && data.details) errors.value = Object.fromEntries(data.details.map((d) => [d.path, d.message]))
    state.value = 'error'
    feedback.value = data?.code === 'TOO_MANY_REQUESTS' ? 'Trop de messages envoyés : réessayez dans quelques minutes.' : config.value.errorMessage
  }
}
</script>

<template>
  <form v-if="mode !== 'none'" class="grid gap-4" novalidate :aria-busy="state === 'sending'" @submit.prevent="serverForm ? submit() : undefined">
    <div v-for="key in visibleFields" :key="key" class="grid gap-1.5">
      <Label :for="`${idPrefix}-${key}`">{{ config.fields[key].label }}<span v-if="config.fields[key].required" class="text-accent" aria-hidden="true"> *</span></Label>
      <Input :id="`${idPrefix}-${key}`" v-model="form[key]" :type="key === 'email' ? 'email' : key === 'phone' ? 'tel' : 'text'" :autocomplete="key === 'email' ? 'email' : key === 'name' ? 'name' : key === 'phone' ? 'tel' : 'off'" :placeholder="config.fields[key].placeholder" :required="config.fields[key].required" :aria-invalid="Boolean(errors[key])" :aria-describedby="errors[key] ? `${idPrefix}-${key}-err` : undefined" maxlength="200" />
      <p v-if="errors[key]" :id="`${idPrefix}-${key}-err`" class="text-sm font-semibold text-danger">{{ errors[key] }}</p>
    </div>
    <div class="grid gap-1.5">
      <Label :for="`${idPrefix}-message`">{{ config.fields.message.label }}<span class="text-accent" aria-hidden="true"> *</span></Label>
      <Textarea :id="`${idPrefix}-message`" v-model="form.message" :placeholder="config.fields.message.placeholder" required maxlength="4000" :aria-invalid="Boolean(errors.message)" :aria-describedby="errors.message ? `${idPrefix}-message-err` : undefined" :class="source === 'widget' ? '!min-h-24' : ''" />
      <p v-if="errors.message" :id="`${idPrefix}-message-err`" class="text-sm font-semibold text-danger">{{ errors.message }}</p>
    </div>
    <div class="absolute -left-[9999px] h-0 w-0 overflow-hidden" aria-hidden="true"><label>Ne pas remplir<input v-model="form.website" type="text" name="website" tabindex="-1" autocomplete="off"></label></div>
    <label v-if="config.requireConsent" class="flex cursor-pointer items-start gap-3 text-sm"><input v-model="consent" type="checkbox" class="mt-1 size-4 accent-[var(--primary)]" :aria-invalid="Boolean(errors.consent)"><span>{{ config.consentLabel }}</span></label>
    <p v-if="errors.consent" class="text-sm font-semibold text-danger">{{ errors.consent }}</p>
    <p class="text-[.82rem] leading-snug text-muted">{{ privacyText }}<template v-if="settings.privacy.enabled"> <NuxtLink to="/confidentialite" class="font-semibold text-primary underline underline-offset-2">{{ t('footer.privacy') }}</NuxtLink></template></p>
    <div class="flex flex-wrap items-center gap-3">
      <Button v-if="serverForm" type="submit" :disabled="state === 'sending' || state === 'sent'"><Send />{{ state === 'sending' ? t('common.loading') : config.submitLabel }}</Button>
      <Button v-if="mode === 'whatsapp' && whatsappUrl" as-child><a :href="whatsappUrl" target="_blank" rel="noopener noreferrer">{{ config.whatsappButtonLabel }}</a></Button>
      <Button v-if="mode === 'both' && (state === 'sent' || state === 'partial') && whatsappUrl" as-child variant="outline"><a :href="whatsappUrl" target="_blank" rel="noopener noreferrer">{{ config.whatsappAfterLabel }}</a></Button>
    </div>
    <p v-if="mode === 'whatsapp'" class="text-sm text-muted">WhatsApp s’ouvre avec votre message prérempli : vous devez confirmer l’envoi vous-même dans l’application.</p>
    <p v-if="source === 'widget'" class="text-sm text-muted">{{ settings.widget.asyncNotice }}</p>
    <p v-if="state === 'sent'" role="status" class="flex items-start gap-2 rounded-xl border border-ok/30 bg-ok/10 p-3 text-sm font-semibold text-ok"><CircleCheck class="mt-0.5 size-4 shrink-0" aria-hidden="true" />{{ feedback }}</p>
    <p v-else-if="state === 'partial'" role="status" class="flex items-start gap-2 rounded-xl border border-warn/35 bg-warn/10 p-3 text-sm font-semibold text-warn"><TriangleAlert class="mt-0.5 size-4 shrink-0" aria-hidden="true" />{{ feedback }}</p>
    <p v-else-if="state === 'error'" role="alert" class="flex items-start gap-2 rounded-xl border border-danger/35 bg-danger/10 p-3 text-sm font-semibold text-danger"><CircleAlert class="mt-0.5 size-4 shrink-0" aria-hidden="true" />{{ feedback }}</p>
  </form>
</template>
