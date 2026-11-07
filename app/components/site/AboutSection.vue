<script setup lang="ts">
import { Download, ExternalLink, Mail, MapPin } from 'lucide-vue-next'
import { optimizeCloudinaryUrl } from '#shared/utils/cloudinary'
import { safeHref } from '#shared/utils/template'
import { Button } from '~/components/ui/button'
import { initials, paragraphs } from '~/utils/format'

const portfolio = usePortfolio()
const { t } = useUi()
const content = computed(() => portfolio.value.settings.content)
const social = computed(() => portfolio.value.settings.social)
</script>

<template>
  <section id="about" class="section" aria-labelledby="about-title">
    <div class="container-page grid items-start gap-10 lg:grid-cols-[1.35fr_1fr] lg:gap-16">
      <div>
        <SectionHead id="about" :title="content.aboutTitle" />
        <div class="grid gap-4 text-[1.08rem] leading-relaxed text-fg/85">
          <p v-for="(text, index) in paragraphs(content.about)" :key="index" v-reveal="index * 70">{{ text }}</p>
        </div>
      </div>
      <aside v-reveal="120" class="card p-6 sm:p-7" :aria-label="content.name">
        <div class="flex items-center gap-4">
          <img v-if="content.avatarUrl" :src="optimizeCloudinaryUrl(content.avatarUrl, { width: 240, height: 240, crop: 'fill' })" :alt="content.name" width="88" height="88" class="size-22 rounded-3xl object-cover shadow-md" loading="lazy">
          <span v-else class="grid size-22 shrink-0 place-items-center rounded-3xl bg-gradient-to-br from-primary to-sea-shallow font-display text-3xl font-bold text-on-primary" aria-hidden="true">{{ initials(content.name) }}</span>
          <div class="min-w-0"><p class="truncate font-display text-xl font-bold">{{ content.name }}</p><p class="text-muted">{{ content.title }}</p></div>
        </div>
        <ul class="mt-6 grid gap-3 text-[.98rem]">
          <li v-if="content.location" class="flex items-center gap-2.5"><MapPin class="size-4 text-primary" aria-hidden="true" />{{ content.location }}</li>
          <li v-if="content.availability" class="flex items-center gap-2.5"><span class="size-2.5 rounded-full bg-ok shadow-[0_0_0_4px_color-mix(in_oklab,var(--color-ok)_22%,transparent)]" aria-hidden="true" /><span><span class="sr-only">{{ t('about.availability') }} : </span>{{ content.availability }}</span></li>
          <li v-if="content.publicEmail && portfolio.settings.contact.showEmailLink" class="flex items-center gap-2.5"><Mail class="size-4 text-primary" aria-hidden="true" /><a :href="`mailto:${content.publicEmail}`" class="font-semibold underline-offset-4 hover:underline">{{ content.publicEmail }}</a></li>
        </ul>
        <div v-if="social.length" class="mt-6 flex flex-wrap gap-2" role="list" :aria-label="t('about.links')">
          <a v-for="item in social" :key="item.url" role="listitem" :href="safeHref(item.url) ?? '#'" target="_blank" rel="noopener noreferrer" class="chip">{{ item.label || item.platform }}<ExternalLink class="size-3.5" aria-hidden="true" /></a>
        </div>
        <Button v-if="safeHref(content.resumeUrl)" as-child variant="soft" class="mt-6 w-full"><a :href="safeHref(content.resumeUrl)!" target="_blank" rel="noopener noreferrer"><Download />{{ t('hero.resume') }}</a></Button>
      </aside>
    </div>
  </section>
</template>
