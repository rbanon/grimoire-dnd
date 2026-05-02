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

    <!-- Final totals (with racial bonuses) -->
    <section v-if="hasRacialBonuses || hasSub" class="space-y-3">
      <div class="rule-gold"><span>Final Scores (with Racial Bonuses)</span></div>
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
import { computeModifier } from '@/shared/types/character'
import AbilityScoreInput from '@/character-builder/components/AbilityScoreInput.vue'

const builder = useBuilderStore()

const methods = [
  { value: 'pointbuy' as const, label: 'Point Buy', desc: `${POINT_BUY_BUDGET} pts to spend` },
  { value: 'standard' as const, label: 'Standard Array', desc: '15 14 13 12 10 8' },
  { value: 'manual'   as const, label: 'Manual', desc: 'Any values' },
]

const abilityDefs = [
  { key: 'str' as const, label: 'STR', fullName: 'Strength'     },
  { key: 'dex' as const, label: 'DEX', fullName: 'Dexterity'    },
  { key: 'con' as const, label: 'CON', fullName: 'Constitution' },
  { key: 'int' as const, label: 'INT', fullName: 'Intelligence' },
  { key: 'wis' as const, label: 'WIS', fullName: 'Wisdom'       },
  { key: 'cha' as const, label: 'CHA', fullName: 'Charisma'     },
]

const racialBonus = (key: typeof abilityDefs[number]['key']) =>
  (builder.draft.raceAbilityBonuses[key] ?? 0) + (builder.draft.subraceAbilityBonuses[key] ?? 0)

const hasRacialBonuses = computed(() =>
  Object.values(builder.draft.raceAbilityBonuses).some(v => v !== 0) ||
  Object.values(builder.draft.subraceAbilityBonuses).some(v => v !== 0),
)

const hasSub = computed(() => builder.draft.subraceIndex !== '')

const effectiveScore = (key: typeof abilityDefs[number]['key']) =>
  builder.effectiveScores[key]

const effectiveMod = (key: typeof abilityDefs[number]['key']) =>
  computeModifier(builder.effectiveScores[key])

function isArrayValueUsed(val: number): boolean {
  return Object.values(builder.draft.baseScores).includes(val) &&
    abilityDefs.some(ab => builder.draft.baseScores[ab.key] === val)
}

function setMethod(method: 'pointbuy' | 'standard' | 'manual') {
  builder.draft.abilityMethod = method
  builder.resetScores()
}
</script>
