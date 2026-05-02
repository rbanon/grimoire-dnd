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
                <div class="flex gap-2 shrink-0">
                  <button class="btn-secondary text-xs gap-1.5" @click="downloadExport">
                    <DownloadIcon :size="13" />Export
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
            <StatBox label="AC" :value="character.combat.armorClass" />
            <StatBox label="Initiative" :value="initiativeDisplay" />
            <StatBox label="Speed" :value="`${speedDisplay}ft`" />

            <!-- HP tracker -->
            <div
              class="card flex flex-col items-center justify-center p-3 gap-0.5"
              :class="hpPercent < 0.25 ? 'pulse-blood border-blood-base/40' : ''"
            >
              <p class="text-2xs font-heading tracking-[0.15em] uppercase text-mist">HP</p>
              <div v-if="hpEditing" class="flex items-center gap-1">
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
                <button type="button" class="w-5 h-5 flex items-center justify-center rounded text-mist hover:text-ash hover:bg-depths/60 font-heading transition-colors" @click="adjustHp(-1)">−</button>
                <button type="button" class="font-heading text-lg leading-none hover:text-gold-mid transition-colors" :class="hpPercent < 0.25 ? 'text-blood-bright' : 'text-vellum'" @click="startHpEdit">
                  {{ character.combat.currentHp }}
                </button>
                <button type="button" class="w-5 h-5 flex items-center justify-center rounded text-mist hover:text-ash hover:bg-depths/60 font-heading transition-colors" @click="adjustHp(1)">+</button>
              </div>
              <p class="text-xs text-mist leading-none">/ {{ character.combat.maxHp }}</p>
            </div>

            <!-- Inspiration -->
            <div
              class="card flex flex-col items-center justify-center p-3 gap-0.5 cursor-pointer transition-all duration-150"
              :class="character.combat.inspiration ? 'border-gold-mid/50 bg-gold-dim/10' : 'hover:border-gold-dim/20'"
              title="Toggle inspiration"
              @click="toggleInspiration"
            >
              <p class="text-2xs font-heading tracking-[0.15em] uppercase" :class="character.combat.inspiration ? 'text-gold-mid' : 'text-mist'">Inspiration</p>
              <p class="font-heading text-xl leading-none" :class="character.combat.inspiration ? 'text-gold-mid' : 'text-mist/30'">✦</p>
            </div>

            <StatBox label="Prof Bonus" :value="`+${profBonus}`" />
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
            <div v-if="character.attacks.length === 0" class="card p-10 text-center">
              <SwordIcon :size="36" class="mx-auto text-mist/25 mb-3" />
              <p class="font-body text-ash text-sm">No attacks recorded.</p>
              <p class="font-body text-mist text-xs mt-1">Attacks can be added from the edit view (coming soon).</p>
            </div>
            <div v-else class="overflow-x-auto">
              <table class="w-full text-sm font-body border-collapse">
                <thead>
                  <tr class="border-b border-shadow">
                    <th class="text-left py-2 px-3 text-2xs font-heading tracking-wide text-mist uppercase">Name</th>
                    <th class="text-left py-2 px-3 text-2xs font-heading tracking-wide text-mist uppercase">Bonus</th>
                    <th class="text-left py-2 px-3 text-2xs font-heading tracking-wide text-mist uppercase">Damage</th>
                    <th class="text-left py-2 px-3 text-2xs font-heading tracking-wide text-mist uppercase">Type</th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-for="attack in character.attacks" :key="attack.id" class="border-b border-shadow/50 hover:bg-depths/40 transition-colors">
                    <td class="py-2.5 px-3 font-heading text-vellum">{{ attack.name }}</td>
                    <td class="py-2.5 px-3 text-gold-mid">{{ attack.attackBonus || '—' }}</td>
                    <td class="py-2.5 px-3 text-stone">{{ attack.damage || '—' }}</td>
                    <td class="py-2.5 px-3 text-mist">{{ attack.damageType || '—' }}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          <!-- Spells -->
          <div v-else-if="activeTab === 'spells'">
            <div v-if="character.favoriteSpells.length > 0" class="mb-6">
              <div class="rule-gold mb-4"><span class="text-gold-mid">★ Favorite Spells</span></div>
              <div class="flex flex-wrap gap-2">
                <div
                  v-for="spell in character.favoriteSpells"
                  :key="spell.index"
                  class="flex items-center gap-2 px-3 py-2 rounded border border-gold-dim/25 bg-gold-dim/10 text-sm"
                >
                  <span class="text-gold-mid text-xs">★</span>
                  <span class="font-heading text-vellum">{{ spell.name }}</span>
                  <span class="badge-arcane text-2xs">{{ spell.level === 0 ? 'Cantrip' : `Lv ${spell.level}` }}</span>
                </div>
              </div>
            </div>
            <div v-if="character.spellcasting?.cantripsKnown.length">
              <div class="rule-gold mb-4"><span>Cantrips</span></div>
              <div class="flex flex-wrap gap-2">
                <span
                  v-for="c in character.spellcasting.cantripsKnown"
                  :key="c.index"
                  class="px-3 py-1.5 rounded border border-arcane-base/30 bg-arcane-deep/10 text-sm font-heading text-arcane-pale"
                >{{ c.name }}</span>
              </div>
            </div>
            <div v-if="!character.favoriteSpells.length && !character.spellcasting?.cantripsKnown.length" class="card p-10 text-center">
              <SparklesIcon :size="36" class="mx-auto text-mist/25 mb-3" />
              <p class="font-body text-ash text-sm">No spells recorded.</p>
            </div>
          </div>

          <!-- Equipment -->
          <div v-else-if="activeTab === 'equipment'" class="space-y-6">
            <!-- Currency -->
            <div class="space-y-2">
              <p class="label">Currency</p>
              <div class="grid grid-cols-5 gap-2">
                <div v-for="coin in COINS" :key="coin.key" class="card p-2 text-center">
                  <p class="text-2xs font-heading tracking-wide text-mist uppercase mb-1">{{ coin.label }}</p>
                  <input
                    v-model.number="currencyEdit[coin.key]"
                    type="number"
                    min="0"
                    class="w-full text-center font-heading text-base bg-transparent outline-none text-vellum border-b border-transparent focus:border-gold-mid/50 transition-colors"
                    @blur="saveCurrency"
                  />
                </div>
              </div>
            </div>

            <!-- Inventory -->
            <div class="space-y-2">
              <p class="label">Inventory</p>
              <div v-if="character.inventory.length === 0" class="card p-10 text-center">
                <PackageIcon :size="36" class="mx-auto text-mist/25 mb-3" />
                <p class="font-body text-ash text-sm">Inventory is empty.</p>
              </div>
              <div v-else class="space-y-1.5">
                <div
                  v-for="item in character.inventory"
                  :key="item.id"
                  class="flex items-center gap-3 px-3 py-2.5 rounded border border-shadow bg-abyss/50"
                >
                  <span
                    class="w-2 h-2 rounded-full shrink-0"
                    :class="item.equipped ? 'bg-gold-mid' : 'bg-mist/30'"
                    :title="item.equipped ? 'Equipped' : 'Not equipped'"
                  />
                  <span class="font-heading text-sm text-vellum flex-1">{{ item.item.name }}</span>
                  <span v-if="item.quantity > 1" class="text-xs font-body text-mist">×{{ item.quantity }}</span>
                  <span v-if="item.item.category" class="text-xs font-body text-mist/60">{{ item.item.category }}</span>
                </div>
              </div>
            </div>
          </div>

          <!-- Features & Traits -->
          <div v-else-if="activeTab === 'features'">
            <div v-if="character.features.length === 0" class="card p-10 text-center">
              <ScrollIcon :size="36" class="mx-auto text-mist/25 mb-3" />
              <p class="font-body text-ash text-sm">No features recorded.</p>
              <p class="font-body text-mist text-xs mt-1">Features from race, class, and background will appear here.</p>
            </div>
            <div v-else class="space-y-3">
              <div v-for="feature in character.features" :key="feature.id" class="card p-4 space-y-1.5">
                <div class="flex items-start justify-between gap-3">
                  <p class="font-heading text-sm text-vellum">{{ feature.name }}</p>
                  <span v-if="feature.source" class="badge-gold text-2xs shrink-0">{{ feature.source }}</span>
                </div>
                <p class="font-body text-sm text-ash leading-relaxed">{{ feature.description }}</p>
              </div>
            </div>
          </div>

          <!-- Biography -->
          <div v-else-if="activeTab === 'bio'">
            <div class="grid sm:grid-cols-2 gap-4">
              <div
                v-for="field in bioFields"
                :key="field.key"
                v-show="field.value"
                class="card p-5"
              >
                <p class="label mb-2">{{ field.label }}</p>
                <p class="font-body text-stone leading-relaxed text-sm">{{ field.value }}</p>
              </div>
              <!-- Appearance -->
              <div v-if="hasAppearance" class="card p-5 sm:col-span-2">
                <p class="label mb-3">Appearance</p>
                <div class="grid grid-cols-2 sm:grid-cols-3 gap-3 text-sm font-body">
                  <div v-for="f in appearanceFields" :key="f.key" v-show="f.value">
                    <p class="text-mist text-xs">{{ f.label }}</p>
                    <p class="text-stone">{{ f.value }}</p>
                  </div>
                </div>
              </div>
              <div v-if="!bioFields.some(f => f.value) && !hasAppearance" class="col-span-2 text-center py-12">
                <p class="font-body text-ash">No biography written yet.</p>
              </div>
            </div>
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
import { ref, computed, watch, reactive, nextTick } from 'vue'
import { DownloadIcon, SparklesIcon, SwordIcon, PackageIcon, ScrollIcon } from 'lucide-vue-next'
import { useCharactersStore } from '@/characters/store'
import { computeModifier, computeAllModifiers } from '@/shared/types/character'
import { computeProficiencyBonus } from '@/shared/lib/derivedStats'
import type { AbilityName } from '@/shared/types/character'
import StatBox from '@/characters/components/StatBox.vue'
import AbilityBlock from '@/characters/components/AbilityBlock.vue'

const props = defineProps<{ id: string }>()
const store = useCharactersStore()
const character = computed(() => store.getById(props.id))

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

// ── Currency ──────────────────────────────────────────────────────────────────

const COINS = [
  { key: 'cp' as const, label: 'CP' },
  { key: 'sp' as const, label: 'SP' },
  { key: 'ep' as const, label: 'EP' },
  { key: 'gp' as const, label: 'GP' },
  { key: 'pp' as const, label: 'PP' },
]

const currencyEdit = reactive({ cp: 0, sp: 0, ep: 0, gp: 0, pp: 0 })

watch(character, (c) => {
  if (c) {
    currencyEdit.cp = c.currency.cp
    currencyEdit.sp = c.currency.sp
    currencyEdit.ep = c.currency.ep
    currencyEdit.gp = c.currency.gp
    currencyEdit.pp = c.currency.pp
  }
}, { immediate: true })

async function saveCurrency() {
  if (!character.value) return
  await store.update(character.value.id, { currency: { ...currencyEdit } })
}

// ── Notes ─────────────────────────────────────────────────────────────────────

const notesText = ref('')

watch(character, (c) => { notesText.value = c?.notes ?? '' }, { immediate: true })

async function saveNotes() {
  if (!character.value) return
  await store.update(character.value.id, { notes: notesText.value })
}

// ── Biography ─────────────────────────────────────────────────────────────────

const bioFields = computed(() => {
  const p = character.value?.personality
  if (!p) return []
  return [
    { key: 'personalityTraits', label: 'Personality Traits', value: p.personalityTraits },
    { key: 'ideals',  label: 'Ideals',     value: p.ideals    },
    { key: 'bonds',   label: 'Bonds',      value: p.bonds     },
    { key: 'flaws',   label: 'Flaws',      value: p.flaws     },
    { key: 'biography', label: 'Biography', value: p.biography },
  ]
})

const appearanceFields = computed(() => {
  const id = character.value?.identity
  if (!id) return []
  return [
    { key: 'age',    label: 'Age',    value: id.age    },
    { key: 'gender', label: 'Gender', value: id.gender },
    { key: 'height', label: 'Height', value: id.height },
    { key: 'weight', label: 'Weight', value: id.weight },
    { key: 'eyes',   label: 'Eyes',   value: id.eyes   },
    { key: 'skin',   label: 'Skin',   value: id.skin   },
    { key: 'hair',   label: 'Hair',   value: id.hair   },
  ].filter(f => f.value)
})

const hasAppearance = computed(() => appearanceFields.value.length > 0)

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
