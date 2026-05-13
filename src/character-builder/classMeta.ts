// Local metadata for classes and races — flavor + glyphs, spell limits
// Supplements the 5e-bits API (which only returns index + name in list responses)

export interface ClassMeta {
  glyph: string
  flavor: string
  tags: string[]
  hitDie: number
  primaryAbility: string
  saves: string
}

export const CLASS_META: Record<string, ClassMeta> = {
  barbarian: {
    glyph: '⚔', hitDie: 12,
    flavor: 'A fierce warrior who can enter a battle rage',
    tags: ['Martial', 'Melee'],
    primaryAbility: 'Strength',
    saves: 'STR · CON',
  },
  bard: {
    glyph: '♫', hitDie: 8,
    flavor: 'An inspiring performer whose magic echoes with music',
    tags: ['Spellcaster', 'Support'],
    primaryAbility: 'Charisma',
    saves: 'DEX · CHA',
  },
  cleric: {
    glyph: '✦', hitDie: 8,
    flavor: 'A priestly champion who wields divine magic in service of a higher power',
    tags: ['Spellcaster', 'Support', 'Melee'],
    primaryAbility: 'Wisdom',
    saves: 'WIS · CHA',
  },
  druid: {
    glyph: '☘', hitDie: 8,
    flavor: 'A priest of the Old Faith wielding the powers of nature',
    tags: ['Spellcaster', 'Nature'],
    primaryAbility: 'Wisdom',
    saves: 'INT · WIS',
  },
  fighter: {
    glyph: '⚔', hitDie: 10,
    flavor: 'A master of martial combat, skilled with a variety of weapons and armor',
    tags: ['Martial', 'Versatile'],
    primaryAbility: 'Strength or Dexterity',
    saves: 'STR · CON',
  },
  monk: {
    glyph: '◎', hitDie: 8,
    flavor: 'A master of martial arts, harnessing the power of body and ki',
    tags: ['Martial', 'Ki'],
    primaryAbility: 'Dexterity · Wisdom',
    saves: 'STR · DEX',
  },
  paladin: {
    glyph: '✚', hitDie: 10,
    flavor: 'A holy warrior bound to a sacred oath, wielding divine power',
    tags: ['Martial', 'Spellcaster', 'Melee'],
    primaryAbility: 'Strength · Charisma',
    saves: 'WIS · CHA',
  },
  ranger: {
    glyph: '⌖', hitDie: 10,
    flavor: 'A warrior of the wilderness, skilled hunter and tracker',
    tags: ['Martial', 'Nature', 'Spellcaster'],
    primaryAbility: 'Dexterity · Wisdom',
    saves: 'STR · DEX',
  },
  rogue: {
    glyph: '◆', hitDie: 8,
    flavor: 'A scoundrel who uses stealth and cunning to overcome obstacles',
    tags: ['Skilled', 'Stealth'],
    primaryAbility: 'Dexterity',
    saves: 'DEX · INT',
  },
  sorcerer: {
    glyph: '✶', hitDie: 6,
    flavor: 'A spellcaster who draws on inherent magic from a gift or bloodline',
    tags: ['Spellcaster', 'Arcane'],
    primaryAbility: 'Charisma',
    saves: 'CON · CHA',
  },
  warlock: {
    glyph: '⌬', hitDie: 8,
    flavor: 'A wielder of magic derived from a bargain with an otherworldly patron',
    tags: ['Spellcaster', 'Pact'],
    primaryAbility: 'Charisma',
    saves: 'WIS · CHA',
  },
  wizard: {
    glyph: '⎊', hitDie: 6,
    flavor: 'A scholarly magic-user capable of manipulating the structures of reality',
    tags: ['Spellcaster', 'Arcane', 'Knowledge'],
    primaryAbility: 'Intelligence',
    saves: 'INT · WIS',
  },
}

export interface RaceMeta {
  glyph: string
  flavor: string
  traits: string[]
}

export const RACE_META: Record<string, RaceMeta> = {
  dragonborn: { glyph: '🐉', flavor: 'Born of dragons, proud and self-sufficient', traits: ['Breath Weapon', 'Damage Resistance'] },
  dwarf:      { glyph: '⛏', flavor: 'Stout and hardy, known for their determination and skill', traits: ['Darkvision', 'Dwarven Resilience', 'Stonecunning'] },
  elf:        { glyph: '✧', flavor: 'A magical people of otherworldly grace', traits: ['Darkvision', 'Keen Senses', 'Fey Ancestry', 'Trance'] },
  gnome:      { glyph: '⚙', flavor: 'Gnomes are small folk with boundless enthusiasm', traits: ['Darkvision', 'Gnome Cunning'] },
  'half-elf': { glyph: '✦', flavor: 'Combining the best of elven and human heritage', traits: ['Darkvision', 'Fey Ancestry', 'Skill Versatility'] },
  'half-orc': { glyph: '🪓', flavor: 'Powerful and enduring, half-orcs are survivors', traits: ['Darkvision', 'Relentless Endurance', 'Savage Attacks'] },
  halfling:   { glyph: '◉', flavor: 'Small but nimble folk with surprising luck', traits: ['Lucky', 'Brave', 'Halfling Nimbleness'] },
  human:      { glyph: '⊕', flavor: 'Ambitious and adaptable, humans shape the world', traits: ['Extra Skill Proficiency', 'Bonus Feat (optional)'] },
  tiefling:   { glyph: '⌬', flavor: 'Marked by infernal heritage, tieflings are both feared and alluring', traits: ['Darkvision', 'Hellish Resistance', 'Infernal Legacy'] },
}

// ─── Spell profiles ───────────────────────────────────────────────────────────

/** How a class acquires spells. */
export type CastingType =
  | 'known'      // fixed list that grows by level (Bard, Ranger, Sorcerer, Warlock)
  | 'prepared'   // daily preparation: abilityMod + level (Cleric, Druid, Paladin)
  | 'spellbook'  // learns Int_mod + level spells, prepares Int_mod + level (Wizard)

export interface SpellProfile {
  castingType: CastingType
  /** Cantrips known at each level, indexed [0] = level 1. 20 entries. */
  cantripsKnown: readonly number[]
  /** Spells known at each level. Only for castingType 'known'. */
  spellsKnown?: readonly number[]
  /** Ability modifier used for prepared-spell limit. Only for 'prepared' / 'spellbook'. */
  preparedAbility?: 'int' | 'wis' | 'cha'
}

// SRD 5e 2014 data — 20 entries per array, index = level - 1
const ZERO20 = new Array<number>(20).fill(0)

export const SPELL_PROFILES: Partial<Record<string, SpellProfile>> = {
  bard: {
    castingType: 'known',
    cantripsKnown: [2,2,2,3,3,3,3,3,3,4,4,4,4,4,4,4,4,4,4,4],
    spellsKnown:   [4,5,6,7,8,9,10,11,12,14,15,15,16,18,19,19,20,22,22,22],
  },
  cleric: {
    castingType: 'prepared',
    cantripsKnown:  [3,3,3,4,4,4,4,4,4,5,5,5,5,5,5,5,5,5,5,5],
    preparedAbility: 'wis',
  },
  druid: {
    castingType: 'prepared',
    cantripsKnown:  [2,2,2,3,3,3,3,3,3,4,4,4,4,4,4,4,4,4,4,4],
    preparedAbility: 'wis',
  },
  paladin: {
    castingType: 'prepared',
    cantripsKnown:  ZERO20, // no cantrips; first spells at level 2
    preparedAbility: 'cha',
  },
  ranger: {
    castingType: 'known',
    cantripsKnown:  ZERO20, // no cantrips; first spells at level 2
    spellsKnown:   [0,2,3,3,4,4,5,5,6,6,7,7,8,8,9,9,10,10,10,11],
  },
  sorcerer: {
    castingType: 'known',
    cantripsKnown: [4,4,4,5,5,5,6,6,6,6,6,6,6,6,6,6,6,6,6,6],
    spellsKnown:   [2,3,4,5,6,7,8,9,10,11,12,12,13,13,14,14,15,15,15,15],
  },
  warlock: {
    castingType: 'known',
    cantripsKnown: [2,2,2,3,3,3,4,4,4,4,4,4,4,4,4,4,4,4,4,4],
    spellsKnown:   [2,3,4,5,6,7,8,9,10,10,11,11,12,12,13,13,14,14,14,15],
  },
  wizard: {
    castingType: 'spellbook',
    cantripsKnown:  [3,3,3,4,4,4,4,4,4,5,5,5,5,5,5,5,5,5,5,5],
    preparedAbility: 'int',
  },
}

export function getSpellProfile(classIndex: string): SpellProfile | null {
  return SPELL_PROFILES[classIndex] ?? null
}

export function getClassMeta(index: string): ClassMeta {
  return CLASS_META[index] ?? {
    glyph: '⚔', hitDie: 8, flavor: '', tags: [], primaryAbility: '—', saves: '—',
  }
}

export function getRaceMeta(index: string): RaceMeta {
  return RACE_META[index] ?? { glyph: '◈', flavor: '', traits: [] }
}
