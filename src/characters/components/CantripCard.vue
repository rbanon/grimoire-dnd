<template>
  <div class="px-3 py-2.5 rounded border border-arcane-base/20 bg-arcane-deep/5">

    <!-- Name row -->
    <div class="flex items-center gap-2">
      <p class="font-heading text-sm text-arcane-pale flex-1 min-w-0 truncate">{{ cantrip.name }}</p>
      <button
        type="button"
        class="shrink-0 w-6 h-6 flex items-center justify-center rounded text-mist/40 hover:text-arcane-pale hover:bg-arcane-deep/20 transition-all"
        title="Ver detalles"
        @click="infoPanel.open({ kind: 'spell', index: cantrip.index })"
      >
        <InfoIcon :size="12" />
      </button>
      <button
        v-if="cantripEditMode"
        type="button"
        class="shrink-0 w-6 h-6 flex items-center justify-center rounded text-mist/30 hover:text-blood-bright hover:bg-blood-deep/20 transition-all"
        title="Eliminar"
        @click="$emit('remove')"
      >
        <XIcon :size="12" />
      </button>
    </div>

    <!-- Summary row -->
    <div class="mt-1 flex flex-wrap items-center gap-x-2.5 gap-y-0.5">

      <!-- Loading skeleton -->
      <template v-if="loading">
        <div class="h-2.5 w-32 rounded bg-shadow/40 animate-pulse" />
      </template>

      <template v-else-if="spell">
        <!-- Casting time -->
        <span class="text-2xs font-heading tracking-wide text-mist">{{ castingTime }}</span>

        <span class="text-mist/25 text-2xs">·</span>

        <!-- Range -->
        <span class="text-2xs font-body text-mist">{{ spell.range }}</span>

        <!-- Area of effect -->
        <template v-if="spell.area_of_effect">
          <span class="text-mist/25 text-2xs">·</span>
          <span class="text-2xs font-body text-mist">{{ spell.area_of_effect.size }} ft {{ spell.area_of_effect.type }}</span>
        </template>

        <!-- Concentration -->
        <template v-if="spell.concentration">
          <span class="text-mist/25 text-2xs">·</span>
          <span class="text-2xs font-heading tracking-wide text-arcane-pale/60">Conc.</span>
        </template>

        <!-- Damage roll -->
        <template v-if="damageRoll">
          <span class="text-mist/25 text-2xs">·</span>
          <span class="text-2xs font-mono text-stone">{{ damageRoll }}</span>
          <span v-if="damageType" class="text-2xs font-body text-mist/70">{{ damageType }}</span>
        </template>
      </template>
    </div>

  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { InfoIcon, XIcon } from 'lucide-vue-next'
import { useQuery } from '@tanstack/vue-query'
import { fiveEApi } from '@/shared/api/fiveE.client'
import { useInfoPanel } from '@/shared/composables/useInfoPanel'
import type { SpellReference } from '@/shared/types/character'

const props = defineProps<{
  cantrip: SpellReference
  cantripEditMode: boolean
}>()
defineEmits<{ remove: [] }>()

const infoPanel = useInfoPanel()

const { data: spell, isPending: loading } = useQuery({
  queryKey: ['spell', props.cantrip.index],
  queryFn: () => fiveEApi.getSpell(props.cantrip.index),
  staleTime: Infinity,
})

const castingTime = computed(() => {
  const raw = spell.value?.casting_time ?? ''
  if (/bonus/i.test(raw)) return 'Bonus Action'
  if (/reaction/i.test(raw)) return 'Reaction'
  if (/action/i.test(raw)) return 'Action'
  return raw
})

const damageRoll = computed(() => {
  const d = spell.value?.damage
  if (!d) return null
  const byCharLevel = d.damage_at_character_level
  if (byCharLevel) {
    const firstKey = Object.keys(byCharLevel).sort((a, b) => Number(a) - Number(b))[0]
    return firstKey ? byCharLevel[firstKey] : null
  }
  const bySlot = d.damage_at_slot_level
  if (bySlot) {
    const firstKey = Object.keys(bySlot).sort((a, b) => Number(a) - Number(b))[0]
    return firstKey ? bySlot[firstKey] : null
  }
  return null
})

const damageType = computed(() => spell.value?.damage?.damage_type?.name ?? null)
</script>
