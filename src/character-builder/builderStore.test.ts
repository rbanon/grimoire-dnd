import { describe, it, expect, beforeEach, vi } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'

// Mock browser APIs unavailable in Node environment
vi.mock('@/shared/lib/storage', () => ({
  storageGet: vi.fn().mockReturnValue(null),
  storageSet: vi.fn(),
  storageRemove: vi.fn(),
}))

vi.mock('@/shared/api/supabase.client', () => ({
  supabase: {
    auth: {
      getSession: vi.fn().mockResolvedValue({ data: { session: null } }),
      onAuthStateChange: vi.fn(),
    },
  },
}))

import { useBuilderStore } from './builderStore'
import type { BuilderDraft } from './builderStore'
import { useCharactersStore } from '@/characters/store'
import type { Character } from '@/shared/types/character'

function makeStore(overrides: Partial<{
  hpMethod: BuilderDraft['hpMethod']
  classHitDie: number
  level: number
  conScore: number
  manualMaxHp: number
  rolls: number[]
}> = {}) {
  const store = useBuilderStore()
  const {
    hpMethod = 'average', classHitDie = 8, level = 1,
    conScore = 10, manualMaxHp = 8, rolls = [],
  } = overrides
  store.draft.hpMethod = hpMethod
  store.draft.classHitDie = classHitDie
  store.draft.level = level
  store.draft.baseScores.con = conScore
  store.draft.manualMaxHp = manualMaxHp
  store.draft.rolledHpPerLevel = rolls
  return store
}

describe('computedMaxHp — max method', () => {
  beforeEach(() => { setActivePinia(createPinia()) })

  it('level 1 fighter: hitDie + conMod', () => {
    const store = makeStore({ hpMethod: 'max', classHitDie: 10, level: 1, conScore: 14 })
    expect(store.computedMaxHp).toBe(12) // 10 + 2
  })

  it('level 3: multiplied across all levels', () => {
    const store = makeStore({ hpMethod: 'max', classHitDie: 10, level: 3, conScore: 14 })
    expect(store.computedMaxHp).toBe(36) // 3 × (10 + 2)
  })

  it('negative conMod is applied but minimum 1 per level', () => {
    const store = makeStore({ hpMethod: 'max', classHitDie: 6, level: 2, conScore: 6 })
    expect(store.computedMaxHp).toBe(8) // 2 × max(1, 6 + (-2)) = 2 × 4
  })

  it('extreme negative conMod: minimum 1 per level enforced', () => {
    const store = makeStore({ hpMethod: 'max', classHitDie: 6, level: 3, conScore: 1 })
    expect(store.computedMaxHp).toBe(3) // 3 × max(1, 6 + (-5)) = 3 × 1
  })
})

describe('computedMaxHp — average method', () => {
  beforeEach(() => { setActivePinia(createPinia()) })

  it('level 1: full hitDie + conMod', () => {
    const store = makeStore({ hpMethod: 'average', classHitDie: 8, level: 1, conScore: 10 })
    expect(store.computedMaxHp).toBe(8)
  })

  it('level 3 wizard (d6, +1 con): 7 + 5 + 5', () => {
    // avg d6 = floor(6/2)+1 = 4; +1 con = 5 per level after 1
    // lv1: max(1, 6+1) = 7; lv2-3: 2 × max(1, 4+1) = 10 → total 17
    const store = makeStore({ hpMethod: 'average', classHitDie: 6, level: 3, conScore: 12 })
    expect(store.computedMaxHp).toBe(17)
  })

  it('negative conMod: minimum 1 per non-first level', () => {
    // avg d8 = 5; con 6 (mod -2) → max(1, 5-2) = max(1,3) = 3
    // lv1: max(1, 8-2) = 6; lv2: max(1, 3) = 3 → total 9
    const store = makeStore({ hpMethod: 'average', classHitDie: 8, level: 2, conScore: 6 })
    expect(store.computedMaxHp).toBe(9)
  })
})

describe('computedMaxHp — roll method', () => {
  beforeEach(() => { setActivePinia(createPinia()) })

  it('returns 0 when fewer rolls than levels', () => {
    const store = makeStore({ hpMethod: 'roll', classHitDie: 8, level: 3, rolls: [5, 4] })
    expect(store.computedMaxHp).toBe(0)
  })

  it('returns 0 when no rolls at all', () => {
    const store = makeStore({ hpMethod: 'roll', classHitDie: 8, level: 2, rolls: [] })
    expect(store.computedMaxHp).toBe(0)
  })

  it('level 1: always uses full hitDie regardless of roll value', () => {
    // rolls[0] is ignored; code uses `hd` for idx 0
    const store = makeStore({ hpMethod: 'roll', classHitDie: 8, level: 1, conScore: 10, rolls: [2] })
    expect(store.computedMaxHp).toBe(8)
  })

  it('level 2: level 1 = hitDie, level 2 = roll', () => {
    const store = makeStore({ hpMethod: 'roll', classHitDie: 8, level: 2, conScore: 10, rolls: [2, 6] })
    expect(store.computedMaxHp).toBe(14) // 8 + 6
  })

  it('adds conMod to each level', () => {
    const store = makeStore({ hpMethod: 'roll', classHitDie: 8, level: 2, conScore: 14, rolls: [3, 5] })
    // lv1: max(1, 8+2) = 10; lv2: max(1, 5+2) = 7 → 17
    expect(store.computedMaxHp).toBe(17)
  })
})

describe('computedMaxHp — manual method', () => {
  beforeEach(() => { setActivePinia(createPinia()) })

  it('returns manualMaxHp directly', () => {
    const store = makeStore({ hpMethod: 'manual', manualMaxHp: 42 })
    expect(store.computedMaxHp).toBe(42)
  })

  it('ignores all other fields', () => {
    const store = makeStore({ hpMethod: 'manual', classHitDie: 12, level: 10, manualMaxHp: 1 })
    expect(store.computedMaxHp).toBe(1)
  })
})

describe('custom (homebrew) race', () => {
  beforeEach(() => { setActivePinia(createPinia()) })

  it('effectiveScores sum custom race ability bonuses onto the base scores', () => {
    const store = useBuilderStore()
    store.draft.raceIndex = 'custom'
    store.draft.baseScores = { str: 15, dex: 10, con: 13, int: 8, wis: 12, cha: 10 }
    store.draft.raceAbilityBonuses = { str: 2, con: 1 }
    expect(store.effectiveScores.str).toBe(17)
    expect(store.effectiveScores.con).toBe(14)
    expect(store.effectiveScores.dex).toBe(10) // unaffected
  })

  it('step-3 validation requires a name for a custom race', () => {
    const store = useBuilderStore()
    store.draft.raceIndex = 'custom'
    store.draft.raceName = ''
    expect(store.stepErrors[3]).toContain('Name your custom race')
    store.draft.raceName = 'Stormborn'
    expect(store.stepErrors[3]).not.toContain('Name your custom race')
  })

  it('build bakes homebrew bonuses, defenses, senses, skills, tools and traits into the character', async () => {
    const store = useBuilderStore()
    // Capture the character passed to the characters store (bypasses persistence).
    const chars = useCharactersStore()
    const createSpy = vi.spyOn(chars, 'create').mockImplementation(async (c) => c as Character)

    store.draft.name = 'Test Hero'
    store.draft.raceIndex = 'custom'
    store.draft.raceName = 'Stormborn'
    store.draft.raceSpeed = 35
    store.draft.raceSizeCategory = 'Small'
    store.draft.baseScores = { str: 8, dex: 14, con: 12, int: 10, wis: 10, cha: 15 }
    store.draft.raceAbilityBonuses = { cha: 2, dex: 1 }
    store.draft.raceResistances = ['lightning', 'thunder']
    store.draft.raceDarkvision = 60
    store.draft.raceSkillProficiencies = ['perception']
    store.draft.raceCustomToolProfs = ["Smith's tools"]
    store.draft.raceCustomTraits = [{ name: 'Stormborn', desc: 'Resistance to lightning and thunder.' }]

    await store.save()

    expect(createSpy).toHaveBeenCalledOnce()
    const built = createSpy.mock.calls[0][0] as Character

    // Bonuses summed onto the sheet
    expect(built.abilityScores.cha).toBe(17) // 15 + 2
    expect(built.abilityScores.dex).toBe(15) // 14 + 1
    // Race snapshot
    expect(built.identity.race.index).toBe('custom')
    expect(built.identity.race.name).toBe('Stormborn')
    expect(built.identity.race.speed).toBe(35)
    expect(built.identity.race.sizeCategory).toBe('Small')
    // Homebrew defenses / senses / proficiencies baked in
    expect(built.resistances).toEqual(expect.arrayContaining(['lightning', 'thunder']))
    expect(built.senses).toContain('Darkvision 60 ft.')
    expect(built.skillProficiencies).toHaveProperty('perception')
    expect(built.otherProficiencies).toContain("Smith's tools")
    // Trait surfaced as a feature on the sheet
    expect(built.features.some(f => f.name === 'Stormborn')).toBe(true)
  })
})
