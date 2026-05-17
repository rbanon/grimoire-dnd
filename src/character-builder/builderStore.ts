import { defineStore } from 'pinia'
import { ref, computed, watch, nextTick } from 'vue'
import { z } from 'zod'
import type { Alignment, AbilityScores, InventoryItem } from '@/shared/types/character'
import { CharacterSchema, computeModifier } from '@/shared/types/character'
import { storageGet, storageSet, storageRemove } from '@/shared/lib/storage'
import { generateId, now } from '@/shared/lib/uuid'
import { useCharactersStore } from '@/characters/store'
import { getSpellSlots, getSpellProfile, getAsiLevels, getLevelEntry } from '@/character-builder/classMeta'

const DRAFT_KEY = 'builder-draft'
const TOTAL_STEPS = 11

// ── Point buy constants ───────────────────────────────────────────────────────
export const POINT_BUY_BUDGET = 27
export const POINT_BUY_MIN = 8
export const POINT_BUY_MAX = 15
// Cumulative cost from score 8
const PB_COST: Record<number, number> = { 8: 0, 9: 1, 10: 2, 11: 3, 12: 4, 13: 5, 14: 7, 15: 9 }
export const STANDARD_ARRAY = [15, 14, 13, 12, 10, 8]

export function pbCost(score: number): number { return PB_COST[score] ?? 0 }
export function pbCostDelta(from: number, to: number): number {
  return pbCost(to) - pbCost(from)
}

// ── Draft shape ───────────────────────────────────────────────────────────────
export interface BuilderDraft {
  // Internal — holy symbol / emblem descriptions keyed by slot "${gi}_${si}"
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
  backgroundSkillProficiencies: string[]
  backgroundToolProficiencies: string[]

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

  // Step 4 — Proficiencies
  selectedSkills: string[]
  selectedLanguages: string[]

  // Step 5 — Equipment (simplified for MVP)
  useStartingEquipment: boolean
  manualGold: number

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
  backgroundIndex: '', backgroundName: '', backgroundSkillProficiencies: [], backgroundToolProficiencies: [],
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
  useStartingEquipment: true, manualGold: 0,
  startingInventory: [],
  levelChoices: {},
  featsByLevel: {},
  asiAllocations: {},
  selectedCantrips: [], selectedSpells: [],
})

const DraftSchema = z.object({ currentStep: z.number() }).passthrough()

export const useBuilderStore = defineStore('builder', () => {
  const draft = ref<BuilderDraft>(defaultDraft())
  const saving = ref(false)
  const saveError = ref<string | null>(null)
  let _skipSave = false

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

  // Step validation
  const stepErrors = computed<Record<number, string[]>>(() => {
    // Step 3 ability errors
    const abilityErrors: string[] = []
    if (draft.value.abilityMethod === 'pointbuy') {
      if (pointsRemaining.value < 0) abilityErrors.push('Too many points spent')
      else if (pointsRemaining.value > 0) abilityErrors.push(`${pointsRemaining.value} point${pointsRemaining.value > 1 ? 's' : ''} left to spend`)
    } else if (draft.value.abilityMethod === 'standard') {
      const assigned = Object.keys(draft.value.standardArrayAssignments).length
      if (assigned < 6) abilityErrors.push(`Assign all standard array values (${assigned}/6 done)`)
    } else if (draft.value.abilityMethod === 'roll') {
      if (draft.value.rolledAbilityScores.length < 6) {
        abilityErrors.push('Roll your ability scores first')
      } else {
        const assigned = Object.keys(draft.value.rollAssignments).length
        if (assigned < 6) abilityErrors.push(`Assign all rolled values (${assigned}/6 done)`)
      }
    }

    const featErrors = (() => {
      const errors: string[] = []
      const activeAsis = getAsiLevels(draft.value.classIndex).filter(l => l <= draft.value.level)
      for (const asiLevel of activeAsis) {
        const decision = draft.value.featsByLevel[asiLevel]
        const type = decision?.type ?? 'asi'
        if (type === 'feat') {
          if (!decision?.featIndex) {
            errors.push(`Level ${asiLevel} improvement: choose a feat`)
            break
          }
        } else {
          const spent = Object.values(draft.value.asiAllocations[asiLevel] ?? {}).reduce((s, v) => s + v, 0)
          if (spent < 2) {
            errors.push(`Level ${asiLevel} ASI: ${spent}/2 points allocated`)
            break
          }
        }
      }
      return errors
    })()

    const spellErrors = (() => {
      if (!isSpellcaster.value) return []
      const profile = getSpellProfile(draft.value.classIndex)
      if (!profile) return []
      const levelIdx = draft.value.level - 1
      const errors: string[] = []
      const cantripLimit = profile.cantripsKnown[levelIdx] ?? 0
      if (cantripLimit > 0 && draft.value.selectedCantrips.length < cantripLimit) {
        errors.push(`Select ${cantripLimit - draft.value.selectedCantrips.length} more cantrip${cantripLimit - draft.value.selectedCantrips.length > 1 ? 's' : ''} (${draft.value.selectedCantrips.length}/${cantripLimit})`)
      }
      if (profile.castingType === 'known') {
        const spellLimit = profile.spellsKnown?.[levelIdx] ?? 0
        if (spellLimit > 0 && draft.value.selectedSpells.length < spellLimit) {
          errors.push(`Select ${spellLimit - draft.value.selectedSpells.length} more spell${spellLimit - draft.value.selectedSpells.length > 1 ? 's' : ''} (${draft.value.selectedSpells.length}/${spellLimit})`)
        }
      } else if (draft.value.level >= 2) {
        const slots = getSpellSlots(draft.value.classIndex, draft.value.level)
        const totalSlots = Object.values(slots).reduce((s: number, v) => s + (v as number), 0)
        const ability = profile.preparedAbility!
        const mod = computeModifier(effectiveScores.value[ability as keyof AbilityScores])
        const lv = draft.value.level
        const daily = Math.max(1, draft.value.classIndex === 'paladin' ? Math.floor(lv / 2) + mod : lv + mod)
        const limit = profile.castingType === 'spellbook' ? daily : Math.max(totalSlots, daily)
        if (limit > 0 && draft.value.selectedSpells.length < limit) {
          errors.push(`Select ${limit - draft.value.selectedSpells.length} more starting spell${limit - draft.value.selectedSpells.length > 1 ? 's' : ''} (${draft.value.selectedSpells.length}/${limit})`)
        }
      }
      return errors
    })()

    return {
      1:  [
        !draft.value.classIndex ? 'Select a class' : '',
        draft.value.classIndex && draft.value.level >= 3 && draft.value.availableSubclasses.length > 0 && !draft.value.subclassIndex
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
        return errs
      })(),
      3:  [
        !draft.value.raceIndex ? 'Select a race' : '',
        draft.value.availableSubraces.length > 0 && !draft.value.subraceIndex ? 'Select a subrace' : '',
      ].filter(Boolean),
      4:  [
        !draft.value.backgroundIndex ? 'Select a background' : '',
      ].filter(Boolean),
      5:  abilityErrors,
      6:  featErrors,
      7:  [
        draft.value.selectedSkills.length < (draft.value.classSkillChoices || 2)
          ? `Choose ${draft.value.classSkillChoices || 2} skill${(draft.value.classSkillChoices || 2) > 1 ? 's' : ''} (${draft.value.selectedSkills.length} selected)` : '',
      ].filter(Boolean),
      8:  spellErrors,
      9:  [],
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
    if (!merged.name && !merged.raceIndex && !merged.classIndex) return false
    draft.value = merged
    return true
  }

  function saveDraft() {
    if (_skipSave) return
    storageSet(DRAFT_KEY, draft.value)
  }

  async function clearDraft() {
    _skipSave = true
    storageRemove(DRAFT_KEY)
    draft.value = defaultDraft()
    await nextTick()
    _skipSave = false
  }

  watch(draft, saveDraft, { deep: true })

  // ── Navigation ────────────────────────────────────────────────────────────

  function goTo(step: number) {
    draft.value.currentStep = step
  }

  function next() {
    if (draft.value.currentStep < TOTAL_STEPS) {
      // Skip spells step (8) if not a spellcaster
      if (draft.value.currentStep === 7 && !isSpellcaster.value) {
        draft.value.currentStep = 9
      } else {
        draft.value.currentStep++
      }
    }
  }

  function back() {
    if (draft.value.currentStep > 1) {
      if (draft.value.currentStep === 9 && !isSpellcaster.value) {
        draft.value.currentStep = 7
      } else {
        draft.value.currentStep--
      }
    }
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

  function resetScores() {
    draft.value.baseScores = { str: 8, dex: 8, con: 8, int: 8, wis: 8, cha: 8 }
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
  })
  watch(() => draft.value.level, (newLevel) => {
    for (const lvl of Object.keys(draft.value.asiAllocations).map(Number)) {
      if (lvl > newLevel) delete draft.value.asiAllocations[lvl]
    }
    for (const lvl of Object.keys(draft.value.featsByLevel).map(Number)) {
      if (lvl > newLevel) delete draft.value.featsByLevel[lvl]
    }
  })

  // ── Finalize ──────────────────────────────────────────────────────────────

  async function save(): Promise<string> {
    saving.value = true
    saveError.value = null
    const characterStore = useCharactersStore()
    const d = draft.value
    const ts = now()
    const id = generateId()

    try {
    let portrait: { type: 'none' } | { type: 'url'; url: string } = { type: 'none' }
    if (d.portraitUrl) {
      try { new URL(d.portraitUrl); portrait = { type: 'url', url: d.portraitUrl } } catch { /* skip invalid URL */ }
    }

    const character = CharacterSchema.parse({
      id,
      schemaVersion: '1.0',
      createdAt: ts,
      updatedAt: ts,
      portrait,
      identity: {
        name: d.name.trim(),
        race: { index: d.raceIndex, name: d.raceName, speed: d.raceSpeed, sizeCategory: d.raceSizeCategory },
        subrace: d.subraceIndex ? { index: d.subraceIndex, name: d.subraceName } : null,
        class: { index: d.classIndex, name: d.className, hitDie: d.classHitDie, spellcastingAbility: d.classSpellcastingAbility },
        subclass: d.subclassIndex ? { index: d.subclassIndex, name: d.subclassName } : null,
        background: { index: d.backgroundIndex, name: d.backgroundName, skillProficiencies: d.backgroundSkillProficiencies },
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
      skillProficiencies: d.selectedSkills.reduce((acc, s) => ({ ...acc, [s]: 'proficient' }), {}),
      savingThrowProficiencies: { str: false, dex: false, con: false, int: false, wis: false, cha: false },
      languages: d.selectedLanguages,
      otherProficiencies: d.backgroundToolProficiencies,
      resistances: [], immunities: [], vulnerabilities: [], senses: [],
      attacks: [],
      inventory: d.startingInventory,
      currency: { cp: 0, sp: 0, ep: 0, gp: d.manualGold, pp: 0 },
      spellcasting: d.classSpellcastingAbility ? (() => {
        const castingType = getSpellProfile(d.classIndex)?.castingType ?? 'known'
        return {
          spellcastingAbility: d.classSpellcastingAbility as 'str' | 'dex' | 'con' | 'int' | 'wis' | 'cha',
          slotsMax:  getSpellSlots(d.classIndex, d.level),
          slotsUsed: { level1:0, level2:0, level3:0, level4:0, level5:0, level6:0, level7:0, level8:0, level9:0 },
          cantripsKnown: d.selectedCantrips.map(c => ({ ...c, level: 0 })),
          // known → spellsKnown; prepared → spellsPrepared; spellbook → both (spellbook + prepared)
          spellsKnown:    castingType === 'known' || castingType === 'spellbook' ? d.selectedSpells : [],
          spellsPrepared: castingType === 'prepared' || castingType === 'spellbook' ? d.selectedSpells : [],
          ritualCasting: false,
        }
      })() : null,
      favoriteSpells: [],
      features: [],
      overrides: {},
    })

    await characterStore.create(character)
    await clearDraft()
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
    resetScores,
    setAsiAllocation,
    setFeatDecision,
    save,
  }
})
