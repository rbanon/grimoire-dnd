import { defineStore } from 'pinia'
import { ref, computed, watch, nextTick } from 'vue'
import { z } from 'zod'
import type { Alignment, AbilityScores, InventoryItem } from '@/shared/types/character'
import { CharacterSchema, computeModifier, computeAllModifiers } from '@/shared/types/character'
import { storageGet, storageSet, storageRemove } from '@/shared/lib/storage'
import { generateId, now } from '@/shared/lib/uuid'
import { useCharactersStore } from '@/characters/store'
import { useAuthStore } from '@/auth/store'
import { uploadPortraitBlob } from '@/shared/lib/uploadPortrait'
import { getSpellSlots, getSpellProfile, getAsiLevels, getLevelEntry, CLASS_META, getFirstSpellLevel, getClassResources, cantripsGainedAtLevel, spellsGainedAtLevel, resolveChoiceFeature, getInvocationsCount, getRaceTraits } from '@/character-builder/classMeta'

const DRAFT_KEY = 'builder-draft'
const TOTAL_STEPS = 11

// ── Ability score default ─────────────────────────────────────────────────────
export const ABILITY_SCORE_DEFAULT = 8

// ── Point buy constants ───────────────────────────────────────────────────────
export const POINT_BUY_BUDGET = 27
export const POINT_BUY_MIN = ABILITY_SCORE_DEFAULT
export const POINT_BUY_MAX = 15
// Cumulative cost from score 8
const PB_COST: Record<number, number> = { 8: 0, 9: 1, 10: 2, 11: 3, 12: 4, 13: 5, 14: 7, 15: 9 }
export const STANDARD_ARRAY = [15, 14, 13, 12, 10, 8]

export function pbCost(score: number): number { return PB_COST[score] ?? 0 }
export function pbCostDelta(from: number, to: number): number {
  return pbCost(to) - pbCost(from)
}

// ── Draft shape ───────────────────────────────────────────────────────────────
export interface SpellsByLevelEntry {
  cantripsGained: { index: string; name: string }[]
  spellsGained: { index: string; name: string; level: number }[]
  spellReplaced: { fromIndex: string; to: { index: string; name: string; level: number } } | null
}

export interface BuilderDraft {
  // Holy symbol / emblem flavor descriptions keyed by slot "${gi}_${si}" (builder-only, not persisted to character)
  holySymbolDescriptions: Record<string, string>
  currentStep: number

  // Step 1 — Identity
  name: string
  portraitUrl: string
  alignment: Alignment
  age: string
  gender: string
  height: string
  weight: string
  eyes: string
  skin: string
  hair: string
  appearanceNotes: string
  personalityTraits: string
  ideals: string
  bonds: string
  flaws: string
  biography: string

  // Step 1b — Race (part of identity step)
  raceIndex: string
  raceName: string
  raceSpeed: number
  raceSizeCategory: string
  raceAbilityBonuses: Partial<Record<keyof AbilityScores, number>>
  raceLanguageCount: number
  subraceIndex: string
  subraceName: string
  subraceAbilityBonuses: Partial<Record<keyof AbilityScores, number>>
  availableSubraces: { index: string; name: string }[]

  // Step 1c — Background
  backgroundIndex: string
  backgroundName: string
  backgroundDescription: string
  backgroundSkillProficiencies: string[]
  backgroundToolProficiencies: string[]
  backgroundLanguageChoices: number

  // Step 2 — Class
  classIndex: string
  className: string
  classHitDie: number
  classSpellcastingAbility: string | null
  classSkillChoices: number
  classSkillOptions: string[]
  subclassIndex: string
  subclassName: string
  availableSubclasses: { index: string; name: string }[]
  level: number
  useMilestones: boolean
  hpMethod: 'average' | 'max' | 'manual' | 'roll'
  manualMaxHp: number
  rolledHpPerLevel: number[]

  // Step 3 — Abilities
  abilityMethod: 'pointbuy' | 'standard' | 'manual' | 'roll'
  baseScores: AbilityScores
  standardArrayAssignments: Partial<Record<keyof AbilityScores, number>> // which index in STANDARD_ARRAY
  rolledAbilityScores: number[]       // 6 values from 4d6-drop-lowest
  rollAssignments: Partial<Record<keyof AbilityScores, number>> // ability → pool index

  // Race tool proficiency choices (e.g. dwarf picks one artisan tool)
  raceProfChoices: number
  raceProfOptions: { index: string; name: string }[]
  selectedRaceProfs: string[]
  // Race auto-granted skill proficiencies (e.g. Half-Orc → Intimidation)
  raceSkillProficiencies: string[]
  // Auto-granted racial languages (tracked separately to avoid overwriting user-chosen languages on race change)
  raceAutoLanguages: string[]

  // Step 4 — Proficiencies
  selectedSkills: string[]
  selectedLanguages: string[]

  // Step 5 — Equipment (simplified for MVP)
  useStartingEquipment: boolean
  manualGold: number
  equipmentChoicesDone: boolean

  // Step 2 — Level choices (fighting style, pact boon, etc.)
  // Key = class level, value = map of choiceKey → selected option index
  levelChoices: Record<number, Record<string, string>>

  // Step 6 — Feats & ASI decisions, keyed by class level granting the improvement
  featsByLevel: Record<number, { type: 'asi' | 'feat'; featIndex?: string; featName?: string }>
  // Ability allocations for levels where type === 'asi'
  asiAllocations: Record<number, Partial<Record<keyof AbilityScores, number>>>

  // Step 5b — Starting inventory (resolved from equipment step choices)
  startingInventory: InventoryItem[]

  // Step 6 — Spells
  selectedCantrips: { index: string; name: string }[]
  selectedSpells: { index: string; name: string; level: number }[]
  // Daily prepared subset for prepared casters (Cleric, Druid, Paladin)
  selectedPreparedSpells: { index: string; name: string; level: number }[]
  // Per-level spell selection for known casters (Bard, Sorcerer, Warlock, Ranger)
  spellsByLevel: Record<number, SpellsByLevelEntry>
  // Warlock: 3 bonus cantrips from any class granted by Pact of the Tome
  tomeCantrips: { index: string; name: string }[]
  // Warlock: Eldritch Invocations chosen
  selectedInvocations: { index: string; name: string }[]
}

const defaultDraft = (): BuilderDraft => ({
  currentStep: 1,
  name: '',
  portraitUrl: '',
  alignment: 'True Neutral',
  age: '', gender: '', height: '', weight: '', eyes: '', skin: '', hair: '',
  appearanceNotes: '', personalityTraits: '', ideals: '', bonds: '', flaws: '', biography: '',
  raceIndex: '', raceName: '', raceSpeed: 30, raceSizeCategory: 'Medium',
  raceAbilityBonuses: {}, raceLanguageCount: 2, subraceIndex: '', subraceName: '',
  subraceAbilityBonuses: {}, availableSubraces: [],
  raceProfChoices: 0, raceProfOptions: [], selectedRaceProfs: [], raceSkillProficiencies: [], raceAutoLanguages: [],
  backgroundIndex: '', backgroundName: '', backgroundDescription: '', backgroundSkillProficiencies: [], backgroundToolProficiencies: [], backgroundLanguageChoices: 0,
  classIndex: '', className: '', classHitDie: 8, classSpellcastingAbility: null,
  classSkillChoices: 2, classSkillOptions: [],
  subclassIndex: '', subclassName: '', availableSubclasses: [],
  level: 1, useMilestones: false, hpMethod: 'average', manualMaxHp: 8, rolledHpPerLevel: [],
  holySymbolDescriptions: {},
  abilityMethod: 'pointbuy',
  baseScores: { str: 8, dex: 8, con: 8, int: 8, wis: 8, cha: 8 },
  standardArrayAssignments: {},
  rolledAbilityScores: [],
  rollAssignments: {},
  selectedSkills: [], selectedLanguages: [],
  useStartingEquipment: true, manualGold: 0, equipmentChoicesDone: true,
  startingInventory: [],
  levelChoices: {},
  featsByLevel: {},
  asiAllocations: {},
  selectedCantrips: [], selectedSpells: [], selectedPreparedSpells: [], spellsByLevel: {},
  tomeCantrips: [], selectedInvocations: [],
})

const DRAFT_ARRAY_FIELDS = [
  'selectedCantrips', 'selectedSpells', 'selectedPreparedSpells', 'rolledHpPerLevel', 'rolledAbilityScores',
  'selectedSkills', 'selectedLanguages', 'startingInventory', 'raceProfOptions',
  'availableSubraces', 'availableSubclasses', 'backgroundSkillProficiencies',
  'backgroundToolProficiencies', 'classSkillOptions', 'selectedRaceProfs', 'raceSkillProficiencies',
  'tomeCantrips', 'selectedInvocations', 'raceAutoLanguages',
] as const

const DRAFT_OBJ_FIELDS = [
  'baseScores', 'spellsByLevel', 'asiAllocations', 'featsByLevel', 'levelChoices',
  'standardArrayAssignments', 'rollAssignments', 'raceAbilityBonuses',
  'subraceAbilityBonuses', 'holySymbolDescriptions',
] as const

const DraftSchema = z.object({ currentStep: z.number() })
  .passthrough()
  .transform((data) => {
    const d = data as Record<string, unknown>
    for (const f of DRAFT_ARRAY_FIELDS) if (!Array.isArray(d[f])) delete d[f]
    for (const f of DRAFT_OBJ_FIELDS) if (typeof d[f] !== 'object' || d[f] === null) delete d[f]
    return d
  })

export const useBuilderStore = defineStore('builder', () => {
  const draft = ref<BuilderDraft>(defaultDraft())
  const saving = ref(false)
  const saveError = ref<string | null>(null)
  let _skipCount = 0
  let _saveTimer: ReturnType<typeof setTimeout> | null = null

  // ── Computed ──────────────────────────────────────────────────────────────

  const isSpellcaster = computed(() => draft.value.classSpellcastingAbility !== null)
  const totalSteps = computed(() => isSpellcaster.value ? TOTAL_STEPS : TOTAL_STEPS - 1)

  // Effective ability scores (base + racial bonuses + ASI allocations), capped at 20
  const effectiveScores = computed<AbilityScores>(() => {
    const b = draft.value.baseScores
    const rb = draft.value.raceAbilityBonuses
    const sb = draft.value.subraceAbilityBonuses
    const allAsis = draft.value.asiAllocations
    const keys: (keyof AbilityScores)[] = ['str', 'dex', 'con', 'int', 'wis', 'cha']
    return keys.reduce((acc, k) => {
      const asiTotal = Object.values(allAsis).reduce((sum, alloc) => sum + (alloc[k] ?? 0), 0)
      acc[k] = Math.min(20, b[k] + (rb[k] ?? 0) + (sb[k] ?? 0) + asiTotal)
      return acc
    }, {} as AbilityScores)
  })

  // Point buy: total points spent
  const pointsSpent = computed(() => {
    const scores = draft.value.baseScores
    return Object.values(scores).reduce((sum, s) => sum + pbCost(s), 0)
  })
  const pointsRemaining = computed(() => POINT_BUY_BUDGET - pointsSpent.value)

  // Computed max HP
  const computedMaxHp = computed(() => {
    const con = effectiveScores.value.con
    const conMod = Math.floor((con - 10) / 2)
    const hd = draft.value.classHitDie
    const lv = draft.value.level
    if (draft.value.hpMethod === 'max') return lv * Math.max(1, hd + conMod)
    if (draft.value.hpMethod === 'average') {
      const avg = Math.floor(hd / 2) + 1
      const lv1Hp = Math.max(1, hd + conMod)
      return lv1Hp + (lv - 1) * Math.max(1, avg + conMod)
    }
    if (draft.value.hpMethod === 'roll') {
      const rolls = draft.value.rolledHpPerLevel
      if (rolls.length < lv) return 0
      return rolls.slice(0, lv).reduce((sum, roll, idx) => {
        return sum + Math.max(1, (idx === 0 ? hd : roll) + conMod)
      }, 0)
    }
    return draft.value.manualMaxHp
  })

  const activeCantrips = computed<{ index: string; name: string }[]>(() => {
    const profile = getSpellProfile(draft.value.classIndex)
    if (!profile || profile.castingType !== 'known') return draft.value.selectedCantrips
    const seen = new Set<string>()
    const result: { index: string; name: string }[] = []
    for (let lvl = 1; lvl <= draft.value.level; lvl++) {
      for (const c of draft.value.spellsByLevel[lvl]?.cantripsGained ?? []) {
        if (!seen.has(c.index)) { seen.add(c.index); result.push(c) }
      }
    }
    // Pact of the Tome grants 3 additional cantrips from any class
    if (draft.value.classIndex === 'warlock' && draft.value.level >= 3
        && draft.value.levelChoices[3]?.['pact-boon'] === 'tome') {
      for (const c of draft.value.tomeCantrips) {
        if (!seen.has(c.index)) { seen.add(c.index); result.push(c) }
      }
    }
    return result
  })

  const activeSpells = computed<{ index: string; name: string; level: number }[]>(() => {
    const profile = getSpellProfile(draft.value.classIndex)
    if (!profile || profile.castingType !== 'known') return draft.value.selectedSpells
    const pool = new Map<string, { index: string; name: string; level: number }>()
    for (let lvl = 1; lvl <= draft.value.level; lvl++) {
      const entry = draft.value.spellsByLevel[lvl]
      if (!entry) continue
      for (const s of entry.spellsGained) pool.set(s.index, s)
      if (entry.spellReplaced) {
        pool.delete(entry.spellReplaced.fromIndex)
        pool.set(entry.spellReplaced.to.index, entry.spellReplaced.to)
      }
    }
    return [...pool.values()]
  })

  // ── Step validators ────────────────────────────────────────────────────────

  function validateAbilities(): string[] {
    const errors: string[] = []
    if (draft.value.abilityMethod === 'pointbuy') {
      if (pointsRemaining.value < 0) errors.push('Too many points spent')
      else if (pointsRemaining.value > 0) errors.push(`${pointsRemaining.value} point${pointsRemaining.value > 1 ? 's' : ''} left to spend`)
    } else if (draft.value.abilityMethod === 'standard') {
      const assigned = Object.keys(draft.value.standardArrayAssignments).length
      if (assigned < 6) errors.push(`Assign all standard array values (${assigned}/6 done)`)
    } else if (draft.value.abilityMethod === 'manual') {
      if (Object.values(draft.value.baseScores).some(s => s > 20))
        errors.push('Starting ability scores above 20 are non-standard for player characters')
    } else if (draft.value.abilityMethod === 'roll') {
      if (draft.value.rolledAbilityScores.length < 6) {
        errors.push('Roll your ability scores first')
      } else {
        const assigned = Object.keys(draft.value.rollAssignments).length
        if (assigned < 6) errors.push(`Assign all rolled values (${assigned}/6 done)`)
      }
    }
    return errors
  }

  function validateFeats(): string[] {
    const errors: string[] = []
    const activeAsis = getAsiLevels(draft.value.classIndex).filter(l => l <= draft.value.level)
    for (const asiLevel of activeAsis) {
      const decision = draft.value.featsByLevel[asiLevel]
      const type = decision?.type ?? 'asi'
      if (type === 'feat') {
        if (!decision?.featIndex) { errors.push(`Level ${asiLevel} improvement: choose a feat`); break }
      } else {
        const spent = Object.values(draft.value.asiAllocations[asiLevel] ?? {}).reduce((s, v) => s + v, 0)
        if (spent < 2) { errors.push(`Level ${asiLevel} ASI: ${spent}/2 points allocated`); break }
      }
    }
    return errors
  }

  function validateSpells(): string[] {
    if (!isSpellcaster.value) return []
    const profile = getSpellProfile(draft.value.classIndex)
    if (!profile) return []
    const levelIdx = draft.value.level - 1
    const errors: string[] = []
    if (profile.castingType === 'known') {
      const incompleteLevels: number[] = []
      for (let lvl = 1; lvl <= draft.value.level; lvl++) {
        const cGain = cantripsGainedAtLevel(draft.value.classIndex, lvl)
        const sGain = spellsGainedAtLevel(draft.value.classIndex, lvl)
        const entry = draft.value.spellsByLevel[lvl]
        const gotC = entry?.cantripsGained?.length ?? 0
        const gotS = entry?.spellsGained?.length ?? 0
        if (gotC < cGain || gotS < sGain) incompleteLevels.push(lvl)
      }
      if (incompleteLevels.length > 0) {
        const lvlList = incompleteLevels.map(l => `Lv ${l}`).join(', ')
        errors.push(`Spells incomplete (${lvlList}) — open the highlighted sections below and pick the missing spells`)
      }
      // Pact of the Tome requires 3 cantrips from any class (Warlock is a known caster)
      if (draft.value.classIndex === 'warlock' && draft.value.level >= 3
          && draft.value.levelChoices[3]?.['pact-boon'] === 'tome') {
        const diff = 3 - draft.value.tomeCantrips.length
        if (diff > 0) errors.push(`Choose ${diff} more Book of Shadows cantrip${diff > 1 ? 's' : ''} (${draft.value.tomeCantrips.length}/3)`)
      }
    } else {
      const cantripLimit = profile.cantripsKnown[levelIdx] ?? 0
      if (cantripLimit > 0 && draft.value.selectedCantrips.length < cantripLimit) {
        const diff = cantripLimit - draft.value.selectedCantrips.length
        errors.push(`Select ${diff} more cantrip${diff > 1 ? 's' : ''} (${draft.value.selectedCantrips.length}/${cantripLimit})`)
      }
      if (draft.value.level >= getFirstSpellLevel(draft.value.classIndex)) {
        const slots = getSpellSlots(draft.value.classIndex, draft.value.level)
        const totalSlots = Object.values(slots).reduce((s: number, v) => s + (v as number), 0)
        const ability = profile.preparedAbility!
        const mod = computeModifier(effectiveScores.value[ability as keyof AbilityScores])
        const lv = draft.value.level
        const daily = Math.max(1, draft.value.classIndex === 'paladin' ? Math.floor(lv / 2) + mod : lv + mod)
        const limit = profile.castingType === 'spellbook' ? daily : Math.max(totalSlots, daily)
        if (profile.castingType === 'prepared') {
          const prepared = draft.value.selectedPreparedSpells.length
          if (limit > 0 && prepared < limit) {
            const diff = limit - prepared
            errors.push(`Prepare ${diff} more spell${diff > 1 ? 's' : ''} (${prepared}/${limit})`)
          }
        } else {
          if (limit > 0 && draft.value.selectedSpells.length < limit) {
            const diff = limit - draft.value.selectedSpells.length
            errors.push(`Select ${diff} more starting spell${diff > 1 ? 's' : ''} (${draft.value.selectedSpells.length}/${limit})`)
          }
        }
      }
    }
    return errors
  }

  // Step validation
  const stepErrors = computed<Record<number, string[]>>(() => {
    const abilityErrors  = validateAbilities()
    const featErrors     = validateFeats()
    const spellErrors    = validateSpells()

    return {
      1:  [
        !draft.value.classIndex ? 'Select a class' : '',
        draft.value.classIndex && draft.value.availableSubclasses.length > 0 && !draft.value.subclassIndex
          ? 'Select a subclass' : '',
      ].filter(Boolean),
      2:  (() => {
        if (!draft.value.classIndex) return []
        const errs: string[] = []
        for (let lvl = 1; lvl <= draft.value.level; lvl++) {
          const entry = getLevelEntry(draft.value.classIndex, lvl)
          if (!entry?.choices) continue
          for (const [key, choice] of Object.entries(entry.choices)) {
            if (choice.kind === 'asi') continue
            if (!draft.value.levelChoices[lvl]?.[key]) {
              const label = choice.kind === 'fighting-style' ? 'Fighting Style'
                : choice.kind === 'static' ? choice.label
                : key
              errs.push(`Level ${lvl}: choose a ${label}`)
              break
            }
          }
        }
        if (draft.value.classIndex === 'warlock' && draft.value.level >= 2) {
          const needed = getInvocationsCount(draft.value.level)
          const chosen = draft.value.selectedInvocations.length
          if (chosen < needed) errs.push(`Choose ${needed - chosen} more Eldritch Invocation${needed - chosen > 1 ? 's' : ''} (${chosen}/${needed})`)
        }
        return errs
      })(),
      3:  [
        !draft.value.raceIndex ? 'Select a race' : '',
        draft.value.availableSubraces.length > 0 && !draft.value.subraceIndex ? 'Select a subrace' : '',
      ].filter(Boolean),
      4:  [
        !draft.value.backgroundIndex ? 'Select a background' : '',
        draft.value.backgroundIndex === 'custom' && !draft.value.backgroundName.trim() ? 'Enter a background name' : '',
        draft.value.backgroundIndex === 'custom' && draft.value.backgroundSkillProficiencies.length < 2 ? 'Choose 2 skills for your custom background' : '',
      ].filter(Boolean),
      5:  abilityErrors,
      6:  featErrors,
      7:  [
        (() => {
          const chosenByClass = draft.value.selectedSkills.filter(
            s => !draft.value.backgroundSkillProficiencies.includes(s)
              && !draft.value.raceSkillProficiencies.includes(s)
          ).length
          const max = draft.value.classSkillChoices || 2
          return chosenByClass < max
            ? `Choose ${max} skill${max > 1 ? 's' : ''} (${chosenByClass} selected)` : ''
        })(),
        draft.value.raceProfChoices > 0 && draft.value.selectedRaceProfs.length < draft.value.raceProfChoices
          ? `Choose ${draft.value.raceProfChoices} race proficiency tool${draft.value.raceProfChoices > 1 ? 's' : ''} (${draft.value.selectedRaceProfs.length} selected)` : '',
      ].filter(Boolean),
      8:  spellErrors,
      9: [
        draft.value.hpMethod === 'roll' && draft.value.rolledHpPerLevel.length < draft.value.level
          ? `Roll HP for all ${draft.value.level} level${draft.value.level > 1 ? 's' : ''}` : '',
        draft.value.useStartingEquipment && !draft.value.equipmentChoicesDone
          ? 'Complete all equipment choices' : '',
      ].filter(Boolean),
      10: [
        !draft.value.name.trim() ? 'Name is required' : '',
      ].filter(Boolean),
      11: [],
    }
  })

  const canAdvance = computed(() => stepErrors.value[draft.value.currentStep]?.length === 0)

  // ── Persistence ───────────────────────────────────────────────────────────

  function loadDraft(): boolean {
    const saved = storageGet(DRAFT_KEY, DraftSchema)
    if (!saved) return false
    const merged = { ...defaultDraft(), ...(saved as Partial<BuilderDraft>) }
    if (!merged.classIndex) return false
    migrateKnownCasterSpells(merged)
    migrateKnownToPreparedCasterSpells(merged)
    draft.value = merged
    return true
  }

  // Migrate drafts saved before per-level spell tracking was introduced.
  // Known casters (Bard/Sorcerer/Warlock/Ranger) stored spells in flat selectedSpells;
  // distribute them into spellsByLevel following each level's gain count.
  function migrateKnownCasterSpells(d: BuilderDraft): void {
    const profile = getSpellProfile(d.classIndex)
    if (!profile || profile.castingType !== 'known') return
    if (Object.keys(d.spellsByLevel).length > 0) return
    if (d.selectedCantrips.length === 0 && d.selectedSpells.length === 0) return
    let ci = 0, si = 0
    for (let lvl = 1; lvl <= d.level; lvl++) {
      const cGain = cantripsGainedAtLevel(d.classIndex, lvl)
      const sGain = spellsGainedAtLevel(d.classIndex, lvl)
      if (cGain === 0 && sGain === 0) continue
      d.spellsByLevel[lvl] = {
        cantripsGained: d.selectedCantrips.slice(ci, ci + cGain),
        spellsGained:   d.selectedSpells.slice(si, si + sGain),
        spellReplaced:  null,
      }
      ci += cGain
      si += sGain
    }
  }

  // Migrate drafts where paladin was previously tracked as 'known' (spellsByLevel)
  // → flatten into selectedSpells for the prepared-caster UI.
  function migrateKnownToPreparedCasterSpells(d: BuilderDraft): void {
    const profile = getSpellProfile(d.classIndex)
    if (!profile || profile.castingType !== 'prepared') return
    if (Object.keys(d.spellsByLevel).length === 0) return
    if (d.selectedSpells.length > 0) return  // already migrated or user has data
    const pool = new Map<string, { index: string; name: string; level: number }>()
    for (let lvl = 1; lvl <= d.level; lvl++) {
      const entry = d.spellsByLevel[lvl]
      if (!entry) continue
      for (const s of entry.spellsGained) pool.set(s.index, s)
      if (entry.spellReplaced) {
        pool.delete(entry.spellReplaced.fromIndex)
        pool.set(entry.spellReplaced.to.index, entry.spellReplaced.to)
      }
    }
    d.selectedSpells = [...pool.values()]
    d.spellsByLevel = {}
  }

  function saveDraft() {
    if (_skipCount > 0) return
    storageSet(DRAFT_KEY, draft.value)
  }

  function debouncedSaveDraft() {
    if (_skipCount > 0) return
    if (_saveTimer) clearTimeout(_saveTimer)
    _saveTimer = setTimeout(saveDraft, 500)
  }

  async function clearDraft() {
    _skipCount++
    storageRemove(DRAFT_KEY)
    draft.value = defaultDraft()
    await nextTick()
    _skipCount--
  }

  watch(draft, debouncedSaveDraft, { deep: true })

  // ── Navigation ────────────────────────────────────────────────────────────

  const STEP_SKIPS: { step: number; skip: () => boolean }[] = [
    { step: 8, skip: () => !isSpellcaster.value },
  ]

  function resolveStep(target: number): number {
    let s = Math.max(1, Math.min(totalSteps.value, target))
    while (STEP_SKIPS.some(r => r.step === s && r.skip())) s++
    return Math.min(s, totalSteps.value)
  }

  function goTo(step: number) {
    draft.value.currentStep = resolveStep(step)
  }

  function next() {
    if (draft.value.currentStep >= TOTAL_STEPS) return
    let s = draft.value.currentStep + 1
    while (s < TOTAL_STEPS && STEP_SKIPS.some(r => r.step === s && r.skip())) s++
    draft.value.currentStep = s
  }

  function back() {
    if (draft.value.currentStep <= 1) return
    let s = draft.value.currentStep - 1
    while (s > 1 && STEP_SKIPS.some(r => r.step === s && r.skip())) s--
    draft.value.currentStep = s
  }

  // ── Point buy helpers ─────────────────────────────────────────────────────

  function canIncrement(key: keyof AbilityScores): boolean {
    const current = draft.value.baseScores[key]
    if (current >= POINT_BUY_MAX) return false
    return pointsRemaining.value >= pbCostDelta(current, current + 1)
  }

  function canDecrement(key: keyof AbilityScores): boolean {
    return draft.value.baseScores[key] > POINT_BUY_MIN
  }

  function incrementScore(key: keyof AbilityScores) {
    if (canIncrement(key)) draft.value.baseScores[key]++
  }

  function decrementScore(key: keyof AbilityScores) {
    if (canDecrement(key)) draft.value.baseScores[key]--
  }

  function applyStandardArray(ability: keyof AbilityScores, value: number) {
    draft.value.standardArrayAssignments[ability] = value
    draft.value.baseScores[ability] = value
  }

  function unassignStandardArray(ability: keyof AbilityScores) {
    delete draft.value.standardArrayAssignments[ability]
    draft.value.baseScores[ability] = ABILITY_SCORE_DEFAULT
  }

  // Atomic drop: reassigns draggedVal to targetAbility and swaps out its previous owner,
  // replacing both assignments and baseScores objects in one operation.
  function applyStandardArrayDrop(draggedVal: number, targetAbility: keyof AbilityScores) {
    const assignments = { ...draft.value.standardArrayAssignments }
    const scores      = { ...draft.value.baseScores }
    const prevAbility = (Object.entries(assignments) as [keyof AbilityScores, number][])
      .find(([k, v]) => k !== targetAbility && v === draggedVal)?.[0]
    const targetCurrent = assignments[targetAbility]
    if (prevAbility) {
      if (targetCurrent !== undefined) {
        assignments[prevAbility] = targetCurrent
        scores[prevAbility] = targetCurrent
      } else {
        delete assignments[prevAbility]
        scores[prevAbility] = ABILITY_SCORE_DEFAULT
      }
    }
    assignments[targetAbility] = draggedVal
    scores[targetAbility] = draggedVal
    draft.value.standardArrayAssignments = assignments
    draft.value.baseScores = scores
  }

  function resetScores() {
    draft.value.baseScores = { str: ABILITY_SCORE_DEFAULT, dex: ABILITY_SCORE_DEFAULT, con: ABILITY_SCORE_DEFAULT, int: ABILITY_SCORE_DEFAULT, wis: ABILITY_SCORE_DEFAULT, cha: ABILITY_SCORE_DEFAULT }
    draft.value.standardArrayAssignments = {}
    draft.value.rolledAbilityScores = []
    draft.value.rollAssignments = {}
  }

  // ── ASI helpers ───────────────────────────────────────────────────────────

  function setAsiAllocation(asiLevel: number, key: keyof AbilityScores, value: number) {
    if (!draft.value.asiAllocations[asiLevel]) draft.value.asiAllocations[asiLevel] = {}
    if (value <= 0) delete draft.value.asiAllocations[asiLevel][key]
    else draft.value.asiAllocations[asiLevel][key] = value
  }

  function setFeatDecision(level: number, type: 'asi' | 'feat', feat?: { index: string; name: string }) {
    draft.value.featsByLevel[level] = { type, featIndex: feat?.index, featName: feat?.name }
    if (type === 'feat') {
      // Clear any ASI allocation for this level when switching to feat
      delete draft.value.asiAllocations[level]
    }
  }

  // Clear ASI allocations and rolled HP that are no longer valid when class changes
  watch(() => draft.value.classIndex, () => {
    draft.value.asiAllocations = {}
    draft.value.rolledHpPerLevel = []
    draft.value.levelChoices = {}
    draft.value.featsByLevel = {}
    draft.value.spellsByLevel = {}
    draft.value.selectedSpells = []
    draft.value.selectedPreparedSpells = []
    draft.value.tomeCantrips = []
    draft.value.selectedInvocations = []
  })

  // Re-validate currentStep whenever skippable conditions change
  watch(isSpellcaster, () => {
    draft.value.currentStep = resolveStep(draft.value.currentStep)
  })
  watch(() => draft.value.level, (newLevel) => {
    for (const lvl of Object.keys(draft.value.asiAllocations).map(Number)) {
      if (lvl > newLevel) delete draft.value.asiAllocations[lvl]
    }
    for (const lvl of Object.keys(draft.value.featsByLevel).map(Number)) {
      if (lvl > newLevel) delete draft.value.featsByLevel[lvl]
    }
    for (const lvl of Object.keys(draft.value.spellsByLevel).map(Number)) {
      if (lvl > newLevel) delete draft.value.spellsByLevel[lvl]
    }
    if (draft.value.classIndex === 'warlock') {
      const maxInvocations = getInvocationsCount(newLevel)
      if (draft.value.selectedInvocations.length > maxInvocations) {
        draft.value.selectedInvocations = draft.value.selectedInvocations.slice(0, maxInvocations)
      }
    }
  })

  // ── Finalize ──────────────────────────────────────────────────────────────

  async function buildCharacterFromDraft(id: string, ts: string, portrait: { type: 'none' } | { type: 'url'; url: string }) {
    const d = draft.value
    const abbrev: Record<string, keyof AbilityScores> = {
      STR: 'str', DEX: 'dex', CON: 'con', INT: 'int', WIS: 'wis', CHA: 'cha',
    }
    const savingThrows: Record<keyof AbilityScores, boolean> = {
      str: false, dex: false, con: false, int: false, wis: false, cha: false,
    }
    for (const part of (CLASS_META[d.classIndex]?.saves ?? '').split('·')) {
      const key = abbrev[part.trim()]
      if (key) savingThrows[key] = true
    }

    let spellcasting = null
    if (d.classSpellcastingAbility) {
      const castingType = getSpellProfile(d.classIndex)?.castingType ?? 'known'
      const finalCantrips = castingType === 'known' ? activeCantrips.value : d.selectedCantrips
      const finalSpells   = castingType === 'known' ? activeSpells.value   : d.selectedSpells
      spellcasting = {
        spellcastingAbility: d.classSpellcastingAbility as 'str' | 'dex' | 'con' | 'int' | 'wis' | 'cha',
        slotsMax:  getSpellSlots(d.classIndex, d.level),
        slotsUsed: { level1:0, level2:0, level3:0, level4:0, level5:0, level6:0, level7:0, level8:0, level9:0 },
        cantripsKnown: finalCantrips.map(c => ({ ...c, level: 0 })),
        spellsKnown:    castingType === 'prepared' ? d.selectedSpells : finalSpells,
        spellsPrepared: castingType === 'prepared' ? d.selectedPreparedSpells
          : castingType === 'spellbook' ? finalSpells : [],
        // Wizard, Cleric, and Druid have the Ritual Casting class feature at level 1.
        // Bard (College of Lore) gets it at level 3, but subclass tracking is out of MVP scope.
        ritualCasting: ['wizard', 'cleric', 'druid'].includes(d.classIndex),
      }
    }

    const fightingStyles = Object.values(d.levelChoices)
      .flatMap(choices => Object.entries(choices))
      .filter(([key]) => key === 'fighting-style')
      .map(([, value]) => value)

    return CharacterSchema.parse({
      id,
      schemaVersion: '1.0',
      createdAt: ts,
      updatedAt: ts,
      portrait,
      fightingStyles,
      identity: {
        name: d.name.trim(),
        race: { index: d.raceIndex, name: d.raceName, speed: d.raceSpeed, sizeCategory: d.raceSizeCategory },
        subrace: d.subraceIndex ? { index: d.subraceIndex, name: d.subraceName } : null,
        class: { index: d.classIndex, name: d.className, hitDie: d.classHitDie, spellcastingAbility: d.classSpellcastingAbility },
        subclass: d.subclassIndex ? { index: d.subclassIndex, name: d.subclassName } : null,
        background: { index: d.backgroundIndex, name: d.backgroundName, skillProficiencies: d.backgroundSkillProficiencies, description: d.backgroundDescription || undefined },
        alignment: d.alignment,
        age: d.age || undefined,
        gender: d.gender || undefined,
        height: d.height || undefined,
        weight: d.weight || undefined,
        eyes: d.eyes || undefined,
        skin: d.skin || undefined,
        hair: d.hair || undefined,
        appearanceNotes: d.appearanceNotes || undefined,
      },
      personality: {
        personalityTraits: d.personalityTraits || undefined,
        ideals: d.ideals || undefined,
        bonds: d.bonds || undefined,
        flaws: d.flaws || undefined,
        biography: d.biography || undefined,
      },
      abilityScores: effectiveScores.value,
      combat: {
        level: d.level,
        maxHp: computedMaxHp.value,
        currentHp: computedMaxHp.value,
        tempHp: 0,
        armorClass: 10 + Math.floor((effectiveScores.value.dex - 10) / 2),
        inspiration: false,
        hitDiceRemaining: d.level,
        useMilestones: d.useMilestones,
      },
      skillProficiencies: [...new Set([...d.selectedSkills, ...d.backgroundSkillProficiencies, ...d.raceSkillProficiencies])]
        .reduce((acc, s) => ({ ...acc, [s]: 'proficient' }), {}),
      savingThrowProficiencies: savingThrows,
      languages: d.selectedLanguages,
      otherProficiencies: [
        ...d.backgroundToolProficiencies,
        ...d.raceProfOptions.filter(p => d.selectedRaceProfs.includes(p.index)).map(p => p.name),
      ],
      ...(() => {
        const t = getRaceTraits(d.raceIndex, d.subraceIndex || undefined)
        return { resistances: t.resistances, immunities: t.immunities, vulnerabilities: [], senses: t.senses }
      })(),
      attacks: [],
      inventory: d.startingInventory,
      currency: { cp: 0, sp: 0, ep: 0, gp: d.manualGold, pp: 0 },
      spellcasting,
      resources: getClassResources(d.classIndex, d.level, computeAllModifiers(effectiveScores.value)),
      favoriteSpells: [],
      features: [
        // Feats chosen at ASI levels
        ...Object.entries(d.featsByLevel)
          .filter(([, dec]) => dec.type === 'feat' && dec.featIndex)
          .map(([level, dec]) => ({
            id: generateId(),
            name: dec.featName ?? dec.featIndex ?? '',
            source: `Level ${level} Feat`,
            description: '',
            apiIndex: dec.featIndex,
          })),
        // Level choices (fighting styles, pact boons, etc.)
        ...Object.entries(d.levelChoices).flatMap(([lvlStr, choices]) => {
          const lvl = Number(lvlStr)
          if (lvl > d.level) return []
          return Object.entries(choices).flatMap(([choiceKey, chosenIndex]) => {
            if (choiceKey === 'fighting-style') return []  // already in character.fightingStyles
            const resolved = resolveChoiceFeature(d.classIndex, lvl, choiceKey, chosenIndex)
            if (!resolved) return []
            return [{ id: generateId(), name: resolved.name, source: resolved.source, description: resolved.description }]
          })
        }),
      ],
      overrides: {},
    })
  }

  async function save(): Promise<string> {
    saving.value = true
    saveError.value = null
    const characterStore = useCharactersStore()
    const auth = useAuthStore()
    const d = draft.value
    const ts = now()
    const id = generateId()

    try {
      let portrait: { type: 'none' } | { type: 'url'; url: string } = { type: 'none' }
      if (d.portraitUrl) {
        let portraitUrl = d.portraitUrl
        if (portraitUrl.startsWith('data:') && auth.isAuthenticated && auth.userId) {
          try {
            // portraitUrl is already a compressed JPEG data URL (compressPortrait
            // ran at ingestion) — upload the blob directly without re-compressing.
            const blob = await fetch(portraitUrl).then(r => r.blob())
            portraitUrl = await uploadPortraitBlob(blob, auth.userId, id)
          } catch { /* keep data URL on upload failure */ }
        }
        // Accept http(s) (uploaded) and data:image (local/unauthenticated) URLs.
        if (/^https?:\/\//i.test(portraitUrl) || /^data:image\//i.test(portraitUrl)) {
          portrait = { type: 'url', url: portraitUrl }
        }
      }

      const character = await buildCharacterFromDraft(id, ts, portrait)
      await characterStore.create(character)
      // clearDraft() is called by the caller (CharacterBuilderPage) AFTER router.replace()
      // so that step transitions don't fire while the overlay is still visible.
      return id
    } catch (err) {
      saveError.value = err instanceof Error ? err.message : 'Could not save character. Please try again.'
      throw err
    } finally {
      saving.value = false
    }
  }

  return {
    draft,
    saving,
    saveError,
    totalSteps,
    isSpellcaster,
    effectiveScores,
    pointsSpent,
    pointsRemaining,
    computedMaxHp,
    stepErrors,
    canAdvance,
    loadDraft,
    saveDraft,
    clearDraft,
    goTo,
    next,
    back,
    canIncrement,
    canDecrement,
    incrementScore,
    decrementScore,
    applyStandardArray,
    unassignStandardArray,
    applyStandardArrayDrop,
    resetScores,
    setAsiAllocation,
    setFeatDecision,
    activeCantrips,
    activeSpells,
    save,
  }
})
