<template>
  <div class="space-y-3">

    <!-- ── Concentration ───────────────────────────────────────────────────── -->
    <div class="flex items-center gap-3 flex-wrap relative">
      <p class="text-2xs font-heading tracking-[0.15em] uppercase text-mist shrink-0">Concentration</p>

      <!-- Active concentration -->
      <span
        v-if="character.combat.concentrationSpell"
        class="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded bg-arcane-base/20 border border-arcane-base/40 text-arcane-pale text-2xs font-heading tracking-wide"
      >
        ◆ {{ character.combat.concentrationSpell }}
        <button
          type="button"
          class="opacity-60 hover:opacity-100 transition-opacity leading-none"
          title="Drop concentration"
          @click="clearConcentration"
        >×</button>
      </span>

      <template v-else>
        <!-- No-caster / no spells known -->
        <span
          v-if="!character.spellcasting"
          class="text-2xs text-mist/50 font-body italic"
        >Not a spellcaster</span>

        <!-- Picker button: opens dropdown of known concentration spells -->
        <button
          v-else
          type="button"
          class="text-2xs text-mist hover:text-ash transition-colors font-body inline-flex items-center gap-1"
          :disabled="loadingFlags"
          @click="openPicker"
        >
          <span v-if="loadingFlags">Loading…</span>
          <span v-else>+ Add concentration</span>
        </button>

        <!-- Dropdown with concentration-only spells -->
        <div
          v-if="pickerOpen"
          ref="pickerEl"
          class="absolute top-full left-0 mt-1 z-50 min-w-[16rem] max-w-xs bg-abyss border border-shadow rounded shadow-xl py-1 max-h-64 overflow-y-auto"
        >
          <p
            v-if="concentrationSpells.length === 0"
            class="px-3 py-2 text-2xs text-mist/60 font-body italic"
          >No concentration spells known.</p>
          <button
            v-for="sp in concentrationSpells"
            :key="sp.index"
            type="button"
            class="w-full text-left px-3 py-1.5 text-xs font-body text-ash hover:bg-depths hover:text-vellum transition-colors flex items-center justify-between gap-3"
            @click="selectConcentration(sp)"
          >
            <span>{{ sp.name }}</span>
            <span class="text-2xs font-heading text-mist/50 shrink-0">
              {{ sp.level === 0 ? 'Cantrip' : `Lv ${sp.level}` }}
            </span>
          </button>
        </div>
      </template>
    </div>

    <!-- ── Conditions ──────────────────────────────────────────────────────── -->
    <div>
      <div class="flex items-center gap-2 flex-wrap">
        <p class="text-2xs font-heading tracking-[0.15em] uppercase text-mist shrink-0">Conditions</p>

        <!-- Active condition chips -->
        <span
          v-for="cond in character.combat.conditions"
          :key="cond"
          class="inline-flex items-center gap-1 px-2 py-0.5 rounded border text-2xs font-heading tracking-wide"
          :class="conditionClass(cond)"
        >
          {{ cond }}
          <button
            type="button"
            class="opacity-60 hover:opacity-100 transition-opacity leading-none ml-0.5"
            @click="removeCondition(cond)"
          >×</button>
        </span>

        <span
          v-if="!character.combat.conditions.length"
          class="text-2xs text-mist font-body italic"
        >None</span>

        <button
          type="button"
          class="w-5 h-5 rounded border border-shadow/40 text-mist/40 hover:border-gold-mid/50 hover:text-gold-mid transition-colors text-xs font-heading flex items-center justify-center shrink-0"
          @click="showPicker = !showPicker"
        >{{ showPicker ? '−' : '+' }}</button>
      </div>

      <!-- Condition picker -->
      <div v-if="showPicker" class="mt-2 flex flex-wrap gap-1.5 p-3 rounded-md bg-abyss/60 border border-shadow/40">
        <button
          v-for="cond in CONDITION_LIST"
          :key="cond.name"
          type="button"
          class="px-2 py-0.5 rounded border text-2xs font-heading tracking-wide transition-all"
          :class="isActive(cond.name)
            ? cond.activeClass
            : 'border-shadow/50 text-mist hover:border-shadow hover:text-vellum'"
          @click="toggleCondition(cond.name)"
        >{{ cond.name }}</button>

      </div>
    </div>

  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'
import type { Character, SpellReference } from '@/shared/types/character'
import { useCharactersStore } from '@/characters/store'
import { fiveEApi } from '@/shared/api/fiveE.client'

const props = defineProps<{
  character: Character
}>()

const store = useCharactersStore()

// ── Condition list ─────────────────────────────────────────────────────────────

const CONDITION_LIST = [
  { name: 'Blinded',       activeClass: 'bg-blood-base/20 text-blood-bright border-blood-base/40' },
  { name: 'Charmed',       activeClass: 'bg-arcane-base/20 text-arcane-bright border-arcane-base/40' },
  { name: 'Deafened',      activeClass: 'bg-shadow/60 text-ash border-shadow' },
  { name: 'Frightened',    activeClass: 'bg-gold-dim/30 text-gold-deep dark:text-gold-bright border-gold-dim/50' },
  { name: 'Grappled',      activeClass: 'bg-gold-deep/20 text-gold-deep dark:text-gold-mid border-gold-deep/40' },
  { name: 'Incapacitated', activeClass: 'bg-blood-deep/30 text-blood-bright border-blood-deep/50' },
  { name: 'Invisible',     activeClass: 'bg-arcane-deep/20 text-arcane-pale border-arcane-deep/40' },
  { name: 'Paralyzed',     activeClass: 'bg-blood-base/30 text-blood-mid border-blood-base/50' },
  { name: 'Petrified',     activeClass: 'bg-shadow/70 text-stone border-shadow' },
  { name: 'Poisoned',      activeClass: 'bg-verdant-base/20 text-verdant-bright border-verdant-base/40' },
  { name: 'Prone',         activeClass: 'bg-shadow/40 text-ash border-shadow/70' },
  { name: 'Restrained',    activeClass: 'bg-gold-dim/20 text-gold-deep dark:text-gold-mid border-gold-dim/40' },
  { name: 'Stunned',       activeClass: 'bg-blood-base/20 text-blood-bright border-blood-base/40' },
  { name: 'Unconscious',   activeClass: 'bg-blood-deep/40 text-blood-mid border-blood-deep/60' },
]

function conditionClass(name: string): string {
  return CONDITION_LIST.find(c => c.name === name)?.activeClass
    ?? 'bg-shadow/40 text-mist border-shadow/60'
}

function isActive(name: string): boolean {
  return props.character.combat.conditions.includes(name)
}

// ── Conditions ─────────────────────────────────────────────────────────────────

const showPicker = ref(false)

function toggleCondition(name: string) {
  const current = props.character.combat.conditions
  const next = current.includes(name)
    ? current.filter(c => c !== name)
    : [...current, name]
  store.update(props.character.id, {
    combat: { ...props.character.combat, conditions: next },
  })
}

function removeCondition(name: string) {
  store.update(props.character.id, {
    combat: {
      ...props.character.combat,
      conditions: props.character.combat.conditions.filter(c => c !== name),
    },
  })
}

// ── Concentration ──────────────────────────────────────────────────────────────

const pickerOpen = ref(false)
const loadingFlags = ref(false)
const pickerEl = ref<HTMLElement | null>(null)

// Spells whose concentration flag is true. Cantrips are included (some have concentration).
const concentrationSpells = computed<SpellReference[]>(() => {
  const sc = props.character.spellcasting
  if (!sc) return []
  const all: SpellReference[] = [...sc.spellsPrepared, ...sc.spellsKnown, ...sc.cantripsKnown]
  const seen = new Set<string>()
  const result: SpellReference[] = []
  for (const s of all) {
    if (s.concentration && !seen.has(s.index)) {
      seen.add(s.index)
      result.push(s)
    }
  }
  return result.sort((a, b) => a.name.localeCompare(b.name))
})

// Lazy-fill concentration flag for stored spells that pre-date this field
async function ensureConcentrationFlags() {
  const sc = props.character.spellcasting
  if (!sc) return
  const allRefs: SpellReference[] = [...sc.spellsPrepared, ...sc.spellsKnown, ...sc.cantripsKnown]
  const missing = allRefs.filter(s => s.concentration === undefined)
  if (missing.length === 0) return

  loadingFlags.value = true
  try {
    const seen = new Set<string>()
    const detailPromises = missing
      .filter(s => { if (seen.has(s.index)) return false; seen.add(s.index); return true })
      .map(async s => {
        const detail = await fiveEApi.getSpell(s.index)
        return { index: s.index, concentration: !!detail.concentration }
      })
    const flagPairs = await Promise.all(detailPromises)
    const flagMap = new Map(flagPairs.map(p => [p.index, p.concentration]))

    const enrich = (list: SpellReference[]) =>
      list.map(s => flagMap.has(s.index)
        ? { ...s, concentration: flagMap.get(s.index)! }
        : s,
      )

    await store.update(props.character.id, {
      spellcasting: {
        ...sc,
        spellsKnown:    enrich(sc.spellsKnown),
        spellsPrepared: enrich(sc.spellsPrepared),
        cantripsKnown:  enrich(sc.cantripsKnown),
      },
    })
  } catch (e) {
    console.warn('[concentration] failed to enrich spell flags', e)
  } finally {
    loadingFlags.value = false
  }
}

async function openPicker() {
  pickerOpen.value = true
  await ensureConcentrationFlags()
}

function selectConcentration(sp: SpellReference) {
  store.update(props.character.id, {
    combat: { ...props.character.combat, concentrationSpell: sp.name },
  })
  pickerOpen.value = false
}

function clearConcentration() {
  store.update(props.character.id, {
    combat: { ...props.character.combat, concentrationSpell: null },
  })
}

// Close picker on outside click
function onDocClick(e: MouseEvent) {
  if (!pickerOpen.value) return
  if (pickerEl.value && !pickerEl.value.contains(e.target as Node)) {
    pickerOpen.value = false
  }
}
onMounted(() => document.addEventListener('mousedown', onDocClick))
onUnmounted(() => document.removeEventListener('mousedown', onDocClick))
</script>
