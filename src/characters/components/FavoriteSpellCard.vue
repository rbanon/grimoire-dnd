<template>
  <div class="card px-4 py-3 space-y-1.5">

    <!-- Name row -->
    <div class="flex items-center gap-2">
      <span class="text-arcane-pale/60 text-sm shrink-0">{{ fav.type === 'cantrip' ? '✦' : '◆' }}</span>
      <p class="font-heading text-sm text-vellum flex-1 min-w-0 truncate">{{ fav.spellName }}</p>

      <span
        class="text-2xs font-heading tracking-wide text-arcane-pale/50 bg-arcane-deep/20 px-2 py-0.5 rounded shrink-0"
      >{{ fav.type === 'cantrip' ? 'Cantrip' : `Lv ${fav.spellLevel}` }}</span>

      <button
        type="button"
        class="shrink-0 w-6 h-6 flex items-center justify-center rounded text-mist/40 hover:text-arcane-pale hover:bg-arcane-deep/20 transition-all"
        title="Details"
        @click="infoPanel.open({ kind: 'spell', index: fav.spellIndex! })"
      >
        <InfoIcon :size="12" />
      </button>

      <button
        v-if="editMode"
        type="button"
        class="shrink-0 w-6 h-6 flex items-center justify-center rounded text-mist/40 hover:text-blood-bright hover:bg-blood-deep/20 transition-all"
        title="Remove from Favorites"
        @click="$emit('remove')"
      >
        <XIcon :size="12" />
      </button>
    </div>

    <!-- Detail row -->
    <div class="flex flex-wrap items-center gap-x-2.5 gap-y-0.5 pl-5">
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
          <span
            class="text-2xs font-heading px-1.5 py-px rounded-sm border"
            :class="schoolClass"
          >{{ detail.school.name }}</span>
        </template>
      </template>
    </div>

    <!-- Roll / cast buttons -->
    <div
      v-if="!loading && detail"
      class="flex justify-end gap-1.5 pt-1.5 border-t border-shadow/30"
    >
      <button
        type="button"
        class="px-3 py-1.5 rounded border border-arcane-base/30 bg-arcane-deep/5 text-arcane-pale/80 hover:border-arcane-base/60 hover:bg-arcane-deep/15 transition-all font-heading text-xs"
        @click="$emit('cast')"
      >Cast</button>
      <button
        v-if="hasAttackRoll"
        type="button"
        class="px-3 py-1.5 rounded border border-arcane-base/40 bg-arcane-deep/10 text-arcane-pale hover:border-arcane-base/70 hover:bg-arcane-deep/20 transition-all font-heading text-xs"
        @click="(e) => rollD20(spellAttackBonus, fav.spellName ?? 'Spell', e)"
      >⚃ Roll Attack</button>
      <button
        v-if="damageRoll"
        type="button"
        class="px-3 py-1.5 rounded border border-blood-base/40 bg-blood-deep/10 text-blood-mid hover:border-blood-base/70 hover:bg-blood-deep/20 transition-all font-heading text-xs"
        @click="rollDamage(damageRoll!, fav.spellName ?? 'Spell')"
      >⚀ Roll Damage</button>
    </div>

  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { InfoIcon, XIcon } from 'lucide-vue-next'
import { useQuery } from '@tanstack/vue-query'
import { fiveEApi } from '@/shared/api/fiveE.client'
import { useInfoPanel } from '@/shared/composables/useInfoPanel'
import { useRoll } from '@/shared/composables/useRoll'
import type { CombatFavorite } from '@/shared/types/character'

const props = defineProps<{
  fav: CombatFavorite
  editMode: boolean
  spellAttackBonus: number
  characterLevel: number
}>()
defineEmits<{ remove: []; cast: [] }>()

const infoPanel = useInfoPanel()
const { rollD20, rollDamage } = useRoll()

const { data: detail, isPending: loading } = useQuery({
  queryKey: computed(() => ['spell', props.fav.spellIndex]),
  queryFn: () => fiveEApi.getSpell(props.fav.spellIndex!),
  staleTime: Infinity,
  enabled: computed(() => !!props.fav.spellIndex),
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
    // Cantrip scaling: pick highest breakpoint <= character level
    const validKeys = Object.keys(byChar).map(Number).filter(k => k <= props.characterLevel).sort((a, b) => b - a)
    const key = validKeys[0]
    return key != null ? byChar[String(key)] : null
  }
  const bySlot = d.damage_at_slot_level
  if (bySlot) {
    const key = Object.keys(bySlot).sort((a, b) => Number(a) - Number(b))[0]
    return key ? bySlot[key] : null
  }
  return null
})

const hasAttackRoll = computed(() => !!detail.value?.attack_type)

const damageType = computed(() => detail.value?.damage?.damage_type?.name ?? null)

const SCHOOL_CLASSES: Record<string, string> = {
  abjuration:    'text-blue-300/80 border-blue-500/30',
  conjuration:   'text-emerald-300/80 border-emerald-500/30',
  divination:    'text-sky-300/80 border-sky-500/30',
  enchantment:   'text-pink-300/80 border-pink-500/30',
  evocation:     'text-orange-300/80 border-orange-500/30',
  illusion:      'text-violet-300/80 border-violet-500/30',
  necromancy:    'text-green-400/70 border-green-600/30',
  transmutation: 'text-amber-300/80 border-amber-500/30',
}
const schoolClass = computed(() => {
  const name = detail.value?.school?.name?.toLowerCase() ?? ''
  return SCHOOL_CLASSES[name] ?? 'text-mist/50 border-shadow'
})
</script>
