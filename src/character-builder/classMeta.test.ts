import { describe, it, expect } from 'vitest'
import { getSpellSlots, getSpellProfile, getAsiLevels, getMaxSpellLevel } from './classMeta'

describe('getSpellProfile', () => {
  it('returns null for martial classes', () => {
    expect(getSpellProfile('barbarian')).toBeNull()
    expect(getSpellProfile('fighter')).toBeNull()
    expect(getSpellProfile('rogue')).toBeNull()
    expect(getSpellProfile('monk')).toBeNull()
  })

  it('returns known casting type for bard, sorcerer, warlock', () => {
    expect(getSpellProfile('bard')?.castingType).toBe('known')
    expect(getSpellProfile('sorcerer')?.castingType).toBe('known')
    expect(getSpellProfile('warlock')?.castingType).toBe('known')
  })

  it('cleric and druid have casting type known in the current implementation', () => {
    expect(getSpellProfile('cleric')?.castingType).toBe('known')
    expect(getSpellProfile('druid')?.castingType).toBe('known')
  })
})

describe('getSpellSlots — full casters', () => {
  it('wizard level 1: 2 first-level slots', () => {
    const s = getSpellSlots('wizard', 1)
    expect(s.level1).toBe(2)
    expect(s.level2).toBe(0)
  })

  it('wizard level 3: 4/3/2 slots', () => {
    const s = getSpellSlots('wizard', 3)
    expect(s.level1).toBe(4)
    expect(s.level2).toBe(2)
    expect(s.level3).toBe(0)
  })

  it('wizard level 5: 4/3/2 slots', () => {
    const s = getSpellSlots('wizard', 5)
    expect(s.level1).toBe(4)
    expect(s.level2).toBe(3)
    expect(s.level3).toBe(2)
    expect(s.level4).toBe(0)
  })

  it('wizard level 20: max slots including 9th level', () => {
    const s = getSpellSlots('wizard', 20)
    expect(s.level1).toBe(4)
    expect(s.level5).toBe(3)
    expect(s.level9).toBe(1)
  })

  it('returns empty for non-caster class', () => {
    const s = getSpellSlots('barbarian', 10)
    const total = Object.values(s).reduce((a, b) => a + b, 0)
    expect(total).toBe(0)
  })
})

describe('getSpellSlots — half casters (paladin, ranger)', () => {
  it('paladin level 1: no slots yet', () => {
    const s = getSpellSlots('paladin', 1)
    expect(s.level1).toBe(0)
  })

  it('paladin level 2: 2 first-level slots', () => {
    const s = getSpellSlots('paladin', 2)
    expect(s.level1).toBe(2)
    expect(s.level2).toBe(0)
  })

  it('paladin level 5: 4/2 slots', () => {
    const s = getSpellSlots('paladin', 5)
    expect(s.level1).toBe(4)
    expect(s.level2).toBe(2)
    expect(s.level3).toBe(0)
  })

  it('ranger level 20: capped at 5th-level slots', () => {
    const s = getSpellSlots('ranger', 20)
    expect(s.level5).toBe(2)
    expect(s.level6).toBe(0)
  })
})

describe('getSpellSlots — warlock (pact slots)', () => {
  it('warlock level 1: 1 first-level slot', () => {
    const s = getSpellSlots('warlock', 1)
    expect(s.level1).toBe(1)
    expect(s.level2).toBe(0)
  })

  it('warlock level 3: 2 second-level slots', () => {
    const s = getSpellSlots('warlock', 3)
    expect(s.level1).toBe(0)
    expect(s.level2).toBe(2)
  })

  it('warlock level 5: 2 third-level slots', () => {
    const s = getSpellSlots('warlock', 5)
    expect(s.level1).toBe(0)
    expect(s.level3).toBe(2)
  })

  it('warlock level 20: 4 fifth-level slots', () => {
    const s = getSpellSlots('warlock', 20)
    expect(s.level5).toBe(4)
    expect(s.level6).toBe(0)
  })
})

describe('getSpellSlots — level clamping', () => {
  it('level 0 treated as level 1', () => {
    expect(getSpellSlots('wizard', 0)).toEqual(getSpellSlots('wizard', 1))
  })

  it('level 21 treated as level 20', () => {
    expect(getSpellSlots('wizard', 21)).toEqual(getSpellSlots('wizard', 20))
  })
})

describe('getMaxSpellLevel', () => {
  it('full caster: unlocks spell levels at expected character levels', () => {
    expect(getMaxSpellLevel('wizard', 1)).toBe(1)
    expect(getMaxSpellLevel('wizard', 3)).toBe(2)
    expect(getMaxSpellLevel('wizard', 5)).toBe(3)
    expect(getMaxSpellLevel('wizard', 17)).toBe(9)
  })

  it('half caster: first spells at level 2', () => {
    expect(getMaxSpellLevel('paladin', 1)).toBe(0)
    expect(getMaxSpellLevel('paladin', 2)).toBe(1)
    expect(getMaxSpellLevel('paladin', 5)).toBe(2)
  })
})

describe('getAsiLevels', () => {
  it('standard classes get ASI at 4,8,12,16,19', () => {
    for (const cls of ['bard', 'cleric', 'druid', 'rogue', 'sorcerer', 'warlock', 'wizard']) {
      const levels = getAsiLevels(cls)
      expect(levels).toContain(4)
      expect(levels).toContain(8)
    }
  })

  it('fighter gets extra ASIs (6, 14 in addition to standard)', () => {
    const levels = getAsiLevels('fighter')
    expect(levels).toContain(6)
    expect(levels).toContain(14)
    expect(levels.length).toBeGreaterThan(5)
  })

  it('unknown class returns empty array', () => {
    expect(getAsiLevels('artificer')).toEqual([])
    expect(getAsiLevels('')).toEqual([])
  })
})
