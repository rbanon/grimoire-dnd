// Cobertura automatizada del Plan de Pruebas Manuales (PRUEBAS_MANUALES.local.md).
// Bloquea ("locks") todos los valores de las reglas que son funciones puras, de modo
// que el QA manual en el navegador solo tenga que cubrir lo que requiere la UI.
// Cada `describe` indica la sección del documento que cubre.
import { describe, it, expect } from 'vitest'
import {
  getSubclassLevel, getAsiLevels, getSpellProfile, getFirstSpellLevel,
  getRaceTraits, getClassResources, getResourceNote, getSneakAttackDice,
  getInvocationsCount, getAvailableInvocations, getLevelEntry,
  getStartingGoldFormula, getFightingStyleOptions, getMaxSpellLevel,
  cantripsGainedAtLevel, spellsGainedAtLevel,
} from './classMeta'
import {
  computeUnarmoredAC, computeEffectiveAC, computeFightingStyleBonuses,
  addBonusToDamage,
} from '@/shared/lib/derivedStats'
import type { InventoryItem, EquippedSlots } from '@/shared/types/character'

// Factory for a valid InventoryItem (satisfies the Zod-inferred type: needs `item` + `equipped`).
// computeEffectiveAC / computeFightingStyleBonuses only read id/itemType/weapon+armor fields.
function makeItem(over: Partial<InventoryItem> & { id: string; itemType: InventoryItem['itemType'] }): InventoryItem {
  return {
    quantity: 1,
    equipped: false,
    item: { index: over.id, name: over.id },
    ...over,
  } as InventoryItem
}

const ALL_CLASSES = [
  'barbarian', 'bard', 'cleric', 'druid', 'fighter', 'monk',
  'paladin', 'ranger', 'rogue', 'sorcerer', 'warlock', 'wizard',
] as const
const noMods = { str: 0, dex: 0, con: 0, int: 0, wis: 0, cha: 0 }

// ──────────────────────────────────────────────────────────────────────────────
// §0 / §2, Nivel de subclase por clase
// ──────────────────────────────────────────────────────────────────────────────
describe('§0 subclass level per class', () => {
  it.each([
    ['cleric', 1], ['sorcerer', 1], ['warlock', 1],
    ['druid', 2], ['wizard', 2],
    ['barbarian', 3], ['bard', 3], ['fighter', 3], ['monk', 3],
    ['paladin', 3], ['ranger', 3], ['rogue', 3],
  ] as const)('%s chooses subclass at level %i', (cls, lvl) => {
    expect(getSubclassLevel(cls)).toBe(lvl)
  })
})

// ──────────────────────────────────────────────────────────────────────────────
// §0, Niveles de ASI por clase (incl. los no estándar Fighter/Rogue)
// ──────────────────────────────────────────────────────────────────────────────
describe('§0 ASI levels per class', () => {
  it.each([
    ['barbarian', [4, 8, 12, 16, 19]],
    ['bard',      [4, 8, 12, 16, 19]],
    ['cleric',    [4, 8, 12, 16, 19]],
    ['druid',     [4, 8, 12, 16, 19]],
    ['monk',      [4, 8, 12, 16, 19]],
    ['paladin',   [4, 8, 12, 16, 19]],
    ['ranger',    [4, 8, 12, 16, 19]],
    ['sorcerer',  [4, 8, 12, 16, 19]],
    ['warlock',   [4, 8, 12, 16, 19]],
    ['wizard',    [4, 8, 12, 16, 19]],
    ['fighter',   [4, 6, 8, 12, 14, 16, 19]],
    ['rogue',     [4, 8, 10, 12, 16, 19]],
  ] as const)('%s ASI levels', (cls, levels) => {
    expect(getAsiLevels(cls)).toEqual(levels)
  })
})

// ──────────────────────────────────────────────────────────────────────────────
// §0, Conjuración: tipo, habilidad y primer nivel con espacios
// ──────────────────────────────────────────────────────────────────────────────
describe('§0 spellcasting profile per class', () => {
  it('martial classes have no spell profile', () => {
    for (const c of ['barbarian', 'fighter', 'monk', 'rogue']) {
      expect(getSpellProfile(c)).toBeNull()
    }
  })

  it.each([
    ['bard', 'known', undefined],
    ['ranger', 'known', undefined],
    ['sorcerer', 'known', undefined],
    ['warlock', 'known', undefined],
    ['cleric', 'prepared', 'wis'],
    ['druid', 'prepared', 'wis'],
    ['paladin', 'prepared', 'cha'],
    ['wizard', 'spellbook', 'int'],
  ] as const)('%s → %s caster', (cls, type, ability) => {
    const p = getSpellProfile(cls)
    expect(p?.castingType).toBe(type)
    if (ability) expect(p?.preparedAbility).toBe(ability)
  })

  it('paladin & ranger gain slots at level 2; full casters at 1', () => {
    expect(getFirstSpellLevel('paladin')).toBe(2)
    expect(getFirstSpellLevel('ranger')).toBe(2)
    for (const c of ['bard', 'cleric', 'druid', 'sorcerer', 'warlock', 'wizard']) {
      expect(getFirstSpellLevel(c)).toBe(1)
    }
  })

  it('paladin/ranger have no spell slots at level 1 (informative note)', () => {
    expect(getMaxSpellLevel('paladin', 1)).toBe(0)
    expect(getMaxSpellLevel('ranger', 1)).toBe(0)
    expect(getMaxSpellLevel('paladin', 2)).toBe(1)
  })

  it('known casters gain a cantrip/spell at level 1', () => {
    for (const c of ['bard', 'sorcerer', 'warlock']) {
      expect(cantripsGainedAtLevel(c, 1)).toBe(getSpellProfile(c)!.cantripsKnown[0])
      expect(spellsGainedAtLevel(c, 1)).toBe(getSpellProfile(c)!.spellsKnown![0])
    }
  })

  it('martial classes gain no cantrips/spells', () => {
    for (const c of ['barbarian', 'fighter', 'monk', 'rogue']) {
      expect(cantripsGainedAtLevel(c, 5)).toBe(0)
      expect(spellsGainedAtLevel(c, 5)).toBe(0)
    }
  })
})

// ──────────────────────────────────────────────────────────────────────────────
// §0 / §1, Rasgos de raza (getRaceTraits): visión en la oscuridad y resistencias
// ──────────────────────────────────────────────────────────────────────────────
describe('§1 race traits, darkvision', () => {
  it.each(['elf', 'dwarf', 'gnome', 'half-elf', 'half-orc', 'tiefling'])(
    '%s has Darkvision 60 ft', (race) => {
      expect(getRaceTraits(race).senses).toContain('Darkvision 60 ft.')
    })

  it('orc (2024) has Darkvision 120 ft', () => {
    expect(getRaceTraits('orc').senses).toContain('Darkvision 120 ft.')
  })

  it.each(['dragonborn', 'halfling', 'human', 'goliath'])(
    '%s has NO darkvision', (race) => {
      expect(getRaceTraits(race).senses).toEqual([])
    })
})

describe('§1 race traits, resistances', () => {
  it('dwarf resists poison', () => {
    expect(getRaceTraits('dwarf').resistances).toContain('poison')
  })

  it('tiefling resists fire by default (2014, no subrace)', () => {
    expect(getRaceTraits('tiefling').resistances).toEqual(['fire'])
  })

  it.each([
    ['fiendish-legacy-abyssal', 'poison'],
    ['fiendish-legacy-chthonic', 'necrotic'],
    ['fiendish-legacy-infernal', 'fire'],
  ] as const)('tiefling legacy %s → %s', (sub, dmg) => {
    expect(getRaceTraits('tiefling', sub).resistances).toEqual([dmg])
  })

  it.each([
    ['dragonborn-black', 'acid'],
    ['dragonborn-blue', 'lightning'],
    ['dragonborn-brass', 'fire'],
    ['dragonborn-bronze', 'lightning'],
    ['dragonborn-copper', 'acid'],
    ['dragonborn-gold', 'fire'],
    ['dragonborn-green', 'poison'],
    ['dragonborn-red', 'fire'],
    ['dragonborn-silver', 'cold'],
    ['dragonborn-white', 'cold'],
  ] as const)('dragonborn %s → resists %s', (sub, dmg) => {
    expect(getRaceTraits('dragonborn', sub).resistances).toEqual([dmg])
  })

  it('dragonborn with no subrace has no resistance', () => {
    expect(getRaceTraits('dragonborn').resistances).toEqual([])
  })
})

// ──────────────────────────────────────────────────────────────────────────────
// §2, Recursos de clase (getClassResources) en niveles clave
// ──────────────────────────────────────────────────────────────────────────────
describe('§2 class resources', () => {
  const find = (cls: string, lvl: number, id: string, mods = noMods) =>
    getClassResources(cls, lvl, mods).find(r => r.id === id)

  it('barbarian Rage scales 2/3/4/5/6 and refreshes on long rest', () => {
    expect(find('barbarian', 1, 'rage')!.max).toBe(2)
    expect(find('barbarian', 3, 'rage')!.max).toBe(3)
    expect(find('barbarian', 6, 'rage')!.max).toBe(4)
    expect(find('barbarian', 12, 'rage')!.max).toBe(5)
    expect(find('barbarian', 17, 'rage')!.max).toBe(6)
    expect(find('barbarian', 1, 'rage')!.refreshOn).toBe('long')
  })

  it('bard Bardic Inspiration = max(1, CHA mod); short rest at 5+', () => {
    expect(find('bard', 1, 'bardic-inspiration', { ...noMods, cha: 3 })!.max).toBe(3)
    expect(find('bard', 1, 'bardic-inspiration', { ...noMods, cha: -1 })!.max).toBe(1)
    expect(find('bard', 4, 'bardic-inspiration')!.refreshOn).toBe('long')
    expect(find('bard', 5, 'bardic-inspiration')!.refreshOn).toBe('short')
  })

  it('cleric/paladin Channel Divinity', () => {
    expect(find('cleric', 2, 'channel-divinity')!.max).toBe(1)
    expect(find('cleric', 6, 'channel-divinity')!.max).toBe(2)
    expect(find('cleric', 18, 'channel-divinity')!.max).toBe(3)
    expect(find('paladin', 3, 'channel-divinity')!.refreshOn).toBe('short')
  })

  it('druid Wild Shape = 2 on a short rest', () => {
    const ws = find('druid', 2, 'wild-shape')!
    expect(ws.max).toBe(2)
    expect(ws.refreshOn).toBe('short')
  })

  it('fighter Second Wind / Action Surge / Indomitable', () => {
    expect(find('fighter', 1, 'second-wind')!.max).toBe(1)
    expect(find('fighter', 2, 'action-surge')!.max).toBe(1)
    expect(find('fighter', 17, 'action-surge')!.max).toBe(2)
    // Indomitable is 0 (absent) before level 9, then 1/2/3
    expect(find('fighter', 8, 'indomitable')).toBeUndefined()
    expect(find('fighter', 9, 'indomitable')!.max).toBe(1)
    expect(find('fighter', 13, 'indomitable')!.max).toBe(2)
    expect(find('fighter', 17, 'indomitable')!.max).toBe(3)
    expect(find('fighter', 2, 'action-surge')!.refreshOn).toBe('short')
  })

  it('monk Ki points = level, short rest', () => {
    expect(find('monk', 2, 'ki-points')!.max).toBe(2)
    expect(find('monk', 10, 'ki-points')!.max).toBe(10)
    expect(find('monk', 5, 'ki-points')!.refreshOn).toBe('short')
  })

  it('paladin Lay on Hands = 5 × level, long rest', () => {
    const loh = find('paladin', 3, 'lay-on-hands')!
    expect(loh.max).toBe(15)
    expect(loh.refreshOn).toBe('long')
  })

  it('sorcerer Sorcery Points = level from level 2 (absent at 1)', () => {
    expect(find('sorcerer', 1, 'sorcery-points')).toBeUndefined()
    expect(find('sorcerer', 2, 'sorcery-points')!.max).toBe(2)
    expect(find('sorcerer', 10, 'sorcery-points')!.max).toBe(10)
  })

  it('warlock Pact Magic slots scale 1/2/3/4 on a short rest', () => {
    expect(find('warlock', 1, 'pact-slots')!.max).toBe(1)
    expect(find('warlock', 2, 'pact-slots')!.max).toBe(2)
    expect(find('warlock', 11, 'pact-slots')!.max).toBe(3)
    expect(find('warlock', 17, 'pact-slots')!.max).toBe(4)
    expect(find('warlock', 1, 'pact-slots')!.refreshOn).toBe('short')
  })

  it('wizard Arcane Recovery = 1 on a long rest', () => {
    const ar = find('wizard', 1, 'arcane-recovery')!
    expect(ar.max).toBe(1)
    expect(ar.refreshOn).toBe('long')
  })

  it('every resource starts full (current === max)', () => {
    for (const cls of ALL_CLASSES) {
      for (const r of getClassResources(cls, 20, { ...noMods, cha: 3, wis: 3 })) {
        expect(r.current).toBe(r.max)
        expect(r.max).toBeGreaterThan(0)
      }
    }
  })
})

// ──────────────────────────────────────────────────────────────────────────────
// §2, Escalado de dados de recursos (getResourceNote) y Sneak Attack
// ──────────────────────────────────────────────────────────────────────────────
describe('§2 resource note scaling', () => {
  it.each([[1, 'd6'], [4, 'd6'], [5, 'd8'], [10, 'd10'], [15, 'd12'], [20, 'd12']] as const)(
    'bard inspiration die at level %i = %s', (lvl, die) => {
      expect(getResourceNote('bard', 'bardic-inspiration', lvl)).toBe(die)
    })

  it.each([[1, '+2 dmg'], [8, '+2 dmg'], [9, '+3 dmg'], [16, '+4 dmg']] as const)(
    'barbarian rage bonus at level %i = %s', (lvl, note) => {
      expect(getResourceNote('barbarian', 'rage', lvl)).toBe(note)
    })

  it.each([[1, 'd4'], [5, 'd6'], [11, 'd8'], [17, 'd10']] as const)(
    'monk martial arts die at level %i = %s', (lvl, die) => {
      expect(getResourceNote('monk', 'ki-points', lvl)).toBe(`Martial Arts ${die}`)
    })

  it('returns null for resources without a note', () => {
    expect(getResourceNote('fighter', 'second-wind', 5)).toBeNull()
  })
})

describe('§2.9 rogue Sneak Attack dice = ceil(level/2)', () => {
  it.each([[1, 1], [2, 1], [3, 2], [5, 3], [11, 6], [19, 10], [20, 10]] as const)(
    'level %i → %id6', (lvl, dice) => {
      expect(getSneakAttackDice(lvl)).toBe(dice)
    })
})

// ──────────────────────────────────────────────────────────────────────────────
// §2.11, Invocaciones de Warlock: conteo y filtrado por prerrequisito
// ──────────────────────────────────────────────────────────────────────────────
describe('§2.11 warlock invocations', () => {
  it.each([
    [1, 0], [2, 2], [4, 2], [5, 3], [7, 4], [9, 5],
    [12, 6], [15, 7], [17, 8], [19, 9], [20, 9],
  ] as const)('invocation count at level %i = %i', (lvl, count) => {
    expect(getInvocationsCount(lvl)).toBe(count)
  })

  it('only invocations meeting prereqLevel are available', () => {
    const lvl2 = getAvailableInvocations(2).map(i => i.index)
    expect(lvl2).toContain('agonizing-blast')      // prereq 2
    expect(lvl2).not.toContain('thirsting-blade')  // prereq 5
    expect(getAvailableInvocations(5).map(i => i.index)).toContain('thirsting-blade')
    expect(getAvailableInvocations(15).map(i => i.index)).toContain('witch-sight') // prereq 15
  })
})

// ──────────────────────────────────────────────────────────────────────────────
// §2 / §3, Features por nivel (getLevelEntry), los hitos citados en el documento
// ──────────────────────────────────────────────────────────────────────────────
describe('§2 level feature milestones', () => {
  const has = (cls: string, lvl: number, needle: string) =>
    (getLevelEntry(cls, lvl)?.features ?? []).some(f => f.includes(needle))

  it('fighter level 2 grants Action Surge (the documented example)', () => {
    expect(has('fighter', 2, 'Action Surge')).toBe(true)
  })

  it('extra-attack classes get Extra Attack at level 5', () => {
    for (const c of ['barbarian', 'fighter', 'monk', 'paladin', 'ranger']) {
      expect(has(c, 5, 'Extra Attack')).toBe(true)
    }
  })

  it('fighter Extra Attack improves at 11 and 20', () => {
    expect(has('fighter', 11, 'attack 3 times')).toBe(true)
    expect(has('fighter', 20, 'attack 4 times')).toBe(true)
  })

  it('fighter level 1 has a fighting-style choice', () => {
    expect(getLevelEntry('fighter', 1)?.choices?.['fighting-style']).toBeDefined()
  })

  it('warlock level 3 has a pact-boon choice', () => {
    expect(getLevelEntry('warlock', 3)?.choices?.['pact-boon']).toBeDefined()
  })

  it('paladin spellcasting begins at level 2', () => {
    expect(has('paladin', 2, 'Spellcasting')).toBe(true)
    expect(has('paladin', 1, 'Spellcasting')).toBe(false)
  })
})

// ──────────────────────────────────────────────────────────────────────────────
// §2, Oro inicial por clase (getStartingGoldFormula)
// ──────────────────────────────────────────────────────────────────────────────
describe('§2 starting gold formula per class', () => {
  it.each([
    ['barbarian', 2, 4, 10],
    ['bard', 5, 4, 10],
    ['cleric', 5, 4, 10],
    ['druid', 2, 4, 10],
    ['fighter', 5, 4, 10],
    ['monk', 5, 4, 1],
    ['paladin', 5, 4, 10],
    ['ranger', 5, 4, 10],
    ['rogue', 4, 4, 10],
    ['sorcerer', 3, 4, 10],
    ['warlock', 4, 4, 10],
    ['wizard', 4, 4, 10],
  ] as const)('%s = %id%i × %i', (cls, dice, sides, mult) => {
    const f = getStartingGoldFormula(cls)!
    expect(f.dice).toBe(dice)
    expect(f.sides).toBe(sides)
    expect(f.multiplier).toBe(mult)
  })
})

// ──────────────────────────────────────────────────────────────────────────────
// §6, Estilos de combate disponibles por clase
// ──────────────────────────────────────────────────────────────────────────────
describe('§6 fighting style options per class', () => {
  it('fighter has all 6 styles', () => {
    expect(getFightingStyleOptions('fighter').map(s => s.index)).toEqual(
      ['archery', 'defense', 'dueling', 'great-weapon', 'protection', 'two-weapon'],
    )
  })
  it('paladin has 4 styles (no archery/two-weapon)', () => {
    const ids = getFightingStyleOptions('paladin').map(s => s.index)
    expect(ids).toEqual(['defense', 'dueling', 'great-weapon', 'protection'])
  })
  it('ranger has 4 styles (no great-weapon/protection)', () => {
    const ids = getFightingStyleOptions('ranger').map(s => s.index)
    expect(ids).toEqual(['archery', 'defense', 'dueling', 'two-weapon'])
  })
  it('non-fighting-style classes have none', () => {
    expect(getFightingStyleOptions('wizard')).toEqual([])
    expect(getFightingStyleOptions('rogue')).toEqual([])
  })
})

// ──────────────────────────────────────────────────────────────────────────────
// §0 / §6, CA sin armadura (RAW) y CA efectiva dinámica
// ──────────────────────────────────────────────────────────────────────────────
describe('§0 unarmored AC (RAW reference)', () => {
  it('monk = 10 + DEX + WIS', () => {
    expect(computeUnarmoredAC('monk', { dex: 3, con: 1, wis: 2 })).toBe(15)
  })
  it('barbarian = 10 + DEX + CON', () => {
    expect(computeUnarmoredAC('barbarian', { dex: 2, con: 3, wis: 0 })).toBe(15)
  })
  it('other classes = 10 + DEX', () => {
    expect(computeUnarmoredAC('wizard', { dex: 2, con: 5, wis: 5 })).toBe(12)
  })
})

describe('§6 effective AC from equipment slots', () => {
  const armor = (id: string, ac: number, type: 'light' | 'medium' | 'heavy'): InventoryItem =>
    makeItem({ id, itemType: 'armor', armorClass: ac, armorType: type })
  const shield: InventoryItem = makeItem({ id: 'sh', itemType: 'armor', armorType: 'shield' })
  const slots = (over: Partial<EquippedSlots> = {}): EquippedSlots =>
    ({ mainHand: null, offHand: null, armor: null, ...over })

  it('light armor adds full DEX', () => {
    const inv = [armor('leather', 11, 'light')]
    expect(computeEffectiveAC(99, [], slots({ armor: 'leather' }), inv, 3)).toBe(14)
  })
  it('medium armor caps DEX at +2', () => {
    const inv = [armor('halfplate', 15, 'medium')]
    expect(computeEffectiveAC(99, [], slots({ armor: 'halfplate' }), inv, 4)).toBe(17)
  })
  it('heavy armor ignores DEX', () => {
    const inv = [armor('plate', 18, 'heavy')]
    expect(computeEffectiveAC(99, [], slots({ armor: 'plate' }), inv, 3)).toBe(18)
  })
  it('shield in off-hand adds +2', () => {
    const inv = [armor('leather', 11, 'light'), shield]
    expect(computeEffectiveAC(99, [], slots({ armor: 'leather', offHand: 'sh' }), inv, 1)).toBe(14)
  })
  it('Defense style adds +1 when armor is worn', () => {
    const inv = [armor('leather', 11, 'light')]
    expect(computeEffectiveAC(99, ['defense'], slots({ armor: 'leather' }), inv, 2)).toBe(14)
  })
  it('no armor slotted falls back to base AC', () => {
    expect(computeEffectiveAC(15, [], slots(), [], 3)).toBe(15)
  })
})

// ──────────────────────────────────────────────────────────────────────────────
// §6, Bonos de estilo de combate por arma equipada
// ──────────────────────────────────────────────────────────────────────────────
describe('§6 fighting style bonuses', () => {
  const bow: InventoryItem = makeItem({ id: 'bow', itemType: 'weapon', weaponCategory: 'ranged' })
  const sword: InventoryItem = makeItem({ id: 'sw', itemType: 'weapon', weaponCategory: 'melee', handedness: 'one-handed' })
  const greatsword: InventoryItem = makeItem({ id: 'gs', itemType: 'weapon', weaponCategory: 'melee', handedness: 'two-handed' })
  const slots = (over: Partial<EquippedSlots> = {}): EquippedSlots =>
    ({ mainHand: null, offHand: null, armor: null, ...over })

  it('Archery: +2 attack with ranged weapon in a slot', () => {
    const b = computeFightingStyleBonuses(['archery'], bow, slots({ mainHand: 'bow' }), [bow])
    expect(b.attack).toBe(2)
  })
  it('Dueling: +2 damage, one-handed melee, off-hand empty', () => {
    const b = computeFightingStyleBonuses(['dueling'], sword, slots({ mainHand: 'sw' }), [sword])
    expect(b.damage).toBe(2)
  })
  it('Dueling does NOT apply with a two-handed weapon', () => {
    const b = computeFightingStyleBonuses(['dueling'], greatsword, slots({ mainHand: 'gs' }), [greatsword])
    expect(b.damage).toBe(0)
  })
  it('Great Weapon Fighting: reroll low dice with two-handed in main hand', () => {
    const b = computeFightingStyleBonuses(['great-weapon'], greatsword, slots({ mainHand: 'gs' }), [greatsword])
    expect(b.rerollLowDice).toBe(true)
  })
  it('Two-Weapon Fighting: adds best of STR/DEX to off-hand damage', () => {
    const b = computeFightingStyleBonuses(['two-weapon'], sword, slots({ offHand: 'sw' }), [sword], { str: 1, dex: 3 })
    expect(b.damage).toBe(3)
  })
  it('no style → no bonus', () => {
    const b = computeFightingStyleBonuses([], sword, slots({ mainHand: 'sw' }), [sword])
    expect(b).toEqual({ attack: 0, damage: 0, rerollLowDice: false })
  })
})

describe('§6 addBonusToDamage', () => {
  it.each([
    ['1d8+3', 2, '1d8+5'],
    ['1d8', 2, '1d8+2'],
    ['2d6+1', -1, '2d6'],
    ['1d10', 0, '1d10'],
  ] as const)('%s + %i → %s', (dmg, bonus, out) => {
    expect(addBonusToDamage(dmg, bonus)).toBe(out)
  })
})
