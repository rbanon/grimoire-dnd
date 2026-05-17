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

      <p
        v-if="showValidation && cantripLimit > 0 && cantripLimit !== Infinity && builder.draft.selectedCantrips.length < cantripLimit"
        class="text-xs font-body text-blood-bright"
      >
        Selecciona {{ cantripLimit - builder.draft.selectedCantrips.length }} cantrip{{ cantripLimit - builder.draft.selectedCantrips.length !== 1 ? 's' : '' }} más para continuar.
      </p>

      <!-- ── Spells Known (known casters: Bard, Ranger, Sorcerer, Warlock) ── -->
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

        <SelectedSpellList :spells="builder.draft.selectedSpells" @remove="removeSpell" />

        <button
          v-if="!atSpellLimit"
          type="button"
          class="btn-secondary text-xs gap-1.5"
          @click="showSpellPicker = true"
        >
          <PlusIcon :size="12" /> Add Spell
        </button>

        <p
          v-if="showValidation && builder.draft.selectedSpells.length < spellLimit"
          class="text-xs font-body text-blood-bright"
        >
          Selecciona {{ spellLimit - builder.draft.selectedSpells.length }} hechizo{{ spellLimit - builder.draft.selectedSpells.length !== 1 ? 's' : '' }} más para continuar.
        </p>
      </section>

      <!-- ── Prepared Spells (Cleric, Druid, Paladin) ──────────────────── -->
      <!-- ── Spellbook (Wizard) ────────────────────────────────────────── -->
      <section
        v-else-if="profile?.castingType === 'prepared' || profile?.castingType === 'spellbook'"
        class="space-y-4"
      >
        <div class="flex items-center justify-between">
          <p class="label">{{ preparedSectionLabel }}</p>
          <span class="text-xs font-body tabular-nums" :class="atPreparedLimit ? 'text-blood-bright' : 'text-mist'">
            {{ builder.draft.selectedSpells.length }} / {{ preparedSpellLimit }}
          </span>
        </div>
        <p v-if="atPreparedLimit" class="text-xs font-body text-blood-bright/80 -mt-2">
          Limit reached for level {{ builder.draft.level }}.
        </p>

        <div class="card p-3 border-shadow/30 bg-depths/20 flex items-start gap-2">
          <span class="text-gold-dim/60 text-xs shrink-0 mt-0.5">ℹ</span>
          <p class="text-xs font-body text-mist">{{ preparedSectionNote }}</p>
        </div>

        <SelectedSpellList :spells="builder.draft.selectedSpells" @remove="removeSpell" />

        <button
          v-if="!atPreparedLimit"
          type="button"
          class="btn-secondary text-xs gap-1.5"
          @click="showSpellPicker = true"
        >
          <PlusIcon :size="12" /> Add Spell
        </button>

        <p
          v-if="showValidation && builder.draft.level >= 2 && builder.draft.selectedSpells.length < preparedSpellLimit"
          class="text-xs font-body text-blood-bright"
        >
          Selecciona {{ preparedSpellLimit - builder.draft.selectedSpells.length }} hechizo{{ preparedSpellLimit - builder.draft.selectedSpells.length !== 1 ? 's' : '' }} más para continuar.
        </p>
      </section>

      <!-- Shared SpellPickerModal (known + prepared/spellbook) -->
      <SpellPickerModal
        :show="showSpellPicker"
        :class-index="builder.draft.classIndex"
        :class-name="builder.draft.className"
        :known-indices="builder.draft.selectedSpells.map(s => s.index)"
        :known-spells="builder.draft.selectedSpells"
        :slots-per-level="slotsPerLevel"
        :max-level="maxSpellLevel"
        :limit="activeSpellLimit"
        @close="showSpellPicker = false"
        @add="onAddSpells"
      />

    </template>

    <div class="h-4" />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, defineComponent, h } from 'vue'
import { useQuery } from '@tanstack/vue-query'
import { InfoIcon, PlusIcon, XIcon } from 'lucide-vue-next'
import { useBuilderStore } from '@/character-builder/builderStore'
import { fiveEApi } from '@/shared/api/fiveE.client'
import { useInfoPanel } from '@/shared/composables/useInfoPanel'
import { useBuilderValidation } from '@/shared/composables/useBuilderValidation'
import { getSpellProfile, getMaxSpellLevel, getSpellSlots } from '@/character-builder/classMeta'
import { computeModifier } from '@/shared/types/character'
import GrimoireSpinner from '@/character-builder/components/GrimoireSpinner.vue'
import SpellPickerModal from '@/characters/components/SpellPickerModal.vue'

// ── Inline sub-component: selected spell list ─────────────────────────────────
const SelectedSpellList = defineComponent({
  props: {
    spells: { type: Array as () => { index: string; name: string; level: number }[], required: true },
  },
  emits: ['remove'],
  setup(props, { emit }) {
    return () => {
      if (props.spells.length === 0) {
        return h('p', { class: 'text-xs font-body text-mist' }, 'No spells selected yet.')
      }
      return h('div', { class: 'space-y-1.5' },
        props.spells.map(s =>
          h('div', {
            key: s.index,
            class: 'group flex items-center gap-2 px-3 py-2 rounded border border-arcane-base/25 bg-arcane-deep/8',
          }, [
            h('span', { class: 'flex-1 text-sm font-heading text-arcane-pale/90' }, s.name),
            h('span', { class: 'badge-arcane text-2xs' }, `Lv ${s.level}`),
            h('button', {
              type: 'button',
              class: 'shrink-0 w-5 h-5 flex items-center justify-center rounded text-mist/30 hover:text-blood-bright transition-colors opacity-0 group-hover:opacity-100',
              onClick: () => emit('remove', s.index),
            }, h(XIcon, { size: 11 })),
          ])
        )
      )
    }
  },
})

// ── Store & composables ───────────────────────────────────────────────────────
const builder = useBuilderStore()
const infoPanel = useInfoPanel()
const { showValidation } = useBuilderValidation()
const showSpellPicker = ref(false)

// ── Spell profile helpers ─────────────────────────────────────────────────────
const abilityFullName: Record<string, string> = {
  cha: 'Charisma', int: 'Intelligence', wis: 'Wisdom',
}
const spellAbilityName = computed(() =>
  abilityFullName[builder.draft.classSpellcastingAbility ?? ''] ?? '—'
)

const profile  = computed(() => getSpellProfile(builder.draft.classIndex))
const levelIdx = computed(() => builder.draft.level - 1)

// ── Limits ────────────────────────────────────────────────────────────────────
const cantripLimit  = computed(() => profile.value?.cantripsKnown[levelIdx.value] ?? Infinity)
const spellLimit    = computed(() => profile.value?.spellsKnown?.[levelIdx.value] ?? 0)
const maxSpellLevel = computed(() => getMaxSpellLevel(builder.draft.classIndex, builder.draft.level))

// Total spell slots available at this level (used as a floor for prepared casters)
const totalSlotCount = computed(() => {
  const s = getSpellSlots(builder.draft.classIndex, builder.draft.level)
  return s.level1 + s.level2 + s.level3 + s.level4 + s.level5 + s.level6 + s.level7 + s.level8 + s.level9
})

// Per-level slot map — enforces per-level caps in the modal.
// Applies to both 'prepared' and 'known' casters: for known casters, slot count at each
// level happens to equal the number of level-ups during which that spell level was accessible
// (e.g. sorcerer lvl7 has 3rd-level slots since lvl5 → 3 chances → cap of 3).
const slotsPerLevel = computed((): Record<number, number> | undefined => {
  const ct = profile.value?.castingType
  if (ct !== 'prepared' && ct !== 'known') return undefined
  const s = getSpellSlots(builder.draft.classIndex, builder.draft.level)
  const result: Record<number, number> = {}
  const entries: [number, number][] = [
    [1, s.level1], [2, s.level2], [3, s.level3], [4, s.level4], [5, s.level5],
    [6, s.level6], [7, s.level7], [8, s.level8], [9, s.level9],
  ]
  for (const [lvl, count] of entries) {
    if (count > 0) result[lvl] = count
  }
  return result
})

// Daily prepared limit per rules (paladin: CHA_mod + floor(level/2); others: ability_mod + level)
const dailyPreparedLimit = computed(() => {
  const p = profile.value
  if (!p || p.castingType === 'known') return 0
  const mod = computeModifier(builder.effectiveScores[p.preparedAbility!])
  const level = builder.draft.level
  const raw = builder.draft.classIndex === 'paladin'
    ? Math.floor(level / 2) + mod
    : level + mod
  return Math.max(1, raw)
})

// Builder limit for prepared/spellbook: at least totalSlotCount so users aren't blocked by low ability scores
const preparedSpellLimit = computed(() => {
  const p = profile.value
  if (!p || p.castingType === 'known') return 0
  if (p.castingType === 'spellbook') return dailyPreparedLimit.value
  return Math.max(totalSlotCount.value, dailyPreparedLimit.value)
})

// Unified limit used by the shared modal
const activeSpellLimit = computed(() =>
  profile.value?.castingType === 'known' ? spellLimit.value : preparedSpellLimit.value
)

// ── At-limit flags ────────────────────────────────────────────────────────────
const atCantripLimit  = computed(() => builder.draft.selectedCantrips.length >= cantripLimit.value)
const atSpellLimit    = computed(() => builder.draft.selectedSpells.length >= spellLimit.value)
const atPreparedLimit = computed(() => builder.draft.selectedSpells.length >= preparedSpellLimit.value)

// ── No spells at this level (Paladin/Ranger lv1) ──────────────────────────────
const noSpellsAtLevel = computed(() => {
  const p = profile.value
  if (!p) return false
  const hasCantrips = (p.cantripsKnown[levelIdx.value] ?? 0) > 0
  const hasSpells   = p.castingType === 'known'
    ? (p.spellsKnown?.[levelIdx.value] ?? 0) > 0
    : builder.draft.level >= 2
  return !hasCantrips && !hasSpells
})

// ── Prepared section labels ───────────────────────────────────────────────────
const preparedSectionLabel = computed(() =>
  profile.value?.castingType === 'spellbook' ? 'Starting Spellbook' : 'Starting Prepared Spells'
)

const preparedSectionNote = computed(() => {
  const p = profile.value
  if (!p) return ''
  const abilityName = abilityFullName[p.preparedAbility ?? ''] ?? ''
  if (p.castingType === 'spellbook') {
    return `Wizards prepare ${abilityName} modifier + level spells from their spellbook each day. These are your starting prepared spells — you can add more to your spellbook from the character sheet.`
  }
  const mod = computeModifier(builder.effectiveScores[p.preparedAbility!])
  const sign = mod >= 0 ? `+${mod}` : `${mod}`
  const level = builder.draft.level
  const formulaText = builder.draft.classIndex === 'paladin'
    ? `${abilityName} mod (${sign}) + ½ level (${Math.floor(level / 2)}) = ${dailyPreparedLimit.value}`
    : `${abilityName} mod (${sign}) + level (${level}) = ${dailyPreparedLimit.value}`
  return `Pre-select your starting spells — you can pick up to ${preparedSpellLimit.value}. Daily preparation limit: ${formulaText}. You may swap prepared spells after each long rest.`
})

// ── Cantrip fetch ─────────────────────────────────────────────────────────────
const { data: cantripData, isPending: cantripsLoading } = useQuery({
  queryKey: ['cantrips', builder.draft.classIndex],
  queryFn: () => fiveEApi.listSpells({ level: 0, class: builder.draft.classIndex }),
  staleTime: Infinity,
  enabled: computed(() => !!builder.draft.classIndex && !noSpellsAtLevel.value && cantripLimit.value > 0),
})
const cantrips = computed(() => cantripData.value?.results ?? [])

// ── Cantrip interactions ──────────────────────────────────────────────────────
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

// ── Spell interactions ────────────────────────────────────────────────────────
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
