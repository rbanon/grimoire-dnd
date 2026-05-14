<template>
  <div class="space-y-6">

    <!-- ── Attack table ───────────────────────────────────────────────────── -->
    <div v-if="character.attacks.length > 0" class="overflow-x-auto">
      <table class="w-full text-sm font-body border-collapse">
        <thead>
          <tr class="border-b border-shadow">
            <th class="text-left py-2 px-3 text-2xs font-heading tracking-wide text-mist uppercase">Name</th>
            <th class="text-left py-2 px-3 text-2xs font-heading tracking-wide text-mist uppercase">Bonus</th>
            <th class="text-left py-2 px-3 text-2xs font-heading tracking-wide text-mist uppercase">Damage</th>
            <th class="text-left py-2 px-3 text-2xs font-heading tracking-wide text-mist uppercase hidden sm:table-cell">Type</th>
            <th class="text-left py-2 px-3 text-2xs font-heading tracking-wide text-mist uppercase hidden sm:table-cell">Range</th>
            <th class="py-2 px-2 text-2xs font-heading tracking-wide text-mist uppercase text-right">Roll</th>
          </tr>
        </thead>
        <tbody>
          <tr
            v-for="attack in character.attacks"
            :key="attack.id"
            class="border-b border-shadow/40 hover:bg-depths/40 transition-colors group"
          >
            <td class="py-2.5 px-3 font-heading text-vellum">{{ attack.name }}</td>
            <td class="py-2.5 px-3 font-heading text-gold-mid">{{ attack.attackBonus || '—' }}</td>
            <td class="py-2.5 px-3 text-stone font-mono text-xs">{{ attack.damage || '—' }}</td>
            <td class="py-2.5 px-3 text-mist hidden sm:table-cell">{{ attack.damageType || '—' }}</td>
            <td class="py-2.5 px-3 text-mist hidden sm:table-cell">{{ attack.range || '—' }}</td>
            <td class="py-2 px-2">
              <div class="flex items-center gap-1 justify-end">
                <!-- Roll attack -->
                <button
                  type="button"
                  class="px-2 py-1 rounded border border-arcane-base/30 bg-arcane-deep/10 text-arcane-pale hover:border-arcane-base/60 hover:bg-arcane-deep/20 transition-all font-heading text-xs"
                  title="Roll attack"
                  @click="rollAttack(attack)"
                >⚃ Atk</button>
                <!-- Roll damage -->
                <button
                  v-if="attack.damage"
                  type="button"
                  class="px-2 py-1 rounded border border-blood-base/30 bg-blood-deep/10 text-blood-mid hover:border-blood-base/60 hover:bg-blood-deep/20 transition-all font-heading text-xs"
                  title="Roll damage"
                  @click="rollDmg(attack)"
                >⚀ Dmg</button>
                <!-- Remove -->
                <button
                  v-if="editMode"
                  type="button"
                  class="p-1 rounded text-mist/30 hover:text-blood-bright hover:bg-blood-base/10 transition-colors opacity-0 group-hover:opacity-100 ml-1"
                  title="Remove attack"
                  @click="removeAttack(attack.id)"
                >
                  <Trash2Icon :size="12" />
                </button>
              </div>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- ── Empty state ────────────────────────────────────────────────────── -->
    <div v-else-if="!showForm" class="card p-10 text-center">
      <SwordIcon :size="36" class="mx-auto text-mist/25 mb-3" />
      <p class="font-body text-ash text-sm">No attacks recorded.</p>
      <p class="font-body text-mist text-xs mt-1">Weapons, spells, and special abilities all go here.</p>
    </div>

    <!-- ── Add button ─────────────────────────────────────────────────────── -->
    <button
      v-if="!showForm && editMode"
      type="button"
      class="btn-secondary text-xs gap-1.5 w-full justify-center"
      @click="openForm"
    >
      <PlusIcon :size="13" /> Add Attack
    </button>

    <!-- ── Add attack form ────────────────────────────────────────────────── -->
    <div v-if="showForm" class="card p-5 space-y-4">
      <div class="flex items-center justify-between">
        <p class="font-heading text-sm text-vellum">New Attack</p>
        <button type="button" class="text-mist hover:text-ash transition-colors" @click="closeForm">
          <XIcon :size="15" />
        </button>
      </div>

      <!-- Name -->
      <div>
        <label class="label mb-1.5 block">Name <span class="text-blood-bright">*</span></label>
        <input
          ref="nameInputEl"
          v-model="draft.name"
          type="text"
          placeholder="Longsword, Fire Bolt, Sneak Attack…"
          class="input-base w-full"
          @keydown.enter="submitForm"
        />
      </div>

      <!-- Ability + Proficient + Flat bonus → computed preview -->
      <div>
        <label class="label mb-1.5 block">Attack Bonus</label>
        <div class="flex flex-wrap gap-2 items-end">
          <select v-model="draft.ability" class="input-base flex-1 min-w-[100px]">
            <option value="none">No modifier</option>
            <option v-for="ab in ABILITY_OPTIONS" :key="ab.value" :value="ab.value">
              {{ ab.label }} ({{ fmt(mods[ab.value]) }})
            </option>
          </select>
          <label class="flex items-center gap-1.5 cursor-pointer select-none shrink-0">
            <input v-model="draft.proficient" type="checkbox" class="w-3.5 h-3.5 accent-gold-mid" />
            <span class="text-xs font-body text-ash">Prof (+{{ profBonus }})</span>
          </label>
          <div class="flex items-center gap-1 shrink-0">
            <span class="text-xs font-body text-mist">Flat</span>
            <input v-model.number="draft.flatBonus" type="number" class="input-base w-16 text-center" placeholder="0" />
          </div>
          <div class="px-3 py-2 rounded border border-gold-dim/30 bg-gold-dim/10 font-heading text-gold-mid text-sm shrink-0 min-w-[52px] text-center">
            {{ computedBonusDisplay }}
          </div>
        </div>
      </div>

      <!-- Damage + Type -->
      <div class="grid grid-cols-2 gap-3">
        <div>
          <label class="label mb-1.5 block">Damage</label>
          <input v-model="draft.damage" type="text" placeholder="1d8+3" class="input-base w-full font-mono text-sm" />
        </div>
        <div>
          <label class="label mb-1.5 block">Damage Type</label>
          <select v-model="draft.damageType" class="input-base w-full">
            <option value="">—</option>
            <optgroup label="Physical">
              <option v-for="t in PHYSICAL_TYPES" :key="t" :value="t">{{ t }}</option>
            </optgroup>
            <optgroup label="Magical">
              <option v-for="t in MAGICAL_TYPES" :key="t" :value="t">{{ t }}</option>
            </optgroup>
          </select>
        </div>
      </div>

      <!-- Range -->
      <div class="max-w-[200px]">
        <label class="label mb-1.5 block">Range</label>
        <input v-model="draft.range" type="text" placeholder="5 ft., 60/120 ft." class="input-base w-full" />
      </div>

      <!-- Actions -->
      <div class="flex gap-2 pt-1">
        <button type="button" class="btn-primary text-sm gap-1.5" :disabled="!draft.name.trim()" @click="submitForm">
          <PlusIcon :size="13" /> Add Attack
        </button>
        <button type="button" class="btn-secondary text-sm" @click="closeForm">Cancel</button>
      </div>
    </div>

    <!-- Add another (when table already has rows) -->
    <button
      v-if="!showForm && editMode && character.attacks.length > 0"
      type="button"
      class="btn-secondary text-xs gap-1.5"
      @click="openForm"
    >
      <PlusIcon :size="13" /> Add Attack
    </button>

  </div>
</template>

<script setup lang="ts">
import { ref, computed, reactive, nextTick } from 'vue'
import { SwordIcon, PlusIcon, Trash2Icon, XIcon } from 'lucide-vue-next'
import { useCharactersStore } from '@/characters/store'
import { computeAllModifiers } from '@/shared/types/character'
import { computeProficiencyBonus } from '@/shared/lib/derivedStats'
import { useRoll } from '@/shared/composables/useRoll'
import type { Attack, Character, AbilityName } from '@/shared/types/character'
import { generateId } from '@/shared/lib/uuid'

const props = defineProps<{ character: Character; editMode: boolean }>()
const store = useCharactersStore()
const { rollD20, rollDamage } = useRoll()

// ── Derived stats ─────────────────────────────────────────────────────────────

const mods = computed(() => computeAllModifiers(props.character.abilityScores))
const profBonus = computed(() => computeProficiencyBonus(props.character.combat.level))
function fmt(n: number) { return n >= 0 ? `+${n}` : String(n) }

// ── Roll helpers ──────────────────────────────────────────────────────────────

function parseBonus(bonusStr: string | undefined): number {
  if (!bonusStr) return 0
  const m = bonusStr.match(/^([+-]?\d+)$/)
  return m ? parseInt(m[1]) : 0
}

function rollAttack(attack: Attack) {
  rollD20(parseBonus(attack.attackBonus), `${attack.name} Attack`)
}

function rollDmg(attack: Attack) {
  if (!attack.damage) return
  rollDamage(attack.damage, `${attack.name} Damage`)
}

// ── Constants ─────────────────────────────────────────────────────────────────

const PHYSICAL_TYPES = ['Slashing', 'Piercing', 'Bludgeoning']
const MAGICAL_TYPES = [
  'Acid', 'Cold', 'Fire', 'Force', 'Lightning',
  'Necrotic', 'Poison', 'Psychic', 'Radiant', 'Thunder',
]
const ABILITY_OPTIONS: { value: AbilityName; label: string }[] = [
  { value: 'str', label: 'STR' }, { value: 'dex', label: 'DEX' },
  { value: 'con', label: 'CON' }, { value: 'int', label: 'INT' },
  { value: 'wis', label: 'WIS' }, { value: 'cha', label: 'CHA' },
]

// ── Form state ────────────────────────────────────────────────────────────────

const showForm = ref(false)
const nameInputEl = ref<HTMLInputElement | null>(null)

const draft = reactive({
  name: '',
  ability: 'str' as AbilityName | 'none',
  proficient: true,
  flatBonus: 0,
  damage: '',
  damageType: '',
  range: '',
})

const computedBonusDisplay = computed(() => {
  const abilMod = draft.ability === 'none' ? 0 : mods.value[draft.ability as AbilityName]
  const prof = draft.proficient ? profBonus.value : 0
  const flat = draft.flatBonus || 0
  const total = abilMod + prof + flat
  return total >= 0 ? `+${total}` : String(total)
})

function resetDraft() {
  draft.name = ''
  draft.ability = 'str'
  draft.proficient = true
  draft.flatBonus = 0
  draft.damage = ''
  draft.damageType = ''
  draft.range = ''
}

function openForm() {
  showForm.value = true
  nextTick(() => nameInputEl.value?.focus())
}

function closeForm() {
  showForm.value = false
  resetDraft()
}

// ── CRUD ──────────────────────────────────────────────────────────────────────

async function submitForm() {
  if (!draft.name.trim()) return
  const newAttack = {
    id: generateId(),
    name: draft.name.trim(),
    attackBonus: computedBonusDisplay.value,
    damage: draft.damage.trim() || undefined,
    damageType: draft.damageType || undefined,
    range: draft.range.trim() || undefined,
  }
  await store.update(props.character.id, {
    attacks: [...props.character.attacks, newAttack],
  })
  closeForm()
}

async function removeAttack(attackId: string) {
  await store.update(props.character.id, {
    attacks: props.character.attacks.filter(a => a.id !== attackId),
  })
}
</script>
