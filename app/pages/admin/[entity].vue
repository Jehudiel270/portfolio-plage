<script setup lang="ts">
import { ENTITY_KEYS, type EntityKey } from '#shared/schemas/entities'

const route = useRoute()
const entity = computed(() => route.params.entity as string)
const valid = computed(() => (ENTITY_KEYS as readonly string[]).includes(entity.value))
if (!valid.value) throw createError({ statusCode: 404, statusMessage: 'Page introuvable' })
definePageMeta({ layout: 'admin' })
</script>

<template>
  <AdminEntityManager v-if="valid" :key="entity" :entity="entity as EntityKey" />
</template>
