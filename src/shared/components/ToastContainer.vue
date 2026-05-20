<template>
  <Teleport to="body">
    <div class="fixed top-4 right-4 z-50 flex flex-col gap-2 pointer-events-none">
      <TransitionGroup name="toast">
        <div
          v-for="t in toasts"
          :key="t.id"
          class="pointer-events-auto flex items-start gap-3 px-4 py-3 rounded border text-sm font-body max-w-sm"
          :class="{
            'bg-arcane-deep border-arcane-mid/50 text-arcane-pale shadow-glow-arcane': t.type === 'error',
            'bg-depths border-gold-mid/40 text-gold-pale shadow-card': t.type === 'success',
            'bg-depths border-shadow text-stone shadow-card': t.type === 'info',
          }"
        >
          <span class="flex-1 leading-snug">{{ t.message }}</span>
          <button
            class="text-mist/50 hover:text-mist transition-colors mt-0.5 shrink-0"
            aria-label="Dismiss"
            @click="dismiss(t.id)"
          >✕</button>
        </div>
      </TransitionGroup>
    </div>
  </Teleport>
</template>

<script setup lang="ts">
import { useToast } from '@/shared/composables/useToast'

const { toasts, dismiss } = useToast()
</script>

<style scoped>
.toast-enter-active { transition: all 0.2s ease; }
.toast-leave-active { transition: all 0.15s ease; }
.toast-enter-from   { opacity: 0; transform: translateX(12px); }
.toast-leave-to     { opacity: 0; transform: translateX(12px); }
.toast-move         { transition: transform 0.2s ease; }
</style>
