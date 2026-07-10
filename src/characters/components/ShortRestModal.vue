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
          aria-labelledby="short-rest-title"
          class="relative w-full max-w-sm bg-void border border-shadow rounded-lg shadow-2xl overflow-hidden"
        >
          <div class="h-0.5 w-full bg-gold-mid" />

          <div class="px-5 py-4 space-y-4">
            <div>
              <p id="short-rest-title" class="font-heading text-base tracking-wide text-gold-mid">Short Rest</p>
              <p class="text-xs font-body text-mist mt-0.5">
                Spend hit dice to recover HP. A short rest is always possible.
              </p>
            </div>

            <!-- Hit dice available -->
            <div class="flex items-center justify-between px-3 py-2.5 rounded border border-shadow bg-depths/40">
              <div>
                <p class="text-xs font-heading text-stone">Available Hit Dice</p>
                <p class="text-2xs font-body text-mist mt-0.5">
                  CON mod: {{ conModDisplay }} · each die adds this to the roll
                </p>
              </div>
              <p class="font-heading text-xl text-gold-mid">
                {{ hitDiceRemaining }}<span class="text-xs text-mist ml-0.5">d{{ hitDie }}</span>
              </p>
            </div>

            <!-- Dice to spend selector -->
            <div class="space-y-1.5">
              <p class="text-xs font-heading text-stone">Dice to Spend</p>
              <div class="flex items-center gap-4 justify-center">
                <button
                  type="button"
                  class="w-8 h-8 flex items-center justify-center rounded border font-heading text-lg transition-all"
                  :class="diceToSpend > 0
                    ? 'border-shadow text-mist hover:border-gold-dim/40 hover:text-stone cursor-pointer'
                    : 'border-shadow/30 text-mist/20 cursor-not-allowed'"
                  :disabled="diceToSpend <= 0"
                  @click="diceToSpend = Math.max(0, diceToSpend - 1)"
                >−</button>
                <div class="text-center w-16">
                  <p class="font-heading text-3xl text-vellum leading-none">{{ diceToSpend }}</p>
                  <p class="text-2xs font-body text-mist mt-0.5">
                    {{ diceToSpend === 0 ? 'no dice' : `d${hitDie}` }}
                  </p>
                </div>
                <button
                  type="button"
                  class="w-8 h-8 flex items-center justify-center rounded border font-heading text-lg transition-all"
                  :class="diceToSpend < hitDiceRemaining
                    ? 'border-shadow text-mist hover:border-gold-dim/40 hover:text-stone cursor-pointer'
                    : 'border-shadow/30 text-mist/20 cursor-not-allowed'"
                  :disabled="diceToSpend >= hitDiceRemaining"
                  @click="diceToSpend = Math.min(hitDiceRemaining, diceToSpend + 1)"
                >+</button>
              </div>

              <!-- Healing estimate -->
              <p class="text-center text-xs font-body text-mist">
                <template v-if="diceToSpend === 0">No HP will be recovered</template>
                <template v-else>
                  Expected: ~{{ expectedHeal }} HP
                  <span class="text-mist/50">({{ diceToSpend }}d{{ hitDie }} + {{ diceToSpend * conMod }} CON)</span>
                </template>
              </p>
            </div>

            <!-- No dice note -->
            <div
              v-if="hitDiceRemaining === 0"
              class="flex items-start gap-2 px-3 py-2 rounded border border-shadow/40 bg-depths/20"
            >
              <span class="text-gold-dim/60 text-xs shrink-0 mt-0.5">ℹ</span>
              <p class="text-xs font-body text-mist">
                No hit dice remaining. You can still rest, some class features and spells recover on a short rest.
              </p>
            </div>

            <!-- Actions -->
            <div class="flex gap-2 pt-1">
              <button type="button" class="flex-1 btn-secondary text-sm" @click="$emit('close')">Cancel</button>
              <button type="button" class="flex-1 btn-primary text-sm" @click="doRest">Take Rest</button>
            </div>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { computeModifier } from '@/shared/types/character'
import type { Character } from '@/shared/types/character'
import { CLASS_META } from '@/character-builder/classMeta'

const props = defineProps<{ show: boolean; character: Character }>()
const emit = defineEmits<{
  close: []
  rested: [{ healed: number; diceSpent: number; rolls: number[]; newHp: number; newHitDice: number }]
}>()

const diceToSpend = ref(0)

const hitDie = computed(() => CLASS_META[props.character.identity.class.index]?.hitDie ?? 8)
const hitDiceRemaining = computed(() => props.character.combat.hitDiceRemaining)
const conMod = computed(() => computeModifier(props.character.abilityScores.con))
const conModDisplay = computed(() => conMod.value >= 0 ? `+${conMod.value}` : String(conMod.value))
const expectedHeal = computed(() => {
  const avgDie = Math.floor(hitDie.value / 2) + 1
  return Math.max(0, diceToSpend.value * (avgDie + conMod.value))
})

function doRest() {
  const rolls: number[] = []
  for (let i = 0; i < diceToSpend.value; i++) {
    rolls.push(Math.ceil(Math.random() * hitDie.value))
  }
  const rawHeal = rolls.reduce((sum, r) => sum + r + conMod.value, 0)
  const healed = Math.max(0, rawHeal)
  const newHp = Math.min(props.character.combat.maxHp, props.character.combat.currentHp + healed)
  const newHitDice = hitDiceRemaining.value - diceToSpend.value
  emit('rested', { healed, diceSpent: diceToSpend.value, rolls, newHp, newHitDice })
  diceToSpend.value = 0
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
