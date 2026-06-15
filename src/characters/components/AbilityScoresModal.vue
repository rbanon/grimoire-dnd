<template>
  <Teleport to="body">
    <Transition name="dialog-fade">
      <div
        v-if="show"
        class="fixed inset-0 z-[60] flex items-center justify-center p-4"
        @keydown.esc="$emit('close')"
      >
        <div class="absolute inset-0 bg-black/60" aria-hidden="true" @click="$emit('close')" />

        <div
          role="dialog"
          aria-modal="true"
          v-focus-trap
          aria-labelledby="ability-scores-title"
          class="relative w-full max-w-md bg-void border border-shadow rounded-lg shadow-2xl overflow-hidden"
        >
          <div class="h-0.5 w-full bg-gold-mid" />

          <div class="px-5 py-4 space-y-4">
            <div>
              <p id="ability-scores-title" class="font-heading text-base tracking-wide text-gold-mid">Ability Scores</p>
              <p class="text-xs font-body text-mist mt-0.5">
                Adjust this character's six ability scores. Modifiers update as you type.
              </p>
            </div>

            <!-- Score grid -->
            <div class="grid grid-cols-3 gap-2.5">
              <div
                v-for="ab in ABILITIES"
                :key="ab.key"
                class="card p-3 text-center"
              >
                <p class="text-2xs font-heading tracking-[0.2em] uppercase text-mist">{{ ab.label }}</p>
                <input
                  v-model.number="draft[ab.key]"
                  type="number"
                  min="1"
                  max="30"
                  class="w-full text-center font-heading text-2xl bg-transparent outline-none border-b border-shadow focus:border-gold-mid/60 text-vellum mt-1.5 pb-0.5 transition-colors"
                />
                <p
                  class="text-xs font-body mt-1.5 leading-none"
                  :class="modOf(draft[ab.key]) >= 0 ? 'text-gold-mid' : 'text-blood-bright'"
                >{{ fmtMod(modOf(draft[ab.key])) }}</p>
              </div>
            </div>

            <!-- Actions -->
            <div class="flex gap-2 pt-1">
              <button type="button" class="flex-1 btn-secondary text-sm" @click="$emit('close')">Cancel</button>
              <button type="button" class="flex-1 btn-primary text-sm" @click="save">Save</button>
            </div>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup lang="ts">
import { reactive, watch } from 'vue'
import { computeModifier } from '@/shared/types/character'
import type { AbilityName, AbilityScores, Character } from '@/shared/types/character'

const props = defineProps<{ show: boolean; character: Character }>()
const emit = defineEmits<{
  close: []
  save: [AbilityScores]
}>()

const ABILITIES: { key: AbilityName; label: string }[] = [
  { key: 'str', label: 'STR' },
  { key: 'dex', label: 'DEX' },
  { key: 'con', label: 'CON' },
  { key: 'int', label: 'INT' },
  { key: 'wis', label: 'WIS' },
  { key: 'cha', label: 'CHA' },
]

const draft = reactive<AbilityScores>({ str: 10, dex: 10, con: 10, int: 10, wis: 10, cha: 10 })

watch(
  () => props.show,
  (open) => { if (open) Object.assign(draft, props.character.abilityScores) },
  { immediate: true },
)

function clamp(n: number): number {
  return Math.max(1, Math.min(30, Math.round(n || 10)))
}

function modOf(score: number): number {
  return computeModifier(clamp(score))
}

function fmtMod(n: number): string {
  return n >= 0 ? `+${n}` : String(n)
}

function save() {
  const result = {} as AbilityScores
  for (const ab of ABILITIES) result[ab.key] = clamp(draft[ab.key])
  emit('save', result)
}
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
