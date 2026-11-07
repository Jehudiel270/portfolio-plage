<script setup lang="ts">
import { Waves } from 'lucide-vue-next'
import type { PublicSkill } from '#shared/types/portfolio'
import { Button } from '~/components/ui/button'

const portfolio = usePortfolio()
const { t } = useUi()
const selection = useSelection()
const explore = useExplore()
const config = computed(() => portfolio.value.settings.sections.skills)
const display = computed(() => portfolio.value.settings.display)
const canExplore = ref(false)
onMounted(async () => { const { webglAvailable } = await import('~/scene/ocean/OceanEngine'); canExplore.value = webglAvailable() })

const groups = computed(() => {
  const skills = portfolio.value.skills
  if (display.value.skillsLayout === 'flat') return [{ name: '', icon: null, items: skills }]
  const known = portfolio.value.categories.skills.map((c) => ({ name: c.name, icon: c.icon, items: skills.filter((s) => s.category === c.name) }))
  const rest = skills.filter((s) => !s.category || !known.some((k) => k.name === s.category))
  return [...known, ...(rest.length ? [{ name: known.length ? 'Autres' : '', icon: null, items: rest }] : [])].filter((g) => g.items.length)
})
const open = (skill: PublicSkill): void => { selection.value = { kind: 'skill', id: skill.id } }
</script>

<template>
  <section id="skills" class="section" aria-labelledby="skills-title">
    <div class="container-page">
      <SectionHead id="skills" :title="config.title" :intro="config.intro">
        <Button v-if="display.explore.skills && canExplore && portfolio.skills.length" class="mt-5" variant="soft" size="sm" @click="explore = 'skills'"><Waves />{{ t('skills.explore') }}</Button>
      </SectionHead>
      <p v-if="!portfolio.skills.length" class="card p-6 text-muted">{{ config.emptyText || t('common.empty') }}</p>
      <div v-else class="grid gap-6" :class="display.skillsLayout === 'flat' ? '' : 'md:grid-cols-2'">
        <section v-for="(group, gi) in groups" :key="group.name || 'all'" v-reveal="(gi % 2) * 90" class="card p-6" :class="{ 'md:col-span-2': !group.name }" :aria-label="group.name || undefined">
          <h3 v-if="group.name" class="mb-4 flex items-center gap-2.5 text-lg"><span v-if="group.icon" class="icon-tile size-9"><IconView :icon="group.icon" :size="18" :colorize="false" class="text-primary" /></span>{{ group.name }}</h3>
          <ul class="flex flex-wrap gap-2.5" role="list">
            <li v-for="skill in group.items" :key="skill.id">
              <button type="button" class="group flex items-center gap-2.5 rounded-2xl border border-line bg-bg/60 py-2 pl-2.5 pr-4 text-left font-bold transition hover:-translate-y-0.5 hover:border-primary/50 hover:bg-surface hover:shadow-md" :style="skill.color ? { borderColor: `color-mix(in oklab, ${skill.color} 45%, transparent)` } : undefined" :aria-label="`${skill.name} — ${t('common.openCard')}`" @click="open(skill)">
                <span class="icon-tile size-9 !rounded-xl"><IconView v-if="skill.icon" :icon="skill.icon" :size="20" :colorize="display.iconStyle === 'brand'" class="text-primary" /><span v-else class="font-display text-sm text-primary" aria-hidden="true">{{ skill.name.slice(0, 2) }}</span></span>
                <span class="grid gap-1"><span class="leading-none">{{ skill.name }}</span>
                  <span v-if="display.showLevels && skill.proficiency !== null" class="block h-1 w-16 overflow-hidden rounded-full bg-fg/10" role="img" :aria-label="`${t('skills.level')} : ${skill.proficiency} %`"><span class="block h-full rounded-full bg-primary" :style="{ width: `${skill.proficiency}%` }" /></span>
                </span>
                <span v-if="skill.isDemo" class="tag tag--demo ml-1">{{ t('common.demo') }}</span>
              </button>
            </li>
          </ul>
        </section>
      </div>
    </div>
  </section>
</template>
