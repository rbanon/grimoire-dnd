<template>
  <div class="max-w-3xl mx-auto px-6 py-8 space-y-8">
    <div class="rule-gold"><span>Spells</span></div>

    <div class="card p-5 border-arcane-base/20 bg-arcane-deep/10">
      <div class="flex items-start gap-3">
        <span class="text-arcane-pale text-xl shrink-0">✶</span>
        <div>
          <p class="font-heading text-sm text-vellum mb-1">{{ builder.draft.className }} Spellcasting</p>
          <p class="text-sm font-body text-ash">
            Your spellcasting ability is <span class="text-arcane-pale font-heading">{{ spellAbilityName }}</span>.
            You can add spells to your favorites and spell list from the full spell browser after character creation.
          </p>
        </div>
      </div>
    </div>

    <!-- Cantrips quick-pick -->
    <section v-if="cantripsLoading" class="flex justify-center py-6"><GrimoireSpinner label="Loading spells" /></section>
    <section v-else class="space-y-4">
      <div class="flex items-center justify-between">
        <p class="label">Cantrips</p>
        <span class="text-xs font-body text-mist">{{ builder.draft.selectedCantrips.length }} selected</span>
      </div>
      <div class="grid grid-cols-2 sm:grid-cols-3 gap-1.5">
        <div
          v-for="c in cantrips"
          :key="c.index"
          class="group relative flex items-center rounded border text-sm font-heading tracking-wide transition-all duration-150 cursor-pointer"
          :class="isCantripSelected(c.index)
            ? 'border-arcane-base/50 bg-arcane-deep/20 text-arcane-pale'
            : 'border-shadow text-ash hover:border-arcane-base/25 hover:text-stone'"
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
    </section>

    <div class="card p-4 border-shadow/40 bg-depths/30">
      <p class="text-xs font-body text-mist">
        First-level spells and spell slot management are available on the character sheet after creation. You can browse the full spell list in the Spells section of the app.
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
import GrimoireSpinner from '@/character-builder/components/GrimoireSpinner.vue'

const builder = useBuilderStore()
const infoPanel = useInfoPanel()

const abilityNames: Record<string, string> = {
  cha: 'Charisma', int: 'Intelligence', wis: 'Wisdom',
}
const spellAbilityName = computed(() =>
  abilityNames[builder.draft.classSpellcastingAbility ?? ''] ?? '—'
)

const { data: cantripData, isPending: cantripsLoading } = useQuery({
  queryKey: ['cantrips', builder.draft.classIndex],
  queryFn: () => fiveEApi.listSpells({ level: 0, class: builder.draft.classIndex }),
  staleTime: Infinity,
  enabled: computed(() => !!builder.draft.classIndex),
})
const cantrips = computed(() => cantripData.value?.results ?? [])

function isCantripSelected(index: string) {
  return builder.draft.selectedCantrips.some(c => c.index === index)
}
function toggleCantrip(c: { index: string; name: string }) {
  if (isCantripSelected(c.index)) {
    builder.draft.selectedCantrips = builder.draft.selectedCantrips.filter(s => s.index !== c.index)
  } else {
    builder.draft.selectedCantrips.push({ index: c.index, name: c.name })
  }
}
</script>
