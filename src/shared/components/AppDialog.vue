<template>
  <Teleport to="body">
    <Transition name="dialog-fade">
      <div
        v-if="dialog.config.value"
        class="fixed inset-0 z-[60] flex items-center justify-center p-4"
        @click.self="dialog.close()"
        @keydown.esc="dialog.close()"
      >
        <!-- Backdrop -->
        <div class="absolute inset-0 bg-black/60" aria-hidden="true" />

        <!-- Panel -->
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="app-dialog-title"
          v-focus-trap
          class="relative w-full max-w-sm bg-void border border-shadow rounded-lg shadow-2xl overflow-hidden"
        >
          <!-- Accent bar -->
          <div
            class="h-0.5 w-full"
            :class="{
              'bg-gold-mid':    dialog.config.value.variant !== 'success' && dialog.config.value.variant !== 'danger',
              'bg-emerald-500': dialog.config.value.variant === 'success',
              'bg-blood-bright': dialog.config.value.variant === 'danger',
            }"
          />

          <div class="px-5 py-4">
            <!-- Title -->
            <p
              id="app-dialog-title"
              class="font-heading text-base tracking-wide mb-1"
              :class="{
                'text-gold-mid':    dialog.config.value.variant !== 'success' && dialog.config.value.variant !== 'danger',
                'text-emerald-400': dialog.config.value.variant === 'success',
                'text-blood-bright': dialog.config.value.variant === 'danger',
              }"
            >{{ dialog.config.value.title }}</p>

            <!-- Body -->
            <p class="font-body text-sm text-ash leading-relaxed">{{ dialog.config.value.body }}</p>

            <!-- Detail items -->
            <dl
              v-if="dialog.config.value.items?.length"
              class="mt-3 pt-3 border-t border-shadow/60 space-y-1.5"
            >
              <div
                v-for="item in dialog.config.value.items"
                :key="item.label"
                class="flex justify-between items-baseline gap-4"
              >
                <dt class="text-2xs font-heading tracking-[0.12em] uppercase text-mist shrink-0">{{ item.label }}</dt>
                <dd class="font-body text-sm text-stone text-right">{{ item.value }}</dd>
              </div>
            </dl>

            <!-- Dismiss -->
            <button
              class="mt-4 btn-primary w-full text-sm"
              @click="dialog.close()"
            >OK</button>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup lang="ts">
import { useDialog } from '@/shared/composables/useDialog'

const dialog = useDialog()
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
