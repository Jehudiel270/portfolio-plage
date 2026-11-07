<script setup lang="ts">
const { toasts } = useToasts()
</script>

<template>
  <div class="pointer-events-none fixed bottom-4 right-4 z-[60] grid w-[min(24rem,calc(100vw-2rem))] gap-2" aria-live="polite">
    <TransitionGroup name="toast">
      <p v-for="t in toasts" :key="t.id" class="pointer-events-auto rounded-xl border px-4 py-3 text-sm font-semibold shadow-xl backdrop-blur" :class="t.tone === 'ok' ? 'border-ok/40 bg-surface text-ok' : t.tone === 'error' ? 'border-danger/50 bg-surface text-danger' : 'border-accent/40 bg-surface text-accent'" :role="t.tone === 'error' ? 'alert' : 'status'">{{ t.text }}</p>
    </TransitionGroup>
  </div>
</template>

<style scoped>
.toast-enter-active, .toast-leave-active { transition: all .25s ease; }
.toast-enter-from, .toast-leave-to { opacity: 0; transform: translateY(8px); }
</style>
