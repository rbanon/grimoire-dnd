<template>
  <div class="space-y-3">

    <!-- ── Concentration ───────────────────────────────────────────────────── -->
    <div class="flex items-center gap-3 flex-wrap">
      <p class="text-2xs font-heading tracking-[0.15em] uppercase text-mist shrink-0">Concentration</p>

      <span
        v-if="character.combat.concentrationSpell"
        class="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded bg-arcane-base/20 border border-arcane-base/40 text-arcane-pale text-2xs font-heading tracking-wide"
      >
        ◆ {{ character.combat.concentrationSpell }}
        <button
          type="button"
          class="opacity-60 hover:opacity-100 transition-opacity leading-none"
          @click="clearConcentration"
        >×</button>
      </span>

      <template v-else>
        <input
          v-if="showConcentrationInput"
          ref="concentrationInputEl"
          v-model="concentrationDraft"
          type="text"
          placeholder="Spell name…"
          class="input-base text-xs py-0.5 px-2 w-40"
          @blur="commitConcentration"
          @keydown.enter="commitConcentration"
          @keydown.esc="cancelConcentration"
        />
        <button
          v-else
          type="button"
          class="text-2xs text-mist hover:text-ash transition-colors font-body"
          @click="startConcentration"
        >+ Add concentration</button>
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
          class="text-2xs text-mist/30 font-body italic"
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
            : 'border-shadow/30 text-mist/50 hover:border-shadow hover:text-mist'"
          @click="toggleCondition(cond.name)"
        >{{ cond.name }}</button>

      </div>
    </div>

  </div>
</template>

<script setup lang="ts">
import { ref, nextTick } from 'vue'
import type { Character } from '@/shared/types/character'
import { useCharactersStore } from '@/characters/store'

const props = defineProps<{
  character: Character
}>()

const store = useCharactersStore()

// ── Condition list ─────────────────────────────────────────────────────────────

const CONDITION_LIST = [
  { name: 'Blinded',       activeClass: 'bg-blood-base/20 text-blood-bright border-blood-base/40' },
  { name: 'Charmed',       activeClass: 'bg-arcane-base/20 text-arcane-bright border-arcane-base/40' },
  { name: 'Deafened',      activeClass: 'bg-shadow/60 text-mist border-shadow' },
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

const showConcentrationInput = ref(false)
const concentrationDraft = ref('')
const concentrationInputEl = ref<HTMLInputElement | null>(null)

async function startConcentration() {
  showConcentrationInput.value = true
  await nextTick()
  concentrationInputEl.value?.focus()
}

function commitConcentration() {
  const spell = concentrationDraft.value.trim()
  if (spell) {
    store.update(props.character.id, {
      combat: { ...props.character.combat, concentrationSpell: spell },
    })
  }
  showConcentrationInput.value = false
  concentrationDraft.value = ''
}

function cancelConcentration() {
  showConcentrationInput.value = false
  concentrationDraft.value = ''
}

function clearConcentration() {
  store.update(props.character.id, {
    combat: { ...props.character.combat, concentrationSpell: null },
  })
}
</script>
