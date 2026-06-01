<template>
  <Transition name="roll-slide">
    <div
      v-if="result"
      class="fixed bottom-6 right-6 z-50 min-w-[240px] max-w-[300px] card shadow-modal overflow-hidden"
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
          class="shrink-0 w-12 h-12 rounded flex flex-col items-center justify-center border select-none gap-0.5"
          :class="dieClass"
        >
          <span class="text-2xs font-heading tracking-widest uppercase opacity-60 leading-none">
            {{ result.type === 'd20' ? 'd20' : dieLabel }}
          </span>
          <span class="font-heading text-xl leading-none">{{ result.die }}</span>
        </div>

        <!-- Info -->
        <div class="flex-1 min-w-0">
          <p class="text-2xs font-heading tracking-widest uppercase text-mist truncate">{{ result.label }}</p>

          <!-- Total -->
          <p class="font-heading leading-tight mt-0.5" :class="[totalClass, result.total >= 20 ? 'text-4xl' : 'text-3xl']">
            {{ result.total }}
          </p>

          <!-- d20 formula breakdown: die + modifier = total -->
          <div v-if="result.type === 'd20'" class="mt-1 space-y-0.5">
            <p class="text-xs font-mono text-mist/70">
              <span class="text-arcane-pale/90">{{ result.die }}</span>
              <template v-if="result.modifier !== 0">
                <span class="text-mist/40"> {{ result.modifier >= 0 ? '+' : '−' }} </span>
                <span>{{ Math.abs(result.modifier) }}</span>
              </template>
              <span class="text-mist/40"> = </span>
              <span class="text-vellum font-heading">{{ result.total }}</span>
            </p>
            <p v-if="result.modifierParts" class="text-2xs font-body text-mist/50 leading-snug">
              {{ result.modifierParts }}
            </p>
            <!-- Advantage / disadvantage dice -->
            <p v-if="result.die2 !== undefined" class="text-2xs font-body text-mist/40">
              <span :class="result.mode === 'advantage' ? 'text-gold-mid/70' : 'text-blood-mid/70'">
                {{ result.mode === 'advantage' ? '▲ Adv' : '▼ Dis' }}
              </span>
              · {{ result.die }} vs {{ result.die2 }}
            </p>
          </div>

          <!-- Damage formula breakdown: dice [X, Y] + flat = total -->
          <div v-else-if="result.type === 'damage'" class="mt-1 space-y-0.5">
            <p class="text-xs font-mono text-mist/70">
              <!-- Individual dice -->
              <template v-if="result.diceRolls?.length">
                <span class="text-blood-mid/90">[{{ result.diceRolls.join(', ') }}]</span>
                <template v-if="result.modifier !== 0">
                  <span class="text-mist/40"> {{ result.modifier >= 0 ? '+' : '−' }} </span>
                  <span>{{ Math.abs(result.modifier) }}</span>
                </template>
                <span class="text-mist/40"> = </span>
                <span class="text-vellum font-heading">{{ result.total }}</span>
              </template>
              <template v-else>
                {{ result.formula }}
              </template>
            </p>
            <p v-if="result.modifierParts" class="text-2xs font-body text-mist/50 leading-snug">
              {{ result.modifierParts }}
            </p>
          </div>

          <p v-if="result.isCrit" class="text-xs font-heading text-gold-mid mt-1 tracking-wide">Critical Hit!</p>
          <p v-else-if="result.isCritFail" class="text-xs font-heading text-blood-bright mt-1 tracking-wide">Critical Fail</p>
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
  if (result.value.isCrit)     return 'bg-gold-dim/20 border-gold-mid/60 text-gold-bright'
  if (result.value.isCritFail) return 'bg-blood-deep/30 border-blood-base/60 text-blood-bright'
  if (result.value.type === 'damage') return 'bg-blood-deep/10 border-blood-base/30 text-blood-mid'
  return 'bg-arcane-deep/20 border-arcane-base/40 text-arcane-pale'
})

const totalClass = computed(() => {
  if (!result.value) return 'text-vellum'
  if (result.value.isCrit)     return 'text-gold-bright'
  if (result.value.isCritFail) return 'text-blood-bright'
  return 'text-vellum'
})

// Extract die label from damage formula ("2d6+3" → "2d6")
const dieLabel = computed(() => {
  if (!result.value?.formula) return 'dmg'
  return result.value.formula.match(/^\d+d\d+/)?.[0] ?? 'dmg'
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
