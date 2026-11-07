<script setup lang="ts">
import { Button } from '~/components/ui/button'

export interface ConfirmOptions { title: string; message: string; confirmLabel?: string; danger?: boolean }
const dialog = ref<HTMLDialogElement | null>(null)
const options = ref<ConfirmOptions>({ title: '', message: '' })
let resolver: ((value: boolean) => void) | null = null

function ask(next: ConfirmOptions): Promise<boolean> {
  options.value = next
  dialog.value?.showModal()
  return new Promise((resolve) => { resolver = resolve })
}
function answer(value: boolean): void {
  resolver?.(value)
  resolver = null
  dialog.value?.close()
}
defineExpose({ ask })
</script>

<template>
  <dialog ref="dialog" class="m-auto w-[min(28rem,calc(100vw-2rem))] rounded-2xl border border-fg/12 bg-surface p-6 text-fg backdrop:bg-black/60" aria-labelledby="confirm-title" @cancel.prevent="answer(false)">
    <h2 id="confirm-title" class="font-display text-lg font-semibold">{{ options.title }}</h2>
    <p class="mt-2 text-sm text-muted">{{ options.message }}</p>
    <div class="mt-6 flex justify-end gap-2">
      <Button variant="ghost" size="sm" @click="answer(false)">Annuler</Button>
      <Button :variant="options.danger ? 'destructive' : 'default'" size="sm" @click="answer(true)">{{ options.confirmLabel ?? 'Confirmer' }}</Button>
    </div>
  </dialog>
</template>
