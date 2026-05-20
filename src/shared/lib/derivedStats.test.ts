import { describe, it, expect } from 'vitest'
import {
  computeProficiencyBonus,
  computeSkillModifier,
  computeSpellSaveDC,
  computeSpellAttackBonus,
  computePassivePerception,
} from './derivedStats'
import { computeModifier } from '../types/character'

describe('computeModifier', () => {
  it.each([
    [1, -5], [8, -1], [9, -1],
    [10, 0], [11, 0],
    [12, 1], [13, 1],
    [14, 2], [15, 2],
    [16, 3], [17, 3],
    [20, 5], [30, 10],
  ])('score %i → modifier %i', (score, mod) => {
    expect(computeModifier(score)).toBe(mod)
  })
})

describe('computeProficiencyBonus', () => {
  it.each([
    [1, 2], [2, 2], [3, 2], [4, 2],
    [5, 3], [6, 3], [7, 3], [8, 3],
    [9, 4], [10, 4], [11, 4], [12, 4],
    [13, 5], [14, 5], [15, 5], [16, 5],
    [17, 6], [18, 6], [19, 6], [20, 6],
  ])('level %i → bonus %i', (level, bonus) => {
    expect(computeProficiencyBonus(level)).toBe(bonus)
  })
})

describe('computeSkillModifier', () => {
  const scores = { str: 10, dex: 14, con: 12, int: 8, wis: 16, cha: 10 }
  const prof = 3

  it('none: returns ability mod only', () => {
    expect(computeSkillModifier(scores, 'dex', 'none', prof)).toBe(2)
    expect(computeSkillModifier(scores, 'int', 'none', prof)).toBe(-1)
  })

  it('proficient: adds proficiency bonus', () => {
    expect(computeSkillModifier(scores, 'dex', 'proficient', prof)).toBe(5)
    expect(computeSkillModifier(scores, 'wis', 'proficient', prof)).toBe(6)
  })

  it('expertise: doubles proficiency bonus', () => {
    expect(computeSkillModifier(scores, 'dex', 'expertise', prof)).toBe(8)
    expect(computeSkillModifier(scores, 'wis', 'expertise', prof)).toBe(9)
  })
})

describe('computeSpellSaveDC', () => {
  it('8 + spellAbilityMod + profBonus', () => {
    expect(computeSpellSaveDC(3, 4)).toBe(15)
    expect(computeSpellSaveDC(5, 6)).toBe(19)
    expect(computeSpellSaveDC(0, 2)).toBe(10)
  })
})

describe('computeSpellAttackBonus', () => {
  it('spellAbilityMod + profBonus', () => {
    expect(computeSpellAttackBonus(3, 4)).toBe(7)
    expect(computeSpellAttackBonus(5, 6)).toBe(11)
  })
})

describe('computePassivePerception', () => {
  it('10 + wisMod without proficiency', () => {
    expect(computePassivePerception(14, false, 3)).toBe(12)
    expect(computePassivePerception(10, false, 2)).toBe(10)
  })

  it('10 + wisMod + profBonus with proficiency', () => {
    expect(computePassivePerception(14, true, 3)).toBe(15)
    expect(computePassivePerception(8, true, 2)).toBe(11)
  })
})
