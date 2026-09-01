import { describe, it, expect } from 'vitest'
import { detectFormat, convertExternal } from './index'
import { fromFoundry, isFoundryActor } from './foundry'
import { fromDndBeyond, isDndBeyondCharacter } from './dndbeyond'
import { normalizeAlignment, slugify, toAbilityScore, clampLevel } from './shared'
import { CharacterSchema } from '@/shared/types/character'

// The fixtures below are hand-built from each format's documented shape. They are NOT real
// exports, so they prove the mapping logic and the schema contract, not compatibility with
// any particular version of either tool.

function foundryActor(overrides: Record<string, unknown> = {}) {
  return {
    name: 'Thorin',
    type: 'character',
    system: {
      abilities: {
        str: { value: 16, proficient: 1 }, dex: { value: 12, proficient: 0 },
        con: { value: 15, proficient: 1 }, int: { value: 10, proficient: 0 },
        wis: { value: 13, proficient: 0 }, cha: { value: 8, proficient: 0 },
      },
      attributes: {
        hp: { value: 22, max: 28, temp: 3 },
        ac: { value: 16 },
        movement: { walk: 25 },
        inspiration: true,
        exhaustion: 1,
      },
      details: {
        alignment: 'Lawful Good',
        biography: { value: '<p>A dwarf of <b>few</b> words.</p>' },
        trait: '<p>Gruff</p>',
      },
      skills: {
        ath: { value: 1 }, ste: { value: 2 }, arc: { value: 0 },
        zzz: { value: 1 },  // unknown key, must be ignored
      },
      currency: { cp: 5, sp: 0, ep: 0, gp: 120, pp: 2 },
    },
    items: [
      { name: 'Fighter', type: 'class', system: { levels: 5 } },
      { name: 'Champion', type: 'subclass', system: {} },
      { name: 'Dwarf', type: 'race', system: {} },
      { name: 'Soldier', type: 'background', system: {} },
      { name: 'Longsword', type: 'weapon', system: { quantity: 1, equipped: true } },
      { name: 'Chain Mail', type: 'equipment', system: { armor: { value: 16 }, equipped: true } },
      { name: 'Rope', type: 'loot', system: { quantity: 2 } },
      { name: 'Second Wind', type: 'feat', system: { description: { value: '<p>Regain HP.</p>' } } },
    ],
    ...overrides,
  }
}

// Typed loosely on purpose: individual tests reassign fields (overrideStats, spells, ...)
// to shapes the literal's own inference would otherwise narrow away.
function dndBeyondCharacter(overrides: Record<string, unknown> = {}): { id: number, success: boolean, data: Record<string, any> } {
  return {
    id: 123,
    success: true,
    data: {
      name: 'Lyra',
      alignmentId: 3,
      baseHitPoints: 30,
      bonusHitPoints: 0,
      overrideHitPoints: null,
      removedHitPoints: 7,
      temporaryHitPoints: 0,
      inspiration: false,
      stats: [
        { id: 1, value: 8 }, { id: 2, value: 16 }, { id: 3, value: 14 },
        { id: 4, value: 12 }, { id: 5, value: 10 }, { id: 6, value: 17 },
      ],
      bonusStats: [{ id: 2, value: 2 }, { id: 6, value: 1 }],
      overrideStats: [],
      race: { fullName: 'High Elf', baseName: 'Elf', size: 'Medium', weightSpeeds: { normal: { walk: 30 } } },
      classes: [
        { level: 4, isStartingClass: true, definition: { name: 'Bard' }, subclassDefinition: { name: 'College of Lore' } },
      ],
      background: { definition: { name: 'Entertainer' } },
      currencies: { cp: 0, sp: 12, ep: 0, gp: 45, pp: 0 },
      traits: { personalityTraits: 'Curious', ideals: 'Freedom', bonds: 'My lute', flaws: 'Reckless' },
      notes: { backstory: '<p>Ran away from home.</p>' },
      inventory: [
        { quantity: 1, equipped: true, definition: { name: 'Rapier', filterType: 'Weapon' } },
        { quantity: 1, equipped: true, definition: { name: 'Leather Armor', filterType: 'Armor', armorClass: 11 } },
      ],
      spells: { race: [{ definition: { name: 'Prestidigitation', level: 0 } }] },
      classSpells: [{ spells: [
        { definition: { name: 'Vicious Mockery', level: 0 } },
        { definition: { name: 'Healing Word', level: 1 } },
      ] }],
      ...(overrides.data as Record<string, unknown> ?? {}),
    },
  }
}

// Everything an adapter produces must survive the real schema, otherwise the import throws
// at migrateCharacter and the user just sees a generic failure.
function parses(character: Record<string, unknown>) {
  return CharacterSchema.parse({
    ...character,
    id: '00000000-0000-4000-8000-000000000000',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  })
}

describe('detectFormat', () => {
  it('recognizes this app\'s own envelopes', () => {
    expect(detectFormat({ $schema: 'dnd-creator:character:v1', data: {} }).format).toBe('grimoire')
    expect(detectFormat({ $schema: 'dnd-creator:characters:v1', data: [] }).format).toBe('grimoire')
  })

  it('recognizes Foundry and D&D Beyond', () => {
    expect(detectFormat(foundryActor()).format).toBe('foundry')
    expect(detectFormat(dndBeyondCharacter()).format).toBe('dndbeyond')
  })

  it('accepts a D&D Beyond payload with the envelope already stripped', () => {
    const inner = dndBeyondCharacter().data
    expect(detectFormat(inner).format).toBe('dndbeyond')
  })

  it('does not confuse the two formats with each other', () => {
    expect(isFoundryActor(dndBeyondCharacter())).toBe(false)
    expect(isDndBeyondCharacter(foundryActor())).toBe(false)
  })

  it('returns unknown for anything else', () => {
    for (const junk of [null, 42, 'text', [], {}, { foo: 'bar' }]) {
      expect(detectFormat(junk).format).toBe('unknown')
    }
  })

  it('convertExternal only owns the external formats', () => {
    expect(convertExternal('grimoire', {})).toBeNull()
    expect(convertExternal('unknown', {})).toBeNull()
  })
})

describe('Foundry VTT adapter', () => {
  it('maps identity, abilities and combat', () => {
    const { character } = fromFoundry(foundryActor())
    const c = parses(character)
    expect(c.identity.name).toBe('Thorin')
    expect(c.identity.class).toMatchObject({ index: 'fighter', name: 'Fighter', hitDie: 10 })
    expect(c.identity.subclass).toMatchObject({ name: 'Champion' })
    expect(c.identity.race).toMatchObject({ index: 'dwarf', name: 'Dwarf', speed: 25 })
    expect(c.identity.background).toMatchObject({ index: 'soldier', name: 'Soldier' })
    expect(c.identity.alignment).toBe('Lawful Good')
    expect(c.abilityScores).toEqual({ str: 16, dex: 12, con: 15, int: 10, wis: 13, cha: 8 })
    expect(c.combat).toMatchObject({ level: 5, maxHp: 28, currentHp: 22, tempHp: 3, armorClass: 16, exhaustion: 1 })
    expect(c.combat.inspiration).toBe(true)
  })

  it('maps skills by rank and ignores unknown keys', () => {
    const { character } = fromFoundry(foundryActor())
    const c = parses(character)
    expect(c.skillProficiencies.athletics).toBe('proficient')
    expect(c.skillProficiencies.stealth).toBe('expertise')
    expect(c.skillProficiencies.arcana).toBeUndefined()
    expect(Object.keys(c.skillProficiencies)).not.toContain('zzz')
  })

  it('maps saving throws from the proficient flag', () => {
    const { character } = fromFoundry(foundryActor())
    const c = parses(character)
    expect(c.savingThrowProficiencies.str).toBe(true)
    expect(c.savingThrowProficiencies.con).toBe(true)
    // All six keys are always present: the schema's record demands them.
    expect(c.savingThrowProficiencies.dex).toBe(false)
    expect(Object.keys(c.savingThrowProficiencies).sort()).toEqual(['cha', 'con', 'dex', 'int', 'str', 'wis'])
  })

  it('splits inventory into weapon, armor and gear', () => {
    const { character } = fromFoundry(foundryActor())
    const c = parses(character)
    const byName = Object.fromEntries(c.inventory.map(i => [i.item.name, i]))
    expect(byName['Longsword'].itemType).toBe('weapon')
    expect(byName['Chain Mail'].itemType).toBe('armor')
    expect(byName['Chain Mail'].armorClass).toBe(16)
    expect(byName['Rope'].itemType).toBe('gear')
    expect(byName['Rope'].quantity).toBe(2)
    // Class/race/feat items are not physical objects and must not land in the bag.
    expect(byName['Fighter']).toBeUndefined()
    expect(byName['Second Wind']).toBeUndefined()
  })

  it('strips HTML from biography and features', () => {
    const { character } = fromFoundry(foundryActor())
    const c = parses(character)
    expect(c.personality.biography).toBe('A dwarf of few words.')
    expect(c.features[0]).toMatchObject({ name: 'Second Wind', description: 'Regain HP.' })
  })

  it('sums multiclass levels, keeps the deepest class, and warns', () => {
    const actor = foundryActor({
      items: [
        { name: 'Rogue', type: 'class', system: { levels: 2 } },
        { name: 'Wizard', type: 'class', system: { levels: 6 } },
      ],
    })
    const { character, warnings } = fromFoundry(actor)
    const c = parses(character)
    expect(c.combat.level).toBe(8)
    expect(c.identity.class.name).toBe('Wizard')
    expect(warnings.some(w => w.message.includes('Multiclass'))).toBe(true)
  })

  it('warns instead of throwing when there is no class', () => {
    const { character, warnings } = fromFoundry(foundryActor({ items: [] }))
    const c = parses(character)
    expect(c.combat.level).toBe(1)
    expect(warnings.some(w => w.message.includes('No class'))).toBe(true)
  })

  it('reads race from the legacy details string when there is no race item', () => {
    const actor = foundryActor({ items: [{ name: 'Fighter', type: 'class', system: { levels: 1 } }] })
    ;(actor.system as Record<string, unknown>).details = { race: 'Halfling' }
    const { character } = fromFoundry(actor)
    expect(parses(character).identity.race.name).toBe('Halfling')
  })

  it('splits spells into cantrips and known, leaving slots empty', () => {
    const actor = foundryActor({
      items: [
        { name: 'Wizard', type: 'class', system: { levels: 3 } },
        { name: 'Fire Bolt', type: 'spell', system: { level: 0 } },
        { name: 'Magic Missile', type: 'spell', system: { level: 1 } },
      ],
    })
    const { character, warnings } = fromFoundry(actor)
    const c = parses(character)
    expect(c.spellcasting?.spellcastingAbility).toBe('int')
    expect(c.spellcasting?.cantripsKnown.map(s => s.name)).toEqual(['Fire Bolt'])
    expect(c.spellcasting?.spellsKnown.map(s => s.name)).toEqual(['Magic Missile'])
    expect(c.spellcasting?.slotsMax.level1).toBe(0)
    expect(warnings.some(w => w.message.includes('Spell slots'))).toBe(true)
  })

  it('leaves spellcasting null for a martial with no spells', () => {
    expect(parses(fromFoundry(foundryActor()).character).spellcasting).toBeNull()
  })

  it('survives a malformed actor without throwing', () => {
    for (const junk of [null, {}, { system: {}, items: [] }, { system: { abilities: {} }, items: 'no' }]) {
      expect(() => parses(fromFoundry(junk).character)).not.toThrow()
    }
  })
})

describe('D&D Beyond adapter', () => {
  it('maps identity and alignment by id', () => {
    const { character } = fromDndBeyond(dndBeyondCharacter())
    const c = parses(character)
    expect(c.identity.name).toBe('Lyra')
    expect(c.identity.alignment).toBe('Chaotic Good')
    expect(c.identity.class).toMatchObject({ index: 'bard', name: 'Bard', hitDie: 8, spellcastingAbility: 'cha' })
    expect(c.identity.subclass).toMatchObject({ name: 'College of Lore' })
    expect(c.identity.background).toMatchObject({ index: 'entertainer' })
  })

  it('separates race from subrace using baseName and fullName', () => {
    const c = parses(fromDndBeyond(dndBeyondCharacter()).character)
    expect(c.identity.race).toMatchObject({ index: 'elf', name: 'Elf' })
    expect(c.identity.subrace).toMatchObject({ index: 'high-elf', name: 'High Elf' })
  })

  it('records no subrace when fullName matches the base race', () => {
    const src = dndBeyondCharacter()
    src.data.race = { fullName: 'Human', baseName: 'Human', size: 'Medium', weightSpeeds: { normal: { walk: 30 } } }
    expect(parses(fromDndBeyond(src).character).identity.subrace).toBeNull()
  })

  it('adds bonusStats on top of base stats', () => {
    const c = parses(fromDndBeyond(dndBeyondCharacter()).character)
    expect(c.abilityScores.dex).toBe(18)  // 16 base + 2 racial
    expect(c.abilityScores.cha).toBe(18)  // 17 base + 1 racial
    expect(c.abilityScores.str).toBe(8)   // untouched
  })

  it('lets overrideStats win outright', () => {
    const src = dndBeyondCharacter()
    src.data.overrideStats = [{ id: 1, value: 20 }]
    expect(parses(fromDndBeyond(src).character).abilityScores.str).toBe(20)
  })

  it('ignores null entries in the stat arrays', () => {
    const src = dndBeyondCharacter()
    src.data.overrideStats = [{ id: 1, value: null }, { id: 2, value: null }]
    const c = parses(fromDndBeyond(src).character)
    expect(c.abilityScores.str).toBe(8)
    expect(c.abilityScores.dex).toBe(18)
  })

  it('rebuilds max HP from the CON contribution D&D Beyond applies at display time', () => {
    // CON 14 -> +2, level 4, base 30  =>  30 + 2*4 = 38, minus 7 removed = 31 current
    const c = parses(fromDndBeyond(dndBeyondCharacter()).character)
    expect(c.combat.maxHp).toBe(38)
    expect(c.combat.currentHp).toBe(31)
  })

  it('honours overrideHitPoints when set', () => {
    const src = dndBeyondCharacter()
    src.data.overrideHitPoints = 50
    expect(parses(fromDndBeyond(src).character).combat.maxHp).toBe(50)
  })

  it('warns that AC was not imported', () => {
    const { warnings } = fromDndBeyond(dndBeyondCharacter())
    expect(warnings.some(w => w.message.includes('Armor Class'))).toBe(true)
  })

  it('gathers spells from every bucket and de-duplicates by name', () => {
    const src = dndBeyondCharacter()
    // Same spell in two buckets must appear once.
    src.data.spells = {
      race: [{ definition: { name: 'Prestidigitation', level: 0 } }],
      class: [{ definition: { name: 'Prestidigitation', level: 0 } }],
    }
    const c = parses(fromDndBeyond(src).character)
    const names = [...c.spellcasting!.cantripsKnown, ...c.spellcasting!.spellsKnown].map(s => s.name)
    expect(names.filter(n => n === 'Prestidigitation')).toHaveLength(1)
    expect(names).toContain('Vicious Mockery')
    expect(names).toContain('Healing Word')
    expect(c.spellcasting!.spellsKnown.map(s => s.name)).toEqual(['Healing Word'])
  })

  it('maps inventory by filterType', () => {
    const c = parses(fromDndBeyond(dndBeyondCharacter()).character)
    const byName = Object.fromEntries(c.inventory.map(i => [i.item.name, i]))
    expect(byName['Rapier'].itemType).toBe('weapon')
    expect(byName['Leather Armor'].itemType).toBe('armor')
    expect(byName['Leather Armor'].armorClass).toBe(11)
  })

  it('survives a malformed payload without throwing', () => {
    for (const junk of [null, {}, { data: null }, { data: { classes: 'no', stats: 'no' } }]) {
      expect(() => parses(fromDndBeyond(junk).character)).not.toThrow()
    }
  })
})

describe('shared helpers', () => {
  it('normalizes alignment from names, codes and casing', () => {
    expect(normalizeAlignment('Chaotic Good')).toBe('Chaotic Good')
    expect(normalizeAlignment('chaotic good')).toBe('Chaotic Good')
    expect(normalizeAlignment('CG')).toBe('Chaotic Good')
    expect(normalizeAlignment('N')).toBe('True Neutral')
    expect(normalizeAlignment('neutral')).toBe('True Neutral')
    expect(normalizeAlignment(undefined)).toBe('True Neutral')
    expect(normalizeAlignment('nonsense')).toBe('True Neutral')
  })

  it('slugifies names the way SRD indices are written', () => {
    expect(slugify('Chain Mail')).toBe('chain-mail')
    expect(slugify("Mage's Hand")).toBe('mages-hand')
    expect(slugify('  Fighter  ')).toBe('fighter')
    expect(slugify(undefined)).toBe('')
  })

  it('clamps ability scores and levels into the schema range', () => {
    expect(toAbilityScore(99)).toBe(30)
    expect(toAbilityScore(-4)).toBe(1)
    expect(toAbilityScore('abc')).toBe(10)
    expect(clampLevel(0)).toBe(1)
    expect(clampLevel(99)).toBe(20)
    expect(clampLevel('abc')).toBe(1)
  })
})
