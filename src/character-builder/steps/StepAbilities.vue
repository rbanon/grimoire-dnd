<template>
  <div class="max-w-3xl mx-auto px-6 py-8 space-y-8">

    <!-- Method selector -->
    <section>
      <div class="rule-gold mb-4"><span>Ability Scores</span></div>

      <div class="grid grid-cols-3 gap-2">
        <button
          v-for="method in methods"
          :key="method.value"
          type="button"
          class="px-3 py-3 rounded border text-center transition-all duration-150"
          :class="builder.draft.abilityMethod === method.value
            ? 'border-gold-mid/60 bg-gold-dim/10 text-gold-pale'
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
        Faltan {{ builder.pointsRemaining }} punto{{ builder.pointsRemaining !== 1 ? 's' : '' }} por gastar — gasta todos para continuar.
      </p>
      <p v-else-if="showValidation && builder.pointsRemaining < 0" class="text-xs font-body text-blood-bright">
        Has gastado demasiados puntos. Reduce alguna puntuación.
      </p>
    </section>

    <!-- Standard array -->
    <section v-else-if="builder.draft.abilityMethod === 'standard'" class="space-y-5">
      <p class="text-sm font-body text-mist">
        Assign each value from the standard array to an ability score. Each value can only be used once.
      </p>

      <!-- Available values -->
      <div class="flex gap-2 flex-wrap">
        <span
          v-for="(val, i) in STANDARD_ARRAY"
          :key="i"
          class="px-3 py-1.5 rounded font-heading text-sm border transition-all duration-150"
          :class="isArrayValueUsed(val)
            ? 'border-shadow/40 text-mist/40 line-through'
            : 'border-gold-dim/30 text-gold-mid bg-gold-dim/10'"
        >
          {{ val }}
        </span>
      </div>

      <div class="grid grid-cols-2 sm:grid-cols-3 gap-3">
        <AbilityScoreInput
          v-for="ab in abilityDefs"
          :key="ab.key"
          :label="ab.label"
          :full-name="ab.fullName"
          :ab-key="ab.key"
          mode="standard"
        />
      </div>

      <p
        v-if="showValidation && Object.keys(builder.draft.standardArrayAssignments).length < 6"
        class="text-xs font-body text-blood-bright"
      >
        Asigna todos los valores del array estándar ({{ Object.keys(builder.draft.standardArrayAssignments).length }}/6 asignados).
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

    <!-- ── Ability Score Improvements ──────────────────────────────────── -->
    <template v-if="activeAsiLevels.length > 0">
      <div class="rule-gold"><span>Ability Score Improvements</span></div>

      <div
        v-for="asiLevel in activeAsiLevels"
        :key="asiLevel"
        class="card p-5 space-y-4"
      >
        <!-- Header -->
        <div class="flex items-center justify-between">
          <div>
            <p class="font-heading text-sm text-vellum">
              Level {{ asiLevel }} — Ability Score Improvement
            </p>
            <p class="text-2xs font-body text-mist mt-0.5">
              +2 to one ability, or +1 to two different abilities · max 20 per score
            </p>
          </div>
          <span
            class="text-sm font-heading tabular-nums"
            :class="asiPointsUsed(asiLevel) === 2 ? 'text-gold-mid' : asiPointsUsed(asiLevel) === 0 ? 'text-mist/50' : 'text-stone'"
          >{{ asiPointsUsed(asiLevel) }}/2</span>
        </div>

        <!-- Per-ability adjusters -->
        <div class="grid grid-cols-3 sm:grid-cols-6 gap-2">
          <div
            v-for="ab in abilityDefs"
            :key="ab.key"
            class="flex flex-col items-center gap-1.5"
          >
            <p class="text-2xs font-heading tracking-[0.15em] text-mist uppercase">{{ ab.label }}</p>

            <!-- Score display -->
            <div class="text-center leading-none">
              <p class="font-heading text-lg text-vellum">{{ scoreAfterAsi(asiLevel, ab.key) }}</p>
              <p
                v-if="asiAlloc(asiLevel, ab.key) > 0"
                class="text-2xs font-heading text-verdant-bright mt-0.5"
              >+{{ asiAlloc(asiLevel, ab.key) }} ASI</p>
              <p v-else class="text-2xs text-mist/30 mt-0.5">+0</p>
            </div>

            <!-- +/- buttons -->
            <div class="flex items-center gap-1">
              <button
                type="button"
                class="w-6 h-6 flex items-center justify-center rounded border text-sm font-heading transition-all"
                :class="canDecreaseAsi(asiLevel, ab.key)
                  ? 'border-shadow text-mist hover:border-blood-base/50 hover:text-blood-mid cursor-pointer'
                  : 'border-shadow/20 text-mist/20 cursor-not-allowed'"
                :disabled="!canDecreaseAsi(asiLevel, ab.key)"
                @click="changeAsi(asiLevel, ab.key, -1)"
              >−</button>
              <button
                type="button"
                class="w-6 h-6 flex items-center justify-center rounded border text-sm font-heading transition-all"
                :class="canIncreaseAsi(asiLevel, ab.key)
                  ? 'border-shadow text-mist hover:border-gold-dim/50 hover:text-gold-mid cursor-pointer'
                  : 'border-shadow/20 text-mist/20 cursor-not-allowed'"
                :disabled="!canIncreaseAsi(asiLevel, ab.key)"
                @click="changeAsi(asiLevel, ab.key, 1)"
              >+</button>
            </div>
          </div>
        </div>

        <p v-if="showValidation && asiPointsUsed(asiLevel) < 2" class="text-xs font-body text-blood-bright">
          Asigna los 2 puntos del ASI de nivel {{ asiLevel }} ({{ asiPointsUsed(asiLevel) }}/2 asignados).
        </p>
      </div>
    </template>

    <!-- Final totals -->
    <section v-if="showFinalScores" class="space-y-3">
      <div class="rule-gold">
        <span>Final Scores</span>
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
import { computed } from 'vue'
import { InfoIcon } from 'lucide-vue-next'
import { useBuilderStore, POINT_BUY_BUDGET, STANDARD_ARRAY } from '@/character-builder/builderStore'
import { getAsiLevels } from '@/character-builder/classMeta'
import { computeModifier, type AbilityScores } from '@/shared/types/character'
import { useBuilderValidation } from '@/shared/composables/useBuilderValidation'
import AbilityScoreInput from '@/character-builder/components/AbilityScoreInput.vue'

const builder = useBuilderStore()
const { showValidation } = useBuilderValidation()

const methods = [
  { value: 'pointbuy' as const, label: 'Point Buy', desc: `${POINT_BUY_BUDGET} pts to spend` },
  { value: 'standard' as const, label: 'Standard Array', desc: '15 14 13 12 10 8' },
  { value: 'manual'   as const, label: 'Manual', desc: 'Any values · not recommended' },
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
  return Object.values(builder.draft.baseScores).includes(val) &&
    abilityDefs.some(ab => builder.draft.baseScores[ab.key] === val)
}

function setMethod(method: 'pointbuy' | 'standard' | 'manual') {
  builder.draft.abilityMethod = method
  builder.resetScores()
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

/** Total points spent in a given ASI */
function asiPointsUsed(asiLevel: number): number {
  return Object.values(builder.draft.asiAllocations[asiLevel] ?? {}).reduce((s, v) => s + v, 0)
}

/** Score just BEFORE applying this ASI (base + racial + all previous ASIs) */
function scoreBeforeAsi(asiLevel: number, key: keyof AbilityScores): number {
  const base   = builder.draft.baseScores[key]
  const racial = racialBonus(key)
  const prevAsiTotal = activeAsiLevels.value
    .filter(l => l < asiLevel)
    .reduce((sum, l) => sum + asiAlloc(l, key), 0)
  return base + racial + prevAsiTotal
}

function scoreAfterAsi(asiLevel: number, key: keyof AbilityScores): number {
  return Math.min(20, scoreBeforeAsi(asiLevel, key) + asiAlloc(asiLevel, key))
}

function canIncreaseAsi(asiLevel: number, key: keyof AbilityScores): boolean {
  if (asiPointsUsed(asiLevel) >= 2) return false
  if (scoreBeforeAsi(asiLevel, key) + asiAlloc(asiLevel, key) >= 20) return false
  return true
}

function canDecreaseAsi(asiLevel: number, key: keyof AbilityScores): boolean {
  return asiAlloc(asiLevel, key) > 0
}

function changeAsi(asiLevel: number, key: keyof AbilityScores, delta: number) {
  if (delta > 0 && !canIncreaseAsi(asiLevel, key)) return
  if (delta < 0 && !canDecreaseAsi(asiLevel, key)) return
  builder.setAsiAllocation(asiLevel, key, asiAlloc(asiLevel, key) + delta)
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
