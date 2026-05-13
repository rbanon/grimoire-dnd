import { defineStore } from 'pinia'
import { ref, computed, watch } from 'vue'
import { z } from 'zod'
import type { Alignment, AbilityScores } from '@/shared/types/character'
import { CharacterSchema } from '@/shared/types/character'
import { storageGet, storageSet, storageRemove } from '@/shared/lib/storage'
import { generateId, now } from '@/shared/lib/uuid'
import { useCharactersStore } from '@/characters/store'

const DRAFT_KEY = 'builder-draft'
const TOTAL_STEPS = 7

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
  subraceIndex: string
  subraceName: string
  subraceAbilityBonuses: Partial<Record<keyof AbilityScores, number>>
  availableSubraces: { index: string; name: string }[]

  // Step 1c — Background
  backgroundIndex: string
  backgroundName: string
  backgroundSkillProficiencies: string[]

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
  hpMethod: 'average' | 'max' | 'manual'
  manualMaxHp: number

  // Step 3 — Abilities
  abilityMethod: 'pointbuy' | 'standard' | 'manual'
  baseScores: AbilityScores
  standardArrayAssignments: Partial<Record<keyof AbilityScores, number>> // which index in STANDARD_ARRAY

  // Step 4 — Proficiencies
  selectedSkills: string[]
  selectedLanguages: string[]

  // Step 5 — Equipment (simplified for MVP)
  useStartingEquipment: boolean
  manualGold: number

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
  raceAbilityBonuses: {}, subraceIndex: '', subraceName: '',
  subraceAbilityBonuses: {}, availableSubraces: [],
  backgroundIndex: '', backgroundName: '', backgroundSkillProficiencies: [],
  classIndex: '', className: '', classHitDie: 8, classSpellcastingAbility: null,
  classSkillChoices: 2, classSkillOptions: [],
  subclassIndex: '', subclassName: '', availableSubclasses: [],
  level: 1, useMilestones: false, hpMethod: 'average', manualMaxHp: 8,
  abilityMethod: 'pointbuy',
  baseScores: { str: 8, dex: 8, con: 8, int: 8, wis: 8, cha: 8 },
  standardArrayAssignments: {},
  selectedSkills: [], selectedLanguages: [],
  useStartingEquipment: true, manualGold: 0,
  selectedCantrips: [], selectedSpells: [],
})

const DraftSchema = z.object({ currentStep: z.number() }).passthrough()

export const useBuilderStore = defineStore('builder', () => {
  const draft = ref<BuilderDraft>(defaultDraft())
  const saving = ref(false)
  const saveError = ref<string | null>(null)

  // ── Computed ──────────────────────────────────────────────────────────────

  const isSpellcaster = computed(() => draft.value.classSpellcastingAbility !== null)
  const totalSteps = computed(() => isSpellcaster.value ? TOTAL_STEPS : TOTAL_STEPS - 1)

  // Effective ability scores (base + racial bonuses)
  const effectiveScores = computed<AbilityScores>(() => {
    const b = draft.value.baseScores
    const rb = draft.value.raceAbilityBonuses
    const sb = draft.value.subraceAbilityBonuses
    const keys: (keyof AbilityScores)[] = ['str', 'dex', 'con', 'int', 'wis', 'cha']
    return keys.reduce((acc, k) => {
      acc[k] = b[k] + (rb[k] ?? 0) + (sb[k] ?? 0)
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
    if (draft.value.hpMethod === 'max') return hd * lv + conMod * lv
    if (draft.value.hpMethod === 'average') {
      const avg = Math.floor(hd / 2) + 1
      return hd + (avg * (lv - 1)) + conMod * lv
    }
    return draft.value.manualMaxHp
  })

  // Step validation
  const stepErrors = computed<Record<number, string[]>>(() => ({
    1: [
      !draft.value.name.trim() ? 'Name is required' : '',
      !draft.value.raceIndex ? 'Select a race' : '',
      !draft.value.backgroundIndex ? 'Select a background' : '',
    ].filter(Boolean),
    2: [!draft.value.classIndex ? 'Select a class' : ''].filter(Boolean),
    3: [
      draft.value.abilityMethod === 'pointbuy' && pointsRemaining.value < 0
        ? 'Too many points spent' : '',
    ].filter(Boolean),
    4: [], 5: [], 6: [], 7: [],
  }))

  const canAdvance = computed(() => stepErrors.value[draft.value.currentStep]?.length === 0)

  // ── Persistence ───────────────────────────────────────────────────────────

  function loadDraft(): boolean {
    const saved = storageGet(DRAFT_KEY, DraftSchema)
    if (saved) {
      draft.value = { ...defaultDraft(), ...(saved as Partial<BuilderDraft>) }
      return true
    }
    return false
  }

  function saveDraft() {
    storageSet(DRAFT_KEY, draft.value)
  }

  function clearDraft() {
    storageRemove(DRAFT_KEY)
    draft.value = defaultDraft()
  }

  watch(draft, saveDraft, { deep: true })

  // ── Navigation ────────────────────────────────────────────────────────────

  function goTo(step: number) {
    draft.value.currentStep = step
  }

  function next() {
    if (draft.value.currentStep < totalSteps.value) {
      // Skip spells step if not a spellcaster
      if (draft.value.currentStep === 5 && !isSpellcaster.value) {
        draft.value.currentStep = 7
      } else {
        draft.value.currentStep++
      }
    }
  }

  function back() {
    if (draft.value.currentStep > 1) {
      if (draft.value.currentStep === 7 && !isSpellcaster.value) {
        draft.value.currentStep = 5
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
  }

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
      otherProficiencies: [],
      resistances: [], immunities: [], vulnerabilities: [], senses: [],
      attacks: [],
      inventory: [],
      currency: { cp: 0, sp: 0, ep: 0, gp: d.manualGold, pp: 0 },
      spellcasting: null,
      favoriteSpells: [],
      features: [],
      overrides: {},
    })

    await characterStore.create(character)
    clearDraft()
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
    save,
  }
})
