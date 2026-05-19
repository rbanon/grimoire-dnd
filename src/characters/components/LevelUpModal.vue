<template>
  <Teleport to="body">
    <Transition name="levelup-fade">
      <div
        v-if="show"
        class="fixed inset-0 z-[60] flex items-center justify-center p-4"
        @keydown.esc="handleEsc"
      >
        <div class="absolute inset-0 bg-black/60" aria-hidden="true" @click="handleEsc" />

        <div
          role="dialog"
          aria-modal="true"
          class="relative w-full max-w-md bg-void border border-shadow rounded-lg shadow-2xl flex flex-col"
          style="max-height: 85vh"
        >
          <div class="h-0.5 w-full bg-gold-mid shrink-0" />

          <!-- Step progress -->
          <div v-if="steps.length > 1" class="flex items-center justify-center gap-2 pt-3 shrink-0">
            <div
              v-for="(s, i) in steps"
              :key="s"
              class="rounded-full transition-all duration-200"
              :class="i === currentStepIndex
                ? 'w-4 h-1.5 bg-gold-mid'
                : i < currentStepIndex
                  ? 'w-1.5 h-1.5 bg-gold-dim/50'
                  : 'w-1.5 h-1.5 bg-shadow'"
            />
          </div>

          <!-- ─────────────────────────── STEP: HP ─────────────────────────── -->
          <div v-if="currentStep === 'hp'" class="px-5 py-4 space-y-5 overflow-y-auto flex-1">

            <div>
              <p class="font-heading text-base tracking-wide text-gold-mid">
                Level Up
                <span class="font-body text-sm text-mist font-normal ml-1.5">
                  {{ character.identity.class.name }} {{ character.combat.level }} → {{ newLevel }}
                </span>
              </p>
              <p class="text-xs font-body text-mist/70 mt-0.5">{{ character.identity.name }}</p>
            </div>

            <p v-if="atMaxLevel" class="text-sm font-body text-mist italic text-center py-3">
              This character has reached the maximum level (20).
            </p>

            <!-- HP gain -->
            <section v-else class="space-y-2">
              <p class="text-2xs font-heading tracking-[0.15em] uppercase text-stone">Hit Points Gained</p>
              <div class="grid grid-cols-3 gap-2">
                <!-- Roll -->
                <button
                  type="button"
                  class="flex flex-col items-start px-2.5 py-3 rounded border transition-all"
                  :class="hpChoice === 'roll'
                    ? 'border-gold-mid/60 bg-depths/60'
                    : 'border-shadow bg-depths/20 hover:border-shadow/80'"
                  @click="selectRoll"
                >
                  <span class="text-2xs font-heading uppercase tracking-wider text-mist mb-2">Roll</span>
                  <span
                    class="font-heading text-2xl leading-none"
                    :class="hpChoice === 'roll' ? 'text-gold-mid' : 'text-ash'"
                  >{{ rollDisplay }}</span>
                  <span class="text-2xs font-body text-mist mt-1.5 leading-tight">
                    {{ rawDie === null
                      ? `d${hitDie}`
                      : `${rawDie}${conMod >= 0 ? '+' : ''}${conMod}` }}
                  </span>
                </button>
                <!-- Average -->
                <button
                  type="button"
                  class="flex flex-col items-start px-2.5 py-3 rounded border transition-all"
                  :class="hpChoice === 'average'
                    ? 'border-gold-mid/60 bg-depths/60'
                    : 'border-shadow bg-depths/20 hover:border-shadow/80'"
                  @click="hpChoice = 'average'"
                >
                  <span class="text-2xs font-heading uppercase tracking-wider text-mist mb-2">Average</span>
                  <span
                    class="font-heading text-2xl leading-none"
                    :class="hpChoice === 'average' ? 'text-gold-mid' : 'text-ash'"
                  >+{{ averageHp }}</span>
                  <span class="text-2xs font-body text-mist mt-1.5 leading-tight">
                    ⌀{{ Math.floor(hitDie / 2) + 1 }}{{ conMod >= 0 ? '+' : '' }}{{ conMod }}
                  </span>
                </button>
                <!-- Manual -->
                <div
                  class="flex flex-col items-start px-2.5 py-3 rounded border transition-all cursor-pointer"
                  :class="hpChoice === 'manual'
                    ? 'border-gold-mid/60 bg-depths/60'
                    : 'border-shadow bg-depths/20 hover:border-shadow/80'"
                  @click="hpChoice = 'manual'"
                >
                  <span class="text-2xs font-heading uppercase tracking-wider text-mist mb-2">Manual</span>
                  <input
                    v-if="hpChoice === 'manual'"
                    v-model.number="manualHp"
                    type="number"
                    min="1"
                    class="w-full bg-transparent border-b border-gold-mid/50 outline-none font-heading text-2xl text-gold-mid leading-none pb-px"
                    @click.stop
                    @keydown.stop
                  />
                  <span v-else class="font-heading text-2xl leading-none text-ash">—</span>
                  <span class="text-2xs font-body text-mist mt-1.5 leading-tight">any value</span>
                </div>
              </div>
              <p v-if="hpChoice !== null" class="text-center text-xs font-body text-stone">
                Max HP: {{ character.combat.maxHp }}
                <span class="mx-1 text-mist/40">→</span>
                <span class="text-gold-mid font-heading">{{ character.combat.maxHp + hpGained }}</span>
              </p>
            </section>

            <!-- Spell slots -->
            <section v-if="character.spellcasting && slotsChanged" class="space-y-2">
              <p class="text-2xs font-heading tracking-[0.15em] uppercase text-stone">Spell Slots Updated</p>
              <div class="flex flex-wrap gap-1.5">
                <span
                  v-for="slot in newSlotsDisplay"
                  :key="slot.label"
                  class="px-2 py-0.5 rounded border text-2xs font-heading"
                  :class="slot.increased
                    ? 'border-arcane-base/60 text-arcane-pale bg-arcane-base/10'
                    : 'border-shadow text-mist'"
                >{{ slot.label }}: {{ slot.count }}</span>
              </div>
            </section>

            <!-- Features gained -->
            <section v-if="featuresGained.length" class="space-y-1.5">
              <p class="text-2xs font-heading tracking-[0.15em] uppercase text-stone">Features Gained</p>
              <ul class="space-y-1">
                <li
                  v-for="f in featuresGained"
                  :key="f"
                  class="flex items-start gap-2 text-xs font-body text-ash"
                >
                  <span class="text-gold-dim/50 shrink-0 mt-px">◆</span>
                  {{ f }}
                </li>
              </ul>
            </section>

            <!-- ASI note -->
            <div
              v-if="isAsiLevel"
              class="flex items-start gap-2 px-3 py-2 rounded border border-gold-dim/30 bg-gold-dim/5"
            >
              <span class="text-gold-mid shrink-0 mt-px">↑</span>
              <p class="text-xs font-body text-mist">
                You gain an <span class="text-vellum font-heading">Ability Score Improvement</span>.
                Unlock the sheet to edit your scores.
              </p>
            </div>

            <!-- Subclass unlock note -->
            <div
              v-if="isSubclassLevel"
              class="flex items-start gap-2 px-3 py-2 rounded border border-gold-dim/30 bg-gold-dim/5"
            >
              <span class="text-gold-mid shrink-0 mt-px">★</span>
              <p class="text-xs font-body text-mist">
                You unlock your
                <span class="text-vellum font-heading">{{ character.identity.class.name }} subclass</span>
                at level 3.
              </p>
            </div>

            <!-- Next steps hint -->
            <p v-if="steps.length > 1" class="text-2xs font-body text-mist/40 text-center">
              Next:
              <span v-if="deltaCantrips > 0">pick {{ deltaCantrips }} cantrip{{ deltaCantrips > 1 ? 's' : '' }}</span>
              <span v-if="deltaCantrips > 0 && deltaSpells > 0"> · </span>
              <span v-if="deltaSpells > 0">pick {{ deltaSpells }} spell{{ deltaSpells > 1 ? 's' : '' }}</span>
            </p>

          </div>

          <!-- ──────────────────────── STEP: Cantrips ──────────────────────── -->
          <template v-else-if="currentStep === 'cantrips'">
            <div class="px-5 py-4 border-b border-shadow shrink-0">
              <p class="font-heading text-base text-arcane-pale">
                Choose Cantrip{{ deltaCantrips > 1 ? 's' : '' }}
              </p>
              <p class="text-2xs font-body text-mist mt-0.5">
                {{ character.identity.class.name }} ·
                <span :class="remainingCantrips === 0 ? 'text-gold-mid' : ''">
                  {{ selectedCantrips.length }}/{{ deltaCantrips }} selected
                </span>
              </p>
            </div>
            <div class="px-5 py-3 border-b border-shadow shrink-0">
              <input
                v-model="cantripSearch"
                type="text"
                placeholder="Search cantrips…"
                class="input-base w-full text-sm"
                autofocus
              />
            </div>
            <div class="overflow-y-auto flex-1 px-4 py-3 space-y-1">
              <div v-if="cantripLoading" class="flex justify-center py-10">
                <GrimoireSpinner label="Loading cantrips…" />
              </div>
              <p v-else-if="filteredCantrips.length === 0" class="text-sm font-body text-mist text-center py-8">
                No cantrips found.
              </p>
              <template v-else>
                <div
                  v-for="c in filteredCantrips"
                  :key="c.index"
                  class="flex items-center gap-3 px-3 py-2.5 rounded border transition-all"
                  :class="isCantripKnown(c.index) || isCantripBlocked(c.index)
                    ? 'border-shadow opacity-40 cursor-not-allowed'
                    : isCantripSelected(c.index)
                      ? 'border-arcane-base/60 bg-arcane-deep/20 cursor-pointer'
                      : 'border-shadow hover:border-arcane-base/30 hover:bg-arcane-deep/10 cursor-pointer'"
                  @click="!isCantripKnown(c.index) && !isCantripBlocked(c.index) && toggleCantrip(c)"
                >
                  <div
                    class="w-4 h-4 rounded border-2 flex items-center justify-center shrink-0 transition-all"
                    :class="isCantripSelected(c.index) ? 'border-arcane-base bg-arcane-deep/40' : 'border-mist/40'"
                  >
                    <span v-if="isCantripSelected(c.index)" class="text-arcane-pale text-[10px] leading-none">✓</span>
                  </div>
                  <div class="flex-1 min-w-0">
                    <p
                      class="font-heading text-sm"
                      :class="isCantripSelected(c.index) ? 'text-arcane-pale' : 'text-ash'"
                    >{{ c.name }}</p>
                    <p v-if="isCantripKnown(c.index)" class="text-2xs font-body text-mist">Already known</p>
                  </div>
                  <button
                    type="button"
                    class="shrink-0 w-6 h-6 flex items-center justify-center rounded text-mist/40 hover:text-arcane-pale hover:bg-arcane-deep/30 transition-all"
                    title="View details"
                    @click.stop="infoPanel.open({ kind: 'spell', index: c.index })"
                  ><InfoIcon :size="12" /></button>
                </div>
              </template>
            </div>
          </template>

          <!-- ───────────────────────── STEP: Spells ──────────────────────── -->
          <template v-else-if="currentStep === 'spells'">
            <div class="px-5 py-4 border-b border-shadow shrink-0">
              <p class="font-heading text-base text-arcane-pale">
                Choose Spell{{ deltaSpells > 1 ? 's' : '' }}
              </p>
              <p class="text-2xs font-body text-mist mt-0.5">
                {{ character.identity.class.name }} ·
                <span :class="remainingSpells === 0 ? 'text-gold-mid' : ''">
                  {{ selectedSpells.length }}/{{ deltaSpells }} selected
                </span>
              </p>
            </div>
            <!-- Level tabs -->
            <div class="flex border-b border-shadow overflow-x-auto shrink-0 scrollbar-none">
              <button
                v-for="lvl in availableSpellLevels"
                :key="lvl"
                type="button"
                class="px-3.5 py-2.5 text-xs font-heading tracking-wide whitespace-nowrap transition-colors shrink-0 border-b-2"
                :class="selectedSpellLevel === lvl
                  ? 'border-arcane-base text-arcane-pale'
                  : 'border-transparent text-mist hover:text-ash'"
                @click="selectedSpellLevel = lvl; spellSearch = ''"
              >Level {{ lvl }}</button>
            </div>
            <div class="px-5 py-3 border-b border-shadow shrink-0">
              <input
                v-model="spellSearch"
                type="text"
                placeholder="Search spells…"
                class="input-base w-full text-sm"
              />
            </div>
            <div class="overflow-y-auto flex-1 px-4 py-3 space-y-1">
              <div v-if="spellLoading" class="flex justify-center py-10">
                <GrimoireSpinner label="Loading spells…" />
              </div>
              <p v-else-if="filteredSpells.length === 0" class="text-sm font-body text-mist text-center py-8">
                No spells found.
              </p>
              <template v-else>
                <div
                  v-for="s in filteredSpells"
                  :key="s.index"
                  class="flex items-center gap-3 px-3 py-2.5 rounded border transition-all"
                  :class="isSpellKnown(s.index) || isSpellBlocked(s.index)
                    ? 'border-shadow opacity-40 cursor-not-allowed'
                    : isSpellSelected(s.index)
                      ? 'border-arcane-base/60 bg-arcane-deep/20 cursor-pointer'
                      : 'border-shadow hover:border-arcane-base/30 hover:bg-arcane-deep/10 cursor-pointer'"
                  @click="!isSpellKnown(s.index) && !isSpellBlocked(s.index) && toggleSpell(s)"
                >
                  <div
                    class="w-4 h-4 rounded border-2 flex items-center justify-center shrink-0 transition-all"
                    :class="isSpellSelected(s.index) ? 'border-arcane-base bg-arcane-deep/40' : 'border-mist/40'"
                  >
                    <span v-if="isSpellSelected(s.index)" class="text-arcane-pale text-[10px] leading-none">✓</span>
                  </div>
                  <div class="flex-1 min-w-0">
                    <p
                      class="font-heading text-sm"
                      :class="isSpellSelected(s.index) ? 'text-arcane-pale' : 'text-ash'"
                    >{{ s.name }}</p>
                    <p v-if="isSpellKnown(s.index)" class="text-2xs font-body text-mist">Already known</p>
                  </div>
                  <button
                    type="button"
                    class="shrink-0 w-6 h-6 flex items-center justify-center rounded text-mist/40 hover:text-arcane-pale hover:bg-arcane-deep/30 transition-all"
                    title="View details"
                    @click.stop="infoPanel.open({ kind: 'spell', index: s.index })"
                  ><InfoIcon :size="12" /></button>
                </div>
              </template>
            </div>
          </template>

          <!-- ──────────────────────────── Footer ──────────────────────────── -->
          <div class="px-5 py-4 border-t border-shadow shrink-0 flex gap-2">
            <button type="button" class="flex-1 btn-secondary text-sm" @click="back">
              {{ currentStepIndex === 0 ? 'Cancel' : '← Back' }}
            </button>
            <button
              type="button"
              class="flex-1 btn-primary text-sm"
              :disabled="!canAdvance"
              @click="next"
            >
              {{ isLastStep ? (atMaxLevel ? 'Close' : 'Level Up') : 'Next →' }}
            </button>
          </div>

        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { InfoIcon } from 'lucide-vue-next'
import { useQuery } from '@tanstack/vue-query'
import { computeModifier } from '@/shared/types/character'
import type { Character, SpellReference } from '@/shared/types/character'
import {
  CLASS_META, CLASS_LEVELS,
  getSpellSlots, getSpellProfile, getAsiLevels, getMaxSpellLevel,
} from '@/character-builder/classMeta'
import type { SpellSlotsMax } from '@/character-builder/classMeta'
import { fiveEApi } from '@/shared/api/fiveE.client'
import { useInfoPanel } from '@/shared/composables/useInfoPanel'
import GrimoireSpinner from '@/character-builder/components/GrimoireSpinner.vue'

const props = defineProps<{ show: boolean; character: Character }>()
const emit = defineEmits<{
  close: []
  leveled: [updates: Partial<Character>]
}>()

const infoPanel = useInfoPanel()
const classIndex = computed(() => props.character.identity.class.index)
const hitDie = computed(() => CLASS_META[classIndex.value]?.hitDie ?? 8)
const conMod = computed(() => computeModifier(props.character.abilityScores.con))
const newLevel = computed(() => Math.min(20, props.character.combat.level + 1))
const atMaxLevel = computed(() => props.character.combat.level >= 20)

// ── Spell profile deltas ──────────────────────────────────────────────────────

const profile = computed(() => getSpellProfile(classIndex.value))

const deltaCantrips = computed(() => {
  if (!profile.value) return 0
  const lvl = props.character.combat.level
  return Math.max(0,
    (profile.value.cantripsKnown[newLevel.value - 1] ?? 0)
    - (profile.value.cantripsKnown[lvl - 1] ?? 0),
  )
})

const deltaSpells = computed(() => {
  if (!profile.value?.spellsKnown) return 0
  const lvl = props.character.combat.level
  return Math.max(0,
    (profile.value.spellsKnown[newLevel.value - 1] ?? 0)
    - (profile.value.spellsKnown[lvl - 1] ?? 0),
  )
})

// ── Stepper ───────────────────────────────────────────────────────────────────

type Step = 'hp' | 'cantrips' | 'spells'

const steps = computed((): Step[] => {
  if (atMaxLevel.value) return ['hp']
  const s: Step[] = ['hp']
  if (deltaCantrips.value > 0) s.push('cantrips')
  if (deltaSpells.value > 0) s.push('spells')
  return s
})

const currentStepIndex = ref(0)
const currentStep = computed((): Step => steps.value[currentStepIndex.value] ?? 'hp')
const isLastStep = computed(() => currentStepIndex.value === steps.value.length - 1)

const canAdvance = computed(() => {
  if (atMaxLevel.value) return true
  if (currentStep.value === 'hp') {
    if (hpChoice.value === null) return false
    if (hpChoice.value === 'manual') return (manualHp.value || 0) >= 1
    return true
  }
  if (currentStep.value === 'cantrips') return remainingCantrips.value === 0
  if (currentStep.value === 'spells') return remainingSpells.value === 0
  return true
})

function back() {
  if (currentStepIndex.value > 0) currentStepIndex.value--
  else emit('close')
}

function next() {
  if (!canAdvance.value) return
  if (isLastStep.value) confirm()
  else currentStepIndex.value++
}

function handleEsc() {
  if (currentStepIndex.value > 0) currentStepIndex.value--
  else emit('close')
}

// ── HP ────────────────────────────────────────────────────────────────────────

const hpChoice = ref<'roll' | 'average' | 'manual' | null>(null)
const rawDie = ref<number | null>(null)
const rolledHp = ref(0)
const manualHp = ref(1)

const averageHp = computed(() => Math.max(1, Math.floor(hitDie.value / 2) + 1 + conMod.value))

const hpGained = computed(() => {
  if (hpChoice.value === 'average') return averageHp.value
  if (hpChoice.value === 'roll') return rolledHp.value
  if (hpChoice.value === 'manual') return Math.max(1, manualHp.value || 1)
  return 0
})

const rollDisplay = computed(() => {
  if (hpChoice.value !== 'roll' || rawDie.value === null) return `d${hitDie.value}`
  return `+${rolledHp.value}`
})

function selectRoll() {
  rawDie.value = Math.ceil(Math.random() * hitDie.value)
  rolledHp.value = Math.max(1, rawDie.value + conMod.value)
  hpChoice.value = 'roll'
}

// ── Spell slots ───────────────────────────────────────────────────────────────

const newSlots = computed((): SpellSlotsMax =>
  getSpellSlots(classIndex.value, newLevel.value),
)

const slotsChanged = computed(() => {
  const sc = props.character.spellcasting
  if (!sc) return false
  const keys: (keyof SpellSlotsMax)[] = ['level1','level2','level3','level4','level5','level6','level7','level8','level9']
  return keys.some(k => newSlots.value[k] !== sc.slotsMax[k])
})

const newSlotsDisplay = computed(() => {
  const sc = props.character.spellcasting
  const entries: Array<{ k: keyof SpellSlotsMax; label: string }> = [
    { k: 'level1', label: 'Lv 1' }, { k: 'level2', label: 'Lv 2' }, { k: 'level3', label: 'Lv 3' },
    { k: 'level4', label: 'Lv 4' }, { k: 'level5', label: 'Lv 5' }, { k: 'level6', label: 'Lv 6' },
    { k: 'level7', label: 'Lv 7' }, { k: 'level8', label: 'Lv 8' }, { k: 'level9', label: 'Lv 9' },
  ]
  return entries
    .map(({ k, label }) => ({ label, count: newSlots.value[k], increased: !!sc && newSlots.value[k] > sc.slotsMax[k] }))
    .filter(x => x.count > 0)
})

// ── Features / notes ──────────────────────────────────────────────────────────

const featuresGained = computed((): string[] =>
  CLASS_LEVELS[classIndex.value]?.[newLevel.value]?.features ?? [],
)

const isAsiLevel = computed(() => getAsiLevels(classIndex.value).includes(newLevel.value))
const isSubclassLevel = computed(() => newLevel.value === 3 && !props.character.identity.subclass)

// ── Cantrips step ─────────────────────────────────────────────────────────────

const cantripSearch = ref('')
const selectedCantrips = ref<{ index: string; name: string }[]>([])

const { data: cantripData, isPending: cantripLoading } = useQuery({
  queryKey: computed(() => ['cantrips', classIndex.value]),
  queryFn: () => fiveEApi.listSpells({ level: 0, class: classIndex.value }),
  staleTime: Infinity,
  enabled: computed(() => props.show && deltaCantrips.value > 0),
})

const filteredCantrips = computed(() => {
  const q = cantripSearch.value.trim().toLowerCase()
  const all = cantripData.value?.results ?? []
  return q ? all.filter(c => c.name.toLowerCase().includes(q)) : all
})

const knownCantripIndices = computed(() =>
  props.character.spellcasting?.cantripsKnown.map(s => s.index) ?? [],
)
const remainingCantrips = computed(() => deltaCantrips.value - selectedCantrips.value.length)

function isCantripKnown(index: string) { return knownCantripIndices.value.includes(index) }
function isCantripSelected(index: string) { return selectedCantrips.value.some(c => c.index === index) }
function isCantripBlocked(index: string) { return !isCantripSelected(index) && remainingCantrips.value <= 0 }
function toggleCantrip(c: { index: string; name: string }) {
  if (isCantripSelected(c.index)) selectedCantrips.value = selectedCantrips.value.filter(x => x.index !== c.index)
  else selectedCantrips.value.push(c)
}

// ── Spells step ───────────────────────────────────────────────────────────────

const spellSearch = ref('')
const selectedSpells = ref<{ index: string; name: string; level: number }[]>([])
const selectedSpellLevel = ref(1)

const availableSpellLevels = computed(() => {
  const max = getMaxSpellLevel(classIndex.value, newLevel.value)
  return Array.from({ length: max }, (_, i) => i + 1)
})

const { data: spellData, isPending: spellLoading } = useQuery({
  queryKey: computed(() => ['spells', classIndex.value, selectedSpellLevel.value]),
  queryFn: () => fiveEApi.listSpells({ class: classIndex.value, level: selectedSpellLevel.value }),
  staleTime: Infinity,
  enabled: computed(() => props.show && deltaSpells.value > 0),
})

const filteredSpells = computed(() => {
  const q = spellSearch.value.trim().toLowerCase()
  const all = spellData.value?.results ?? []
  return q ? all.filter(s => s.name.toLowerCase().includes(q)) : all
})

const knownSpellIndices = computed(() =>
  props.character.spellcasting?.spellsKnown.map(s => s.index) ?? [],
)
const remainingSpells = computed(() => deltaSpells.value - selectedSpells.value.length)

function isSpellKnown(index: string) { return knownSpellIndices.value.includes(index) }
function isSpellSelected(index: string) { return selectedSpells.value.some(s => s.index === index) }
function isSpellBlocked(index: string) { return !isSpellSelected(index) && remainingSpells.value <= 0 }
function toggleSpell(s: { index: string; name: string }) {
  if (isSpellSelected(s.index)) selectedSpells.value = selectedSpells.value.filter(x => x.index !== s.index)
  else selectedSpells.value.push({ index: s.index, name: s.name, level: selectedSpellLevel.value })
}

// ── Reset on open ─────────────────────────────────────────────────────────────

watch(() => props.show, (v) => {
  if (!v) return
  currentStepIndex.value = 0
  hpChoice.value = null
  rawDie.value = null
  rolledHp.value = 0
  manualHp.value = 1
  selectedCantrips.value = []
  selectedSpells.value = []
  cantripSearch.value = ''
  spellSearch.value = ''
  selectedSpellLevel.value = availableSpellLevels.value[0] ?? 1
})

// ── Confirm ───────────────────────────────────────────────────────────────────

function confirm() {
  if (atMaxLevel.value) { emit('close'); return }

  const c = props.character
  const updates: Partial<Character> = {
    combat: {
      ...c.combat,
      level: newLevel.value,
      maxHp: c.combat.maxHp + hpGained.value,
      hitDiceRemaining: c.combat.hitDiceRemaining + 1,
    },
  }

  if (c.spellcasting) {
    const addedCantrips: SpellReference[] = selectedCantrips.value.map(ct => ({
      index: ct.index, name: ct.name, level: 0,
    }))
    const addedSpells: SpellReference[] = selectedSpells.value.map(s => ({
      index: s.index, name: s.name, level: s.level,
    }))
    updates.spellcasting = {
      ...c.spellcasting,
      slotsMax: newSlots.value,
      cantripsKnown: [...c.spellcasting.cantripsKnown, ...addedCantrips],
      spellsKnown:   [...c.spellcasting.spellsKnown,   ...addedSpells],
    }
  }

  emit('leveled', updates)
}
</script>

<style scoped>
.levelup-fade-enter-active,
.levelup-fade-leave-active { transition: opacity 0.15s ease; }
.levelup-fade-enter-from,
.levelup-fade-leave-to { opacity: 0; }
.levelup-fade-enter-from .relative { transform: scale(0.95); }
.scrollbar-none { scrollbar-width: none; }
.scrollbar-none::-webkit-scrollbar { display: none; }
</style>
