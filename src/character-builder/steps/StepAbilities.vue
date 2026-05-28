<template>
  <div class="max-w-3xl mx-auto px-6 py-8 space-y-8">

    <!-- Method selector -->
    <section>
      <div class="rule-gold mb-4"><span>Ability Scores</span></div>

      <div class="grid grid-cols-2 sm:grid-cols-4 gap-2">
        <button
          v-for="method in methods"
          :key="method.value"
          type="button"
          class="px-3 py-3 rounded border text-center transition-all duration-150"
          :class="builder.draft.abilityMethod === method.value
            ? 'border-gold-mid/60 bg-gold-dim/10 text-gold-deep'
            : 'border-shadow bg-abyss text-mist hover:border-gold-dim/20 hover:text-ash'"
          @click="setMethod(method.value)"
        >
          <p class="font-heading text-sm tracking-wide">{{ method.label }}</p>
          <p class="text-2xs text-mist mt-0.5 font-body">{{ method.desc }}</p>
        </button>
      </div>
    </section>

    <!-- Point buy -->
    <section v-if="builder.draft.abilityMethod === 'pointbuy'" class="space-y-5">
      <!-- Budget bar -->
      <div class="flex items-center justify-between gap-4">
        <div class="flex-1 h-1.5 rounded-full bg-shadow overflow-hidden">
          <div
            class="h-full rounded-full transition-all duration-300"
            :class="builder.pointsRemaining < 0 ? 'bg-blood-mid' : 'bg-gold-mid'"
            :style="{ width: `${Math.min(100, (builder.pointsSpent / POINT_BUY_BUDGET) * 100)}%` }"
          />
        </div>
        <div class="text-sm font-heading shrink-0" :class="builder.pointsRemaining < 0 ? 'text-blood-bright' : builder.pointsRemaining === 0 ? 'text-gold-mid' : 'text-stone'">
          {{ builder.pointsRemaining }} pts remaining
        </div>
      </div>

      <div class="grid grid-cols-2 sm:grid-cols-3 gap-3">
        <AbilityScoreInput
          v-for="ab in abilityDefs"
          :key="ab.key"
          :label="ab.label"
          :full-name="ab.fullName"
          :ab-key="ab.key"
          mode="pointbuy"
        />
      </div>

      <!-- Racial bonus note -->
      <div v-if="hasRacialBonuses" class="flex items-start gap-2 text-xs font-body text-mist px-3 py-2.5 rounded border border-shadow bg-depths/40">
        <InfoIcon :size="13" class="shrink-0 mt-px text-gold-dim" />
        Racial ability bonuses from <span class="text-stone font-heading">{{ builder.draft.raceName }}</span> are applied on top of your chosen scores and shown in the final total.
      </div>

      <p v-if="showValidation && builder.pointsRemaining > 0" class="text-xs font-body text-blood-bright">
        {{ builder.pointsRemaining }} point{{ builder.pointsRemaining !== 1 ? 's' : '' }} left to spend — allocate all points to continue.
      </p>
      <p v-else-if="showValidation && builder.pointsRemaining < 0" class="text-xs font-body text-blood-bright">
        Too many points spent — reduce a score to continue.
      </p>
    </section>

    <!-- Standard array -->
    <section v-else-if="builder.draft.abilityMethod === 'standard'" class="space-y-5">
      <p class="text-sm font-body text-mist">
        Assign each value to an ability score — drag a number onto a card, or use the dropdown.
      </p>

      <!-- Available values (draggable) -->
      <div class="flex gap-2 flex-wrap">
        <span
          v-for="(val, i) in STANDARD_ARRAY"
          :key="i"
          class="px-3 py-1.5 rounded font-heading text-sm border transition-all duration-150 select-none cursor-grab active:cursor-grabbing"
          :class="isArrayValueUsed(val)
            ? 'border-shadow/40 text-mist/40 line-through'
            : 'border-gold-dim/30 text-gold-mid bg-gold-dim/10'"
          draggable="true"
          @dragstart="dragValue = val"
          @dragend="dragValue = null"
        >
          {{ val }}
        </span>
      </div>

      <div class="grid grid-cols-2 sm:grid-cols-3 gap-3">
        <div
          v-for="ab in abilityDefs"
          :key="ab.key"
          class="rounded-lg transition-all duration-150"
          :class="dragOver === ab.key && dragValue !== null ? 'ring-2 ring-gold-mid/40 ring-offset-2 ring-offset-abyss' : ''"
          @dragover.prevent="dragOver = ab.key"
          @dragleave.self="dragOver = null"
          @drop.prevent="onDrop(ab.key)"
        >
          <AbilityScoreInput
            :label="ab.label"
            :full-name="ab.fullName"
            :ab-key="ab.key"
            mode="standard"
          />
        </div>
      </div>

      <p
        v-if="showValidation && !standardArrayComplete"
        class="text-xs font-body text-blood-bright"
      >
        Assign all standard array values ({{ Object.keys(builder.draft.standardArrayAssignments).length }}/6 done).
      </p>
    </section>

    <!-- Roll -->
    <section v-else-if="builder.draft.abilityMethod === 'roll'" class="space-y-5">
      <div class="flex items-start justify-between gap-4 flex-wrap">
        <p class="text-sm font-body text-mist max-w-sm">
          Roll 4 six-sided dice, drop the lowest result — repeat six times, then assign each value to an ability.
        </p>
        <button type="button" class="btn-primary shrink-0" @click="rollAllAbilities">
          Roll All
        </button>
      </div>

      <!-- Rolled pool -->
      <div v-if="builder.draft.rolledAbilityScores.length > 0" class="flex gap-2 flex-wrap">
        <span
          v-for="(val, i) in builder.draft.rolledAbilityScores"
          :key="i"
          class="px-3 py-1.5 rounded font-heading text-sm border transition-all"
          :class="isRollIndexUsed(i)
            ? 'border-shadow/40 text-mist/40 line-through'
            : 'border-gold-dim/30 text-gold-mid bg-gold-dim/10'"
        >{{ val }}</span>
        <button
          type="button"
          class="px-3 py-1.5 rounded border border-shadow text-xs font-heading text-mist hover:text-ash hover:border-shadow/80 transition-all"
          @click="rollAllAbilities"
        >Reroll</button>
      </div>
      <div v-else class="px-4 py-4 rounded border border-shadow/50 bg-depths/20 text-center">
        <p class="text-sm font-body text-mist">Press <span class="font-heading text-stone">Roll All</span> to generate your six ability scores.</p>
      </div>

      <!-- Assignment grid -->
      <div v-if="builder.draft.rolledAbilityScores.length > 0" class="grid grid-cols-2 sm:grid-cols-3 gap-3">
        <div
          v-for="ab in abilityDefs"
          :key="ab.key"
          class="card p-3 flex flex-col gap-2"
        >
          <div class="flex items-baseline justify-between">
            <p class="font-heading text-xs tracking-[0.15em] text-mist uppercase">{{ ab.label }}</p>
            <p class="text-2xs font-body text-mist/60">{{ ab.fullName }}</p>
          </div>

          <div class="text-center leading-none">
            <p class="font-heading text-2xl text-vellum">
              {{ builder.draft.rollAssignments[ab.key] !== undefined
                  ? builder.draft.rolledAbilityScores[builder.draft.rollAssignments[ab.key]!]
                  : '—' }}
            </p>
            <p v-if="racialBonus(ab.key)" class="text-2xs font-heading text-verdant-bright mt-1">
              +{{ racialBonus(ab.key) }} racial
            </p>
          </div>

          <div class="flex flex-wrap gap-1 justify-center">
            <button
              v-for="(val, i) in builder.draft.rolledAbilityScores"
              :key="i"
              type="button"
              class="px-2 py-1 rounded border text-xs font-heading transition-all"
              :class="builder.draft.rollAssignments[ab.key] === i
                ? 'border-gold-mid/60 bg-gold-dim/15 text-gold-mid'
                : isRollIndexUsed(i)
                  ? 'border-shadow/30 text-mist/30 cursor-not-allowed'
                  : 'border-shadow text-ash hover:border-gold-dim/40 hover:text-stone'"
              :disabled="isRollIndexUsed(i) && builder.draft.rollAssignments[ab.key] !== i"
              @click="assignRoll(ab.key, i)"
            >{{ val }}</button>
          </div>
        </div>
      </div>

      <p v-if="showValidation && builder.draft.rolledAbilityScores.length < 6" class="text-xs font-body text-blood-bright">
        Roll your ability scores before continuing.
      </p>
      <p v-else-if="showValidation && Object.keys(builder.draft.rollAssignments).length < 6" class="text-xs font-body text-blood-bright">
        Assign all rolled values ({{ Object.keys(builder.draft.rollAssignments).length }}/6 done).
      </p>
    </section>

    <!-- Manual -->
    <section v-else class="space-y-5">
      <p class="text-sm font-body text-mist">Enter your ability scores directly.</p>
      <div class="grid grid-cols-2 sm:grid-cols-3 gap-3">
        <AbilityScoreInput
          v-for="ab in abilityDefs"
          :key="ab.key"
          :label="ab.label"
          :full-name="ab.fullName"
          :ab-key="ab.key"
          mode="manual"
        />
      </div>
    </section>

    <!-- Final totals (racial bonuses + ASIs from Step VI) -->
    <section v-if="showFinalScores" class="space-y-3">
      <div class="rule-gold">
        <span>Effective Scores</span>
        <span class="text-mist text-xs ml-2 font-body">
          {{ finalScoresSubtitle }}
        </span>
      </div>
      <div class="grid grid-cols-3 sm:grid-cols-6 gap-2">
        <div
          v-for="ab in abilityDefs"
          :key="ab.key"
          class="card flex flex-col items-center py-3 gap-0.5"
        >
          <p class="text-2xs font-heading tracking-[0.15em] text-mist uppercase">{{ ab.label }}</p>
          <p class="font-heading text-xl text-vellum leading-none">{{ effectiveScore(ab.key) }}</p>
          <p
            class="text-xs font-heading leading-none"
            :class="effectiveMod(ab.key) >= 0 ? 'text-gold-mid' : 'text-blood-bright'"
          >
            {{ effectiveMod(ab.key) >= 0 ? '+' : '' }}{{ effectiveMod(ab.key) }}
          </p>
          <p v-if="racialBonus(ab.key)" class="text-2xs text-verdant-bright font-heading">
            +{{ racialBonus(ab.key) }} racial
          </p>
          <p v-if="totalAsiBonus(ab.key)" class="text-2xs text-gold-mid font-heading">
            +{{ totalAsiBonus(ab.key) }} ASI
          </p>
        </div>
      </div>
    </section>

    <div class="h-4" />
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { InfoIcon } from 'lucide-vue-next'
import { useBuilderStore, POINT_BUY_BUDGET, STANDARD_ARRAY } from '@/character-builder/builderStore'
import { getAsiLevels } from '@/character-builder/classMeta'
import { computeModifier, type AbilityScores } from '@/shared/types/character'
import { useBuilderValidation } from '@/shared/composables/useBuilderValidation'
import AbilityScoreInput from '@/character-builder/components/AbilityScoreInput.vue'

// getAsiLevels still used for "Final Scores" section's subtitle + totalAsiBonus

const builder = useBuilderStore()
const { showValidation } = useBuilderValidation()

const methods = [
  { value: 'pointbuy' as const, label: 'Point Buy',      desc: `${POINT_BUY_BUDGET} pts to spend` },
  { value: 'standard' as const, label: 'Standard Array', desc: '15 14 13 12 10 8' },
  { value: 'roll'     as const, label: 'Roll (4d6)',      desc: 'Drop lowest, assign' },
  { value: 'manual'   as const, label: 'Manual',          desc: 'Any values · not recommended' },
]

const abilityDefs = [
  { key: 'str' as const, label: 'STR', fullName: 'Strength'     },
  { key: 'dex' as const, label: 'DEX', fullName: 'Dexterity'    },
  { key: 'con' as const, label: 'CON', fullName: 'Constitution' },
  { key: 'int' as const, label: 'INT', fullName: 'Intelligence' },
  { key: 'wis' as const, label: 'WIS', fullName: 'Wisdom'       },
  { key: 'cha' as const, label: 'CHA', fullName: 'Charisma'     },
]

// ── Base score helpers ────────────────────────────────────────────────────────

const racialBonus = (key: keyof AbilityScores) =>
  (builder.draft.raceAbilityBonuses[key] ?? 0) + (builder.draft.subraceAbilityBonuses[key] ?? 0)

const hasRacialBonuses = computed(() =>
  Object.values(builder.draft.raceAbilityBonuses).some(v => v !== 0) ||
  Object.values(builder.draft.subraceAbilityBonuses).some(v => v !== 0),
)

const effectiveScore = (key: keyof AbilityScores) => builder.effectiveScores[key]
const effectiveMod   = (key: keyof AbilityScores) => computeModifier(builder.effectiveScores[key])

function isArrayValueUsed(val: number): boolean {
  return Object.values(builder.draft.standardArrayAssignments).includes(val)
}

const standardArrayComplete = computed(() => {
  const scores = abilityDefs.map(ab => builder.draft.baseScores[ab.key]).sort((a, b) => a - b)
  const arr = [...STANDARD_ARRAY].sort((a, b) => a - b)
  return scores.every((v, i) => v === arr[i])
})

const dragValue = ref<number | null>(null)
const dragOver = ref<string | null>(null)

function onDrop(abKey: keyof AbilityScores) {
  dragOver.value = null
  if (dragValue.value === null) return
  const val = dragValue.value
  // If this value is assigned to another ability, unassign it first
  const prev = (Object.entries(builder.draft.standardArrayAssignments) as [keyof AbilityScores, number][])
    .find(([k, v]) => k !== abKey && v === val)?.[0]
  if (prev) {
    delete builder.draft.standardArrayAssignments[prev]
    builder.draft.baseScores[prev] = 8
  }
  builder.applyStandardArray(abKey, val)
  dragValue.value = null
}

function setMethod(method: 'pointbuy' | 'standard' | 'manual' | 'roll') {
  builder.draft.abilityMethod = method
  builder.resetScores()
}

function rollAllAbilities() {
  function roll4d6(): number {
    const dice = Array.from({ length: 4 }, () => Math.floor(Math.random() * 6) + 1)
    dice.sort((a, b) => a - b)
    return dice.slice(1).reduce((sum, d) => sum + d, 0)
  }
  builder.draft.rolledAbilityScores = Array.from({ length: 6 }, roll4d6)
  builder.draft.rollAssignments = {}
  builder.resetScores()
  // Re-set abilityMethod after resetScores (which doesn't touch abilityMethod)
  builder.draft.abilityMethod = 'roll'
}

function isRollIndexUsed(poolIndex: number): boolean {
  return Object.values(builder.draft.rollAssignments).includes(poolIndex)
}

function assignRoll(ability: keyof AbilityScores, poolIndex: number) {
  const currentAssignment = builder.draft.rollAssignments[ability]
  if (currentAssignment === poolIndex) {
    // Unassign
    delete builder.draft.rollAssignments[ability]
    builder.draft.baseScores[ability] = 8
    return
  }
  // If pool slot already owned by another ability, unassign that first
  const prev = (Object.entries(builder.draft.rollAssignments) as [keyof AbilityScores, number][])
    .find(([, v]) => v === poolIndex)?.[0]
  if (prev) {
    delete builder.draft.rollAssignments[prev]
    builder.draft.baseScores[prev] = 8
  }
  builder.draft.rollAssignments[ability] = poolIndex
  builder.draft.baseScores[ability] = builder.draft.rolledAbilityScores[poolIndex]
}

// ── ASI helpers ───────────────────────────────────────────────────────────────

/** ASI levels unlocked at the current character level */
const activeAsiLevels = computed(() =>
  getAsiLevels(builder.draft.classIndex).filter(l => l <= builder.draft.level),
)

/** Allocation for a specific ASI level + ability */
function asiAlloc(asiLevel: number, key: keyof AbilityScores): number {
  return builder.draft.asiAllocations[asiLevel]?.[key] ?? 0
}

/** Sum of all ASI allocations for a given ability (used in Final Scores display) */
function totalAsiBonus(key: keyof AbilityScores): number {
  return activeAsiLevels.value.reduce((sum, l) => sum + asiAlloc(l, key), 0)
}

// ── Final scores section visibility ──────────────────────────────────────────

const showFinalScores = computed(() =>
  hasRacialBonuses.value || builder.draft.subraceIndex !== '' || activeAsiLevels.value.length > 0,
)

const finalScoresSubtitle = computed(() => {
  const parts: string[] = []
  if (hasRacialBonuses.value || builder.draft.subraceIndex !== '') parts.push('racial bonuses')
  if (activeAsiLevels.value.length > 0) parts.push('ASIs')
  return parts.join(' + ')
})
</script>
