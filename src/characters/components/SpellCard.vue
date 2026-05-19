<template>
  <div class="px-3 py-2.5 rounded border border-arcane-base/20 bg-arcane-deep/5">

    <!-- Name row -->
    <div class="flex items-center gap-2">
      <!-- Clickable prepare toggle in edit mode for prepared casters -->
      <button
        v-if="spellEditMode && canTogglePrepared"
        type="button"
        class="shrink-0 w-5 h-5 flex items-center justify-center rounded transition-all"
        :class="spell.prepared
          ? 'text-gold-mid hover:text-gold-dim'
          : 'text-mist/30 hover:text-gold-mid'"
        :title="spell.prepared ? 'Unprepare' : 'Prepare'"
        @click.stop="$emit('togglePrepared')"
      >
        <span class="text-2xs leading-none">{{ spell.prepared ? '◆' : '◇' }}</span>
      </button>
      <!-- Static prepared indicator in view mode -->
      <span v-else-if="spell.prepared" class="text-gold-mid text-2xs shrink-0" title="Prepared">◆</span>
      <button
        type="button"
        class="font-heading text-sm text-arcane-pale/90 flex-1 min-w-0 truncate text-left hover:text-arcane-pale transition-colors"
        title="Cast spell"
        @click="$emit('cast')"
      >{{ spell.name }}</button>
      <!-- Favorite toggle -->
      <button
        type="button"
        class="shrink-0 w-6 h-6 flex items-center justify-center rounded transition-all"
        :class="isFavorite
          ? 'text-gold-mid hover:text-gold-dim'
          : 'text-mist/30 hover:text-gold-mid hover:bg-gold-dim/10'"
        :title="isFavorite ? 'Remove from Favorites' : 'Add to Favorites'"
        @click="$emit('toggleFavorite')"
      >
        <StarIcon :size="12" :fill="isFavorite ? 'currentColor' : 'none'" />
      </button>
      <button
        type="button"
        class="shrink-0 w-6 h-6 flex items-center justify-center rounded text-mist/40 hover:text-arcane-pale hover:bg-arcane-deep/20 transition-all"
        title="Ver detalles"
        @click="infoPanel.open({ kind: 'spell', index: spell.index })"
      >
        <InfoIcon :size="12" />
      </button>
      <button
        v-if="spellEditMode"
        type="button"
        class="shrink-0 w-6 h-6 flex items-center justify-center rounded text-mist/30 hover:text-blood-bright hover:bg-blood-deep/20 transition-all"
        title="Remove spell"
        @click="$emit('remove')"
      >
        <XIcon :size="12" />
      </button>
    </div>

    <!-- Summary row -->
    <div class="mt-1 flex flex-wrap items-center gap-x-2.5 gap-y-0.5">
      <template v-if="loading">
        <div class="h-2.5 w-40 rounded bg-shadow/40 animate-pulse" />
      </template>
      <template v-else-if="detail">
        <span class="text-2xs font-heading tracking-wide text-mist">{{ castingTime }}</span>
        <span class="text-mist/25 text-2xs">·</span>
        <span class="text-2xs font-body text-mist">{{ detail.range }}</span>
        <template v-if="detail.area_of_effect">
          <span class="text-mist/25 text-2xs">·</span>
          <span class="text-2xs font-body text-mist">{{ detail.area_of_effect.size }} ft {{ detail.area_of_effect.type }}</span>
        </template>
        <template v-if="detail.concentration">
          <span class="text-mist/25 text-2xs">·</span>
          <span class="text-2xs font-heading tracking-wide text-arcane-pale/60">Conc.</span>
        </template>
        <template v-if="damageRoll">
          <span class="text-mist/25 text-2xs">·</span>
          <span class="text-2xs font-mono text-stone">{{ damageRoll }}</span>
          <span v-if="damageType" class="text-2xs font-body text-mist/70">{{ damageType }}</span>
        </template>
        <template v-if="detail.school">
          <span class="text-mist/25 text-2xs">·</span>
          <span class="text-2xs font-body text-mist/50">{{ detail.school.name }}</span>
        </template>
      </template>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { InfoIcon, XIcon, StarIcon } from 'lucide-vue-next'
import { useQuery } from '@tanstack/vue-query'
import { fiveEApi } from '@/shared/api/fiveE.client'
import { useInfoPanel } from '@/shared/composables/useInfoPanel'
import type { SpellReference } from '@/shared/types/character'

const props = defineProps<{
  spell: SpellReference & { prepared: boolean }
  spellEditMode: boolean
  isFavorite: boolean
  canTogglePrepared?: boolean
}>()
defineEmits<{ remove: []; toggleFavorite: []; cast: []; togglePrepared: [] }>()

const infoPanel = useInfoPanel()

const { data: detail, isPending: loading } = useQuery({
  queryKey: ['spell', props.spell.index],
  queryFn: () => fiveEApi.getSpell(props.spell.index),
  staleTime: Infinity,
})

const castingTime = computed(() => {
  const raw = detail.value?.casting_time ?? ''
  if (/bonus/i.test(raw)) return 'Bonus Action'
  if (/reaction/i.test(raw)) return 'Reaction'
  if (/action/i.test(raw)) return 'Action'
  return raw
})

const damageRoll = computed(() => {
  const d = detail.value?.damage
  if (!d) return null
  const byChar = d.damage_at_character_level
  if (byChar) {
    const key = Object.keys(byChar).sort((a, b) => Number(a) - Number(b))[0]
    return key ? byChar[key] : null
  }
  const bySlot = d.damage_at_slot_level
  if (bySlot) {
    const key = Object.keys(bySlot).sort((a, b) => Number(a) - Number(b))[0]
    return key ? bySlot[key] : null
  }
  return null
})

const damageType = computed(() => detail.value?.damage?.damage_type?.name ?? null)
</script>
