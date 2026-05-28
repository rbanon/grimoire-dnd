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

    <!-- ── Known casters: per-level accordion ── -->
    <template v-else-if="profile?.castingType === 'known'">
      <p class="text-xs font-body text-mist -mt-4">
        Choose your spells level by level — each level grants new cantrips or spells.
        <span v-if="builder.draft.level > 1" class="text-mist/60">
          Starting from level 2, you may also replace one previously learned spell.
        </span>
      </p>

      <!-- Slot info -->
      <div v-if="slotInfoEntries.length > 0" class="flex items-start gap-2 text-xs font-body text-mist px-3 py-2.5 rounded border border-shadow bg-depths/40 -mt-2">
        <span class="text-gold-dim/60 shrink-0 mt-0.5">ℹ</span>
        <span>
          Spell slots at level {{ builder.draft.level }}:
          <template v-for="(e, i) in slotInfoEntries" :key="e.lvl">
            <span class="text-stone font-heading">{{ e.count }}× Lv {{ e.lvl }}</span>
            <span v-if="i < slotInfoEntries.length - 1" class="mx-1 text-mist/40">·</span>
          </template>
          — you may pick any spell up to level {{ maxSpellLevel }}.
        </span>
      </div>

      <div class="space-y-2">
        <div v-for="lvl in levelsWithGains" :key="lvl" class="card overflow-hidden">
          <!-- Header -->
          <button
            type="button"
            class="w-full flex items-center justify-between px-5 py-4 hover:bg-depths/30 transition-colors"
            @click="toggleLevel(lvl)"
          >
            <div class="flex items-center gap-3">
              <span class="font-heading text-sm text-vellum">Level {{ lvl }}</span>
              <span class="text-2xs font-body text-mist">{{ levelGainDescription(lvl) }}</span>
            </div>
            <div class="flex items-center gap-2">
              <span
                class="text-2xs font-heading px-2 py-0.5 rounded border"
                :class="isLevelComplete(lvl)
                  ? 'border-arcane-base/40 text-arcane-pale bg-arcane-deep/10'
                  : showValidation
                    ? 'border-blood-base/60 text-blood-bright bg-blood-deep/15'
                    : 'border-shadow text-mist/50'"
              >{{ isLevelComplete(lvl) ? 'Done' : 'Pending' }}</span>
              <ChevronDownIcon
                :size="14"
                class="text-mist/50 transition-transform duration-200"
                :class="openLevels.has(lvl) ? 'rotate-180' : ''"
              />
            </div>
          </button>

          <!-- Body -->
          <Transition name="expand">
            <div v-if="openLevels.has(lvl)" class="border-t border-shadow/30 px-5 pb-5 pt-4 space-y-5">

              <!-- Cantrips gained at this level -->
              <div v-if="cantripsGainedAt(lvl) > 0" class="space-y-3">
                <div class="flex items-center justify-between">
                  <p class="text-xs font-heading text-mist uppercase tracking-wide">
                    New Cantrip{{ cantripsGainedAt(lvl) > 1 ? 's' : '' }}
                  </p>
                  <span class="text-xs font-body tabular-nums text-mist">
                    {{ getCantripEntry(lvl).length }}/{{ cantripsGainedAt(lvl) }}
                  </span>
                </div>
                <div v-if="cantripsLoading" class="flex justify-center py-2">
                  <GrimoireSpinner />
                </div>
                <div v-else class="grid grid-cols-2 sm:grid-cols-3 gap-1.5">
                  <div
                    v-for="c in cantrips"
                    :key="c.index"
                    class="group relative flex items-center rounded border text-sm font-heading tracking-wide transition-all duration-150"
                    :class="isCantripSelectedAtLevel(lvl, c.index)
                      ? 'border-arcane-base/50 bg-arcane-deep/20 text-arcane-pale cursor-pointer'
                      : isCantripTakenElsewhere(lvl, c.index)
                        ? 'border-shadow text-mist/30 cursor-not-allowed opacity-40'
                        : getCantripEntry(lvl).length >= cantripsGainedAt(lvl)
                          ? 'border-shadow text-mist/40 cursor-not-allowed opacity-50'
                          : 'border-shadow text-ash hover:border-arcane-base/25 hover:text-stone cursor-pointer'"
                    @click="toggleCantripAtLevel(lvl, c)"
                  >
                    <span class="flex-1 px-3 py-2 text-left">
                      {{ c.name }}
                      <span v-if="isCantripSelectedAtLevel(lvl, c.index)" class="text-arcane-pale ml-1">✓</span>
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

              <!-- Spells gained at this level -->
              <div v-if="spellsGainedAt(lvl) > 0" class="space-y-3">
                <p class="text-xs font-heading text-mist uppercase tracking-wide">
                  New Spell{{ spellsGainedAt(lvl) > 1 ? 's' : '' }}
                  <span class="font-body normal-case text-mist/60 ml-1">(up to spell level {{ getMaxSpellLevel(builder.draft.classIndex, lvl) }})</span>
                </p>
                <div v-if="getSpellEntry(lvl).length > 0" class="space-y-1.5">
                  <div
                    v-for="spell in getSpellEntry(lvl)"
                    :key="spell.index"
                    class="group flex items-center gap-2 px-3 py-2 rounded border border-arcane-base/25 bg-arcane-deep/8"
                  >
                    <span class="flex-1 text-sm font-heading text-arcane-pale/90">{{ spell.name }}</span>
                    <span class="badge-arcane text-2xs">Lv {{ spell.level }}</span>
                    <button
                      type="button"
                      class="shrink-0 w-5 h-5 flex items-center justify-center rounded text-mist/30 hover:text-blood-bright transition-colors opacity-0 group-hover:opacity-100"
                      @click="removeSpellAtLevel(lvl, spell.index)"
                    >
                      <XIcon :size="11" />
                    </button>
                  </div>
                </div>
                <button
                  type="button"
                  class="btn-secondary text-xs gap-1.5"
                  @click="showSpellPickerForLevel = lvl"
                >
                  <PlusIcon :size="12" />
                  {{ getSpellEntry(lvl).length >= spellsGainedAt(lvl) ? 'Change' : 'Pick Spell' }}
                </button>
              </div>

              <!-- Optional replacement (level >= 2 with prior active spells) -->
              <div
                v-if="spellsGainedAt(lvl) > 0 && activeSpellsBeforeLevel(lvl).length > 0"
                class="border-t border-shadow/20 pt-4 space-y-3"
              >
                <p class="text-xs font-heading text-mist/60 uppercase tracking-wide">Replace (Optional)</p>

                <!-- Replacement already set -->
                <div v-if="getReplacementEntry(lvl)" class="flex items-center gap-2">
                  <div class="flex-1 flex items-center gap-2 px-3 py-2 rounded border border-shadow/40 bg-depths/20 min-w-0">
                    <span class="text-sm font-heading text-ash line-through opacity-50 truncate">{{ getReplacementFromName(lvl) }}</span>
                    <span class="text-arcane-pale/50 text-xs shrink-0">→</span>
                    <span class="text-sm font-heading text-arcane-pale truncate">{{ getReplacementEntry(lvl)!.to.name }}</span>
                    <span class="badge-arcane text-2xs shrink-0 ml-auto">Lv {{ getReplacementEntry(lvl)!.to.level }}</span>
                  </div>
                  <button
                    type="button"
                    class="shrink-0 w-7 h-7 flex items-center justify-center rounded border border-shadow text-mist/50 hover:text-blood-bright hover:border-blood-base/30 transition-all"
                    @click="clearReplacement(lvl)"
                  >
                    <XIcon :size="12" />
                  </button>
                </div>

                <!-- No replacement yet -->
                <template v-else>
                  <p class="text-xs font-body text-mist/60">Select a spell to swap out:</p>
                  <div class="flex flex-wrap gap-1.5">
                    <button
                      v-for="spell in activeSpellsBeforeLevel(lvl)"
                      :key="spell.index"
                      type="button"
                      class="px-3 py-1.5 rounded border text-xs font-heading tracking-wide transition-all"
                      :class="replacingFromIndex[lvl] === spell.index
                        ? 'border-arcane-base/50 bg-arcane-deep/20 text-arcane-pale'
                        : 'border-shadow text-ash hover:border-arcane-base/25 hover:text-stone'"
                      @click="selectReplacementFrom(lvl, spell.index)"
                    >
                      {{ spell.name }}
                    </button>
                  </div>
                  <button
                    v-if="replacingFromIndex[lvl]"
                    type="button"
                    class="btn-secondary text-xs gap-1.5"
                    @click="showReplacementPickerForLevel = lvl"
                  >
                    <PlusIcon :size="12" /> Pick Replacement
                  </button>
                </template>
              </div>

              <!-- Per-level validation hint -->
              <p v-if="showValidation && !isLevelComplete(lvl)" class="text-xs font-body text-blood-bright pt-1">
                <template v-if="getCantripEntry(lvl).length < cantripsGainedAt(lvl)">
                  Pick {{ cantripsGainedAt(lvl) - getCantripEntry(lvl).length }} more cantrip{{ cantripsGainedAt(lvl) - getCantripEntry(lvl).length > 1 ? 's' : '' }} above.
                </template>
                <template v-if="getSpellEntry(lvl).length < spellsGainedAt(lvl)">
                  Pick {{ spellsGainedAt(lvl) - getSpellEntry(lvl).length }} more spell{{ spellsGainedAt(lvl) - getSpellEntry(lvl).length > 1 ? 's' : '' }} above.
                </template>
              </p>

            </div>
          </Transition>
        </div>
      </div>

      <!-- Gain spell picker -->
      <SpellPickerModal
        v-if="showSpellPickerForLevel !== null"
        :show="showSpellPickerForLevel !== null"
        :class-index="builder.draft.classIndex"
        :class-name="builder.draft.className"
        :known-indices="knownIndicesForLevel(showSpellPickerForLevel!)"
        :chosen-elsewhere-indices="chosenElsewhereForLevel(showSpellPickerForLevel)"
        :known-spells="activeSpellsBeforeLevel(showSpellPickerForLevel!)"
        :max-level="getMaxSpellLevel(builder.draft.classIndex, showSpellPickerForLevel!)"
        :limit="activeSpellsBeforeLevel(showSpellPickerForLevel!).length + spellsGainedAt(showSpellPickerForLevel!)"
        @close="showSpellPickerForLevel = null"
        @add="(spells) => onSpellPickedAtLevel(showSpellPickerForLevel!, spells)"
      />
      <!-- Replace spell picker -->
      <SpellPickerModal
        v-if="showReplacementPickerForLevel !== null"
        :show="showReplacementPickerForLevel !== null"
        :class-index="builder.draft.classIndex"
        :class-name="builder.draft.className"
        :known-indices="replacementKnownIndices(showReplacementPickerForLevel!)"
        :chosen-elsewhere-indices="chosenElsewhereForLevel(showReplacementPickerForLevel)"
        :known-spells="activeSpellsBeforeLevel(showReplacementPickerForLevel!).filter(s => s.index !== replacingFromIndex[showReplacementPickerForLevel!])"
        :max-level="getMaxSpellLevel(builder.draft.classIndex, showReplacementPickerForLevel!)"
        :limit="activeSpellsBeforeLevel(showReplacementPickerForLevel!).length"
        @close="showReplacementPickerForLevel = null"
        @add="(spells) => onReplacementPickedAtLevel(showReplacementPickerForLevel!, spells)"
      />
    </template>

    <!-- ── Prepared / spellbook casters: flat UI ── -->
    <template v-else>

      <!-- Cantrips -->
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
          <GrimoireSpinner />
        </div>
        <div v-else class="grid grid-cols-2 sm:grid-cols-3 gap-1.5">
          <div
            v-for="c in cantrips"
            :key="c.index"
            class="group relative flex items-center rounded border text-sm font-heading tracking-wide transition-all duration-150"
            :class="isCantripSelectedFlat(c.index)
              ? 'border-arcane-base/50 bg-arcane-deep/20 text-arcane-pale cursor-pointer'
              : atCantripLimit
                ? 'border-shadow text-mist cursor-not-allowed opacity-50'
                : 'border-shadow text-ash hover:border-arcane-base/25 hover:text-stone cursor-pointer'"
            @click="toggleCantripFlat(c)"
          >
            <span class="flex-1 px-3 py-2 text-left">
              {{ c.name }}
              <span v-if="isCantripSelectedFlat(c.index)" class="text-arcane-pale ml-1">✓</span>
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
        <p v-if="showValidation && cantripLimit !== Infinity && builder.draft.selectedCantrips.length < cantripLimit" class="text-xs font-body text-blood-bright">
          Select {{ cantripLimit - builder.draft.selectedCantrips.length }} more cantrip{{ cantripLimit - builder.draft.selectedCantrips.length !== 1 ? 's' : '' }} to continue.
        </p>
      </section>

      <!-- ── Prepared casters: two-step (pool + daily prepared) ── -->
      <template v-if="profile?.castingType === 'prepared'">

        <!-- Section A: Spell List (known pool) -->
        <section class="space-y-4">
          <p class="label">Your Spell List</p>

          <div class="card p-3 border-shadow/30 bg-depths/20 flex items-start gap-2">
            <span class="text-gold-dim/60 text-xs shrink-0 mt-0.5">ℹ</span>
            <p class="text-xs font-body text-mist">
              These are the spells you have access to. Your class spell list is your full library — add any spells you want available. Each day you prepare a subset of these.
            </p>
          </div>

          <SelectedSpellList :spells="builder.draft.selectedSpells" @remove="removeSpell" />

          <button
            type="button"
            class="btn-secondary text-xs gap-1.5"
            @click="showSpellPickerFlat = true"
          >
            <PlusIcon :size="12" /> Add to Spell List
          </button>
        </section>

        <!-- Section B: Daily Preparation -->
        <section class="space-y-4">
          <div class="flex items-center justify-between">
            <p class="label">Prepared Today</p>
            <span class="text-xs font-body tabular-nums" :class="atPreparedLimit ? 'text-blood-bright' : 'text-mist'">
              {{ builder.draft.selectedPreparedSpells.length }} / {{ preparedSpellLimit }}
            </span>
          </div>
          <p v-if="atPreparedLimit" class="text-xs font-body text-blood-bright/80 -mt-2">
            Limit reached for level {{ builder.draft.level }}.
          </p>

          <div class="card p-3 border-shadow/30 bg-depths/20 flex items-start gap-2">
            <span class="text-gold-dim/60 text-xs shrink-0 mt-0.5">ℹ</span>
            <p class="text-xs font-body text-mist">{{ preparedSectionNote }}</p>
          </div>

          <div v-if="builder.draft.selectedSpells.length === 0" class="text-xs font-body text-mist/50 italic">
            Add spells to your list above to begin preparing.
          </div>
          <div v-else class="grid grid-cols-1 gap-1">
            <button
              v-for="spell in builder.draft.selectedSpells"
              :key="spell.index"
              type="button"
              class="flex items-center gap-2.5 px-3 py-2 rounded border text-left transition-all duration-100"
              :class="isPreparedInBuilder(spell.index)
                ? 'border-arcane-base/50 bg-arcane-deep/15 text-arcane-pale'
                : atPreparedLimit
                  ? 'border-shadow/40 text-mist/40 cursor-not-allowed'
                  : 'border-shadow text-ash hover:border-arcane-base/25 hover:text-stone cursor-pointer'"
              :disabled="!isPreparedInBuilder(spell.index) && atPreparedLimit"
              @click="togglePreparedInBuilder(spell)"
            >
              <span
                class="w-4 h-4 rounded shrink-0 border flex items-center justify-center transition-all"
                :class="isPreparedInBuilder(spell.index)
                  ? 'border-arcane-base/60 bg-arcane-base/30 text-arcane-pale'
                  : 'border-shadow/60'"
              >
                <span v-if="isPreparedInBuilder(spell.index)" class="text-2xs leading-none">✓</span>
              </span>
              <span class="font-body text-sm leading-snug flex-1">{{ spell.name }}</span>
              <span class="badge-arcane text-2xs">Lv {{ spell.level }}</span>
            </button>
          </div>

          <p
            v-if="showValidation && builder.draft.level >= getFirstSpellLevel(builder.draft.classIndex) && builder.draft.selectedPreparedSpells.length < preparedSpellLimit"
            class="text-xs font-body text-blood-bright"
          >
            Prepare {{ preparedSpellLimit - builder.draft.selectedPreparedSpells.length }} more spell{{ preparedSpellLimit - builder.draft.selectedPreparedSpells.length !== 1 ? 's' : '' }} to continue.
          </p>
        </section>
      </template>

      <!-- ── Spellbook casters: single pool ── -->
      <section
        v-else-if="profile?.castingType === 'spellbook'"
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
          @click="showSpellPickerFlat = true"
        >
          <PlusIcon :size="12" /> Add Spell
        </button>

        <p
          v-if="showValidation && builder.draft.level >= getFirstSpellLevel(builder.draft.classIndex) && builder.draft.selectedSpells.length < preparedSpellLimit"
          class="text-xs font-body text-blood-bright"
        >
          Select {{ preparedSpellLimit - builder.draft.selectedSpells.length }} more starting spell{{ preparedSpellLimit - builder.draft.selectedSpells.length !== 1 ? 's' : '' }} to continue.
        </p>
      </section>

      <SpellPickerModal
        :show="showSpellPickerFlat"
        :class-index="builder.draft.classIndex"
        :class-name="builder.draft.className"
        :known-indices="builder.draft.selectedSpells.map(s => s.index)"
        :known-spells="builder.draft.selectedSpells"
        :slots-per-level="slotsPerLevel"
        :max-level="maxSpellLevel"
        :limit="profile?.castingType === 'prepared' ? undefined : activeSpellLimit"
        @close="showSpellPickerFlat = false"
        @add="onAddSpellsFlat"
      />
    </template>

    <div class="h-4" />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted } from 'vue'
import { useQuery } from '@tanstack/vue-query'
import { InfoIcon, PlusIcon, ChevronDownIcon, XIcon } from 'lucide-vue-next'
import { useBuilderStore } from '@/character-builder/builderStore'
import type { SpellsByLevelEntry } from '@/character-builder/builderStore'
import { fiveEApi } from '@/shared/api/fiveE.client'
import { useInfoPanel } from '@/shared/composables/useInfoPanel'
import { useBuilderValidation } from '@/shared/composables/useBuilderValidation'
import {
  getSpellProfile, getMaxSpellLevel, getSpellSlots,
  cantripsGainedAtLevel, spellsGainedAtLevel, getFirstSpellLevel,
} from '@/character-builder/classMeta'
import { computeModifier } from '@/shared/types/character'
import GrimoireSpinner from '@/character-builder/components/GrimoireSpinner.vue'
import SelectedSpellList from '@/character-builder/components/SelectedSpellList.vue'
import SpellPickerModal from '@/characters/components/SpellPickerModal.vue'

// ── Store & composables ───────────────────────────────────────────────────────
const builder = useBuilderStore()
const infoPanel = useInfoPanel()
const { showValidation } = useBuilderValidation()

const abilityFullName: Record<string, string> = {
  cha: 'Charisma', int: 'Intelligence', wis: 'Wisdom',
}
const spellAbilityName = computed(() =>
  abilityFullName[builder.draft.classSpellcastingAbility ?? ''] ?? '—'
)

const profile  = computed(() => getSpellProfile(builder.draft.classIndex))
const levelIdx = computed(() => builder.draft.level - 1)

// ── Per-level helpers ─────────────────────────────────────────────────────────

function cantripsGainedAt(lvl: number): number {
  return cantripsGainedAtLevel(builder.draft.classIndex, lvl)
}

function spellsGainedAt(lvl: number): number {
  return spellsGainedAtLevel(builder.draft.classIndex, lvl)
}

const levelsWithGains = computed(() => {
  const result: number[] = []
  for (let lvl = 1; lvl <= builder.draft.level; lvl++) {
    if (cantripsGainedAt(lvl) > 0 || spellsGainedAt(lvl) > 0) result.push(lvl)
  }
  return result
})

function levelGainDescription(lvl: number): string {
  const c = cantripsGainedAt(lvl)
  const s = spellsGainedAt(lvl)
  const parts: string[] = []
  if (c > 0) parts.push(`+${c} cantrip${c > 1 ? 's' : ''}`)
  if (s > 0) parts.push(`+${s} spell${s > 1 ? 's' : ''}`)
  return parts.join(', ')
}

function ensureEntry(lvl: number): SpellsByLevelEntry {
  if (!builder.draft.spellsByLevel[lvl]) {
    builder.draft.spellsByLevel[lvl] = { cantripsGained: [], spellsGained: [], spellReplaced: null }
  }
  return builder.draft.spellsByLevel[lvl]
}

function getCantripEntry(lvl: number): { index: string; name: string }[] {
  return builder.draft.spellsByLevel[lvl]?.cantripsGained ?? []
}

function getSpellEntry(lvl: number): { index: string; name: string; level: number }[] {
  return builder.draft.spellsByLevel[lvl]?.spellsGained ?? []
}

function getReplacementEntry(lvl: number) {
  return builder.draft.spellsByLevel[lvl]?.spellReplaced ?? null
}

function getReplacementFromName(lvl: number): string {
  const r = getReplacementEntry(lvl)
  if (!r) return ''
  return activeSpellsBeforeLevel(lvl).find(s => s.index === r.fromIndex)?.name ?? r.fromIndex
}

function isLevelComplete(lvl: number): boolean {
  return getCantripEntry(lvl).length >= cantripsGainedAt(lvl) &&
         getSpellEntry(lvl).length >= spellsGainedAt(lvl)
}

function isCantripSelectedAtLevel(lvl: number, index: string): boolean {
  return getCantripEntry(lvl).some(c => c.index === index)
}

function isCantripTakenElsewhere(lvl: number, index: string): boolean {
  return Object.entries(builder.draft.spellsByLevel).some(([l, entry]) =>
    Number(l) !== lvl && (entry?.cantripsGained ?? []).some(c => c.index === index)
  )
}

function toggleCantripAtLevel(lvl: number, c: { index: string; name: string }) {
  if (isCantripTakenElsewhere(lvl, c.index)) return
  const entry = ensureEntry(lvl)
  if (isCantripSelectedAtLevel(lvl, c.index)) {
    entry.cantripsGained = entry.cantripsGained.filter(x => x.index !== c.index)
  } else if (entry.cantripsGained.length < cantripsGainedAt(lvl)) {
    entry.cantripsGained.push({ index: c.index, name: c.name })
  }
}

function removeSpellAtLevel(lvl: number, index: string) {
  const entry = builder.draft.spellsByLevel[lvl]
  if (entry) entry.spellsGained = entry.spellsGained.filter(s => s.index !== index)
}

// ── Active spells before a given level ───────────────────────────────────────

const spellPoolByLevel = computed(() => {
  const pools = new Map<number, { index: string; name: string; level: number }[]>()
  const pool = new Map<string, { index: string; name: string; level: number }>()
  for (let l = 1; l <= builder.draft.level + 1; l++) {
    pools.set(l, [...pool.values()])
    const entry = builder.draft.spellsByLevel[l]
    if (!entry) continue
    for (const s of entry.spellsGained) pool.set(s.index, s)
    if (entry.spellReplaced) {
      pool.delete(entry.spellReplaced.fromIndex)
      pool.set(entry.spellReplaced.to.index, entry.spellReplaced.to)
    }
  }
  return pools
})

function activeSpellsBeforeLevel(lvl: number): { index: string; name: string; level: number }[] {
  return spellPoolByLevel.value.get(lvl) ?? []
}

// ── Replacement state ─────────────────────────────────────────────────────────

const replacingFromIndex = ref<Record<number, string | null>>({})

function selectReplacementFrom(lvl: number, index: string) {
  if (replacingFromIndex.value[lvl] === index) {
    const map = { ...replacingFromIndex.value }
    delete map[lvl]
    replacingFromIndex.value = map
  } else {
    replacingFromIndex.value = { ...replacingFromIndex.value, [lvl]: index }
  }
}

function clearReplacement(lvl: number) {
  const entry = builder.draft.spellsByLevel[lvl]
  if (entry) entry.spellReplaced = null
  const map = { ...replacingFromIndex.value }
  delete map[lvl]
  replacingFromIndex.value = map
}

// ── Per-level spell picker modals ─────────────────────────────────────────────

const showSpellPickerForLevel = ref<number | null>(null)
const showReplacementPickerForLevel = ref<number | null>(null)

function knownIndicesForLevel(lvl: number | null): string[] {
  if (lvl === null) return []
  return activeSpellsBeforeLevel(lvl).map(s => s.index)
}

/** Spells chosen at other character levels (not before this level) — blocks them in the picker without consuming the limit. */
function chosenElsewhereForLevel(lvl: number | null): string[] {
  if (lvl === null) return []
  const before = new Set(activeSpellsBeforeLevel(lvl).map(s => s.index))
  const result: string[] = []
  for (const [l, entry] of Object.entries(builder.draft.spellsByLevel)) {
    if (Number(l) === lvl || !entry) continue
    for (const s of entry.spellsGained) {
      if (!before.has(s.index)) result.push(s.index)
    }
  }
  return result
}

function replacementKnownIndices(lvl: number | null): string[] {
  if (lvl === null) return []
  const fromIndex = replacingFromIndex.value[lvl]
  return activeSpellsBeforeLevel(lvl).map(s => s.index).filter(i => i !== fromIndex)
}

function onSpellPickedAtLevel(lvl: number, spells: { index: string; name: string; level: number }[]) {
  showSpellPickerForLevel.value = null
  if (spells.length === 0) return
  const entry = ensureEntry(lvl)
  entry.spellsGained = spells.slice(0, spellsGainedAt(lvl))
}

function onReplacementPickedAtLevel(lvl: number, spells: { index: string; name: string; level: number }[]) {
  showReplacementPickerForLevel.value = null
  if (spells.length === 0) return
  const fromIndex = replacingFromIndex.value[lvl]
  if (!fromIndex) return
  const entry = ensureEntry(lvl)
  entry.spellReplaced = { fromIndex, to: spells[0] }
}

// ── Accordion state ───────────────────────────────────────────────────────────

const openLevels = ref<Set<number>>(new Set())

onMounted(() => {
  const levels = levelsWithGains.value
  const toOpen = new Set<number>()
  // Open the first incomplete level
  for (const l of levels) {
    if (!isLevelComplete(l)) { toOpen.add(l); break }
  }
  // Always open the highest level
  if (levels.length > 0) toOpen.add(levels[levels.length - 1])
  openLevels.value = toOpen
  // Restore replacingFromIndex from existing draft
  const fromMap: Record<number, string | null> = {}
  for (const [l, entry] of Object.entries(builder.draft.spellsByLevel)) {
    if (entry?.spellReplaced) fromMap[Number(l)] = entry.spellReplaced.fromIndex
  }
  replacingFromIndex.value = fromMap
})

// When validation fires, auto-open every incomplete level so the user can see what's missing
watch(showValidation, (active) => {
  if (!active) return
  const next = new Set(openLevels.value)
  for (const l of levelsWithGains.value) {
    if (!isLevelComplete(l)) next.add(l)
  }
  openLevels.value = next
})

function toggleLevel(lvl: number) {
  const next = new Set(openLevels.value)
  if (next.has(lvl)) next.delete(lvl)
  else next.add(lvl)
  openLevels.value = next
}

// ── Slot info for known casters ───────────────────────────────────────────────

const slotInfoEntries = computed(() => {
  const slots = getSpellSlots(builder.draft.classIndex, builder.draft.level)
  const result: { lvl: number; count: number }[] = []
  const pairs: [number, number][] = [
    [1, slots.level1], [2, slots.level2], [3, slots.level3], [4, slots.level4],
    [5, slots.level5], [6, slots.level6], [7, slots.level7], [8, slots.level8], [9, slots.level9],
  ]
  for (const [lvl, count] of pairs) {
    if (count > 0) result.push({ lvl, count })
  }
  return result
})

// ── Flat limits (prepared / spellbook) ───────────────────────────────────────

const cantripLimit  = computed(() => profile.value?.cantripsKnown[levelIdx.value] ?? Infinity)
const maxSpellLevel = computed(() => getMaxSpellLevel(builder.draft.classIndex, builder.draft.level))

const totalSlotCount = computed(() => {
  const s = getSpellSlots(builder.draft.classIndex, builder.draft.level)
  return s.level1 + s.level2 + s.level3 + s.level4 + s.level5 + s.level6 + s.level7 + s.level8 + s.level9
})

const slotsPerLevel = computed((): Record<number, number> | undefined => {
  if (profile.value?.castingType !== 'prepared') return undefined
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

const preparedSpellLimit = computed(() => {
  const p = profile.value
  if (!p || p.castingType === 'known') return 0
  if (p.castingType === 'spellbook') return dailyPreparedLimit.value
  return Math.max(totalSlotCount.value, dailyPreparedLimit.value)
})

const activeSpellLimit = computed(() =>
  profile.value?.castingType === 'known' ? 0 : preparedSpellLimit.value
)

const atCantripLimit  = computed(() => builder.draft.selectedCantrips.length >= cantripLimit.value)
const atPreparedLimit = computed(() =>
  profile.value?.castingType === 'prepared'
    ? builder.draft.selectedPreparedSpells.length >= preparedSpellLimit.value
    : builder.draft.selectedSpells.length >= preparedSpellLimit.value
)

const noSpellsAtLevel = computed(() => {
  const p = profile.value
  if (!p) return false
  if (p.castingType === 'known') return levelsWithGains.value.length === 0
  const hasCantrips = (p.cantripsKnown[levelIdx.value] ?? 0) > 0
  return !hasCantrips && builder.draft.level < getFirstSpellLevel(builder.draft.classIndex)
})

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
  queryKey: computed(() => ['cantrips', builder.draft.classIndex]),
  queryFn: () => fiveEApi.listSpells({ level: 0, class: builder.draft.classIndex }),
  staleTime: Infinity,
  enabled: computed(() => !!builder.draft.classIndex && !!profile.value),
})
const cantrips = computed(() => cantripData.value?.results ?? [])

// ── Flat cantrip interactions (prepared / spellbook) ──────────────────────────

function isCantripSelectedFlat(index: string) {
  return builder.draft.selectedCantrips.some(c => c.index === index)
}
function toggleCantripFlat(c: { index: string; name: string }) {
  if (isCantripSelectedFlat(c.index)) {
    builder.draft.selectedCantrips = builder.draft.selectedCantrips.filter(s => s.index !== c.index)
  } else if (!atCantripLimit.value) {
    builder.draft.selectedCantrips.push({ index: c.index, name: c.name })
  }
}

// ── Flat spell interactions (prepared / spellbook) ────────────────────────────

const showSpellPickerFlat = ref(false)

function removeSpell(index: string) {
  builder.draft.selectedSpells = builder.draft.selectedSpells.filter(s => s.index !== index)
  // If removed from known pool, also remove from prepared
  builder.draft.selectedPreparedSpells = builder.draft.selectedPreparedSpells.filter(s => s.index !== index)
}
function onAddSpellsFlat(spells: { index: string; name: string; level: number }[]) {
  showSpellPickerFlat.value = false
  for (const s of spells) {
    if (!builder.draft.selectedSpells.some(x => x.index === s.index)) {
      builder.draft.selectedSpells.push(s)
    }
  }
}

// ── Prepared toggle (prepared casters only) ───────────────────────────────────

function isPreparedInBuilder(index: string): boolean {
  return builder.draft.selectedPreparedSpells.some(s => s.index === index)
}

function togglePreparedInBuilder(spell: { index: string; name: string; level: number }) {
  if (isPreparedInBuilder(spell.index)) {
    builder.draft.selectedPreparedSpells = builder.draft.selectedPreparedSpells.filter(s => s.index !== spell.index)
  } else if (!atPreparedLimit.value) {
    builder.draft.selectedPreparedSpells.push({ index: spell.index, name: spell.name, level: spell.level })
  }
}
</script>

<style scoped>
.expand-enter-active, .expand-leave-active { transition: all 0.2s ease; overflow: hidden; }
.expand-enter-from, .expand-leave-to { opacity: 0; max-height: 0; }
.expand-enter-to, .expand-leave-from { max-height: 1600px; }
</style>
