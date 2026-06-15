<template>
  <Teleport to="body">
    <Transition name="dialog-fade">
      <div
        v-if="confirm.config.value"
        class="fixed inset-0 z-[60] flex items-center justify-center p-4"
        @keydown.esc="confirm.cancel()"
      >
        <!-- Backdrop -->
        <div class="absolute inset-0 bg-black/60" aria-hidden="true" @click="confirm.cancel()" />

        <!-- Panel -->
        <div
          role="alertdialog"
          aria-modal="true"
          aria-labelledby="confirm-dialog-title"
          v-focus-trap
          class="relative w-full max-w-sm bg-void border border-shadow rounded-lg shadow-2xl overflow-hidden"
        >
          <!-- Accent bar -->
          <div
            class="h-0.5 w-full"
            :class="confirm.config.value.variant === 'danger' ? 'bg-blood-bright' : 'bg-gold-mid'"
          />

          <div class="px-5 py-4 space-y-3">
            <!-- Title -->
            <p
              id="confirm-dialog-title"
              class="font-heading text-base tracking-wide"
              :class="confirm.config.value.variant === 'danger' ? 'text-blood-bright' : 'text-gold-mid'"
            >{{ confirm.config.value.title }}</p>

            <!-- Body -->
            <p class="font-body text-sm text-ash leading-relaxed">{{ confirm.config.value.body }}</p>

            <!-- Detail block (optional structured info) -->
            <div
              v-if="confirm.config.value.detail?.length"
              class="rounded border border-shadow bg-depths px-3 py-2.5 space-y-1.5"
            >
              <div
                v-for="row in confirm.config.value.detail"
                :key="row.label"
                class="flex items-baseline gap-3"
              >
                <span class="font-mono text-2xs tracking-widest uppercase text-mist w-14 shrink-0">{{ row.label }}</span>
                <span class="font-body text-sm text-vellum leading-snug">{{ row.value }}</span>
              </div>
            </div>

            <!-- Actions -->
            <div class="flex gap-2 pt-1">
              <button
                type="button"
                class="flex-1 btn-secondary text-sm"
                @click="confirm.cancel()"
              >Cancel</button>
              <button
                type="button"
                class="flex-1 text-sm px-4 py-2 rounded font-heading tracking-wide transition-all"
                :class="confirm.config.value.variant === 'danger'
                  ? 'bg-blood-deep border border-blood-base/40 text-blood-bright hover:bg-blood-base/20'
                  : 'btn-primary'"
                @click="confirm.accept()"
              >{{ confirm.config.value.confirmLabel ?? 'Confirm' }}</button>
            </div>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup lang="ts">
import { useConfirm } from '@/shared/composables/useConfirm'

const confirm = useConfirm()
</script>

<style scoped>
.dialog-fade-enter-active,
.dialog-fade-leave-active {
  transition: opacity 0.15s ease;
}
.dialog-fade-enter-active .relative,
.dialog-fade-leave-active .relative {
  transition: opacity 0.15s ease, transform 0.15s ease;
}
.dialog-fade-enter-from,
.dialog-fade-leave-to {
  opacity: 0;
}
.dialog-fade-enter-from .relative {
  transform: scale(0.95);
}
</style>
