<template>
  <Transition name="roll-slide">
    <div
      v-if="result"
      class="fixed bottom-6 right-6 z-50 min-w-[220px] max-w-[280px] card shadow-modal overflow-hidden"
      role="status"
      aria-live="polite"
    >
      <!-- Accent bar -->
      <div
        class="h-0.5 w-full"
        :class="result.isCrit ? 'bg-gold-mid' : result.isCritFail ? 'bg-blood-bright' : result.type === 'damage' ? 'bg-blood-base/60' : 'bg-arcane-base/60'"
      />

      <div class="p-4 flex items-start gap-3">
        <!-- Die face -->
        <div
          class="shrink-0 w-12 h-12 rounded flex items-center justify-center font-heading text-xl border select-none"
          :class="dieClass"
        >
          <span v-if="result.type === 'd20'">{{ result.die }}</span>
          <span v-else class="text-base">{{ result.formula }}</span>
        </div>

        <!-- Info -->
        <div class="flex-1 min-w-0">
          <p class="text-2xs font-heading tracking-widest uppercase text-mist truncate">{{ result.label }}</p>
          <p class="font-heading leading-tight mt-0.5" :class="[totalClass, result.total >= 20 ? 'text-4xl' : 'text-3xl']">
            {{ result.total }}
          </p>
          <p v-if="result.type === 'd20' && result.modifier !== 0" class="text-xs font-body text-mist/60 mt-0.5">
            {{ result.die }}
            {{ result.modifier >= 0 ? '+' : '' }}{{ result.modifier }}
            = {{ result.total }}
          </p>
          <p v-if="result.die2 !== undefined" class="text-2xs font-body text-mist/40 mt-0.5">
            <span :class="result.mode === 'advantage' ? 'text-gold-mid/70' : 'text-blood-mid/70'">
              {{ result.mode === 'advantage' ? '▲' : '▼' }}
            </span>
            {{ result.die }} vs {{ result.die2 }}
          </p>
          <p v-if="result.isCrit" class="text-xs font-heading text-gold-mid mt-0.5 tracking-wide">Critical Hit!</p>
          <p v-else-if="result.isCritFail" class="text-xs font-heading text-blood-bright mt-0.5 tracking-wide">Critical Fail</p>
        </div>

        <!-- Dismiss -->
        <button
          type="button"
          class="shrink-0 text-mist/30 hover:text-mist transition-colors p-0.5"
          aria-label="Dismiss roll result"
          @click="dismiss()"
        >✕</button>
      </div>
    </div>
  </Transition>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useRoll } from '@/shared/composables/useRoll'

const { current: result, dismiss } = useRoll()

const dieClass = computed(() => {
  if (!result.value) return ''
  if (result.value.isCrit)    return 'bg-gold-dim/20 border-gold-mid/60 text-gold-bright'
  if (result.value.isCritFail) return 'bg-blood-deep/30 border-blood-base/60 text-blood-bright'
  if (result.value.type === 'damage') return 'bg-blood-deep/10 border-blood-base/30 text-blood-mid'
  return 'bg-arcane-deep/20 border-arcane-base/40 text-arcane-pale'
})

const totalClass = computed(() => {
  if (!result.value) return 'text-vellum'
  if (result.value.isCrit)    return 'text-gold-bright'
  if (result.value.isCritFail) return 'text-blood-bright'
  return 'text-vellum'
})
</script>

<style scoped>
.roll-slide-enter-active,
.roll-slide-leave-active {
  transition: opacity 0.2s ease, transform 0.2s ease;
}
.roll-slide-enter-from,
.roll-slide-leave-to {
  opacity: 0;
  transform: translateY(8px) scale(0.97);
}
</style>
