<template>
  <Teleport to="body">
    <template v-if="pending">
      <div class="fixed inset-0 z-40" @click="cancelRoll()" />
      <Transition name="confirm-pop">
        <div
          class="fixed z-50 card shadow-modal p-2 w-[200px]"
          :style="popoverStyle"
        >
          <p class="text-2xs font-heading tracking-widest uppercase text-mist px-1 mb-2 truncate">
            {{ pending.label }}
          </p>
          <div class="flex flex-col gap-0.5">
            <button
              v-for="opt in OPTIONS"
              :key="opt.mode"
              type="button"
              class="flex items-center gap-2.5 px-2 py-1.5 rounded text-left w-full transition-colors hover:bg-depths group"
              @click="confirmRoll(opt.mode)"
            >
              <span class="text-sm leading-none shrink-0" :class="opt.color">{{ opt.icon }}</span>
              <div class="min-w-0">
                <p class="text-xs font-heading text-ash group-hover:text-vellum transition-colors">{{ opt.label }}</p>
                <p class="text-2xs font-body text-mist/40">{{ opt.hint }}</p>
              </div>
            </button>
          </div>
        </div>
      </Transition>
    </template>
  </Teleport>
</template>

<script setup lang="ts">
import { computed, onMounted, onUnmounted } from 'vue'
import { useRoll } from '@/shared/composables/useRoll'
import type { RollMode } from '@/shared/composables/useRoll'

const { pending, confirmRoll, cancelRoll } = useRoll()

const OPTIONS: { mode: RollMode; label: string; hint: string; icon: string; color: string }[] = [
  { mode: 'normal',       label: 'Normal',     hint: '1d20',             icon: '⬡', color: 'text-arcane-pale' },
  { mode: 'advantage',    label: 'Ventaja',    hint: '2d20, toma mayor', icon: '▲', color: 'text-gold-mid'    },
  { mode: 'disadvantage', label: 'Desventaja', hint: '2d20, toma menor', icon: '▼', color: 'text-blood-mid'   },
]

const popoverStyle = computed(() => {
  const rect = pending.value?.rect
  if (!rect) return { top: '50%', left: '50%', transform: 'translate(-50%,-50%)' }

  const W = 200, H = 152
  const vw = window.innerWidth, vh = window.innerHeight

  let top = rect.bottom + 8
  let left = rect.left

  if (top + H > vh - 8) top = rect.top - H - 8
  if (left + W > vw - 8) left = vw - W - 8
  if (left < 8) left = 8
  if (top < 8) top = 8

  return { top: `${top}px`, left: `${left}px` }
})

function onKeydown(e: KeyboardEvent) {
  if (e.key === 'Escape') cancelRoll()
}
onMounted(() => window.addEventListener('keydown', onKeydown))
onUnmounted(() => window.removeEventListener('keydown', onKeydown))
</script>

<style scoped>
.confirm-pop-enter-active,
.confirm-pop-leave-active {
  transition: opacity 0.12s ease, transform 0.12s ease;
}
.confirm-pop-enter-from,
.confirm-pop-leave-to {
  opacity: 0;
  transform: translateY(-4px) scale(0.96);
}
</style>
