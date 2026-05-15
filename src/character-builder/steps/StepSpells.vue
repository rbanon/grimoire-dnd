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

    <!-- No spells at this level (Ranger/Paladin lv1) -->
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

    <template v-else>

      <!-- ── Cantrips ─────────────────────────────────────────────────── -->
      <section v-if="cantripLimit > 0" class="space-y-4">
        <div class="flex items-center justify-between">
          <p class="label">Cantrips</p>
          <span class="text-xs font-body tabular-nums" :class="atCantripLimit ? 'text-blood-bright' : 'text-mist'">
            {{ builder.draft.selectedCantrips.length }} / {{ cantripLimit }}
          </span>
        </div>
        <p v-if="atCantripLimit" class="text-xs font-body text-blood-bright/80 -mt-2">
          Maximum cantrips reached for level {{ builder.draft.level }}.
        </p>

        <div v-if="cantripsLoading" class="flex justify-center py-6">
          <GrimoireSpinner label="Loading cantrips" />
        </div>
        <div v-else class="grid grid-cols-2 sm:grid-cols-3 gap-1.5">
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
      </section>

      <!-- ── Spells Known (known casters) ────────────────────────────── -->
      <section v-if="profile?.castingType === 'known' && spellLimit > 0" class="space-y-4">
        <div class="flex items-center justify-between">
          <p class="label">Spells Known</p>
          <span class="text-xs font-body tabular-nums" :class="atSpellLimit ? 'text-blood-bright' : 'text-mist'">
            {{ builder.draft.selectedSpells.length }} / {{ spellLimit }}
          </span>
        </div>
        <p v-if="atSpellLimit" class="text-xs font-body text-blood-bright/80 -mt-2">
          Maximum spells known reached for level {{ builder.draft.level }}.
        </p>

        <!-- Selected spells list -->
        <div v-if="builder.draft.selectedSpells.length > 0" class="space-y-1.5">
          <div
            v-for="s in builder.draft.selectedSpells"
            :key="s.index"
            class="group flex items-center gap-2 px-3 py-2 rounded border border-arcane-base/25 bg-arcane-deep/8"
          >
            <span class="flex-1 text-sm font-heading text-arcane-pale/90">{{ s.name }}</span>
            <span class="badge-arcane text-2xs">Lv {{ s.level }}</span>
            <button
              type="button"
              class="shrink-0 w-5 h-5 flex items-center justify-center rounded text-mist/30 hover:text-blood-bright transition-colors opacity-0 group-hover:opacity-100"
              @click="removeSpell(s.index)"
            >
              <XIcon :size="11" />
            </button>
          </div>
        </div>
        <p v-else class="text-xs font-body text-mist">No spells selected yet.</p>

        <button
          v-if="!atSpellLimit"
          type="button"
          class="btn-secondary text-xs gap-1.5"
          @click="showSpellPicker = true"
        >
          <PlusIcon :size="12" /> Add Spell
        </button>

        <SpellPickerModal
          :show="showSpellPicker"
          :class-index="builder.draft.classIndex"
          :class-name="builder.draft.className"
          :known-indices="builder.draft.selectedSpells.map(s => s.index)"
          :max-level="maxSpellLevel"
          :limit="spellLimit"
          @close="showSpellPicker = false"
          @add="onAddSpells"
        />
      </section>

      <!-- ── Info for prepared/spellbook casters ──────────────────────── -->
      <div
        v-else-if="profile && profile.castingType !== 'known'"
        class="card p-4 border-shadow/40 bg-depths/30"
      >
        <p class="text-xs font-heading text-stone mb-1">
          {{ profile.castingType === 'spellbook' ? 'Spellbook' : 'Prepared Spells' }}
        </p>
        <p class="text-xs font-body text-mist">
          <template v-if="profile.castingType === 'spellbook'">
            Wizards copy spells into their spellbook. You'll add your starting spells from the character sheet after creation.
          </template>
          <template v-else>
            {{ builder.draft.className }}s prepare their spell list each day. You'll choose prepared spells from the character sheet.
          </template>
        </p>
      </div>

    </template>

    <div class="h-4" />
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { useQuery } from '@tanstack/vue-query'
import { InfoIcon, PlusIcon, XIcon } from 'lucide-vue-next'
import { useBuilderStore } from '@/character-builder/builderStore'
import { fiveEApi } from '@/shared/api/fiveE.client'
import { useInfoPanel } from '@/shared/composables/useInfoPanel'
import { getSpellProfile, getMaxSpellLevel } from '@/character-builder/classMeta'
import GrimoireSpinner from '@/character-builder/components/GrimoireSpinner.vue'
import SpellPickerModal from '@/characters/components/SpellPickerModal.vue'

const builder = useBuilderStore()
const infoPanel = useInfoPanel()
const showSpellPicker = ref(false)

const abilityNames: Record<string, string> = {
  cha: 'Charisma', int: 'Intelligence', wis: 'Wisdom',
}
const spellAbilityName = computed(() =>
  abilityNames[builder.draft.classSpellcastingAbility ?? ''] ?? '—'
)

const profile  = computed(() => getSpellProfile(builder.draft.classIndex))
const levelIdx = computed(() => builder.draft.level - 1)

const cantripLimit = computed(() => profile.value?.cantripsKnown[levelIdx.value] ?? Infinity)
const spellLimit   = computed(() => profile.value?.spellsKnown?.[levelIdx.value] ?? 0)

const noSpellsAtLevel = computed(() => {
  const p = profile.value
  if (!p) return false
  const hasCantrips = (p.cantripsKnown[levelIdx.value] ?? 0) > 0
  const hasSpells   = p.castingType === 'known'
    ? (p.spellsKnown?.[levelIdx.value] ?? 0) > 0
    : builder.draft.level >= 2
  return !hasCantrips && !hasSpells
})

const atCantripLimit = computed(() => builder.draft.selectedCantrips.length >= cantripLimit.value)
const maxSpellLevel = computed(() => getMaxSpellLevel(builder.draft.classIndex, builder.draft.level))

const atSpellLimit   = computed(() => builder.draft.selectedSpells.length >= spellLimit.value)

const { data: cantripData, isPending: cantripsLoading } = useQuery({
  queryKey: ['cantrips', builder.draft.classIndex],
  queryFn: () => fiveEApi.listSpells({ level: 0, class: builder.draft.classIndex }),
  staleTime: Infinity,
  enabled: computed(() => !!builder.draft.classIndex && !noSpellsAtLevel.value && cantripLimit.value > 0),
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

function removeSpell(index: string) {
  builder.draft.selectedSpells = builder.draft.selectedSpells.filter(s => s.index !== index)
}
function onAddSpells(spells: { index: string; name: string; level: number }[]) {
  showSpellPicker.value = false
  for (const s of spells) {
    if (!builder.draft.selectedSpells.some(x => x.index === s.index)) {
      builder.draft.selectedSpells.push(s)
    }
  }
}
</script>
