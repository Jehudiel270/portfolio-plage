<script setup lang="ts">
import { RotateCcw, Save, Undo2 } from 'lucide-vue-next'
import { Button } from '~/components/ui/button'

/** Carte de réglages avec barre d'actions : enregistrer, annuler les modifications, restaurer les valeurs par défaut. */
defineProps<{ title: string; description?: string; dirty: boolean; saving: boolean; showDefaults?: boolean }>()
defineEmits<{ save: []; cancel: []; defaults: [] }>()
</script>

<template>
  <section class="admin-card p-5 sm:p-6">
    <header class="mb-5"><h2 class="font-display text-lg font-semibold">{{ title }}</h2><p v-if="description" class="mt-1 text-sm text-muted">{{ description }}</p></header>
    <slot />
    <footer class="sticky bottom-3 z-10 mt-6 flex flex-wrap items-center gap-2 rounded-xl border border-fg/10 bg-bg/90 p-3 backdrop-blur">
      <Button size="sm" :disabled="!dirty || saving" @click="$emit('save')"><Save />{{ saving ? 'Enregistrement…' : 'Enregistrer' }}</Button>
      <Button size="sm" variant="ghost" :disabled="!dirty || saving" @click="$emit('cancel')"><Undo2 />Annuler les modifications</Button>
      <Button v-if="showDefaults" size="sm" variant="ghost" :disabled="saving" @click="$emit('defaults')"><RotateCcw />Valeurs par défaut</Button>
      <span class="ml-auto text-xs font-semibold" :class="dirty ? 'text-warn' : 'text-muted'" role="status">{{ dirty ? 'Modifications non enregistrées' : 'À jour' }}</span>
    </footer>
  </section>
</template>
