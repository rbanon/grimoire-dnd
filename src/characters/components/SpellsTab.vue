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
        <div class="rule-gold mb-4"><span class="text-gold-mid">★ Favorites</span></div>
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
        <div class="rule-gold mb-4"><span>Cantrips</span></div>

        <div v-if="sc.cantripsKnown.length > 0" class="flex flex-wrap gap-2 mb-4">
          <div
            v-for="c in sc.cantripsKnown"
            :key="c.index"
            class="group flex items-center gap-1.5 px-3 py-1.5 rounded border border-arcane-base/30 bg-arcane-deep/10"
          >
            <span class="text-sm font-heading text-arcane-pale">{{ c.name }}</span>
            <button
              v-if="editMode"
              type="button"
              class="text-mist/30 hover:text-blood-bright transition-colors opacity-0 group-hover:opacity-100 ml-0.5"
              title="Remove"
              @click="removeSpell(c.index, 'cantrip')"
            >
              <XIcon :size="11" />
            </button>
          </div>
        </div>
        <p v-else class="font-body text-mist text-sm mb-4">No cantrips known.</p>

        <button
          v-if="editMode && addTarget !== 'cantrip'"
          type="button"
          class="btn-secondary text-xs gap-1.5"
          @click="openAdd('cantrip')"
        >
          <PlusIcon :size="12" /> Add Cantrip
        </button>

        <!-- Inline add form for cantrips -->
        <AddSpellForm
          v-if="editMode && addTarget === 'cantrip'"
          label="Cantrip name"
          @submit="onAddCantrip"
          @cancel="addTarget = null"
        />
      </section>

      <!-- ── Spell levels 1–9 ───────────────────────────────────────────── -->
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
              class="w-4 h-4 rounded-full border-2 transition-all duration-100"
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
        <div v-if="spellsAtLevel(lvl).length > 0" class="flex flex-wrap gap-2">
          <div
            v-for="spell in spellsAtLevel(lvl)"
            :key="spell.index"
            class="group flex items-center gap-1.5 px-3 py-1.5 rounded border border-arcane-base/20 bg-arcane-deep/5"
          >
            <span v-if="spell.prepared" class="text-gold-mid text-2xs" title="Prepared">◆</span>
            <span class="text-sm font-heading text-arcane-pale/90">{{ spell.name }}</span>
            <span v-if="spell.school" class="text-2xs font-body text-mist/50">{{ spell.school }}</span>
            <button
              type="button"
              class="text-mist/30 hover:text-blood-bright transition-colors opacity-0 group-hover:opacity-100 ml-0.5"
              title="Remove"
              @click="removeSpell(spell.index, spell.prepared ? 'prepared' : 'known')"
            >
              <XIcon :size="11" />
            </button>
          </div>
        </div>
        <p v-else class="font-body text-mist/50 text-xs italic">No spells at this level.</p>

        <!-- Add spell button / form -->
        <button
          v-if="addTarget !== lvl"
          type="button"
          class="btn-secondary text-xs gap-1.5"
          @click="openAdd(lvl)"
        >
          <PlusIcon :size="12" /> Add Level {{ lvl }} Spell
        </button>

        <AddSpellForm
          v-if="addTarget === lvl"
          :label="`Level ${lvl} spell name`"
          @submit="(name) => onAddSpell(name, lvl)"
          @cancel="addTarget = null"
        />
      </section>

      <!-- ── No slots configured ────────────────────────────────────────── -->
      <div v-if="activeLevels.length === 0" class="card p-6 text-center border-arcane-base/20">
        <p class="font-body text-ash text-sm">No spell slots configured.</p>
        <p class="font-body text-mist text-xs mt-1">
          Spell slots will be set automatically when Short/Long Rest and Level Up are implemented.
        </p>
        <button class="btn-secondary text-xs mt-3 gap-1.5" @click="openAdd(1)">
          <PlusIcon :size="12" /> Add Level 1 Spell
        </button>
        <AddSpellForm
          v-if="typeof addTarget === 'number'"
          :label="`Level ${addTarget} spell name`"
          class="mt-3 text-left"
          @submit="(name) => onAddSpell(name, addTarget as number)"
          @cancel="addTarget = null"
        />
      </div>

    </template>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { SparklesIcon, PlusIcon, XIcon } from 'lucide-vue-next'
import { useCharactersStore } from '@/characters/store'
import {
  computeAllModifiers,
} from '@/shared/types/character'
import { computeProficiencyBonus, computeSpellSaveDC, computeSpellAttackBonus } from '@/shared/lib/derivedStats'
import type { Character, SpellReference } from '@/shared/types/character'
import { generateId } from '@/shared/lib/uuid'
import AddSpellForm from './AddSpellForm.vue'

const props = defineProps<{ character: Character; editMode: boolean }>()
const store = useCharactersStore()

// ── Aliases ───────────────────────────────────────────────────────────────────

const sc = computed(() => props.character.spellcasting)
const mods = computed(() => computeAllModifiers(props.character.abilityScores))
const profBonus = computed(() => computeProficiencyBonus(props.character.combat.level))

const spellAbilityMod = computed(() => {
  if (!sc.value) return 0
  return mods.value[sc.value.spellcastingAbility]
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

// Show a level row if it has slots OR any spells at that level
const activeLevels = computed(() => {
  if (!sc.value) return []
  return LEVELS.filter(lvl => {
    const hasSlots = maxSlots(lvl) > 0
    const hasSpells = sc.value!.spellsKnown.some(s => s.level === lvl) ||
                      sc.value!.spellsPrepared.some(s => s.level === lvl)
    return hasSlots || hasSpells
  })
})

// Merged spell list for a given level, with `prepared` flag
function spellsAtLevel(lvl: number) {
  if (!sc.value) return []
  const knownAt = sc.value.spellsKnown.filter(s => s.level === lvl)
  const preparedAt = sc.value.spellsPrepared.filter(s => s.level === lvl)
  // Union: prepared takes precedence; known-only are listed without diamond
  const seen = new Set<string>()
  const result: (SpellReference & { prepared: boolean })[] = []
  for (const s of preparedAt) { seen.add(s.index); result.push({ ...s, prepared: true }) }
  for (const s of knownAt)    { if (!seen.has(s.index)) result.push({ ...s, prepared: false }) }
  return result
}

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

// ── Add spell ─────────────────────────────────────────────────────────────────

const addTarget = ref<SlotLevel | 'cantrip' | null>(null)

function openAdd(target: SlotLevel | 'cantrip' | number) {
  addTarget.value = target as SlotLevel | 'cantrip'
}

function spellRef(name: string, level: number): SpellReference {
  return { index: name.toLowerCase().replace(/\s+/g, '-') + '-' + generateId().slice(0, 6), name, level }
}

async function onAddCantrip(name: string) {
  if (!sc.value || !name.trim()) return
  const ref = spellRef(name.trim(), 0)
  await store.update(props.character.id, {
    spellcasting: { ...sc.value, cantripsKnown: [...sc.value.cantripsKnown, ref] },
  })
  addTarget.value = null
}

async function onAddSpell(name: string, level: number) {
  if (!sc.value || !name.trim()) return
  const ref = spellRef(name.trim(), level)
  await store.update(props.character.id, {
    spellcasting: { ...sc.value, spellsKnown: [...sc.value.spellsKnown, ref] },
  })
  addTarget.value = null
}

// ── Remove spell ──────────────────────────────────────────────────────────────

async function removeSpell(index: string, list: 'cantrip' | 'known' | 'prepared') {
  if (!sc.value) return
  const updated = { ...sc.value }
  if (list === 'cantrip')   updated.cantripsKnown  = sc.value.cantripsKnown.filter(s => s.index !== index)
  if (list === 'known')     updated.spellsKnown    = sc.value.spellsKnown.filter(s => s.index !== index)
  if (list === 'prepared')  updated.spellsPrepared = sc.value.spellsPrepared.filter(s => s.index !== index)
  await store.update(props.character.id, { spellcasting: updated })
}
</script>
