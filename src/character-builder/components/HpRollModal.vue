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
          class="relative w-full max-w-lg bg-void border border-shadow rounded-lg shadow-2xl overflow-hidden"
        >
          <div class="h-0.5 w-full bg-gold-mid" />

          <div class="px-5 py-4 space-y-4">
            <div class="flex items-start justify-between gap-3">
              <div>
                <p class="font-heading text-base tracking-wide text-gold-mid">Roll Hit Points</p>
                <p class="text-xs font-body text-mist mt-0.5">
                  Level 1 always gets the maximum ({{ hitDie }}). Roll d{{ hitDie }} for each level after.
                </p>
              </div>
              <div class="text-right">
                <p class="text-2xs font-heading text-mist uppercase tracking-wide">Total HP</p>
                <p class="font-heading text-2xl text-gold-mid">{{ totalHp }}</p>
              </div>
            </div>

            <!-- House rule toggle -->
            <div class="flex items-center gap-3 px-3 py-2 rounded border border-shadow/40 bg-depths/30">
              <button
                type="button"
                class="w-8 h-4 rounded-full border transition-all duration-200 flex items-center px-0.5 shrink-0"
                :class="rerollOnes
                  ? 'bg-gold-dim/30 border-gold-mid/50 justify-end'
                  : 'bg-shadow border-shadow justify-start'"
                @click="rerollOnes = !rerollOnes"
              >
                <div class="w-3 h-3 rounded-full transition-all"
                  :class="rerollOnes ? 'bg-gold-mid' : 'bg-mist'" />
              </button>
              <div>
                <p class="text-xs font-heading text-ash">Reroll 1s</p>
                <p class="text-2xs font-body text-mist">House rule: clicking a die showing 1 rerolls it</p>
              </div>
            </div>

            <!-- Dice grid -->
            <div class="grid grid-cols-5 sm:grid-cols-8 gap-2 max-h-52 overflow-y-auto pr-1">
              <div
                v-for="(roll, idx) in rolls"
                :key="idx"
                class="flex flex-col items-center gap-1"
              >
                <p class="text-2xs font-heading text-mist/60 leading-none">Lv {{ idx + 1 }}</p>
                <div
                  class="w-10 h-10 rounded border flex items-center justify-center font-heading text-base transition-all relative"
                  :class="getDieClass(roll, idx)"
                  :title="idx === 0 ? 'Level 1: always max' : (canRerollDie(roll) ? 'Click to reroll' : '')"
                  @click="rerollDie(idx)"
                >
                  {{ idx === 0 ? hitDie : roll }}
                  <span v-if="idx === 0" class="absolute -top-1 -right-1 text-2xs bg-gold-mid text-void rounded px-0.5 leading-tight font-heading">max</span>
                </div>
                <p class="text-2xs font-heading leading-none" :class="getHpPerLevel(roll, idx) >= 0 ? 'text-verdant-bright' : 'text-blood-bright'">
                  +{{ getHpPerLevel(roll, idx) }}
                </p>
              </div>
            </div>

            <!-- Actions -->
            <div class="flex gap-2 pt-1">
              <button type="button" class="flex-1 btn-secondary text-sm gap-2" @click="rollAll">
                <span class="text-base">⚃</span> Reroll All
              </button>
              <button type="button" class="flex-1 btn-secondary text-sm" @click="$emit('close')">Cancel</button>
              <button
                type="button"
                class="flex-1 btn-primary text-sm"
                :disabled="rolls.length !== level"
                @click="confirm"
              >Confirm HP</button>
            </div>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'

const props = defineProps<{
  show: boolean
  hitDie: number
  level: number
  conMod: number
}>()

const emit = defineEmits<{
  close: []
  confirm: [rolls: number[]]
}>()

const rerollOnes = ref(false)
const rolls = ref<number[]>([])

function rollDie() {
  return Math.ceil(Math.random() * props.hitDie)
}

function rollAll() {
  rolls.value = Array.from({ length: props.level }, () => rollDie())
}

function canRerollDie(roll: number): boolean {
  return rerollOnes.value && roll === 1
}

function rerollDie(idx: number) {
  if (idx === 0) return
  if (!canRerollDie(rolls.value[idx])) return
  rolls.value = rolls.value.map((r, i) => i === idx ? rollDie() : r)
}

function getHpPerLevel(roll: number, idx: number): number {
  if (idx === 0) return props.hitDie + props.conMod
  return Math.max(1, roll + props.conMod)
}

function getDieClass(roll: number, idx: number): string {
  if (idx === 0) return 'border-gold-mid/50 bg-gold-dim/20 text-gold-mid cursor-default'
  if (roll === props.hitDie) return 'border-verdant-base/50 bg-verdant-deep/20 text-verdant-bright'
  if (roll === 1) return rerollOnes.value
    ? 'border-blood-base/50 bg-blood-deep/20 text-blood-bright cursor-pointer hover:bg-blood-base/30'
    : 'border-blood-base/30 bg-blood-deep/10 text-blood-mid'
  return 'border-shadow text-vellum'
}

const totalHp = computed(() => {
  if (rolls.value.length !== props.level) return 0
  return rolls.value.reduce((sum, roll, idx) => sum + getHpPerLevel(roll, idx), 0)
})

function confirm() {
  emit('confirm', [...rolls.value])
}

watch(() => props.show, (val) => {
  if (val && rolls.value.length !== props.level) rollAll()
})
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
.dialog-fade-leave-to { opacity: 0; }
.dialog-fade-enter-from .relative { transform: scale(0.95); }
</style>
