<template>
  <Teleport to="body">
    <Transition name="fm-fade">
      <div
        v-if="show"
        class="fixed inset-0 z-50 flex items-center justify-center p-4"
        @keydown.esc="emit('close')"
      >
        <div class="absolute inset-0 bg-black/60" @click="emit('close')" />

        <div class="relative w-full max-w-lg bg-void border border-shadow rounded-lg shadow-2xl flex flex-col max-h-[90vh]">
          <div class="h-0.5 w-full bg-arcane-base shrink-0" />

          <!-- Header -->
          <div class="px-5 pt-4 pb-3 shrink-0">
            <div class="flex items-center justify-between">
              <p class="font-heading text-base text-arcane-pale tracking-wide">Font of Magic</p>
              <span class="badge-arcane">{{ points }} / {{ maxPoints }} SP</span>
            </div>
            <p class="font-body text-sm text-ash mt-0.5">
              As a Bonus Action, convert sorcery points into spell slots, or expend a slot to regain points.
            </p>
          </div>

          <div class="overflow-y-auto px-5 pb-5 space-y-5 flex-1">
            <!-- Create slots from sorcery points -->
            <section class="space-y-2">
              <p class="label">Create a spell slot</p>
              <p class="text-2xs font-body text-mist">Spends sorcery points to recover one expended slot.</p>
              <div class="grid grid-cols-1 gap-1.5">
                <button
                  v-for="lvl in CREATE_LEVELS"
                  :key="`c${lvl}`"
                  type="button"
                  class="flex items-center justify-between gap-3 px-3 py-2.5 rounded border text-left transition-all"
                  :class="canCreate(lvl)
                    ? 'border-arcane-base/30 bg-arcane-deep/10 hover:border-arcane-base/60'
                    : 'border-shadow/40 bg-depths/20 opacity-40 cursor-not-allowed'"
                  :disabled="!canCreate(lvl)"
                  @click="createSlot(lvl)"
                >
                  <span class="text-sm font-heading text-vellum">Level {{ lvl }} slot</span>
                  <span class="text-2xs font-body text-mist">
                    {{ expended(lvl) }} expended · costs <span class="font-heading text-arcane-pale">{{ CREATE_COST[lvl] }} SP</span>
                  </span>
                </button>
              </div>
            </section>

            <!-- Convert slot back to points -->
            <section class="space-y-2">
              <p class="label">Convert a slot to sorcery points</p>
              <p class="text-2xs font-body text-mist">Expends an available slot to gain points equal to its level (up to your max).</p>
              <div class="grid grid-cols-1 gap-1.5">
                <button
                  v-for="lvl in CONVERT_LEVELS"
                  :key="`x${lvl}`"
                  type="button"
                  class="flex items-center justify-between gap-3 px-3 py-2.5 rounded border text-left transition-all"
                  :class="canConvert(lvl)
                    ? 'border-gold-dim/30 bg-gold-dim/5 hover:border-gold-mid/50'
                    : 'border-shadow/40 bg-depths/20 opacity-40 cursor-not-allowed'"
                  :disabled="!canConvert(lvl)"
                  @click="convertSlot(lvl)"
                >
                  <span class="text-sm font-heading text-vellum">Level {{ lvl }} slot</span>
                  <span class="text-2xs font-body text-mist">
                    {{ available(lvl) }} available · gain <span class="font-heading text-gold-mid">+{{ lvl }} SP</span>
                  </span>
                </button>
              </div>
            </section>
          </div>

          <div class="px-5 py-4 border-t border-shadow shrink-0">
            <button type="button" class="w-full btn-secondary text-sm" @click="emit('close')">Done</button>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import type { Character, SpellSlotsByLevel } from '@/shared/types/character'

const props = defineProps<{ show: boolean; character: Character }>()
const emit = defineEmits<{
  close: []
  /** slotLevel changes one slot; sorceryPointsDelta adjusts the pool. */
  convert: [payload: { slotLevel: number; slotDelta: 1 | -1; sorceryPointsDelta: number }]
}>()

// PHB Font of Magic: cost in sorcery points to create a slot of each level.
const CREATE_COST: Record<number, number> = { 1: 2, 2: 3, 3: 5, 4: 6, 5: 7 }
const CREATE_LEVELS = [1, 2, 3, 4, 5] as const
const CONVERT_LEVELS = [1, 2, 3, 4, 5] as const

const sc = computed(() => props.character.spellcasting)
const pool = computed(() => props.character.resources.find((r) => r.id === 'sorcery-points') ?? null)
const points = computed(() => pool.value?.current ?? 0)
const maxPoints = computed(() => pool.value?.max ?? 0)

function key(lvl: number) { return `level${lvl}` as keyof SpellSlotsByLevel }
function maxSlots(lvl: number) { return sc.value?.slotsMax[key(lvl)] ?? 0 }
function expended(lvl: number) { return sc.value?.slotsUsed[key(lvl)] ?? 0 }
function available(lvl: number) { return Math.max(0, maxSlots(lvl) - expended(lvl)) }

// Create: need an expended slot to recover and enough points.
function canCreate(lvl: number): boolean {
  return expended(lvl) > 0 && points.value >= CREATE_COST[lvl]
}
// Convert: need an available slot, and not already at max points.
function canConvert(lvl: number): boolean {
  return available(lvl) > 0 && points.value < maxPoints.value
}

function createSlot(lvl: number) {
  if (!canCreate(lvl)) return
  emit('convert', { slotLevel: lvl, slotDelta: -1, sorceryPointsDelta: -CREATE_COST[lvl] })
}

function convertSlot(lvl: number) {
  if (!canConvert(lvl)) return
  const gain = Math.min(lvl, maxPoints.value - points.value)
  emit('convert', { slotLevel: lvl, slotDelta: 1, sorceryPointsDelta: gain })
}
</script>

<style scoped>
.fm-fade-enter-active, .fm-fade-leave-active { transition: opacity 0.15s ease; }
.fm-fade-enter-from, .fm-fade-leave-to { opacity: 0; }
</style>
