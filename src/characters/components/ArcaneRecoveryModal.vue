<template>
  <Teleport to="body">
    <Transition name="ar-fade">
      <div
        v-if="show"
        class="fixed inset-0 z-50 flex items-center justify-center p-4"
        @keydown.esc="emit('close')"
      >
        <div class="absolute inset-0 bg-black/60" @click="emit('close')" />

        <div
          role="dialog"
          aria-modal="true"
          v-focus-trap
          aria-labelledby="arcane-recovery-title"
          class="relative w-full max-w-lg bg-void border border-shadow rounded-lg shadow-2xl flex flex-col max-h-[90vh]"
        >
          <!-- Accent bar -->
          <div class="h-0.5 w-full bg-arcane-base shrink-0" />

          <!-- Header -->
          <div class="px-5 pt-4 pb-3 shrink-0">
            <div class="flex items-center justify-between">
              <p id="arcane-recovery-title" class="font-heading text-base text-arcane-pale tracking-wide">Arcane Recovery</p>
              <span class="badge-arcane">Wizard Lv {{ wizardLevel }}</span>
            </div>
            <p class="font-body text-sm text-ash mt-0.5">
              Once per day on a short rest, recover expended spell slots with a combined level up to
              <span class="font-heading text-vellum">{{ budget }}</span>
              <span class="text-mist">(½ wizard level, rounded up)</span>. Slots of level 6+ can't be recovered.
            </p>
          </div>

          <!-- Body -->
          <div class="overflow-y-auto px-5 pb-5 space-y-4 flex-1">

            <!-- Budget counter -->
            <div class="flex items-center justify-between px-3 py-2.5 rounded border border-arcane-base/25 bg-arcane-deep/10">
              <span class="text-xs font-heading text-mist uppercase tracking-wide">Combined level</span>
              <span class="font-heading text-sm tabular-nums" :class="spent > 0 ? 'text-arcane-pale' : 'text-mist'">
                {{ spent }} / {{ budget }}
              </span>
            </div>

            <!-- Nothing to recover -->
            <p v-if="!hasRecoverable" class="text-sm font-body text-mist/60 italic text-center py-4">
              No expended spell slots of level 1–5 to recover.
            </p>

            <!-- Per-level steppers (levels 1–5) -->
            <div v-else class="space-y-2">
              <div
                v-for="lvl in recoverableLevels"
                :key="lvl"
                class="flex items-center gap-3 px-3 py-2.5 rounded border"
                :class="recovery[lvl] > 0 ? 'border-arcane-base/40 bg-arcane-deep/10' : 'border-shadow bg-depths/30'"
              >
                <span class="text-sm font-heading text-vellum w-16 shrink-0">Level {{ lvl }}</span>
                <span class="text-2xs font-body text-mist flex-1">
                  {{ expended(lvl) }} expended · recovering
                  <span class="font-heading" :class="recovery[lvl] > 0 ? 'text-arcane-pale' : 'text-mist'">{{ recovery[lvl] }}</span>
                </span>
                <div class="flex items-center gap-1.5 shrink-0">
                  <button
                    type="button"
                    class="w-6 h-6 flex items-center justify-center rounded border text-sm font-heading transition-all"
                    :class="recovery[lvl] > 0
                      ? 'border-shadow text-mist hover:border-blood-base/50 hover:text-blood-mid'
                      : 'border-shadow/20 text-mist/20 cursor-not-allowed'"
                    :disabled="recovery[lvl] === 0"
                    @click="change(lvl, -1)"
                  >−</button>
                  <span class="w-5 text-center font-heading text-sm text-vellum tabular-nums">{{ recovery[lvl] }}</span>
                  <button
                    type="button"
                    class="w-6 h-6 flex items-center justify-center rounded border text-sm font-heading transition-all"
                    :class="canIncrease(lvl)
                      ? 'border-shadow text-mist hover:border-arcane-base/50 hover:text-arcane-pale'
                      : 'border-shadow/20 text-mist/20 cursor-not-allowed'"
                    :disabled="!canIncrease(lvl)"
                    @click="change(lvl, 1)"
                  >+</button>
                </div>
              </div>
            </div>
          </div>

          <!-- Footer -->
          <div class="px-5 py-4 border-t border-shadow shrink-0 flex gap-2">
            <button type="button" class="flex-1 btn-secondary text-sm" @click="emit('close')">
              Cancel
            </button>
            <button
              type="button"
              class="flex-1 btn-primary text-sm"
              :disabled="spent === 0"
              @click="confirm"
            >
              Recover {{ spent > 0 ? `${spent} slot level${spent !== 1 ? 's' : ''}` : 'Slots' }}
            </button>
          </div>

        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import type { Character, SpellSlotsByLevel } from '@/shared/types/character'

const props = defineProps<{ show: boolean; character: Character }>()
const emit = defineEmits<{ close: []; confirm: [recovery: Partial<SpellSlotsByLevel>] }>()

// Arcane Recovery can only restore slots of level 1–5.
const RECOVERABLE_LEVELS = [1, 2, 3, 4, 5] as const
type RecLevel = (typeof RECOVERABLE_LEVELS)[number]

const wizardLevel = computed(() => props.character.combat.level)
const budget = computed(() => Math.ceil(wizardLevel.value / 2))

const slotsUsed = computed(() => props.character.spellcasting?.slotsUsed)

function expended(lvl: number): number {
  return slotsUsed.value?.[`level${lvl}` as keyof SpellSlotsByLevel] ?? 0
}

const recoverableLevels = computed<RecLevel[]>(() =>
  RECOVERABLE_LEVELS.filter(l => expended(l) > 0),
)
const hasRecoverable = computed(() => recoverableLevels.value.length > 0)

// Per-level recovery selection
const recovery = ref<Record<RecLevel, number>>({ 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 })

function resetSelection() {
  recovery.value = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 }
}
watch(() => props.show, (open) => { if (open) resetSelection() })

const spent = computed(() =>
  RECOVERABLE_LEVELS.reduce((sum, l) => sum + l * recovery.value[l], 0),
)

function canIncrease(lvl: RecLevel): boolean {
  return recovery.value[lvl] < expended(lvl) && spent.value + lvl <= budget.value
}

function change(lvl: RecLevel, delta: number) {
  if (delta > 0 && !canIncrease(lvl)) return
  if (delta < 0 && recovery.value[lvl] === 0) return
  recovery.value = { ...recovery.value, [lvl]: recovery.value[lvl] + delta }
}

function confirm() {
  if (spent.value === 0) return
  const out: Partial<SpellSlotsByLevel> = {}
  for (const l of RECOVERABLE_LEVELS) {
    if (recovery.value[l] > 0) out[`level${l}` as keyof SpellSlotsByLevel] = recovery.value[l]
  }
  emit('confirm', out)
}
</script>

<style scoped>
.ar-fade-enter-active, .ar-fade-leave-active { transition: opacity 0.15s ease; }
.ar-fade-enter-from, .ar-fade-leave-to { opacity: 0; }
</style>
