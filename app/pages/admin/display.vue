<script setup lang="ts">
import { ArrowDown, ArrowUp } from 'lucide-vue-next'
import { JOURNEY_TABS, SECTION_IDS } from '#shared/constants'

definePageMeta({ layout: 'admin' })
await loadAdminSettings()
const display = useSettingsSection('display')
const sections = useSettingsSection('sections')
const journey = useSettingsSection('journey')
const navigation = useSettingsSection('navigation')
const widget = useSettingsSection('widget')
const SECTION_LABELS: Record<string, string> = { about: 'À propos', projects: 'Projets', skills: 'Compétences', journey: 'Parcours', contact: 'Contact' }
const NAV_LABELS: Record<string, string> = { hero: 'Accueil', ...SECTION_LABELS }
const TAB_LABELS: Record<string, string> = { experiences: 'Expériences', education: 'Formation', certifications: 'Certifications', achievements: 'Réalisations' }

function swap<T>(list: T[], index: number, direction: -1 | 1): T[] {
  const target = index + direction
  if (target < 0 || target >= list.length) return list
  const copy = [...list]
  ;[copy[index], copy[target]] = [copy[target]!, copy[index]!]
  return copy
}
const s = sections.draft
const enabledTabs = computed(() => journey.draft.value.order.filter((t) => journey.draft.value.tabs[t].enabled))
</script>

<template>
  <div class="grid gap-6">
    <AdminPageHeader title="Affichage et menu" description="Grille, icônes, ordre chronologique, sections, onglets du parcours et menu (6 entrées maximum recommandées). Une section désactivée ou vide disparaît du menu sans ancre cassée." />

    <AdminSettingsCard title="Affichage" :dirty="display.dirty.value" :saving="display.saving.value" show-defaults @save="display.save" @cancel="display.cancel" @defaults="display.restoreDefaults">
      <div class="grid gap-4 sm:grid-cols-2">
        <AdminField label="Icônes des technologies" for="d-icon"><select id="d-icon" v-model="display.draft.value.iconStyle" class="admin-input"><option value="brand">Couleurs de marque</option><option value="mono">Monochrome (couleur du thème)</option></select></AdminField>
        <AdminField label="Mise en page des compétences" for="d-layout"><select id="d-layout" v-model="display.draft.value.skillsLayout" class="admin-input"><option value="grouped">Groupées par catégorie</option><option value="flat">Une seule grille</option></select></AdminField>
        <AdminField label="Ordre de la frise (formation, expériences…)" for="d-order" hint="« Par date » : le plus récent d’abord, quelle que soit la date de saisie."><select id="d-order" v-model="display.draft.value.timelineOrder" class="admin-input"><option value="date">Par date (recommandé)</option><option value="manual">Ordre manuel (flèches de l’administration)</option></select></AdminField>
        <AdminField label="Projets affichés par page" for="d-per"><input id="d-per" v-model.number="display.draft.value.projectsPerPage" class="admin-input" type="number" min="3" max="24"></AdminField>
        <AdminToggle v-model="display.draft.value.showLevels" label="Afficher les niveaux de maîtrise" hint="Uniquement quand un niveau est renseigné." />
        <AdminToggle v-model="display.draft.value.showTechIcons" label="Icônes sur les technologies des projets" />
        <AdminToggle v-model="display.draft.value.explore.skills" label="Bouton « Explorer en 3D » : compétences" hint="Bouées flottantes sur la mer." />
        <AdminToggle v-model="display.draft.value.explore.projects" label="Bouton « Explorer en 3D » : projets" hint="Bouteilles à la mer." />
      </div>
    </AdminSettingsCard>

    <AdminSettingsCard title="Menu principal" description="Libellé, visibilité et ordre des entrées. Une entrée n’apparaît jamais si sa section est masquée ou vide." :dirty="navigation.dirty.value" :saving="navigation.saving.value" show-defaults @save="navigation.save" @cancel="navigation.cancel" @defaults="navigation.restoreDefaults">
      <ul class="grid gap-2"><li v-for="(item, index) in navigation.draft.value.items" :key="item.id" class="grid items-center gap-3 rounded-xl border border-line p-3 sm:grid-cols-[auto_1fr_auto]">
        <div class="flex flex-col"><button type="button" class="grid size-7 place-items-center rounded-md hover:bg-fg/8 disabled:opacity-30" :disabled="index === 0" :aria-label="`Monter ${NAV_LABELS[item.id]}`" @click="navigation.draft.value.items = swap(navigation.draft.value.items, index, -1)"><ArrowUp class="size-4" /></button><button type="button" class="grid size-7 place-items-center rounded-md hover:bg-fg/8 disabled:opacity-30" :disabled="index === navigation.draft.value.items.length - 1" :aria-label="`Descendre ${NAV_LABELS[item.id]}`" @click="navigation.draft.value.items = swap(navigation.draft.value.items, index, 1)"><ArrowDown class="size-4" /></button></div>
        <AdminField :label="`Libellé : ${NAV_LABELS[item.id]}`" :for="`n-${item.id}`"><input :id="`n-${item.id}`" v-model="item.label" class="admin-input" maxlength="40"></AdminField>
        <AdminToggle v-model="item.visible" label="Visible" />
      </li></ul>
      <AdminToggle v-model="navigation.draft.value.showSettings" class="mt-4" label="Bouton de réglages d’affichage" hint="Petit bouton (animations réduites) rangé à part, hors du menu." />
    </AdminSettingsCard>

    <AdminSettingsCard title="Sections de la page d’accueil" description="Titre, introduction et comportement quand une section n’a aucun contenu publié." :dirty="sections.dirty.value" :saving="sections.saving.value" show-defaults @save="sections.save" @cancel="sections.cancel" @defaults="sections.restoreDefaults">
      <div class="grid gap-4"><section v-for="id in SECTION_IDS" :key="id" class="rounded-xl border border-line p-4">
        <div class="flex flex-wrap items-center justify-between gap-3"><h3 class="font-display text-sm font-bold">{{ SECTION_LABELS[id] }}</h3><AdminToggle v-model="s[id].enabled" label="Activée" class="min-w-44" /></div>
        <div class="mt-3 grid gap-3 sm:grid-cols-2">
          <AdminField label="Titre" :for="`s-t-${id}`"><input :id="`s-t-${id}`" v-model="s[id].title" class="admin-input" maxlength="100"></AdminField>
          <AdminField v-if="!['about', 'contact'].includes(id)" label="Si aucun contenu publié" :for="`s-e-${id}`"><select :id="`s-e-${id}`" v-model="s[id].emptyBehavior" class="admin-input"><option value="hide">Masquer la section</option><option value="neutral">Afficher un message neutre</option></select></AdminField>
          <AdminField label="Introduction" optional :for="`s-i-${id}`" class="sm:col-span-2"><input :id="`s-i-${id}`" v-model="s[id].intro" class="admin-input" maxlength="400"></AdminField>
          <AdminField v-if="s[id].emptyBehavior === 'neutral' && !['about', 'contact'].includes(id)" label="Message neutre" :for="`s-n-${id}`" class="sm:col-span-2"><input :id="`s-n-${id}`" v-model="s[id].emptyText" class="admin-input" maxlength="200"></AdminField>
        </div></section></div>
    </AdminSettingsCard>

    <AdminSettingsCard title="Onglets du parcours" description="Expériences, formation, certifications et réalisations sont regroupées dans une seule section à onglets (un onglet vide n’apparaît pas)." :dirty="journey.dirty.value" :saving="journey.saving.value" show-defaults @save="journey.save" @cancel="journey.cancel" @defaults="journey.restoreDefaults">
      <ul class="grid gap-2"><li v-for="(tab, index) in journey.draft.value.order" :key="tab" class="grid items-center gap-3 rounded-xl border border-line p-3 sm:grid-cols-[auto_1fr_auto]">
        <div class="flex flex-col"><button type="button" class="grid size-7 place-items-center rounded-md hover:bg-fg/8 disabled:opacity-30" :disabled="index === 0" :aria-label="`Monter ${TAB_LABELS[tab]}`" @click="journey.draft.value.order = swap(journey.draft.value.order, index, -1)"><ArrowUp class="size-4" /></button><button type="button" class="grid size-7 place-items-center rounded-md hover:bg-fg/8 disabled:opacity-30" :disabled="index === journey.draft.value.order.length - 1" :aria-label="`Descendre ${TAB_LABELS[tab]}`" @click="journey.draft.value.order = swap(journey.draft.value.order, index, 1)"><ArrowDown class="size-4" /></button></div>
        <AdminField :label="`Libellé : ${TAB_LABELS[tab]}`" :for="`j-${tab}`"><input :id="`j-${tab}`" v-model="journey.draft.value.tabs[tab].label" class="admin-input" maxlength="40"></AdminField>
        <AdminToggle v-model="journey.draft.value.tabs[tab].enabled" label="Activé" />
      </li></ul>
      <div class="mt-4 grid gap-4 sm:grid-cols-2">
        <AdminField label="Onglet affiché par défaut" for="j-default"><select id="j-default" v-model="journey.draft.value.defaultTab" class="admin-input"><option v-for="t in (enabledTabs.length ? enabledTabs : JOURNEY_TABS)" :key="t" :value="t">{{ TAB_LABELS[t] }}</option></select></AdminField>
        <AdminTagsField v-model="journey.draft.value.hiddenAchievementCategories" label="Catégories de réalisations masquées" optional hint="Ex. « Langue » : retirées du site, conservées dans l’administration." />
      </div>
    </AdminSettingsCard>

    <AdminSettingsCard title="Widget « Contact rapide »" description="Petit panneau flottant (désactivé par défaut pour garder un site épuré). Messages asynchrones, pas de chat en temps réel." :dirty="widget.dirty.value" :saving="widget.saving.value" show-defaults @save="widget.save" @cancel="widget.cancel" @defaults="widget.restoreDefaults">
      <div class="grid gap-4 sm:grid-cols-2">
        <AdminToggle v-model="widget.draft.value.enabled" label="Widget visible" class="sm:col-span-2" />
        <AdminField label="Libellé du bouton" for="w-label"><input id="w-label" v-model="widget.draft.value.label" class="admin-input" maxlength="40"></AdminField>
        <AdminField label="Titre du panneau" for="w-title"><input id="w-title" v-model="widget.draft.value.title" class="admin-input" maxlength="60"></AdminField>
        <AdminField label="Message d’accueil" for="w-greeting" class="sm:col-span-2"><textarea id="w-greeting" v-model="widget.draft.value.greeting" class="admin-input" rows="3" maxlength="400" /></AdminField>
        <AdminField label="Position" for="w-pos"><select id="w-pos" v-model="widget.draft.value.position" class="admin-input"><option value="bottom-right">En bas à droite</option><option value="bottom-left">En bas à gauche</option></select></AdminField>
        <AdminField label="Mention « asynchrone »" for="w-async"><input id="w-async" v-model="widget.draft.value.asyncNotice" class="admin-input" maxlength="240"></AdminField>
        <AdminToggle v-model="widget.draft.value.offerForm" label="Proposer le formulaire" /><AdminToggle v-model="widget.draft.value.offerEmail" label="Proposer l’e-mail" /><AdminToggle v-model="widget.draft.value.offerWhatsapp" label="Proposer WhatsApp" />
      </div>
    </AdminSettingsCard>
  </div>
</template>
