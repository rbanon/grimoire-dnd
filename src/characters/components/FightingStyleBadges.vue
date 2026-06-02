<template>
  <div v-if="hasAny" class="flex items-center gap-1.5 flex-wrap">
    <span
      v-if="bonus.attack > 0"
      class="text-2xs font-heading px-1.5 py-0.5 rounded border border-arcane-base/40 text-arcane-pale bg-arcane-deep/10"
    >+{{ bonus.attack }} atk</span>
    <span
      v-if="bonus.damage > 0"
      class="text-2xs font-heading px-1.5 py-0.5 rounded border border-blood-base/40 text-blood-mid bg-blood-deep/10"
    >+{{ bonus.damage }} dmg</span>
    <span
      v-if="bonus.rerollLowDice"
      class="text-2xs font-heading px-1.5 py-0.5 rounded border border-gold-dim/40 text-gold-mid bg-gold-dim/10"
    >GWF</span>
    <span v-if="label" class="text-2xs font-body text-mist/40">Fighting Style</span>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import type { FightingStyleBonuses } from '@/shared/lib/derivedStats'

const props = defineProps<{ bonus: FightingStyleBonuses; label?: boolean }>()

const hasAny = computed(() =>
  props.bonus.attack > 0 || props.bonus.damage > 0 || props.bonus.rerollLowDice,
)
</script>
