<template>
  <div>
    <div v-if="!character" class="app-container py-24 text-center">
      <p class="font-body text-ash">Character not found in this tome.</p>
      <RouterLink to="/" class="btn-secondary mt-4 inline-flex">← Back to characters</RouterLink>
    </div>

    <template v-else>
      <!-- ── Header ────────────────────────────────────────────────────────── -->
      <section class="border-b border-shadow relative overflow-hidden">
        <div
          class="absolute inset-0 pointer-events-none"
          style="background: linear-gradient(180deg, rgba(212,168,67,0.03) 0%, transparent 100%)"
        />
        <div class="app-container py-8 relative">
          <div class="flex items-start gap-5">
            <!-- Portrait -->
            <div
              class="shrink-0 w-20 h-20 sm:w-24 sm:h-24 rounded relative overflow-hidden border border-shadow"
              style="box-shadow: 0 0 0 1px rgba(212,168,67,0.1) inset"
            >
              <img
                v-if="character.portrait.type === 'url'"
                :src="character.portrait.url"
                :alt="character.identity.name"
                class="w-full h-full object-cover"
              />
              <div v-else class="w-full h-full flex items-center justify-center bg-depths">
                <span class="text-3xl text-gold-dim/40">{{ classGlyph }}</span>
              </div>
              <div class="absolute top-0 left-0 w-3 h-3 border-t border-l border-gold-dim/40" />
              <div class="absolute top-0 right-0 w-3 h-3 border-t border-r border-gold-dim/40" />
              <div class="absolute bottom-0 left-0 w-3 h-3 border-b border-l border-gold-dim/40" />
              <div class="absolute bottom-0 right-0 w-3 h-3 border-b border-r border-gold-dim/40" />
            </div>

            <!-- Identity -->
            <div class="flex-1 min-w-0">
              <div class="flex items-start justify-between gap-4 flex-wrap">
                <div>
                  <h1 class="font-display text-3xl sm:text-4xl text-vellum leading-tight">
                    {{ character.identity.name }}
                  </h1>
                  <p class="font-body text-ash mt-1">
                    {{ character.identity.race.name }}<span v-if="character.identity.subrace">&nbsp;({{ character.identity.subrace.name }})</span>
                    <span class="text-mist mx-1.5">·</span>
                    {{ character.identity.class.name }}<span v-if="character.identity.subclass">&nbsp;— {{ character.identity.subclass.name }}</span>
                    <span class="text-mist mx-1.5">·</span>
                    Level {{ character.combat.level }}
                  </p>
                  <p class="font-body text-sm text-mist mt-0.5">
                    {{ character.identity.background.name }}
                    <span class="mx-1">·</span>
                    {{ character.identity.alignment }}
                  </p>
                </div>
                <div class="flex gap-2 shrink-0 items-center">
                  <button class="btn-secondary text-xs gap-1.5" @click="downloadExport">
                    <DownloadIcon :size="13" />Export
                  </button>
                  <button
                    :title="editMode ? 'Bloquear ficha' : 'Desbloquear ficha'"
                    class="w-7 h-7 flex items-center justify-center rounded transition-colors"
                    :class="editMode ? 'text-mist hover:text-ash hover:bg-shadow/40' : 'text-gold-mid hover:text-gold-bright hover:bg-gold-dim/10'"
                    @click="editMode = !editMode"
                  >
                    <LockOpenIcon v-if="editMode" :size="14" />
                    <LockIcon v-else :size="14" />
                  </button>
                </div>
              </div>
              <div class="flex flex-wrap gap-2 mt-3">
                <span class="badge-gold">Lv {{ character.combat.level }}</span>
                <span v-if="character.spellcasting" class="badge-arcane">Spellcaster</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      <!-- ── Quick Stats ────────────────────────────────────────────────────── -->
      <section class="border-b border-shadow bg-depths/50">
        <div class="app-container py-4">
          <div class="grid grid-cols-3 sm:grid-cols-6 gap-2">
            <!-- AC editable -->
            <div class="card flex flex-col items-center justify-center p-3 gap-0.5">
              <p class="text-2xs font-heading tracking-[0.15em] uppercase text-mist">AC</p>
              <input
                v-if="acEditing && editMode"
                ref="acInputEl"
                v-model.number="acValue"
                type="number"
                min="0"
                class="w-10 text-center font-heading text-xl bg-transparent border-b border-gold-mid/50 outline-none text-vellum"
                @blur="commitAc"
                @keydown.enter="commitAc"
                @keydown.esc="acEditing = false"
              />
              <button
                v-else
                type="button"
                class="font-heading text-xl text-vellum transition-colors"
                :class="editMode ? 'hover:text-gold-mid cursor-pointer' : 'cursor-default'"
                :title="editMode ? 'Click to edit AC' : ''"
                @click="editMode && startAcEdit()"
              >{{ character.combat.armorClass }}</button>
            </div>
            <StatBox label="Initiative" :value="initiativeDisplay" />
            <StatBox label="Speed" :value="`${speedDisplay}ft`" />

            <!-- HP tracker -->
            <div
              class="card flex flex-col items-center justify-center p-3 gap-0.5"
              :class="hpPercent < 0.25 ? 'pulse-blood border-blood-base/40' : ''"
            >
              <p class="text-2xs font-heading tracking-[0.15em] uppercase text-mist">HP</p>
              <div v-if="hpEditing && editMode" class="flex items-center gap-1">
                <input
                  ref="hpInputEl"
                  v-model.number="hpInputValue"
                  type="number"
                  :min="0"
                  :max="character.combat.maxHp"
                  class="w-14 text-center font-heading text-lg bg-transparent border-b border-gold-mid/50 outline-none text-vellum"
                  @blur="commitHp"
                  @keydown.enter="commitHp"
                  @keydown.esc="hpEditing = false"
                />
              </div>
              <div v-else class="flex items-center gap-1">
                <button v-if="editMode" type="button" class="w-5 h-5 flex items-center justify-center rounded text-mist hover:text-ash hover:bg-depths/60 font-heading transition-colors" @click="adjustHp(-1)">−</button>
                <button
                  type="button"
                  class="font-heading text-lg leading-none transition-colors"
                  :class="[hpPercent < 0.25 ? 'text-blood-bright' : 'text-vellum', editMode ? 'hover:text-gold-mid cursor-pointer' : 'cursor-default']"
                  @click="editMode && startHpEdit()"
                >{{ character.combat.currentHp }}</button>
                <button v-if="editMode" type="button" class="w-5 h-5 flex items-center justify-center rounded text-mist hover:text-ash hover:bg-depths/60 font-heading transition-colors" @click="adjustHp(1)">+</button>
              </div>
              <p class="text-xs text-mist leading-none">/ {{ character.combat.maxHp }}</p>
              <!-- Temp HP -->
              <div class="flex items-center gap-1 mt-0.5 border-t border-shadow/40 pt-0.5 w-full justify-center">
                <button v-if="editMode" type="button" class="w-4 h-4 flex items-center justify-center rounded text-mist/60 hover:text-ash font-heading text-xs transition-colors" @click="adjustTempHp(-1)">−</button>
                <span class="text-2xs font-heading text-mist leading-none">THP&nbsp;</span>
                <button
                  type="button"
                  class="font-heading text-xs transition-colors"
                  :class="[character.combat.tempHp > 0 ? 'text-arcane-pale' : 'text-mist/40', editMode ? 'hover:text-arcane-pale/80 cursor-pointer' : 'cursor-default']"
                  :title="editMode ? 'Click to set Temp HP' : ''"
                  @click="editMode && startTempHpEdit()"
                >
                  <template v-if="tempHpEditing && editMode">
                    <input
                      ref="tempHpInputEl"
                      v-model.number="tempHpValue"
                      type="number"
                      min="0"
                      class="w-8 text-center bg-transparent border-b border-arcane-base/50 outline-none text-arcane-pale font-heading text-xs"
                      @blur="commitTempHp"
                      @keydown.enter="commitTempHp"
                      @keydown.esc="tempHpEditing = false"
                    />
                  </template>
                  <template v-else>{{ character.combat.tempHp }}</template>
                </button>
                <button v-if="editMode" type="button" class="w-4 h-4 flex items-center justify-center rounded text-mist/60 hover:text-ash font-heading text-xs transition-colors" @click="adjustTempHp(1)">+</button>
              </div>
            </div>

            <!-- Inspiration -->
            <div
              class="card flex flex-col items-center justify-center p-3 gap-0.5 transition-all duration-150"
              :class="[
                character.combat.inspiration ? 'border-gold-mid/50 bg-gold-dim/10' : '',
                editMode ? 'cursor-pointer hover:border-gold-dim/20' : 'cursor-default',
              ]"
              :title="editMode ? 'Toggle inspiration' : ''"
              @click="editMode && toggleInspiration()"
            >
              <p class="text-2xs font-heading tracking-[0.15em] uppercase" :class="character.combat.inspiration ? 'text-gold-mid' : 'text-mist'">Inspiration</p>
              <p class="font-heading text-xl leading-none" :class="character.combat.inspiration ? 'text-gold-mid' : 'text-mist/30'">✦</p>
            </div>

            <StatBox label="Prof Bonus" :value="`+${profBonus}`" />
          </div>

          <!-- ── Death Saves ─────────────────────────────────────────────── -->
          <div class="mt-3 pt-3 border-t border-shadow/40 flex items-center gap-6 flex-wrap">
            <p class="text-2xs font-heading tracking-[0.15em] uppercase text-mist shrink-0">Death Saves</p>

            <!-- Successes -->
            <div class="flex items-center gap-1.5">
              <span class="text-2xs font-body text-mist/60 mr-0.5">Success</span>
              <button
                v-for="pip in 3"
                :key="`s${pip}`"
                type="button"
                class="w-3.5 h-3.5 rounded-full border-2 transition-all duration-100"
                :class="[
                  pip <= deathSaves.successes ? 'bg-gold-mid border-gold-mid' : 'bg-transparent border-mist/30',
                  editMode ? 'hover:border-gold-dim/60 cursor-pointer' : 'cursor-default',
                ]"
                @click="editMode && toggleDeathSave('successes', pip)"
              />
            </div>
            <!-- Failures -->
            <div class="flex items-center gap-1.5">
              <span class="text-2xs font-body text-mist/60 mr-0.5">Failure</span>
              <button
                v-for="pip in 3"
                :key="`f${pip}`"
                type="button"
                class="w-3.5 h-3.5 rounded-full border-2 transition-all duration-100"
                :class="[
                  pip <= deathSaves.failures ? 'bg-blood-bright border-blood-bright' : 'bg-transparent border-mist/30',
                  editMode ? 'hover:border-blood-base/60 cursor-pointer' : 'cursor-default',
                ]"
                @click="editMode && toggleDeathSave('failures', pip)"
              />
            </div>
          </div>

          <!-- ── Rest ──────────────────────────────────────────────────────── -->
          <div class="mt-3 pt-3 border-t border-shadow/40 flex items-center gap-4 flex-wrap">
            <div class="flex items-center gap-2 flex-wrap">
              <p class="text-2xs font-heading tracking-[0.15em] uppercase text-mist shrink-0">Hit Dice (d{{ hitDie }})</p>
              <div class="flex items-center gap-1">
                <div
                  v-for="pip in character.combat.level"
                  :key="pip"
                  class="w-3.5 h-3.5 rounded-full border-2 transition-all duration-100"
                  :class="pip <= character.combat.hitDiceRemaining
                    ? 'bg-arcane-pale border-arcane-pale'
                    : 'bg-transparent border-mist/30'"
                />
              </div>
              <span class="text-2xs font-body text-mist/60">{{ character.combat.hitDiceRemaining }}/{{ character.combat.level }}</span>
            </div>
            <div class="flex gap-2 ml-auto">
              <button
                class="btn-secondary text-xs gap-1.5 disabled:opacity-40 disabled:cursor-not-allowed"
                :disabled="character.combat.hitDiceRemaining <= 0"
                @click="shortRest"
              >Short Rest</button>
              <button
                class="btn-secondary text-xs gap-1.5"
                @click="longRest"
              >Long Rest</button>
            </div>
          </div>

          <!-- ── Conditions & Concentration ─────────────────────────────────── -->
          <div class="mt-3 pt-3 border-t border-shadow/40">
            <ConditionsBar :character="character" :edit-mode="editMode" />
          </div>

        </div>
      </section>

      <!-- ── Ability Scores ─────────────────────────────────────────────────── -->
      <section class="border-b border-shadow">
        <div class="app-container py-5">
          <div class="grid grid-cols-3 sm:grid-cols-6 gap-2">
            <AbilityBlock
              v-for="ab in abilityEntries"
              :key="ab.key"
              :label="ab.label"
              :score="ab.score"
              :mod="ab.mod"
            />
          </div>
        </div>
      </section>

      <!-- ── Saving Throws & Skills ─────────────────────────────────────────── -->
      <section class="border-b border-shadow">
        <div class="app-container py-5">
          <div class="grid sm:grid-cols-[200px_1fr] gap-6">

            <!-- Saving Throws -->
            <div>
              <p class="label mb-3">Saving Throws</p>
              <div class="space-y-1.5">
                <div v-for="save in SAVES" :key="save.key" class="flex items-center gap-2">
                  <span
                    class="w-2.5 h-2.5 rounded-full border-2 shrink-0 transition-colors"
                    :class="character.savingThrowProficiencies[save.key]
                      ? 'bg-gold-mid border-gold-mid'
                      : 'bg-transparent border-mist/50'"
                  />
                  <span class="font-heading text-sm w-8 shrink-0" :class="character.savingThrowProficiencies[save.key] ? 'text-gold-pale' : 'text-stone'">
                    {{ fmt(saveBonus(save.key)) }}
                  </span>
                  <span class="text-xs font-body text-ash">{{ save.label }}</span>
                </div>
              </div>
            </div>

            <!-- Skills -->
            <div>
              <div class="flex items-center justify-between mb-3 flex-wrap gap-2">
                <p class="label">Skills</p>
                <p class="text-xs font-body text-mist">Passive Perception {{ passivePerception }}</p>
              </div>
              <div class="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-1.5">
                <div v-for="skill in SKILLS" :key="skill.index" class="flex items-center gap-2">
                  <span
                    class="w-2.5 h-2.5 rounded-full border-2 shrink-0 transition-colors"
                    :class="profClass(skill.index)"
                  />
                  <span class="font-heading text-sm w-8 shrink-0" :class="hasProficiency(skill.index) ? 'text-gold-pale' : 'text-stone'">
                    {{ fmt(skillBonus(skill)) }}
                  </span>
                  <span class="text-xs font-body text-ash flex-1">{{ skill.name }}</span>
                  <span class="text-2xs font-heading text-mist/60 shrink-0">{{ skill.ability.toUpperCase() }}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <!-- ── Tabs ───────────────────────────────────────────────────────────── -->
      <div class="app-container pt-5">
        <div class="border-b border-shadow mb-6">
          <div class="flex gap-0 overflow-x-auto">
            <button
              v-for="tab in tabs"
              :key="tab.id"
              class="px-4 py-2.5 text-sm font-heading tracking-wide border-b-2 transition-all duration-150 whitespace-nowrap shrink-0"
              :class="activeTab === tab.id
                ? 'border-gold-mid text-gold-mid'
                : 'border-transparent text-ash hover:text-stone hover:border-shadow'"
              @click="activeTab = tab.id"
            >
              {{ tab.label }}
            </button>
          </div>
        </div>

        <div class="pb-12">

          <!-- Attacks -->
          <div v-if="activeTab === 'attacks'">
            <AttacksTab :character="character" :edit-mode="editMode" />
          </div>

          <!-- Spells -->
          <div v-else-if="activeTab === 'spells'">
            <SpellsTab :character="character" :edit-mode="editMode" />
          </div>

          <!-- Equipment -->
          <div v-else-if="activeTab === 'equipment'">
            <EquipmentTab :character="character" :edit-mode="editMode" />
          </div>

          <!-- Features & Traits -->
          <div v-else-if="activeTab === 'features'">
            <FeaturesTab :character="character" />
          </div>

          <!-- Biography -->
          <div v-else-if="activeTab === 'bio'">
            <BioTab :character="character" :edit-mode="editMode" />
          </div>

          <!-- Notes -->
          <div v-else-if="activeTab === 'notes'" class="space-y-2">
            <p class="label">Session Notes</p>
            <textarea
              v-model="notesText"
              class="input-base w-full resize-y font-body text-sm leading-relaxed"
              rows="12"
              placeholder="Write notes about this character's adventures, session recaps, plans for the next session…"
              @blur="saveNotes"
            />
          </div>

        </div>
      </div>
    </template>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, nextTick } from 'vue'
import { DownloadIcon, LockIcon, LockOpenIcon } from 'lucide-vue-next'
import { useCharactersStore } from '@/characters/store'
import { computeModifier, computeAllModifiers } from '@/shared/types/character'
import type { Character, AbilityName } from '@/shared/types/character'
import { computeProficiencyBonus } from '@/shared/lib/derivedStats'
import { CLASS_META } from '@/character-builder/classMeta'
import { useDialog } from '@/shared/composables/useDialog'
import StatBox from '@/characters/components/StatBox.vue'
import AbilityBlock from '@/characters/components/AbilityBlock.vue'
import FeaturesTab from '@/characters/components/FeaturesTab.vue'
import BioTab from '@/characters/components/BioTab.vue'
import ConditionsBar from '@/characters/components/ConditionsBar.vue'
import AttacksTab from '@/characters/components/AttacksTab.vue'
import EquipmentTab from '@/characters/components/EquipmentTab.vue'
import SpellsTab from '@/characters/components/SpellsTab.vue'

const props = defineProps<{ id: string }>()
const store = useCharactersStore()
const character = computed(() => store.getById(props.id))
const dialog = useDialog()

const editMode = ref(true)

// ── Tabs ──────────────────────────────────────────────────────────────────────

const activeTab = ref('attacks')
const tabs = [
  { id: 'attacks',   label: 'Attacks'   },
  { id: 'spells',    label: 'Spells'    },
  { id: 'equipment', label: 'Equipment' },
  { id: 'features',  label: 'Features'  },
  { id: 'bio',       label: 'Biography' },
  { id: 'notes',     label: 'Notes'     },
]

// ── Core derived stats ────────────────────────────────────────────────────────

const profBonus = computed(() =>
  character.value ? computeProficiencyBonus(character.value.combat.level) : 0,
)

const mods = computed(() =>
  character.value ? computeAllModifiers(character.value.abilityScores) : { str: 0, dex: 0, con: 0, int: 0, wis: 0, cha: 0 },
)

const hpPercent = computed(() => {
  if (!character.value) return 1
  return character.value.combat.currentHp / character.value.combat.maxHp
})

const initiativeDisplay = computed(() => {
  if (!character.value) return '—'
  const override = character.value.overrides.initiative
  if (override !== undefined) return override >= 0 ? `+${override}` : String(override)
  const mod = computeModifier(character.value.abilityScores.dex)
  return mod >= 0 ? `+${mod}` : String(mod)
})

const speedDisplay = computed(() => {
  if (!character.value) return 30
  return character.value.overrides.speed ?? character.value.identity.race.speed
})

const abilityEntries = computed(() => {
  if (!character.value) return []
  const scores = character.value.abilityScores
  const m = computeAllModifiers(scores)
  return [
    { key: 'str', label: 'STR', score: scores.str, mod: m.str },
    { key: 'dex', label: 'DEX', score: scores.dex, mod: m.dex },
    { key: 'con', label: 'CON', score: scores.con, mod: m.con },
    { key: 'int', label: 'INT', score: scores.int, mod: m.int },
    { key: 'wis', label: 'WIS', score: scores.wis, mod: m.wis },
    { key: 'cha', label: 'CHA', score: scores.cha, mod: m.cha },
  ]
})

const classGlyphs: Record<string, string> = {
  barbarian: '⚔', bard: '♪', cleric: '✦', druid: '☘', fighter: '🛡',
  monk: '◎', paladin: '✚', ranger: '⌖', rogue: '◆', sorcerer: '✶',
  warlock: '⌬', wizard: '⎊',
}
const classGlyph = computed(() => classGlyphs[character.value?.identity.class.name.toLowerCase() ?? ''] ?? '⚔')

// ── HP tracker ────────────────────────────────────────────────────────────────

const hpEditing = ref(false)
const hpInputValue = ref(0)
const hpInputEl = ref<HTMLInputElement | null>(null)

function startHpEdit() {
  if (!character.value) return
  hpInputValue.value = character.value.combat.currentHp
  hpEditing.value = true
  nextTick(() => hpInputEl.value?.select())
}

async function commitHp() {
  if (!character.value) return
  hpEditing.value = false
  const clamped = Math.max(0, Math.min(hpInputValue.value || 0, character.value.combat.maxHp))
  if (clamped === character.value.combat.currentHp) return
  await store.update(character.value.id, { combat: { ...character.value.combat, currentHp: clamped } })
}

async function adjustHp(delta: number) {
  if (!character.value) return
  const next = Math.max(0, Math.min(character.value.combat.currentHp + delta, character.value.combat.maxHp))
  if (next === character.value.combat.currentHp) return
  await store.update(character.value.id, { combat: { ...character.value.combat, currentHp: next } })
}

async function toggleInspiration() {
  if (!character.value) return
  await store.update(character.value.id, {
    combat: { ...character.value.combat, inspiration: !character.value.combat.inspiration },
  })
}

// ── AC editable ───────────────────────────────────────────────────────────────

const acEditing = ref(false)
const acValue = ref(0)
const acInputEl = ref<HTMLInputElement | null>(null)

function startAcEdit() {
  if (!character.value) return
  acValue.value = character.value.combat.armorClass
  acEditing.value = true
  nextTick(() => acInputEl.value?.select())
}

async function commitAc() {
  if (!character.value) return
  acEditing.value = false
  const next = Math.max(0, acValue.value || 0)
  if (next === character.value.combat.armorClass) return
  await store.update(character.value.id, { combat: { ...character.value.combat, armorClass: next } })
}

// ── Temp HP ───────────────────────────────────────────────────────────────────

const tempHpEditing = ref(false)
const tempHpValue = ref(0)
const tempHpInputEl = ref<HTMLInputElement | null>(null)

function startTempHpEdit() {
  if (!character.value) return
  tempHpValue.value = character.value.combat.tempHp
  tempHpEditing.value = true
  nextTick(() => tempHpInputEl.value?.select())
}

async function commitTempHp() {
  if (!character.value) return
  tempHpEditing.value = false
  const next = Math.max(0, tempHpValue.value || 0)
  if (next === character.value.combat.tempHp) return
  await store.update(character.value.id, { combat: { ...character.value.combat, tempHp: next } })
}

async function adjustTempHp(delta: number) {
  if (!character.value) return
  const next = Math.max(0, character.value.combat.tempHp + delta)
  if (next === character.value.combat.tempHp) return
  await store.update(character.value.id, { combat: { ...character.value.combat, tempHp: next } })
}

// ── Death saves ───────────────────────────────────────────────────────────────

const deathSaves = computed(() =>
  character.value?.combat.deathSaves ?? { successes: 0, failures: 0 },
)

async function toggleDeathSave(type: 'successes' | 'failures', pip: number) {
  if (!character.value) return
  const current = deathSaves.value
  const currentVal = current[type]
  const next = pip <= currentVal ? pip - 1 : pip
  await store.update(character.value.id, {
    combat: {
      ...character.value.combat,
      deathSaves: { ...current, [type]: Math.max(0, Math.min(3, next)) },
    },
  })
}

// ── Saving Throws & Skills ─────────────────────────────────────────────────────

const SAVES: { key: AbilityName; label: string }[] = [
  { key: 'str', label: 'Strength' },
  { key: 'dex', label: 'Dexterity' },
  { key: 'con', label: 'Constitution' },
  { key: 'int', label: 'Intelligence' },
  { key: 'wis', label: 'Wisdom' },
  { key: 'cha', label: 'Charisma' },
]

const SKILLS = [
  { index: 'acrobatics',      name: 'Acrobatics',     ability: 'dex' as AbilityName },
  { index: 'animal-handling', name: 'Animal Handling', ability: 'wis' as AbilityName },
  { index: 'arcana',          name: 'Arcana',          ability: 'int' as AbilityName },
  { index: 'athletics',       name: 'Athletics',       ability: 'str' as AbilityName },
  { index: 'deception',       name: 'Deception',       ability: 'cha' as AbilityName },
  { index: 'history',         name: 'History',         ability: 'int' as AbilityName },
  { index: 'insight',         name: 'Insight',         ability: 'wis' as AbilityName },
  { index: 'intimidation',    name: 'Intimidation',    ability: 'cha' as AbilityName },
  { index: 'investigation',   name: 'Investigation',   ability: 'int' as AbilityName },
  { index: 'medicine',        name: 'Medicine',        ability: 'wis' as AbilityName },
  { index: 'nature',          name: 'Nature',          ability: 'int' as AbilityName },
  { index: 'perception',      name: 'Perception',      ability: 'wis' as AbilityName },
  { index: 'performance',     name: 'Performance',     ability: 'cha' as AbilityName },
  { index: 'persuasion',      name: 'Persuasion',      ability: 'cha' as AbilityName },
  { index: 'religion',        name: 'Religion',        ability: 'int' as AbilityName },
  { index: 'sleight-of-hand', name: 'Sleight of Hand', ability: 'dex' as AbilityName },
  { index: 'stealth',         name: 'Stealth',         ability: 'dex' as AbilityName },
  { index: 'survival',        name: 'Survival',        ability: 'wis' as AbilityName },
]

function fmt(n: number) { return n >= 0 ? `+${n}` : String(n) }

function saveBonus(ability: AbilityName): number {
  if (!character.value) return 0
  const base = mods.value[ability]
  return character.value.savingThrowProficiencies[ability] ? base + profBonus.value : base
}

function skillBonus(skill: (typeof SKILLS)[number]): number {
  if (!character.value) return 0
  const base = mods.value[skill.ability]
  const prof = character.value.skillProficiencies[skill.index]
  if (prof === 'expertise')  return base + profBonus.value * 2
  if (prof === 'proficient') return base + profBonus.value
  return base
}

function hasProficiency(skillIndex: string): boolean {
  const prof = character.value?.skillProficiencies[skillIndex]
  return prof === 'proficient' || prof === 'expertise'
}

function profClass(skillIndex: string): string {
  const prof = character.value?.skillProficiencies[skillIndex]
  if (prof === 'expertise')  return 'bg-arcane-pale border-arcane-pale'
  if (prof === 'proficient') return 'bg-gold-mid border-gold-mid'
  return 'bg-transparent border-mist/50'
}

const passivePerception = computed(() => {
  if (!character.value) return 10
  const override = character.value.overrides.passivePerception
  if (override !== undefined) return override
  const percSkill = SKILLS.find(s => s.index === 'perception')!
  return 10 + skillBonus(percSkill)
})

// ── Notes ─────────────────────────────────────────────────────────────────────

const notesText = ref('')

watch(character, (c) => { notesText.value = c?.notes ?? '' }, { immediate: true })

async function saveNotes() {
  if (!character.value) return
  await store.update(character.value.id, { notes: notesText.value })
}


// ── Rest ──────────────────────────────────────────────────────────────────────

const hitDie = computed(() =>
  CLASS_META[character.value?.identity.class.index ?? '']?.hitDie ?? 8,
)

function shortRest() {
  const c = character.value
  if (!c || c.combat.hitDiceRemaining <= 0) return
  const conMod = computeModifier(c.abilityScores.con)
  const roll = Math.ceil(Math.random() * hitDie.value)
  const healed = Math.max(1, roll + conMod)
  const newHp = Math.min(c.combat.maxHp, c.combat.currentHp + healed)
  store.update(c.id, {
    combat: {
      ...c.combat,
      currentHp: newHp,
      hitDiceRemaining: c.combat.hitDiceRemaining - 1,
    },
  })
  const conStr = conMod >= 0 ? `+${conMod}` : String(conMod)
  dialog.open({
    title: 'Short Rest',
    body: 'You spend a moment to catch your breath and tend to your wounds.',
    items: [
      { label: 'Hit die rolled', value: `d${hitDie.value} → ${roll} ${conStr} = ${roll + conMod}` },
      { label: 'HP recovered',   value: `+${healed} (${newHp} / ${c.combat.maxHp})` },
      { label: 'Hit dice left',  value: `${c.combat.hitDiceRemaining - 1}d${hitDie.value}` },
    ],
  })
}

function longRest() {
  const c = character.value
  if (!c) return
  const regained = Math.max(1, Math.floor(c.combat.level / 2))
  const newHitDice = Math.min(c.combat.level, c.combat.hitDiceRemaining + regained)
  const updates: Partial<Character> = {
    combat: {
      ...c.combat,
      currentHp: c.combat.maxHp,
      tempHp: 0,
      hitDiceRemaining: newHitDice,
      deathSaves: { successes: 0, failures: 0 },
    },
  }
  const items: { label: string; value: string }[] = [
    { label: 'HP',        value: `Restaurado a ${c.combat.maxHp} / ${c.combat.maxHp}` },
    { label: 'Hit Dice',  value: `+${regained} recuperados (${newHitDice}d${hitDie.value})` },
    { label: 'Death Saves', value: 'Reiniciados' },
  ]
  if (c.spellcasting) {
    updates.spellcasting = {
      ...c.spellcasting,
      slotsUsed: { level1: 0, level2: 0, level3: 0, level4: 0, level5: 0, level6: 0, level7: 0, level8: 0, level9: 0 },
    }
    items.splice(1, 0, { label: 'Spell Slots', value: 'Todos recuperados' })
  }
  store.update(c.id, updates)
  dialog.open({
    title: 'Long Rest',
    body: 'Tras un descanso completo, te despiertas renovado y recuperado.',
    items,
    variant: 'success',
  })
}

// ── Export ────────────────────────────────────────────────────────────────────

function downloadExport() {
  if (!character.value) return
  const json = store.exportOne(character.value.id)
  const blob = new Blob([json], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `${character.value.identity.name.replace(/\s+/g, '-')}.grimoire.json`
  a.click()
  URL.revokeObjectURL(url)
}
</script>
