<template>
  <div
    class="card flex flex-col items-center py-4 px-3 gap-2 group relative overflow-hidden transition-all duration-200"
    :class="modValue >= 0 ? 'hover:border-gold-dim/30' : 'hover:border-blood-base/30'"
  >
    <!-- Background glow -->
    <div
      class="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"
      :style="modValue >= 0
        ? 'background: radial-gradient(ellipse at center, rgba(212,168,67,0.04) 0%, transparent 70%)'
        : 'background: radial-gradient(ellipse at center, rgba(192,57,43,0.04) 0%, transparent 70%)'"
    />

    <!-- Labels -->
    <p class="text-2xs font-heading tracking-[0.2em] uppercase text-mist">{{ label }}</p>
    <p class="text-2xs text-mist/60 font-body -mt-1">{{ fullName }}</p>

    <!-- Score control -->
    <div class="flex items-center gap-2 w-full justify-center">
      <!-- Point buy / manual: +/- buttons -->
      <template v-if="mode !== 'standard'">
        <button
          type="button"
          class="w-6 h-6 rounded border border-shadow flex items-center justify-center text-mist hover:text-stone hover:border-gold-dim/30 transition-all duration-150 text-sm font-heading disabled:opacity-30 disabled:pointer-events-none"
          :disabled="!canDec"
          @click="dec"
        >−</button>
        <span class="font-heading text-2xl text-vellum w-8 text-center leading-none">{{ score }}</span>
        <button
          type="button"
          class="w-6 h-6 rounded border border-shadow flex items-center justify-center text-mist hover:text-stone hover:border-gold-dim/30 transition-all duration-150 text-sm font-heading disabled:opacity-30 disabled:pointer-events-none"
          :disabled="!canInc"
          @click="inc"
        >+</button>
      </template>

      <!-- Standard array: select -->
      <template v-else>
        <select
          class="font-heading text-xl text-vellum bg-transparent border-none outline-none text-center cursor-pointer w-16 appearance-none"
          :value="score"
          @change="onSelectChange($event)"
        >
          <option value="" class="bg-abyss text-mist">—</option>
          <option
            v-for="val in STANDARD_ARRAY"
            :key="val"
            :value="val"
            :disabled="usedByOther(val)"
            class="bg-abyss text-stone disabled:text-mist"
          >{{ val }}</option>
        </select>
      </template>
    </div>

    <!-- Modifier -->
    <div
      class="font-heading text-lg leading-none transition-colors duration-200"
      :class="modValue >= 0 ? 'text-gold-mid' : 'text-blood-bright'"
    >
      {{ modValue >= 0 ? '+' : '' }}{{ modValue }}
    </div>

    <!-- Point cost (point buy only) -->
    <div v-if="mode === 'pointbuy'" class="text-2xs font-heading text-center">
      <span :class="score >= 15 ? 'text-gold-mid' : 'text-mist'">{{ pbCost(score) }} pts</span>
      <span v-if="score >= 15" class="ml-1 text-mist/50">(max)</span>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useBuilderStore, pbCost, STANDARD_ARRAY, POINT_BUY_MIN } from '@/character-builder/builderStore'
import { computeModifier } from '@/shared/types/character'
import type { AbilityScores } from '@/shared/types/character'

const props = defineProps<{
  label: string
  fullName: string
  abKey: keyof AbilityScores
  mode: 'pointbuy' | 'standard' | 'manual'
}>()

const builder = useBuilderStore()

const score = computed(() => builder.draft.baseScores[props.abKey])
const modValue = computed(() => computeModifier(score.value))

const usedByOther = (val: number) => {
  const assignments = builder.draft.standardArrayAssignments
  return Object.entries(assignments).some(([k, v]) => k !== props.abKey && v === val)
}

const canInc = computed(() => {
  if (props.mode === 'manual') return score.value < 30
  if (props.mode === 'pointbuy') return builder.canIncrement(props.abKey)
  return false
})
const canDec = computed(() => {
  if (props.mode === 'manual') return score.value > 1
  return builder.canDecrement(props.abKey)
})

function inc() {
  if (props.mode === 'pointbuy') builder.incrementScore(props.abKey)
  else if (props.mode === 'manual') builder.draft.baseScores[props.abKey]++
}
function dec() {
  if (props.mode === 'pointbuy') builder.decrementScore(props.abKey)
  else if (props.mode === 'manual') builder.draft.baseScores[props.abKey]--
}

function onSelectChange(e: Event) {
  const val = parseInt((e.target as HTMLSelectElement).value)
  if (!isNaN(val)) builder.applyStandardArray(props.abKey, val)
  else builder.draft.baseScores[props.abKey] = POINT_BUY_MIN
}
</script>
