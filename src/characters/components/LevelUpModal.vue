<template>
  <Teleport to="body">
    <Transition name="levelup-fade">
      <div
        v-if="show"
        class="fixed inset-0 z-[60] flex items-center justify-center p-4"
        @keydown.esc="$emit('close')"
      >
        <div class="absolute inset-0 bg-black/60" aria-hidden="true" @click="$emit('close')" />

        <div
          role="dialog"
          aria-modal="true"
          class="relative w-full max-w-md bg-void border border-shadow rounded-lg shadow-2xl overflow-y-auto max-h-[90vh]"
        >
          <div class="h-0.5 w-full bg-gold-mid" />

          <div class="px-5 py-4 space-y-5">

            <!-- Title -->
            <div>
              <p class="font-heading text-base tracking-wide text-gold-mid">
                Level Up
                <span class="font-body text-sm text-mist font-normal ml-1.5">
                  {{ character.identity.class.name }} {{ character.combat.level }} → {{ newLevel }}
                </span>
              </p>
              <p class="text-xs font-body text-mist/70 mt-0.5">{{ character.identity.name }}</p>
            </div>

            <!-- At max level -->
            <p v-if="atMaxLevel" class="text-sm font-body text-mist italic text-center py-3">
              This character has reached the maximum level (20).
            </p>

            <!-- HP gain -->
            <section v-else class="space-y-2">
              <p class="text-2xs font-heading tracking-[0.15em] uppercase text-stone">Hit Points Gained</p>
              <div class="grid grid-cols-2 gap-2">

                <!-- Roll -->
                <button
                  type="button"
                  class="flex flex-col items-start px-3 py-3 rounded border transition-all"
                  :class="hpChoice === 'roll'
                    ? 'border-gold-mid/60 bg-depths/60'
                    : 'border-shadow bg-depths/20 hover:border-shadow/80'"
                  @click="selectRoll"
                >
                  <span class="text-2xs font-heading uppercase tracking-wider text-mist mb-2">Roll</span>
                  <span
                    class="font-heading text-3xl leading-none"
                    :class="hpChoice === 'roll' ? 'text-gold-mid' : 'text-ash'"
                  >{{ rollDisplay }}</span>
                  <span class="text-2xs font-body text-mist mt-1.5">
                    {{ rawDie === null
                      ? `click to roll d${hitDie}`
                      : `d${hitDie}(${rawDie}) ${conMod >= 0 ? '+' : ''}${conMod} CON` }}
                  </span>
                </button>

                <!-- Average -->
                <button
                  type="button"
                  class="flex flex-col items-start px-3 py-3 rounded border transition-all"
                  :class="hpChoice === 'average'
                    ? 'border-gold-mid/60 bg-depths/60'
                    : 'border-shadow bg-depths/20 hover:border-shadow/80'"
                  @click="hpChoice = 'average'"
                >
                  <span class="text-2xs font-heading uppercase tracking-wider text-mist mb-2">Take Average</span>
                  <span
                    class="font-heading text-3xl leading-none"
                    :class="hpChoice === 'average' ? 'text-gold-mid' : 'text-ash'"
                  >+{{ averageHp }}</span>
                  <span class="text-2xs font-body text-mist mt-1.5">
                    ⌀{{ Math.floor(hitDie / 2) + 1 }} {{ conMod >= 0 ? '+' : '' }}{{ conMod }} CON
                  </span>
                </button>

              </div>

              <p v-if="hpChoice !== null" class="text-center text-xs font-body text-stone">
                Max HP: {{ character.combat.maxHp }}
                <span class="mx-1 text-mist/40">→</span>
                <span class="text-gold-mid font-heading">{{ character.combat.maxHp + hpGained }}</span>
              </p>
            </section>

            <!-- Spell slots -->
            <section v-if="character.spellcasting && slotsChanged" class="space-y-2">
              <p class="text-2xs font-heading tracking-[0.15em] uppercase text-stone">Spell Slots Updated</p>
              <div class="flex flex-wrap gap-1.5">
                <span
                  v-for="slot in newSlotsDisplay"
                  :key="slot.label"
                  class="px-2 py-0.5 rounded border text-2xs font-heading"
                  :class="slot.increased
                    ? 'border-arcane-base/60 text-arcane-pale bg-arcane-base/10'
                    : 'border-shadow text-mist'"
                >{{ slot.label }}: {{ slot.count }}</span>
              </div>
            </section>

            <!-- Features gained -->
            <section v-if="featuresGained.length" class="space-y-1.5">
              <p class="text-2xs font-heading tracking-[0.15em] uppercase text-stone">Features Gained</p>
              <ul class="space-y-1">
                <li
                  v-for="f in featuresGained"
                  :key="f"
                  class="flex items-start gap-2 text-xs font-body text-ash"
                >
                  <span class="text-gold-dim/50 shrink-0 mt-px">◆</span>
                  {{ f }}
                </li>
              </ul>
            </section>

            <!-- Spell / cantrip note -->
            <div
              v-if="spellNote"
              class="flex items-start gap-2 px-3 py-2 rounded border border-arcane-base/30 bg-arcane-base/5"
            >
              <span class="text-arcane-pale shrink-0 mt-px text-sm">✦</span>
              <p class="text-xs font-body text-mist">{{ spellNote }}</p>
            </div>

            <!-- ASI note -->
            <div
              v-if="isAsiLevel"
              class="flex items-start gap-2 px-3 py-2 rounded border border-gold-dim/30 bg-gold-dim/5"
            >
              <span class="text-gold-mid shrink-0 mt-px">↑</span>
              <p class="text-xs font-body text-mist">
                You gain an <span class="text-vellum font-heading">Ability Score Improvement</span>.
                Unlock the sheet to edit your scores.
              </p>
            </div>

            <!-- Subclass unlock note -->
            <div
              v-if="isSubclassLevel"
              class="flex items-start gap-2 px-3 py-2 rounded border border-gold-dim/30 bg-gold-dim/5"
            >
              <span class="text-gold-mid shrink-0 mt-px">★</span>
              <p class="text-xs font-body text-mist">
                You unlock your
                <span class="text-vellum font-heading">{{ character.identity.class.name }} subclass</span>
                at level 3. Rebuild the character from the list to pick one.
              </p>
            </div>

            <!-- Actions -->
            <div class="flex gap-2 pt-1">
              <button type="button" class="flex-1 btn-secondary text-sm" @click="$emit('close')">
                Cancel
              </button>
              <button
                type="button"
                class="flex-1 btn-primary text-sm"
                :disabled="!canConfirm"
                @click="confirm"
              >
                {{ atMaxLevel ? 'Close' : 'Level Up' }}
              </button>
            </div>

          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { computeModifier } from '@/shared/types/character'
import type { Character } from '@/shared/types/character'
import {
  CLASS_META, CLASS_LEVELS,
  getSpellSlots, getSpellProfile, getAsiLevels,
} from '@/character-builder/classMeta'
import type { SpellSlotsMax } from '@/character-builder/classMeta'

const props = defineProps<{ show: boolean; character: Character }>()
const emit = defineEmits<{
  close: []
  leveled: [updates: Partial<Character>]
}>()

const hitDie = computed(() => CLASS_META[props.character.identity.class.index]?.hitDie ?? 8)
const conMod = computed(() => computeModifier(props.character.abilityScores.con))
const newLevel = computed(() => Math.min(20, props.character.combat.level + 1))
const atMaxLevel = computed(() => props.character.combat.level >= 20)

// ── HP ────────────────────────────────────────────────────────────────────────

const hpChoice = ref<'roll' | 'average' | null>(null)
const rawDie = ref<number | null>(null)
const rolledHp = ref(0)

const averageHp = computed(() => Math.max(1, Math.floor(hitDie.value / 2) + 1 + conMod.value))

const hpGained = computed(() => {
  if (hpChoice.value === 'average') return averageHp.value
  if (hpChoice.value === 'roll') return rolledHp.value
  return 0
})

const rollDisplay = computed(() => {
  if (hpChoice.value !== 'roll' || rawDie.value === null) return `d${hitDie.value}`
  return `+${rolledHp.value}`
})

function selectRoll() {
  rawDie.value = Math.ceil(Math.random() * hitDie.value)
  rolledHp.value = Math.max(1, rawDie.value + conMod.value)
  hpChoice.value = 'roll'
}

// ── Spell slots ───────────────────────────────────────────────────────────────

const newSlots = computed((): SpellSlotsMax =>
  getSpellSlots(props.character.identity.class.index, newLevel.value),
)

const slotsChanged = computed(() => {
  const sc = props.character.spellcasting
  if (!sc) return false
  const keys: (keyof SpellSlotsMax)[] = ['level1','level2','level3','level4','level5','level6','level7','level8','level9']
  return keys.some(k => newSlots.value[k] !== sc.slotsMax[k])
})

const newSlotsDisplay = computed(() => {
  const sc = props.character.spellcasting
  const keys: Array<{ k: keyof SpellSlotsMax; label: string }> = [
    { k: 'level1', label: 'Lv 1' }, { k: 'level2', label: 'Lv 2' }, { k: 'level3', label: 'Lv 3' },
    { k: 'level4', label: 'Lv 4' }, { k: 'level5', label: 'Lv 5' }, { k: 'level6', label: 'Lv 6' },
    { k: 'level7', label: 'Lv 7' }, { k: 'level8', label: 'Lv 8' }, { k: 'level9', label: 'Lv 9' },
  ]
  return keys
    .map(({ k, label }) => ({
      label,
      count: newSlots.value[k],
      increased: !!sc && newSlots.value[k] > sc.slotsMax[k],
    }))
    .filter(x => x.count > 0)
})

// ── Features ──────────────────────────────────────────────────────────────────

const featuresGained = computed((): string[] =>
  CLASS_LEVELS[props.character.identity.class.index]?.[newLevel.value]?.features ?? [],
)

// ── Misc checks ───────────────────────────────────────────────────────────────

const isAsiLevel = computed(() =>
  getAsiLevels(props.character.identity.class.index).includes(newLevel.value),
)

const isSubclassLevel = computed(() =>
  newLevel.value === 3 && !props.character.identity.subclass,
)

const spellNote = computed(() => {
  const profile = getSpellProfile(props.character.identity.class.index)
  if (!profile) return null
  const lvl = props.character.combat.level
  const deltaCantrips = (profile.cantripsKnown[newLevel.value - 1] ?? 0) - (profile.cantripsKnown[lvl - 1] ?? 0)
  const deltaSpells = (profile.spellsKnown?.[newLevel.value - 1] ?? 0) - (profile.spellsKnown?.[lvl - 1] ?? 0)
  const parts: string[] = []
  if (deltaCantrips > 0) parts.push(`${deltaCantrips} new cantrip${deltaCantrips > 1 ? 's' : ''}`)
  if (deltaSpells > 0) parts.push(`${deltaSpells} new spell${deltaSpells > 1 ? 's' : ''}`)
  return parts.length ? parts.join(' and ') + ' available — go to the Spells tab to select.' : null
})

const canConfirm = computed(() => atMaxLevel.value || hpChoice.value !== null)

// ── Reset on open ─────────────────────────────────────────────────────────────

watch(() => props.show, (v) => {
  if (v) {
    hpChoice.value = null
    rawDie.value = null
    rolledHp.value = 0
  }
})

// ── Confirm ───────────────────────────────────────────────────────────────────

function confirm() {
  if (atMaxLevel.value) { emit('close'); return }
  if (!canConfirm.value) return

  const c = props.character
  const updates: Partial<Character> = {
    combat: {
      ...c.combat,
      level: newLevel.value,
      maxHp: c.combat.maxHp + hpGained.value,
      hitDiceRemaining: c.combat.hitDiceRemaining + 1,
    },
  }

  if (c.spellcasting) {
    updates.spellcasting = { ...c.spellcasting, slotsMax: newSlots.value }
  }

  emit('leveled', updates)
}
</script>

<style scoped>
.levelup-fade-enter-active,
.levelup-fade-leave-active { transition: opacity 0.15s ease; }
.levelup-fade-enter-active .relative,
.levelup-fade-leave-active .relative { transition: opacity 0.15s ease, transform 0.15s ease; }
.levelup-fade-enter-from,
.levelup-fade-leave-to { opacity: 0; }
.levelup-fade-enter-from .relative { transform: scale(0.95); }
</style>
