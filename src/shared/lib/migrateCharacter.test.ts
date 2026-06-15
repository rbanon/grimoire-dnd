import { describe, it, expect } from 'vitest'
import { migrateCharacter } from './migrateCharacter'
import { CURRENT_SCHEMA_VERSION } from '@/shared/types/character'

const validChar = {
  id: '550e8400-e29b-41d4-a716-446655440000',
  schemaVersion: '1.0',
  createdAt: '2024-01-01T00:00:00.000Z',
  updatedAt: '2024-01-01T00:00:00.000Z',
  portrait: { type: 'none' },
  identity: {
    name: 'Kira',
    race: { index: 'human', name: 'Human', speed: 30, sizeCategory: 'Medium' },
    subrace: null,
    class: { index: 'fighter', name: 'Fighter', hitDie: 10, spellcastingAbility: null },
    subclass: null,
    background: { index: 'soldier', name: 'Soldier', skillProficiencies: [] },
    alignment: 'True Neutral',
  },
  personality: {},
  abilityScores: { str: 16, dex: 12, con: 14, int: 10, wis: 8, cha: 10 },
  combat: {
    level: 1, maxHp: 11, currentHp: 11, tempHp: 0,
    armorClass: 13, inspiration: false, hitDiceRemaining: 1, useMilestones: false,
  },
  skillProficiencies: {},
  savingThrowProficiencies: { str: true, dex: false, con: true, int: false, wis: false, cha: false },
  languages: [],
  otherProficiencies: [],
  resistances: [], immunities: [], vulnerabilities: [], senses: [],
  inventory: [],
  currency: { cp: 0, sp: 0, ep: 0, gp: 0, pp: 0 },
  spellcasting: null,
  favoriteSpells: [],
  features: [],
  overrides: {},
}

describe('migrateCharacter', () => {
  it('passes through a valid character with correct data', () => {
    const result = migrateCharacter(validChar)
    expect(result.id).toBe('550e8400-e29b-41d4-a716-446655440000')
    expect(result.identity.name).toBe('Kira')
    expect(result.combat.level).toBe(1)
  })

  it('always stamps the current schema version', () => {
    const result = migrateCharacter(validChar)
    expect(result.schemaVersion).toBe(CURRENT_SCHEMA_VERSION)
  })

  it('adds missing schemaVersion via default', () => {
    const { schemaVersion: _schemaVersion, ...withoutVersion } = validChar
    const result = migrateCharacter(withoutVersion)
    expect(result.schemaVersion).toBe(CURRENT_SCHEMA_VERSION)
  })

  it('strips the legacy 1.0 attacks field on migration to 1.1', () => {
    const legacy = { ...validChar, schemaVersion: '1.0', attacks: [{ id: 'x', name: 'Longsword' }] }
    const result = migrateCharacter(legacy)
    expect(result.schemaVersion).toBe('1.1')
    expect('attacks' in result).toBe(false)
  })

  it('throws on non-object input', () => {
    expect(() => migrateCharacter('not an object')).toThrow()
    expect(() => migrateCharacter(null)).toThrow()
    expect(() => migrateCharacter(42)).toThrow()
    expect(() => migrateCharacter([])).toThrow()
  })

  it('throws when required fields are missing', () => {
    expect(() => migrateCharacter({ schemaVersion: '1.0' })).toThrow()
    expect(() => migrateCharacter({ ...validChar, identity: undefined })).toThrow()
    expect(() => migrateCharacter({ ...validChar, abilityScores: undefined })).toThrow()
  })

  it('throws when ability scores are out of range', () => {
    expect(() => migrateCharacter({
      ...validChar,
      abilityScores: { str: 0, dex: 10, con: 10, int: 10, wis: 10, cha: 10 },
    })).toThrow()
  })

  it('preserves extra fields not in the schema (no data loss)', () => {
    const withExtra = { ...validChar, _customNotes: 'DM notes' }
    const result = migrateCharacter(withExtra)
    expect(result.id).toBe('550e8400-e29b-41d4-a716-446655440000')
  })
})
