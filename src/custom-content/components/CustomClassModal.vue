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
          aria-labelledby="custom-class-title"
          class="relative w-full max-w-2xl bg-void border border-shadow rounded-lg shadow-2xl overflow-hidden flex flex-col"
          style="max-height: 90vh"
        >
          <div class="h-0.5 w-full bg-arcane-base" />

          <!-- Header -->
          <div class="px-5 py-4 border-b border-shadow flex items-center justify-between shrink-0">
            <div>
              <p id="custom-class-title" class="font-heading text-base text-arcane-pale">{{ editId ? 'Edit Custom Class' : 'Custom Class' }}</p>
              <p class="text-2xs font-body text-mist mt-0.5">Homebrew a class — detailed for levels 1–3</p>
            </div>
            <button type="button" class="text-mist hover:text-ash transition-colors" aria-label="Close" @click="$emit('close')">
              <XIcon :size="16" />
            </button>
          </div>

          <!-- Body -->
          <div class="flex-1 overflow-y-auto px-5 py-5 space-y-6">

            <!-- Name + description -->
            <div class="space-y-1.5">
              <label class="text-2xs font-heading tracking-wide uppercase text-mist">Class Name</label>
              <input v-model.trim="form.name" type="text" maxlength="60" placeholder="e.g. Runesmith" class="input-base w-full text-sm" />
            </div>
            <div class="space-y-1.5">
              <label class="text-2xs font-heading tracking-wide uppercase text-mist">Description <span class="normal-case font-body text-mist/50">(optional)</span></label>
              <textarea v-model="form.description" rows="2" maxlength="1000" placeholder="A short flavor description…" class="input-base w-full text-sm resize-none" />
            </div>

            <!-- Hit die + skill choices -->
            <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div class="space-y-1.5">
                <label class="text-2xs font-heading tracking-wide uppercase text-mist">Hit Die</label>
                <div class="flex gap-1.5">
                  <button
                    v-for="d in HIT_DICE"
                    :key="d"
                    type="button"
                    class="flex-1 px-2 py-2 rounded border text-xs font-heading tracking-wide transition-all"
                    :class="form.hitDie === d ? 'border-gold-mid/60 bg-gold-dim/15 text-gold-deep' : 'border-shadow text-ash hover:border-gold-dim/40'"
                    @click="form.hitDie = d"
                  >d{{ d }}</button>
                </div>
              </div>
              <div class="space-y-1.5">
                <label class="text-2xs font-heading tracking-wide uppercase text-mist">Skill Choices</label>
                <input v-model.number="form.skillChoices" type="number" min="0" max="6" class="input-base w-full text-sm" />
              </div>
            </div>

            <!-- Primary ability -->
            <div class="space-y-2">
              <p class="text-2xs font-heading tracking-wide uppercase text-mist">Primary Ability <span class="normal-case font-body text-mist/50">(1–2)</span></p>
              <div class="flex flex-wrap gap-1.5">
                <button
                  v-for="ab in ABILITY_KEYS"
                  :key="`p-${ab}`"
                  type="button"
                  class="px-2.5 py-1 rounded border text-xs font-heading tracking-wide transition-all"
                  :class="primaryAbs.includes(ab) ? 'border-arcane-base/50 bg-arcane-deep/15 text-arcane-pale' : 'border-shadow text-ash hover:border-arcane-base/25'"
                  @click="togglePrimary(ab)"
                >{{ ab.toUpperCase() }}</button>
              </div>
            </div>

            <!-- Saving throws -->
            <div class="space-y-2">
              <p class="text-2xs font-heading tracking-wide uppercase text-mist">Saving Throws <span class="normal-case font-body text-mist/50">(pick 2)</span></p>
              <div class="flex flex-wrap gap-1.5">
                <button
                  v-for="ab in ABILITY_KEYS"
                  :key="`s-${ab}`"
                  type="button"
                  class="px-2.5 py-1 rounded border text-xs font-heading tracking-wide transition-all"
                  :class="form.saves.includes(ab) ? 'border-gold-mid/50 bg-gold-dim/15 text-gold-deep' : 'border-shadow text-ash hover:border-gold-dim/30'"
                  @click="toggleSave(ab)"
                >{{ ab.toUpperCase() }}</button>
              </div>
            </div>

            <!-- Skill proficiency options -->
            <div class="space-y-2">
              <p class="text-2xs font-heading tracking-wide uppercase text-mist">Skill Options <span class="normal-case font-body text-mist/50">(the list players choose {{ form.skillChoices }} from)</span></p>
              <div class="grid grid-cols-2 sm:grid-cols-3 gap-1.5">
                <button
                  v-for="skill in SKILLS"
                  :key="skill.index"
                  type="button"
                  class="text-left px-3 py-2 rounded border text-xs font-heading tracking-wide transition-all duration-100"
                  :class="form.skillOptions.includes(skill.index) ? 'border-arcane-base/50 bg-arcane-deep/15 text-arcane-pale' : 'border-shadow text-ash hover:border-arcane-base/25'"
                  @click="toggleSkill(skill.index)"
                >{{ skill.name }}</button>
              </div>
            </div>

            <!-- Proficiencies (armor / weapon / tool) -->
            <div class="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <ProfList
                label="Armor" :list="form.armorProficiencies" placeholder="e.g. Light armor"
                @add="(v) => addUniq(form.armorProficiencies, v)" @remove="(i) => form.armorProficiencies.splice(i, 1)"
              />
              <ProfList
                label="Weapons" :list="form.weaponProficiencies" placeholder="e.g. Simple weapons"
                @add="(v) => addUniq(form.weaponProficiencies, v)" @remove="(i) => form.weaponProficiencies.splice(i, 1)"
              />
              <ProfList
                label="Tools" :list="form.toolProficiencies" placeholder="e.g. Smith's tools"
                @add="(v) => addUniq(form.toolProficiencies, v)" @remove="(i) => form.toolProficiencies.splice(i, 1)"
              />
            </div>

            <!-- Spellcasting -->
            <div class="space-y-3 pt-1 border-t border-shadow/40">
              <label class="flex items-center gap-2.5 cursor-pointer">
                <input type="checkbox" v-model="spellcastingEnabled" class="accent-arcane-base w-4 h-4" @change="onToggleSpellcasting" />
                <span class="text-2xs font-heading tracking-wide uppercase text-arcane-pale">Spellcaster</span>
              </label>

              <div v-if="spellcastingEnabled && form.spellcasting" class="space-y-4 pl-1">
                <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div class="space-y-1.5">
                    <label class="text-2xs font-heading tracking-wide uppercase text-mist">Spellcasting Ability</label>
                    <AppSelect v-model="form.spellcasting.ability" class="text-sm">
                      <option v-for="ab in ABILITY_KEYS" :key="`sc-${ab}`" :value="ab">{{ ABILITY_FULL[ab] }}</option>
                    </AppSelect>
                  </div>
                  <div class="space-y-1.5">
                    <label class="text-2xs font-heading tracking-wide uppercase text-mist">Preparation</label>
                    <AppSelect v-model="form.spellcasting.castingType" class="text-sm">
                      <option value="known">Known (fixed list)</option>
                      <option value="prepared">Prepared (daily)</option>
                      <option value="spellbook">Spellbook (Wizard-style)</option>
                    </AppSelect>
                  </div>
                  <div class="space-y-1.5">
                    <label class="text-2xs font-heading tracking-wide uppercase text-mist">Slot Progression</label>
                    <AppSelect v-model="form.spellcasting.casterProgression" class="text-sm">
                      <option value="full">Full (Wizard)</option>
                      <option value="half">Half (Paladin)</option>
                      <option value="third">Third (Eldritch Knight)</option>
                      <option value="pact">Pact (Warlock)</option>
                    </AppSelect>
                  </div>
                  <div class="space-y-1.5">
                    <label class="text-2xs font-heading tracking-wide uppercase text-mist">Spell List From</label>
                    <AppSelect v-model="spellListModel" class="text-sm">
                      <option value="">— pick a source —</option>
                      <option v-for="c in CASTER_CLASSES" :key="c" :value="c">{{ capitalize(c) }}</option>
                    </AppSelect>
                  </div>
                </div>

                <div class="space-y-2">
                  <p class="text-2xs font-heading tracking-wide uppercase text-mist">Cantrips Known — levels 1 / 2 / 3</p>
                  <div class="flex gap-2">
                    <input v-for="i in 3" :key="`cn-${i}`" v-model.number="form.spellcasting.cantripsKnown[i - 1]" type="number" min="0" max="10" class="input-base w-full text-sm text-center" />
                  </div>
                </div>

                <div v-if="form.spellcasting.castingType === 'known'" class="space-y-2">
                  <p class="text-2xs font-heading tracking-wide uppercase text-mist">Spells Known — levels 1 / 2 / 3</p>
                  <div class="flex gap-2">
                    <input v-for="i in 3" :key="`sn-${i}`" v-model.number="spellsKnownProxy[i - 1]" type="number" min="0" max="20" class="input-base w-full text-sm text-center" />
                  </div>
                </div>
                <p v-else class="text-2xs font-body text-mist/60">
                  Prepared casters prepare (ability modifier + class level) spells each day — no fixed "known" count.
                </p>
              </div>
            </div>

            <!-- Features by level -->
            <div class="space-y-4 pt-1 border-t border-shadow/40">
              <p class="text-2xs font-heading tracking-wide uppercase text-mist">Features by Level</p>
              <div v-for="lvl in ['1', '2', '3']" :key="`lvl-${lvl}`" class="space-y-2">
                <div class="flex items-center justify-between">
                  <p class="text-xs font-heading text-ash">Level {{ lvl }}</p>
                  <button type="button" class="text-2xs font-heading text-arcane-pale/80 hover:text-arcane-pale transition-all" @click="addFeature(lvl)">+ Add feature</button>
                </div>
                <div v-if="form.featuresByLevel[lvl]?.length" class="space-y-2">
                  <div
                    v-for="(feat, i) in form.featuresByLevel[lvl]"
                    :key="`${lvl}-${i}`"
                    class="px-3 py-2.5 rounded border border-shadow/50 bg-depths/20 space-y-2"
                  >
                    <div class="flex gap-2">
                      <input v-model="feat.name" type="text" maxlength="60" placeholder="Feature name" class="input-base flex-1 text-sm" />
                      <button type="button" class="px-2 text-mist/50 hover:text-blood-mid" aria-label="Remove feature" @click="removeFeature(lvl, i)">×</button>
                    </div>
                    <textarea v-model="feat.desc" rows="2" maxlength="600" placeholder="Describe the feature…" class="input-base w-full text-sm resize-none" />
                  </div>
                </div>
                <p v-else class="text-2xs font-body text-mist/40 italic">No level {{ lvl }} features.</p>
              </div>
            </div>
          </div>

          <!-- Footer -->
          <div class="px-5 py-3 border-t border-shadow flex items-center justify-between gap-3 shrink-0">
            <p v-if="!form.name.trim()" class="text-2xs font-body text-blood-bright">Name your class to save.</p>
            <span v-else />
            <div class="flex items-center gap-2 shrink-0">
              <button type="button" class="btn-secondary text-sm" @click="$emit('close')">Cancel</button>
              <button type="button" class="btn-primary text-sm" :disabled="!form.name.trim() || saving" @click="save">
                {{ saving ? 'Saving…' : (editId ? 'Update class' : 'Save to my collection') }}
              </button>
            </div>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup lang="ts">
import { reactive, ref, watch, computed, defineComponent, h } from 'vue'
import { XIcon } from 'lucide-vue-next'
import { useCustomContentStore } from '@/custom-content/store'
import { SKILLS } from '@/shared/lib/skillAbilityMap'
import type { CustomClass, CustomClassInput, CustomClassSpellcasting } from '@/shared/types/customContent'
import type { AbilityName } from '@/shared/types/character'
import AppSelect from '@/shared/ui/AppSelect.vue'

const props = defineProps<{ show: boolean; editId?: string | null }>()
const emit = defineEmits<{ close: []; saved: [id: string] }>()

const customContent = useCustomContentStore()
const saving = ref(false)

const ABILITY_KEYS: AbilityName[] = ['str', 'dex', 'con', 'int', 'wis', 'cha']
const ABILITY_FULL: Record<string, string> = {
  str: 'Strength', dex: 'Dexterity', con: 'Constitution', int: 'Intelligence', wis: 'Wisdom', cha: 'Charisma',
}
const HIT_DICE = [6, 8, 10, 12]
const CASTER_CLASSES = ['bard', 'cleric', 'druid', 'paladin', 'ranger', 'sorcerer', 'warlock', 'wizard']

function emptyClass(): CustomClassInput {
  return {
    name: '', edition: '2014', description: '', hitDie: 8, primaryAbility: '',
    saves: [], armorProficiencies: [], weaponProficiencies: [], toolProficiencies: [],
    skillChoices: 2, skillOptions: [], spellcasting: null,
    featuresByLevel: { '1': [], '2': [], '3': [] }, isPublic: false,
  }
}
function defaultSpellcasting(): CustomClassSpellcasting {
  return { castingType: 'known', ability: 'int', casterProgression: 'full', cantripsKnown: [0, 0, 0], spellsKnown: [0, 0, 0], spellList: '' }
}

const form = reactive<CustomClassInput>(emptyClass())
const primaryAbs = ref<AbilityName[]>([])
const spellcastingEnabled = ref(false)

// Keep spellsKnown length-3 and defined for the known-caster inputs.
const spellsKnownProxy = computed<number[]>({
  get: () => form.spellcasting?.spellsKnown ?? [0, 0, 0],
  set: (v) => { if (form.spellcasting) form.spellcasting.spellsKnown = v },
})
// spellList is optional (undefined) in the schema; bind through a '' ⟷ undefined proxy.
const spellListModel = computed<string>({
  get: () => form.spellcasting?.spellList ?? '',
  set: (v) => { if (form.spellcasting) form.spellcasting.spellList = v || undefined },
})

function togglePrimary(ab: AbilityName) {
  const i = primaryAbs.value.indexOf(ab)
  if (i >= 0) primaryAbs.value.splice(i, 1)
  else if (primaryAbs.value.length < 2) primaryAbs.value.push(ab)
}
function toggleSave(ab: AbilityName) {
  const i = form.saves.indexOf(ab)
  if (i >= 0) form.saves.splice(i, 1)
  else if (form.saves.length < 2) form.saves.push(ab)
}
function toggleSkill(index: string) {
  const i = form.skillOptions.indexOf(index)
  if (i >= 0) form.skillOptions.splice(i, 1)
  else form.skillOptions.push(index)
}

function onToggleSpellcasting() {
  form.spellcasting = spellcastingEnabled.value ? defaultSpellcasting() : null
}

function addFeature(lvl: string) {
  ;(form.featuresByLevel[lvl] ??= []).push({ name: '', desc: '' })
}
function removeFeature(lvl: string, i: number) {
  form.featuresByLevel[lvl]?.splice(i, 1)
}

function parsePrimary(s: string): AbilityName[] {
  const low = s.toLowerCase()
  return ABILITY_KEYS.filter(k => low.includes(ABILITY_FULL[k].toLowerCase()) || low.includes(k))
}

function loadFrom(c: CustomClass) {
  Object.assign(form, {
    name: c.name,
    edition: c.edition,
    description: c.description ?? '',
    hitDie: c.hitDie,
    primaryAbility: c.primaryAbility,
    saves: [...c.saves],
    armorProficiencies: [...c.armorProficiencies],
    weaponProficiencies: [...c.weaponProficiencies],
    toolProficiencies: [...c.toolProficiencies],
    skillChoices: c.skillChoices,
    skillOptions: [...c.skillOptions],
    spellcasting: c.spellcasting
      ? {
          ...c.spellcasting,
          cantripsKnown: normalize3(c.spellcasting.cantripsKnown),
          spellsKnown: normalize3(c.spellcasting.spellsKnown ?? []),
        }
      : null,
    featuresByLevel: normalizeFeatures(c.featuresByLevel),
    isPublic: c.isPublic,
  })
  primaryAbs.value = parsePrimary(c.primaryAbility)
  spellcastingEnabled.value = !!c.spellcasting
}
function normalize3(arr: number[]): number[] {
  return [arr[0] ?? 0, arr[1] ?? 0, arr[2] ?? 0]
}
function normalizeFeatures(f: Record<string, { name: string; desc: string }[]>): Record<string, { name: string; desc: string }[]> {
  const out: Record<string, { name: string; desc: string }[]> = { '1': [], '2': [], '3': [] }
  for (const [k, v] of Object.entries(f)) out[k] = v.map(t => ({ name: t.name, desc: t.desc }))
  return out
}
function resetForm() {
  Object.assign(form, emptyClass())
  primaryAbs.value = []
  spellcastingEnabled.value = false
}

watch(() => props.show, (open) => {
  if (!open) return
  const existing = props.editId ? customContent.getClass(props.editId) : null
  if (existing) loadFrom(existing)
  else resetForm()
})

function capitalize(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1)
}

async function save() {
  if (saving.value || !form.name.trim()) return
  saving.value = true
  try {
    const payload: CustomClassInput = {
      name: form.name.trim(),
      edition: form.edition,
      description: form.description?.trim() || undefined,
      hitDie: form.hitDie,
      primaryAbility: primaryAbs.value.map(k => ABILITY_FULL[k]).join(' · '),
      saves: [...form.saves],
      armorProficiencies: [...form.armorProficiencies],
      weaponProficiencies: [...form.weaponProficiencies],
      toolProficiencies: [...form.toolProficiencies],
      skillChoices: form.skillChoices,
      skillOptions: [...form.skillOptions],
      spellcasting: spellcastingEnabled.value && form.spellcasting
        ? {
            castingType: form.spellcasting.castingType,
            ability: form.spellcasting.ability,
            casterProgression: form.spellcasting.casterProgression,
            cantripsKnown: normalize3(form.spellcasting.cantripsKnown),
            spellsKnown: form.spellcasting.castingType === 'known' ? normalize3(form.spellcasting.spellsKnown ?? []) : undefined,
            spellList: form.spellcasting.spellList || undefined,
          }
        : null,
      featuresByLevel: form.featuresByLevel,
      isPublic: props.editId ? (customContent.getClass(props.editId)?.isPublic ?? false) : false,
    }
    if (props.editId) {
      await customContent.updateClass(props.editId, payload)
      emit('saved', props.editId)
    } else {
      const created = await customContent.createClass(payload)
      if (created) emit('saved', created.id)
    }
    emit('close')
  } finally {
    saving.value = false
  }
}

function addUniq(list: string[], v: string) {
  const t = (v ?? '').trim()
  if (t && !list.includes(t)) list.push(t)
}

// Inline "add a free-text proficiency" list editor (armor / weapons / tools). Presentational:
// it renders the list and emits add/remove so the parent mutates its own reactive `form`.
const ProfList = defineComponent({
  props: { label: { type: String, required: true }, list: { type: Array as () => string[], required: true }, placeholder: { type: String, default: '' } },
  emits: ['add', 'remove'],
  setup(p, { emit }) {
    const draft = ref('')
    function add() {
      const v = draft.value.trim()
      if (v) emit('add', v)
      draft.value = ''
    }
    return () => h('div', { class: 'space-y-1.5' }, [
      h('label', { class: 'text-2xs font-heading tracking-wide uppercase text-mist' }, p.label),
      h('div', { class: 'flex gap-1.5' }, [
        h('input', {
          value: draft.value,
          onInput: (e: Event) => { draft.value = (e.target as HTMLInputElement).value },
          onKeydown: (e: KeyboardEvent) => { if (e.key === 'Enter') { e.preventDefault(); add() } },
          type: 'text', maxlength: 40, placeholder: p.placeholder,
          class: 'input-base flex-1 text-sm min-w-0',
        }),
        h('button', { type: 'button', class: 'px-2.5 rounded border border-shadow text-xs font-heading text-ash hover:border-arcane-base/40 hover:text-arcane-pale transition-all', onClick: add }, 'Add'),
      ]),
      p.list.length
        ? h('div', { class: 'flex flex-wrap gap-1' }, p.list.map((prof, i) =>
            h('span', { key: `${prof}-${i}`, class: 'inline-flex items-center gap-1 px-1.5 py-0.5 rounded border border-shadow text-2xs font-heading text-ash' }, [
              prof,
              h('button', { type: 'button', class: 'text-mist/50 hover:text-blood-mid', 'aria-label': 'Remove', onClick: () => emit('remove', i) }, '×'),
            ]),
          ))
        : null,
    ])
  },
})
</script>

<style scoped>
.dialog-fade-enter-active, .dialog-fade-leave-active { transition: opacity 0.15s ease; }
.dialog-fade-enter-from, .dialog-fade-leave-to { opacity: 0; }
</style>
