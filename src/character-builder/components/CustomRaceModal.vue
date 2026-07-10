<template>
  <Teleport to="body">
    <Transition name="dialog-fade">
      <div
        v-if="show"
        class="fixed inset-0 z-[60] flex items-center justify-center p-4"
        @keydown.esc="$emit('close')"
      >
        <div class="absolute inset-0 bg-black/60" @click="$emit('close')" />

        <div
          role="dialog"
          aria-modal="true"
          v-focus-trap
          aria-labelledby="custom-race-title"
          class="relative w-full max-w-2xl bg-void border border-shadow rounded-lg shadow-2xl overflow-hidden flex flex-col"
          style="max-height: 88vh"
        >
          <div class="h-0.5 w-full bg-arcane-base" />

          <!-- Header -->
          <div class="px-5 py-4 border-b border-shadow flex items-center justify-between shrink-0">
            <div>
              <p id="custom-race-title" class="font-heading text-base text-arcane-pale">Custom Race</p>
              <p class="text-2xs font-body text-mist mt-0.5">Homebrew a race, bonuses add straight to your sheet</p>
            </div>
            <button type="button" class="text-mist hover:text-ash transition-colors" aria-label="Close" @click="$emit('close')">
              <XIcon :size="16" />
            </button>
          </div>

          <!-- Body: the form -->
          <div class="flex-1 overflow-y-auto px-5 py-5 space-y-6">

            <!-- Load a saved race from the user's collection -->
            <div v-if="auth.isAuthenticated && customContent.races.length" class="flex items-center gap-2">
              <span class="text-2xs font-heading tracking-wide uppercase text-mist shrink-0">Load a saved race</span>
              <AppSelect v-model="selectedSavedRaceId" class="flex-1 text-sm" @change="onSelectSavedRace">
                <option value="">Choose from your collection…</option>
                <option v-for="r in customContent.races" :key="r.id" :value="r.id">{{ r.name }}</option>
              </AppSelect>
            </div>

            <!-- Name -->
            <div class="space-y-1.5">
              <label class="text-2xs font-heading tracking-wide uppercase text-mist">Race Name</label>
              <input
                v-model.trim="builder.draft.raceName"
                type="text"
                maxlength="60"
                placeholder="e.g. Stormborn Aasimar"
                class="input-base w-full text-sm"
              />
              <p v-if="showValidation && !builder.draft.raceName.trim()" class="text-xs font-body text-blood-bright">
                Enter a name for your custom race.
              </p>
            </div>

            <!-- Ability score bonuses -->
            <div class="space-y-2">
              <div class="flex items-baseline justify-between gap-2">
                <p class="text-2xs font-heading tracking-wide uppercase text-mist">Ability Score Bonuses</p>
                <span
                  class="text-2xs font-heading tabular-nums"
                  :class="raceAbilityTotal > 4 ? 'text-gold-mid' : 'text-arcane-pale'"
                >+{{ raceAbilityTotal }} total</span>
              </div>
              <p class="text-2xs font-body text-mist/60">
                These add straight to your character sheet. A typical race grants about +3 (e.g. +2 / +1).
              </p>
              <div class="grid grid-cols-3 sm:grid-cols-6 gap-2">
                <div
                  v-for="ab in ABILITIES"
                  :key="ab.key"
                  class="flex flex-col items-center gap-1.5 px-2 py-2.5 rounded border"
                  :class="(builder.draft.raceAbilityBonuses[ab.key] ?? 0) > 0
                    ? 'border-arcane-base/40 bg-arcane-deep/10'
                    : 'border-shadow bg-depths/30'"
                >
                  <span class="text-2xs font-heading tracking-[0.12em] uppercase text-mist">{{ ab.label }}</span>
                  <span
                    class="font-heading text-lg leading-none"
                    :class="(builder.draft.raceAbilityBonuses[ab.key] ?? 0) > 0 ? 'text-arcane-pale' : 'text-mist/40'"
                  >+{{ builder.draft.raceAbilityBonuses[ab.key] ?? 0 }}</span>
                  <div class="flex items-center gap-1">
                    <button
                      type="button"
                      class="w-6 h-6 flex items-center justify-center rounded border text-sm font-heading transition-all"
                      :class="(builder.draft.raceAbilityBonuses[ab.key] ?? 0) > 0
                        ? 'border-shadow text-mist hover:border-blood-base/50 hover:text-blood-mid'
                        : 'border-shadow/20 text-mist/20 cursor-not-allowed'"
                      :disabled="(builder.draft.raceAbilityBonuses[ab.key] ?? 0) === 0"
                      @click="changeRaceAbility(ab.key, -1)"
                    >−</button>
                    <button
                      type="button"
                      class="w-6 h-6 flex items-center justify-center rounded border text-sm font-heading transition-all"
                      :class="canIncreaseRaceAbility(ab.key)
                        ? 'border-shadow text-mist hover:border-arcane-base/50 hover:text-arcane-pale'
                        : 'border-shadow/20 text-mist/20 cursor-not-allowed'"
                      :disabled="!canIncreaseRaceAbility(ab.key)"
                      @click="changeRaceAbility(ab.key, 1)"
                    >+</button>
                  </div>
                </div>
              </div>
            </div>

            <!-- Size / Speed / Darkvision -->
            <div class="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div class="space-y-1.5">
                <label class="text-2xs font-heading tracking-wide uppercase text-mist">Size</label>
                <div class="flex gap-1.5">
                  <button
                    v-for="size in SIZES"
                    :key="size"
                    type="button"
                    class="flex-1 px-2 py-2 rounded border text-xs font-heading tracking-wide transition-all"
                    :class="builder.draft.raceSizeCategory === size
                      ? 'border-gold-mid/60 bg-gold-dim/15 text-gold-deep'
                      : 'border-shadow text-ash hover:border-gold-dim/40'"
                    @click="builder.draft.raceSizeCategory = size"
                  >{{ size }}</button>
                </div>
              </div>
              <div class="space-y-1.5">
                <label class="text-2xs font-heading tracking-wide uppercase text-mist">Speed (ft.)</label>
                <input
                  v-model.number="builder.draft.raceSpeed"
                  type="number"
                  min="0"
                  max="60"
                  step="5"
                  class="input-base w-full text-sm"
                />
              </div>
              <div class="space-y-1.5">
                <label class="text-2xs font-heading tracking-wide uppercase text-mist">Darkvision</label>
                <div class="flex gap-1.5">
                  <button
                    v-for="opt in DARKVISION_OPTIONS"
                    :key="opt.value"
                    type="button"
                    class="flex-1 px-2 py-2 rounded border text-xs font-heading tracking-wide transition-all"
                    :class="builder.draft.raceDarkvision === opt.value
                      ? 'border-arcane-base/60 bg-arcane-deep/10 text-arcane-pale'
                      : 'border-shadow text-ash hover:border-arcane-base/30'"
                    @click="builder.draft.raceDarkvision = opt.value"
                  >{{ opt.label }}</button>
                </div>
              </div>
            </div>

            <!-- Damage resistances -->
            <div class="space-y-2">
              <p class="text-2xs font-heading tracking-wide uppercase text-mist">
                Damage Resistances <span class="normal-case font-body text-mist/50">(optional)</span>
              </p>
              <div v-if="damageTypes.length" class="flex flex-wrap gap-1.5">
                <button
                  v-for="dt in damageTypes"
                  :key="dt.index"
                  type="button"
                  class="px-2.5 py-1 rounded border text-xs font-heading tracking-wide transition-all"
                  :class="isResistanceSelected(dt.index)
                    ? 'border-arcane-base/50 bg-arcane-deep/15 text-arcane-pale'
                    : 'border-shadow text-ash hover:border-arcane-base/25 hover:text-stone'"
                  @click="toggleResistance(dt.index)"
                >{{ dt.name }}</button>
              </div>
              <p v-else class="text-xs font-body text-mist/50 italic">Loading damage types…</p>
            </div>

            <!-- Skill proficiencies -->
            <div class="space-y-2">
              <p class="text-2xs font-heading tracking-wide uppercase text-mist">
                Skill Proficiencies <span class="normal-case font-body text-mist/50">(optional)</span>
              </p>
              <div class="grid grid-cols-2 sm:grid-cols-3 gap-1.5">
                <button
                  v-for="skill in SKILLS"
                  :key="skill.index"
                  type="button"
                  class="text-left px-3 py-2 rounded border text-xs font-heading tracking-wide transition-all duration-100"
                  :class="isRaceSkillSelected(skill.index)
                    ? 'border-arcane-base/50 bg-arcane-deep/15 text-arcane-pale'
                    : 'border-shadow text-ash hover:border-arcane-base/25 hover:text-stone'"
                  @click="toggleRaceSkill(skill.index)"
                >
                  {{ skill.name }}
                  <span class="text-mist/40 font-body normal-case">{{ skill.ability.toUpperCase() }}</span>
                </button>
              </div>
            </div>

            <!-- Tool / weapon proficiencies -->
            <div class="space-y-2">
              <p class="text-2xs font-heading tracking-wide uppercase text-mist">
                Tool / Weapon Proficiencies <span class="normal-case font-body text-mist/50">(optional)</span>
              </p>
              <div class="flex gap-2">
                <input
                  v-model="toolProfInput"
                  type="text"
                  maxlength="60"
                  placeholder="e.g. Smith's tools, Longsword"
                  class="input-base flex-1 text-sm"
                  @keydown.enter.prevent="addToolProf"
                />
                <button
                  type="button"
                  class="px-3 py-2 rounded border border-shadow text-xs font-heading text-ash hover:border-arcane-base/40 hover:text-arcane-pale transition-all"
                  @click="addToolProf"
                >Add</button>
              </div>
              <div v-if="builder.draft.raceCustomToolProfs.length" class="flex flex-wrap gap-1.5">
                <span
                  v-for="(prof, i) in builder.draft.raceCustomToolProfs"
                  :key="`${prof}-${i}`"
                  class="inline-flex items-center gap-1.5 px-2 py-0.5 rounded border border-shadow text-xs font-heading text-ash"
                >
                  {{ prof }}
                  <button type="button" class="text-mist/50 hover:text-blood-mid" aria-label="Remove proficiency" @click="removeToolProf(i)">×</button>
                </span>
              </div>
            </div>

            <!-- Bonus languages -->
            <div class="space-y-1.5">
              <label class="text-2xs font-heading tracking-wide uppercase text-mist">Bonus Languages</label>
              <div class="flex items-center gap-3">
                <input
                  v-model.number="builder.draft.raceLanguageChoices"
                  type="number"
                  min="0"
                  max="5"
                  class="input-base w-20 text-sm"
                />
                <p class="text-xs font-body text-mist/60">
                  Beyond Common. You'll pick the specific languages in Step VII, Proficiencies.
                </p>
              </div>
            </div>

            <!-- Traits -->
            <div class="space-y-2">
              <div class="flex items-center justify-between">
                <p class="text-2xs font-heading tracking-wide uppercase text-mist">
                  Racial Traits <span class="normal-case font-body text-mist/50">(optional)</span>
                </p>
                <button
                  type="button"
                  class="text-2xs font-heading text-arcane-pale/80 hover:text-arcane-pale transition-all"
                  @click="addTrait"
                >+ Add trait</button>
              </div>
              <div v-if="builder.draft.raceCustomTraits.length" class="space-y-2">
                <div
                  v-for="(trait, i) in builder.draft.raceCustomTraits"
                  :key="i"
                  class="px-3 py-2.5 rounded border border-shadow/50 bg-depths/20 space-y-2"
                >
                  <div class="flex gap-2">
                    <input
                      v-model="trait.name"
                      type="text"
                      maxlength="60"
                      placeholder="Trait name (e.g. Celestial Resistance)"
                      class="input-base flex-1 text-sm"
                    />
                    <button type="button" class="px-2 text-mist/50 hover:text-blood-mid" aria-label="Remove trait" @click="removeTrait(i)">×</button>
                  </div>
                  <textarea
                    v-model="trait.desc"
                    rows="2"
                    maxlength="600"
                    placeholder="Describe the trait…"
                    class="input-base w-full text-sm resize-none"
                  />
                </div>
              </div>
              <p v-else class="text-xs font-body text-mist/50 italic">
                No traits yet. Add special abilities, senses, or flavor perks for your race.
              </p>
            </div>
          </div>

          <!-- Footer: save to collection (auth) + done -->
          <div class="px-5 py-3 border-t border-shadow flex items-center justify-between gap-3 shrink-0">
            <div class="min-w-0">
              <button
                v-if="auth.isAuthenticated"
                type="button"
                class="px-3.5 py-2 rounded border text-xs font-heading tracking-wide transition-all"
                :class="builder.draft.raceName.trim() && !savingRace
                  ? 'border-arcane-base/50 bg-arcane-deep/15 text-arcane-pale hover:bg-arcane-deep/25'
                  : 'border-shadow/40 text-mist/40 cursor-not-allowed'"
                :disabled="!builder.draft.raceName.trim() || savingRace"
                @click="saveCurrentRace"
              >{{ savingRace ? 'Saving…' : (savedRace ? 'Update in collection' : 'Save to my collection') }}</button>
              <p v-else class="text-2xs font-body text-mist/50 italic truncate">
                Sign in to save this race and reuse it later.
              </p>
            </div>
            <button type="button" class="btn-primary text-sm shrink-0" @click="$emit('close')">Done</button>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup lang="ts">
import { computed, ref, onMounted } from 'vue'
import { XIcon } from 'lucide-vue-next'
import { useQuery } from '@tanstack/vue-query'
import { useBuilderStore } from '@/character-builder/builderStore'
import { fiveEApi } from '@/shared/api/fiveE.client'
import { useBuilderValidation } from '@/shared/composables/useBuilderValidation'
import { useAuthStore } from '@/auth/store'
import { useCustomContentStore } from '@/custom-content/store'
import { useToast } from '@/shared/composables/useToast'
import { SKILLS } from '@/shared/lib/skillAbilityMap'
import type { ApiReference } from '@/shared/types/api'
import type { AbilityScores } from '@/shared/types/character'
import type { CustomRace, CustomRaceInput } from '@/shared/types/customContent'
import AppSelect from '@/shared/ui/AppSelect.vue'

const props = defineProps<{ show: boolean }>()
defineEmits<{ close: [] }>()

const builder = useBuilderStore()
const auth = useAuthStore()
const customContent = useCustomContentStore()
const { showValidation } = useBuilderValidation()

const ABILITIES: { key: keyof AbilityScores; label: string }[] = [
  { key: 'str', label: 'STR' }, { key: 'dex', label: 'DEX' }, { key: 'con', label: 'CON' },
  { key: 'int', label: 'INT' }, { key: 'wis', label: 'WIS' }, { key: 'cha', label: 'CHA' },
]
const SIZES = ['Small', 'Medium', 'Large']
const DARKVISION_OPTIONS = [
  { value: 0, label: 'None' }, { value: 60, label: '60 ft.' }, { value: 120, label: '120 ft.' },
]

// Damage types for the resistance picker (same source as the sheet's Traits editor)
const { data: damageTypesData } = useQuery({
  queryKey: ['damage-types'],
  queryFn: () => fiveEApi.listDamageTypes(),
  staleTime: Infinity,
  enabled: computed(() => props.show),
})
const damageTypes = computed(() =>
  (damageTypesData.value?.results ?? []).map((d: ApiReference) => ({ index: d.index, name: d.name })),
)

// Ability bonus allocator. Homebrew-friendly: 0..+3 per ability, no hard total cap (a hint
// appears past the usual ~+3 racial budget). effectiveScores sums these and caps final at 20.
const raceAbilityTotal = computed(() =>
  Object.values(builder.draft.raceAbilityBonuses).reduce((s, v) => s + (v ?? 0), 0),
)
function canIncreaseRaceAbility(key: keyof AbilityScores): boolean {
  return (builder.draft.raceAbilityBonuses[key] ?? 0) < 3
}
function changeRaceAbility(key: keyof AbilityScores, delta: number) {
  const current = builder.draft.raceAbilityBonuses[key] ?? 0
  const val = current + delta
  if (val < 0 || val > 3) return
  const next = { ...builder.draft.raceAbilityBonuses }
  if (val === 0) delete next[key]
  else next[key] = val
  builder.draft.raceAbilityBonuses = next
}

function isRaceSkillSelected(index: string): boolean {
  return builder.draft.raceSkillProficiencies.includes(index)
}
function toggleRaceSkill(index: string) {
  const cur = builder.draft.raceSkillProficiencies
  builder.draft.raceSkillProficiencies = cur.includes(index)
    ? cur.filter(s => s !== index)
    : [...cur, index]
}

function isResistanceSelected(index: string): boolean {
  return builder.draft.raceResistances.includes(index)
}
function toggleResistance(index: string) {
  const cur = builder.draft.raceResistances
  builder.draft.raceResistances = cur.includes(index)
    ? cur.filter(r => r !== index)
    : [...cur, index]
}

function addTrait() {
  builder.draft.raceCustomTraits = [...builder.draft.raceCustomTraits, { name: '', desc: '' }]
}
function removeTrait(i: number) {
  builder.draft.raceCustomTraits = builder.draft.raceCustomTraits.filter((_, idx) => idx !== i)
}

const toolProfInput = ref('')
function addToolProf() {
  const v = toolProfInput.value.trim()
  if (v && !builder.draft.raceCustomToolProfs.includes(v)) {
    builder.draft.raceCustomToolProfs = [...builder.draft.raceCustomToolProfs, v]
  }
  toolProfInput.value = ''
}
function removeToolProf(i: number) {
  builder.draft.raceCustomToolProfs = builder.draft.raceCustomToolProfs.filter((_, idx) => idx !== i)
}

// ── Save / load custom races to the user's cloud collection ─────────────────────

const savingRace = ref(false)
const selectedSavedRaceId = ref('')

onMounted(() => {
  if (auth.isAuthenticated && !customContent.loaded) customContent.loadMine()
})

function draftToCustomRaceInput(): CustomRaceInput {
  const d = builder.draft
  return {
    name: d.raceName.trim(),
    edition: '2014',
    abilityBonuses: { ...d.raceAbilityBonuses },
    size: d.raceSizeCategory,
    speed: d.raceSpeed,
    darkvision: d.raceDarkvision,
    resistances: [...d.raceResistances],
    skillProficiencies: [...d.raceSkillProficiencies],
    toolProficiencies: [...d.raceCustomToolProfs],
    languageChoices: d.raceLanguageChoices,
    traits: d.raceCustomTraits.map(t => ({ name: t.name, desc: t.desc })),
    isPublic: false,
  }
}

// The collection entry this custom race maps to: the tracked id, else a same-name race.
// Drives create-vs-update so re-saving never duplicates.
const savedRace = computed<CustomRace | null>(() => {
  const id = builder.draft.savedCustomRaceId
  if (id) {
    const byId = customContent.races.find(r => r.id === id)
    if (byId) return byId
  }
  const name = builder.draft.raceName.trim().toLowerCase()
  if (!name) return null
  return customContent.races.find(r => r.name.trim().toLowerCase() === name) ?? null
})

async function saveCurrentRace() {
  const name = builder.draft.raceName.trim()
  if (savingRace.value || !name) return
  savingRace.value = true
  try {
    const input = draftToCustomRaceInput()
    const existing = savedRace.value
    if (existing) {
      await customContent.updateRace(existing.id, input)
      builder.draft.savedCustomRaceId = existing.id
      useToast().success('Custom race updated in your collection.')
    } else {
      const created = await customContent.createRace(input)
      if (created) builder.draft.savedCustomRaceId = created.id
    }
  } finally {
    savingRace.value = false
  }
}

function applyCustomRace(race: CustomRace) {
  builder.initCustomRace()
  const d = builder.draft
  d.savedCustomRaceId = race.id
  d.raceName = race.name
  d.raceAbilityBonuses = { ...race.abilityBonuses }
  d.raceSizeCategory = race.size
  d.raceSpeed = race.speed
  d.raceDarkvision = race.darkvision
  d.raceResistances = [...race.resistances]
  d.raceSkillProficiencies = [...race.skillProficiencies]
  d.raceCustomToolProfs = [...race.toolProficiencies]
  d.raceLanguageChoices = race.languageChoices
  d.raceCustomTraits = race.traits.map(t => ({ name: t.name, desc: t.desc }))
}

function onSelectSavedRace() {
  const race = customContent.races.find(r => r.id === selectedSavedRaceId.value)
  if (race) applyCustomRace(race)
  selectedSavedRaceId.value = ''
}
</script>

<style scoped>
.dialog-fade-enter-active, .dialog-fade-leave-active { transition: opacity 0.15s ease; }
.dialog-fade-enter-from, .dialog-fade-leave-to { opacity: 0; }
</style>
