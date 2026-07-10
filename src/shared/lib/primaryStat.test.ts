import { describe, it, expect } from 'vitest'
import { racePrimaryStat, classPrimaryStat } from './primaryStat'

describe('racePrimaryStat', () => {
  it('returns the highest-bonus ability', () => {
    expect(racePrimaryStat({ str: 2, con: 1 })).toBe('str')
    expect(racePrimaryStat({ dex: 1, cha: 2 })).toBe('cha')
  })

  it('breaks ties by canonical order (STR > DEX > … > CHA)', () => {
    expect(racePrimaryStat({ str: 1, dex: 1 })).toBe('str')
    expect(racePrimaryStat({ wis: 2, cha: 2 })).toBe('wis')
  })

  it('returns null when there is no positive bonus', () => {
    expect(racePrimaryStat({})).toBeNull()
    expect(racePrimaryStat({ str: 0 })).toBeNull()
  })
})

describe('classPrimaryStat', () => {
  it('normalizes a single ability name', () => {
    expect(classPrimaryStat('Strength')).toBe('str')
    expect(classPrimaryStat('Charisma')).toBe('cha')
  })

  it('picks the first canonical ability from a compound string', () => {
    expect(classPrimaryStat('Strength or Dexterity')).toBe('str')
    expect(classPrimaryStat('Dexterity · Wisdom')).toBe('dex')
  })

  it('returns null for unrecognized input', () => {
    expect(classPrimaryStat('Luck')).toBeNull()
  })
})
