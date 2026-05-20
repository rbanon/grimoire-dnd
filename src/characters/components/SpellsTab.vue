<template>
  <div class="space-y-8">

    <!-- ── Non-caster ────────────────────────────────────────────────────── -->
    <div v-if="!sc" class="card p-10 text-center">
      <SparklesIcon :size="36" class="mx-auto text-mist/25 mb-3" />
      <p class="font-body text-ash text-sm">This character has no spellcasting.</p>
      <p class="font-body text-mist text-xs mt-1">Spellcasting is set during character creation.</p>
    </div>

    <template v-else>

      <!-- ── Spellcasting stats ─────────────────────────────────────────── -->
      <section>
        <div class="grid grid-cols-3 gap-3">
          <div class="card p-3 text-center">
            <p class="text-2xs font-heading tracking-[0.12em] uppercase text-mist mb-1">Ability</p>
            <p class="font-heading text-lg text-vellum uppercase">{{ sc.spellcastingAbility }}</p>
            <p class="text-xs font-body text-ash">{{ fmt(spellAbilityMod) }}</p>
          </div>
          <div class="card p-3 text-center">
            <p class="text-2xs font-heading tracking-[0.12em] uppercase text-mist mb-1">Save DC</p>
            <p class="font-heading text-2xl text-vellum">{{ spellSaveDC }}</p>
          </div>
          <div class="card p-3 text-center">
            <p class="text-2xs font-heading tracking-[0.12em] uppercase text-mist mb-1">Atk Bonus</p>
            <p class="font-heading text-2xl text-vellum">{{ fmt(spellAttackBonus) }}</p>
          </div>
        </div>
      </section>

      <!-- ── Favorites ──────────────────────────────────────────────────── -->
      <section v-if="character.favoriteSpells.length > 0">
        <div class="rule-gold mb-4"><span>★ Favorites</span></div>
        <div class="flex flex-wrap gap-2">
          <div
            v-for="spell in character.favoriteSpells"
            :key="spell.index"
            class="flex items-center gap-2 px-3 py-1.5 rounded border border-gold-dim/25 bg-gold-dim/10 text-sm"
          >
            <span class="text-gold-mid text-xs">★</span>
            <span class="font-heading text-vellum">{{ spell.name }}</span>
            <span class="badge-arcane text-2xs">{{ spell.level === 0 ? 'Cantrip' : `Lv ${spell.level}` }}</span>
          </div>
        </div>
      </section>

      <!-- ── Cantrips ───────────────────────────────────────────────────── -->
      <section>
        <div class="rule-gold mb-4 flex items-center">
          <span class="flex-1">Cantrips</span>
          <button
            v-if="editMode"
            type="button"
            class="text-xs font-heading px-2 py-0.5 rounded border transition-all"
            :class="cantripEditMode
              ? 'border-blood-base/40 text-blood-mid hover:border-blood-base/70'
              : 'border-shadow text-mist hover:border-arcane-base/40 hover:text-arcane-pale'"
            @click="cantripEditMode = !cantripEditMode"
          >{{ cantripEditMode ? 'Done' : 'Edit' }}</button>
        </div>

        <div v-if="sc.cantripsKnown.length > 0" class="space-y-1.5 mb-4">
          <CantripCard
            v-for="c in sc.cantripsKnown"
            :key="c.index"
            :cantrip="c"
            :cantrip-edit-mode="cantripEditMode"
            :is-favorite="isSpellFav(c.index)"
            @remove="removeSpell(c.index, 'cantrip')"
            @toggle-favorite="toggleSpellFav(c, 'cantrip')"
            @cast="castingSpell = c"
          />
        </div>
        <p v-else class="font-body text-mist text-sm mb-4">No cantrips known.</p>

        <button
          v-if="editMode"
          type="button"
          class="btn-secondary text-xs gap-1.5"
          @click="showCantripPicker = true"
        >
          <PlusIcon :size="12" /> Add Cantrip
        </button>

        <CantripPickerModal
          :show="showCantripPicker"
          :class-index="props.character.identity.class.index"
          :class-name="props.character.identity.class.name"
          :known-indices="sc?.cantripsKnown.map(c => c.index) ?? []"
          :limit="cantripLimit"
          @close="showCantripPicker = false"
          @add="onAddCantrips"
        />
      </section>

      <!-- ── Spell levels 1–9 ───────────────────────────────────────────── -->
      <div v-if="activeLevels.length > 0" class="rule-gold mb-0 flex items-center">
        <span class="flex-1">Spells</span>
        <button
          v-if="editMode"
          type="button"
          class="text-xs font-heading px-2 py-0.5 rounded border transition-all"
          :class="spellEditMode
            ? 'border-blood-base/40 text-blood-mid hover:border-blood-base/70'
            : 'border-shadow text-mist hover:border-arcane-base/40 hover:text-arcane-pale'"
          @click="spellEditMode = !spellEditMode"
        >{{ spellEditMode ? 'Done' : 'Edit' }}</button>
      </div>

      <section
        v-for="lvl in activeLevels"
        :key="lvl"
        class="space-y-3"
      >
        <!-- Level header + slot pips -->
        <div class="flex items-center gap-4 flex-wrap">
          <p class="font-heading text-sm text-vellum shrink-0">Level {{ lvl }}</p>

          <div v-if="maxSlots(lvl) > 0" class="flex items-center gap-1.5">
            <button
              v-for="pip in maxSlots(lvl)"
              :key="pip"
              type="button"
              class="w-4 h-4 rounded border-2 transition-all duration-100"
              :class="[
                pip <= usedSlots(lvl) ? 'bg-arcane-base/60 border-arcane-base/60' : 'bg-transparent border-arcane-base/40',
                editMode ? 'hover:border-arcane-pale/60 cursor-pointer' : 'cursor-default',
              ]"
              :title="editMode ? (pip <= usedSlots(lvl) ? 'Slot used — click to recover' : 'Click to spend slot') : ''"
              @click="editMode && toggleSlot(lvl, pip)"
            />
            <span class="text-2xs font-body text-mist ml-1">
              {{ maxSlots(lvl) - usedSlots(lvl) }}/{{ maxSlots(lvl) }}
            </span>
          </div>

          <span v-else class="text-2xs font-body text-mist/50 italic">No slots</span>
        </div>

        <!-- Spells at this level -->
        <div v-if="spellsAtLevel(lvl).length > 0" class="space-y-1.5">
          <SpellCard
            v-for="spell in spellsAtLevel(lvl)"
            :key="spell.index"
            :spell="spell"
            :spell-edit-mode="spellEditMode"
            :is-favorite="isSpellFav(spell.index)"
            :can-toggle-prepared="isPreparedCaster"
            @remove="removeSpell(spell.index, spell.prepared ? 'prepared' : 'known')"
            @toggle-prepared="togglePrepared(spell.index, spell.prepared)"
            @toggle-favorite="toggleSpellFav(spell, 'spell')"
            @cast="castingSpell = spell"
          />
        </div>
        <p v-else class="font-body text-mist/50 text-xs italic">No spells at this level.</p>

        <button
          v-if="editMode"
          type="button"
          class="btn-secondary text-xs gap-1.5"
          @click="openSpellPicker(lvl)"
        >
          <PlusIcon :size="12" /> Add Level {{ lvl }} Spell
        </button>
      </section>

      <!-- ── No slots configured ────────────────────────────────────────── -->
      <div v-if="activeLevels.length === 0" class="card p-6 text-center border-arcane-base/20">
        <p class="font-body text-ash text-sm">No spell slots configured.</p>
        <p class="font-body text-mist text-xs mt-1">
          Spell slots will be set automatically when Short/Long Rest and Level Up are implemented.
        </p>
        <button v-if="editMode && maxSpellLevel > 0" class="btn-secondary text-xs mt-3 gap-1.5" @click="openSpellPicker(1)">
          <PlusIcon :size="12" /> Add Spell
        </button>
      </div>

      <!-- Shared spell picker modal -->
      <SpellPickerModal
        :show="spellPickerLevel !== null"
        :class-index="props.character.identity.class.index"
        :class-name="props.character.identity.class.name"
        :known-indices="allKnownSpellIndices"
        :known-spells="allKnownSpellsWithLevel"
        :initial-level="spellPickerLevel ?? 1"
        :max-level="maxSpellLevel"
        :limit="sheetSpellLimit"
        :slots-per-level="sheetSlotsPerLevel"
        @close="spellPickerLevel = null"
        @add="onAddSpells"
      />

    </template>

    <!-- Cast spell modal -->
    <CastSpellModal
      v-if="castingSpell"
      :show="castingSpell !== null"
      :spell="castingSpell"
      :character="props.character"
      @close="castingSpell = null"
      @cast="onCastSpell"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { SparklesIcon, PlusIcon } from 'lucide-vue-next'
import { useCharactersStore } from '@/characters/store'
import { useConfirm } from '@/shared/composables/useConfirm'
import { computeAllModifiers } from '@/shared/types/character'
import { computeProficiencyBonus, computeSpellSaveDC, computeSpellAttackBonus } from '@/shared/lib/derivedStats'
import { getSpellProfile, getMaxSpellLevel, getSpellSlots } from '@/character-builder/classMeta'
import type { Character, SpellReference, CombatFavorite } from '@/shared/types/character'
import { generateId } from '@/shared/lib/uuid'
import CantripCard from './CantripCard.vue'
import CantripPickerModal from './CantripPickerModal.vue'
import SpellCard from './SpellCard.vue'
import SpellPickerModal from './SpellPickerModal.vue'
import CastSpellModal from './CastSpellModal.vue'

const props = defineProps<{ character: Character; editMode: boolean }>()
const store = useCharactersStore()
const { confirm } = useConfirm()
const cantripEditMode = ref(false)
const spellEditMode = ref(false)
const showCantripPicker = ref(false)
const spellPickerLevel = ref<number | null>(null)
const castingSpell = ref<SpellReference | null>(null)

const cantripLimit = computed(() => {
  const profile = getSpellProfile(props.character.identity.class.index)
  return profile?.cantripsKnown[props.character.combat.level - 1] ?? Infinity
})

const maxSpellLevel = computed(() =>
  getMaxSpellLevel(props.character.identity.class.index, props.character.combat.level)
)

// ── Aliases ───────────────────────────────────────────────────────────────────

const sc = computed(() => props.character.spellcasting)
const mods = computed(() => computeAllModifiers(props.character.abilityScores))
const profBonus = computed(() => computeProficiencyBonus(props.character.combat.level))

const spellAbilityMod = computed(() => {
  if (!sc.value) return 0
  return mods.value[sc.value.spellcastingAbility]
})

const isPreparedCaster = computed(() => {
  const profile = getSpellProfile(props.character.identity.class.index)
  return profile?.castingType === 'prepared'
})

// Daily prepared limit for prepared casters (Math.max to always be able to fill all slots)
const preparedLimit = computed((): number | undefined => {
  if (!isPreparedCaster.value || !sc.value) return undefined
  const level = props.character.combat.level
  const slots = getSpellSlots(props.character.identity.class.index, level)
  const totalSlots = Object.values(slots).reduce((s, v) => s + v, 0)
  const mod = spellAbilityMod.value
  const daily = props.character.identity.class.index === 'paladin'
    ? Math.max(1, Math.floor(level / 2) + mod)
    : Math.max(1, level + mod)
  return Math.max(totalSlots, daily)
})

// Spell limit enforced in the picker:
// - known casters  → total spells known from profile table
// - prepared → no limit on the known pool
// - spellbook → ability_mod + level
const sheetSpellLimit = computed((): number | undefined => {
  const p = getSpellProfile(props.character.identity.class.index)
  if (!p) return undefined
  if (p.castingType === 'prepared') return undefined
  const level = props.character.combat.level
  if (p.castingType === 'known') return p.spellsKnown?.[level - 1]
  const mod = spellAbilityMod.value
  if (props.character.identity.class.index === 'paladin') {
    return Math.max(1, Math.floor(level / 2) + mod)
  }
  return Math.max(1, level + mod)
})

// Per-level slot caps for known casters — limits how many spells can be known at each level
// (e.g. 1 level-4 slot → at most 1 level-4 spell known)
const sheetSlotsPerLevel = computed((): Record<number, number> | undefined => {
  if (!sc.value) return undefined
  const p = getSpellProfile(props.character.identity.class.index)
  if (!p || p.castingType !== 'known') return undefined
  const m = sc.value.slotsMax
  return { 1: m.level1, 2: m.level2, 3: m.level3, 4: m.level4, 5: m.level5, 6: m.level6, 7: m.level7, 8: m.level8, 9: m.level9 }
})

// Known spells with their levels — needed for per-level blocking in the picker
const allKnownSpellsWithLevel = computed(() => {
  if (!sc.value) return []
  const seen = new Set<string>()
  const result: { index: string; level: number }[] = []
  for (const s of [...sc.value.spellsPrepared, ...sc.value.spellsKnown]) {
    if (!seen.has(s.index)) { seen.add(s.index); result.push({ index: s.index, level: s.level }) }
  }
  return result
})
const spellSaveDC = computed(() => computeSpellSaveDC(spellAbilityMod.value, profBonus.value))
const spellAttackBonus = computed(() => computeSpellAttackBonus(spellAbilityMod.value, profBonus.value))

function fmt(n: number) { return n >= 0 ? `+${n}` : String(n) }

// ── Slot helpers ──────────────────────────────────────────────────────────────

type SlotLevel = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9
type SlotKey = `level${SlotLevel}`

function slotKey(n: number): SlotKey { return `level${n}` as SlotKey }
function maxSlots(n: number) { return sc.value?.slotsMax[slotKey(n)] ?? 0 }
function usedSlots(n: number) { return sc.value?.slotsUsed[slotKey(n)] ?? 0 }

const LEVELS = [1, 2, 3, 4, 5, 6, 7, 8, 9] as const

const activeLevels = computed(() => {
  if (!sc.value) return []
  return LEVELS.filter(lvl => {
    const hasSlots = maxSlots(lvl) > 0
    const hasSpells = sc.value!.spellsKnown.some(s => s.level === lvl) ||
                      sc.value!.spellsPrepared.some(s => s.level === lvl)
    return hasSlots || hasSpells
  })
})

function spellsAtLevel(lvl: number) {
  if (!sc.value) return []
  const knownAt   = sc.value.spellsKnown.filter(s => s.level === lvl)
  const preparedAt = sc.value.spellsPrepared.filter(s => s.level === lvl)
  const seen = new Set<string>()
  const result: (SpellReference & { prepared: boolean })[] = []
  for (const s of preparedAt) { seen.add(s.index); result.push({ ...s, prepared: true }) }
  for (const s of knownAt)    { if (!seen.has(s.index)) result.push({ ...s, prepared: false }) }
  return result
}

const allKnownSpellIndices = computed(() => {
  if (!sc.value) return []
  return [...new Set([
    ...sc.value.spellsKnown.map(s => s.index),
    ...sc.value.spellsPrepared.map(s => s.index),
  ])]
})

// ── Slot toggle ───────────────────────────────────────────────────────────────

async function toggleSlot(lvl: number, pip: number) {
  if (!sc.value) return
  const key = slotKey(lvl)
  const current = sc.value.slotsUsed[key]
  const next = pip <= current ? pip - 1 : pip
  await store.update(props.character.id, {
    spellcasting: { ...sc.value, slotsUsed: { ...sc.value.slotsUsed, [key]: next } },
  })
}

// ── Cast spell ────────────────────────────────────────────────────────────────

async function onCastSpell(slotLevel: number) {
  if (!sc.value || slotLevel === 0) return
  const key = slotKey(slotLevel)
  const current = sc.value.slotsUsed[key]
  const max = sc.value.slotsMax[key]
  if (current >= max) return
  await store.update(props.character.id, {
    spellcasting: { ...sc.value, slotsUsed: { ...sc.value.slotsUsed, [key]: current + 1 } },
  })
}

// ── Add spells ────────────────────────────────────────────────────────────────

function openSpellPicker(lvl: number) { spellPickerLevel.value = lvl }

async function onAddCantrips(cantrips: { index: string; name: string; level: number }[]) {
  if (!sc.value || cantrips.length === 0) return
  showCantripPicker.value = false
  await store.update(props.character.id, {
    spellcasting: { ...sc.value, cantripsKnown: [...sc.value.cantripsKnown, ...cantrips] },
  })
}

async function onAddSpells(spells: { index: string; name: string; level: number }[]) {
  if (!sc.value || spells.length === 0) return
  spellPickerLevel.value = null
  const castingType = getSpellProfile(props.character.identity.class.index)?.castingType ?? 'known'
  const updated = { ...sc.value }
  if (castingType === 'spellbook') {
    // Wizard: new spells enter both spellbook and prepared list
    updated.spellsKnown    = [...sc.value.spellsKnown, ...spells]
    updated.spellsPrepared = [...sc.value.spellsPrepared, ...spells]
  } else {
    // prepared and known: spells go into the known pool only
    updated.spellsKnown = [...sc.value.spellsKnown, ...spells]
  }
  await store.update(props.character.id, { spellcasting: updated })
}

async function togglePrepared(index: string, currentlyPrepared: boolean) {
  if (!sc.value) return
  const updated = { ...sc.value }
  if (currentlyPrepared) {
    updated.spellsPrepared = sc.value.spellsPrepared.filter(s => s.index !== index)
  } else {
    if (preparedLimit.value !== undefined && sc.value.spellsPrepared.length >= preparedLimit.value) return
    const spell = sc.value.spellsKnown.find(s => s.index === index)
    if (!spell) return
    updated.spellsPrepared = [...sc.value.spellsPrepared, spell]
  }
  await store.update(props.character.id, { spellcasting: updated })
}

// ── Remove spell ──────────────────────────────────────────────────────────────

async function removeSpell(index: string, list: 'cantrip' | 'known' | 'prepared') {
  if (!sc.value) return
  const label = list === 'cantrip' ? 'cantrip' : 'spell'
  const ok = await confirm({
    title: `Remove ${label.charAt(0).toUpperCase() + label.slice(1)}`,
    body: `Remove this ${label} from your character?`,
    confirmLabel: 'Remove',
    variant: 'danger',
  })
  if (!ok) return
  const castingType = getSpellProfile(props.character.identity.class.index)?.castingType ?? 'known'
  const updated = { ...sc.value }
  if (list === 'cantrip') {
    updated.cantripsKnown = sc.value.cantripsKnown.filter(s => s.index !== index)
  } else if (castingType === 'spellbook' || castingType === 'prepared') {
    // Remove from both lists: spell leaves the known pool entirely
    updated.spellsKnown    = sc.value.spellsKnown.filter(s => s.index !== index)
    updated.spellsPrepared = sc.value.spellsPrepared.filter(s => s.index !== index)
  } else if (list === 'known') {
    updated.spellsKnown = sc.value.spellsKnown.filter(s => s.index !== index)
  } else {
    updated.spellsPrepared = sc.value.spellsPrepared.filter(s => s.index !== index)
  }
  await store.update(props.character.id, { spellcasting: updated })
}

// ── Favorites ─────────────────────────────────────────────────────────────────

function isSpellFav(spellIndex: string): boolean {
  return props.character.combatFavorites.some(
    f => (f.type === 'cantrip' || f.type === 'spell') && f.spellIndex === spellIndex,
  )
}

async function toggleSpellFav(spell: SpellReference, type: 'cantrip' | 'spell') {
  const next: CombatFavorite[] = isSpellFav(spell.index)
    ? props.character.combatFavorites.filter(
        f => !((f.type === 'cantrip' || f.type === 'spell') && f.spellIndex === spell.index),
      )
    : [
        ...props.character.combatFavorites,
        {
          id: generateId(),
          type,
          spellIndex: spell.index,
          spellName: spell.name,
          spellLevel: spell.level,
          spellSchool: spell.school,
        },
      ]
  await store.update(props.character.id, { combatFavorites: next })
}
</script>
