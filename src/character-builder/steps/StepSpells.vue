<template>
  <div class="max-w-3xl mx-auto px-6 py-8 space-y-8">
    <div class="rule-gold"><span>Spells</span></div>

    <!-- Spellcasting info -->
    <div class="card p-5 border-arcane-base/20 bg-arcane-deep/10">
      <div class="flex items-start gap-3">
        <span class="text-arcane-pale text-xl shrink-0">✶</span>
        <div>
          <p class="font-heading text-sm text-vellum mb-1">{{ builder.draft.className }} Spellcasting</p>
          <p class="text-sm font-body text-ash">
            Your spellcasting ability is
            <span class="text-arcane-pale font-heading">{{ spellAbilityName }}</span>.
          </p>
        </div>
      </div>
    </div>

    <!-- No spells at this level -->
    <div
      v-if="noSpellsAtLevel"
      class="card p-5 border-shadow/40 bg-depths/30 flex items-start gap-3"
    >
      <span class="text-gold-dim text-base shrink-0 mt-0.5">⚠</span>
      <div>
        <p class="font-heading text-sm text-stone mb-1">No spells at this level</p>
        <p class="text-sm font-body text-mist">
          {{ builder.draft.className }}s don't gain spells until level 2.
          Increase the level in Step II or add spells from the sheet after creation.
        </p>
      </div>
    </div>

    <!-- Cantrip picker -->
    <section v-else-if="cantripLimit > 0">
      <div v-if="cantripsLoading" class="flex justify-center py-6">
        <GrimoireSpinner label="Loading spells" />
      </div>
      <div v-else class="space-y-4">
        <div class="flex items-center justify-between">
          <p class="label">Cantrips</p>
          <span
            class="text-xs font-body tabular-nums"
            :class="atCantripLimit ? 'text-blood-bright' : 'text-mist'"
          >
            {{ builder.draft.selectedCantrips.length }} / {{ cantripLimit }}
          </span>
        </div>
        <p v-if="atCantripLimit" class="text-xs font-body text-blood-bright/80 -mt-2">
          Maximum cantrips reached for level {{ builder.draft.level }}.
        </p>
        <div class="grid grid-cols-2 sm:grid-cols-3 gap-1.5">
          <div
            v-for="c in cantrips"
            :key="c.index"
            class="group relative flex items-center rounded border text-sm font-heading tracking-wide transition-all duration-150"
            :class="isCantripSelected(c.index)
              ? 'border-arcane-base/50 bg-arcane-deep/20 text-arcane-pale cursor-pointer'
              : atCantripLimit
                ? 'border-shadow text-mist cursor-not-allowed opacity-50'
                : 'border-shadow text-ash hover:border-arcane-base/25 hover:text-stone cursor-pointer'"
            @click="toggleCantrip(c)"
          >
            <span class="flex-1 px-3 py-2 text-left">
              {{ c.name }}
              <span v-if="isCantripSelected(c.index)" class="text-arcane-pale ml-1">✓</span>
            </span>
            <button
              type="button"
              class="shrink-0 px-2.5 py-2 text-mist/60 hover:text-ash opacity-0 group-hover:opacity-100 transition-all"
              aria-label="Spell details"
              @click.stop="infoPanel.open({ kind: 'spell', index: c.index })"
            >
              <InfoIcon :size="12" />
            </button>
          </div>
        </div>
      </div>
    </section>

    <!-- Leveled spells note -->
    <div class="card p-4 border-shadow/40 bg-depths/30">
      <p class="text-xs font-body text-mist">
        First-level spells and spell slot management are available on the character
        sheet after creation. You can browse the full spell list in the Spells section.
      </p>
    </div>

    <div class="h-4" />
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useQuery } from '@tanstack/vue-query'
import { InfoIcon } from 'lucide-vue-next'
import { useBuilderStore } from '@/character-builder/builderStore'
import { fiveEApi } from '@/shared/api/fiveE.client'
import { useInfoPanel } from '@/shared/composables/useInfoPanel'
import { getSpellProfile } from '@/character-builder/classMeta'
import GrimoireSpinner from '@/character-builder/components/GrimoireSpinner.vue'

const builder = useBuilderStore()
const infoPanel = useInfoPanel()

const abilityNames: Record<string, string> = {
  cha: 'Charisma', int: 'Intelligence', wis: 'Wisdom',
}
const spellAbilityName = computed(() =>
  abilityNames[builder.draft.classSpellcastingAbility ?? ''] ?? '—'
)

const profile   = computed(() => getSpellProfile(builder.draft.classIndex))
const levelIdx  = computed(() => builder.draft.level - 1)

const cantripLimit = computed(() =>
  profile.value?.cantripsKnown[levelIdx.value] ?? Infinity
)

// True when a class gains its first spells only at level 2+ (e.g. Ranger, Paladin at level 1)
const noSpellsAtLevel = computed(() => {
  const p = profile.value
  if (!p) return false
  const hasCantrips  = (p.cantripsKnown[levelIdx.value] ?? 0) > 0
  const hasSpells    = p.castingType === 'known'
    ? (p.spellsKnown?.[levelIdx.value] ?? 0) > 0
    : builder.draft.level >= 2 // prepared/spellbook casters gain slots at level 2
  return !hasCantrips && !hasSpells
})

const atCantripLimit = computed(() =>
  builder.draft.selectedCantrips.length >= cantripLimit.value
)

const { data: cantripData, isPending: cantripsLoading } = useQuery({
  queryKey: ['cantrips', builder.draft.classIndex],
  queryFn: () => fiveEApi.listSpells({ level: 0, class: builder.draft.classIndex }),
  staleTime: Infinity,
  enabled: computed(() => !!builder.draft.classIndex && !noSpellsAtLevel.value),
})
const cantrips = computed(() => cantripData.value?.results ?? [])

function isCantripSelected(index: string) {
  return builder.draft.selectedCantrips.some(c => c.index === index)
}

function toggleCantrip(c: { index: string; name: string }) {
  if (isCantripSelected(c.index)) {
    builder.draft.selectedCantrips = builder.draft.selectedCantrips.filter(s => s.index !== c.index)
  } else if (!atCantripLimit.value) {
    builder.draft.selectedCantrips.push({ index: c.index, name: c.name })
  }
}
</script>
