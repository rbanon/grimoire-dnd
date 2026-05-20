// Local metadata for classes and races — flavor + glyphs, spell limits
// Supplements the 5e-bits API (which only returns index + name in list responses)
// SRD numeric data (hit dice, spell slots, cantrips/spells known) is sourced from
// srd-class-data.json — regenerate with: node scripts/generate-srd-data.mjs
import srdData from '@/shared/data/srd-class-data.json'

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
    glyph: '⚔', hitDie: srdData.hitDie.barbarian,
    flavor: 'A fierce warrior who can enter a battle rage',
    tags: ['Martial', 'Melee'],
    primaryAbility: 'Strength',
    saves: 'STR · CON',
  },
  bard: {
    glyph: '♫', hitDie: srdData.hitDie.bard,
    flavor: 'An inspiring performer whose magic echoes with music',
    tags: ['Spellcaster', 'Support'],
    primaryAbility: 'Charisma',
    saves: 'DEX · CHA',
  },
  cleric: {
    glyph: '✦', hitDie: srdData.hitDie.cleric,
    flavor: 'A priestly champion who wields divine magic in service of a higher power',
    tags: ['Spellcaster', 'Support', 'Melee'],
    primaryAbility: 'Wisdom',
    saves: 'WIS · CHA',
  },
  druid: {
    glyph: '☘', hitDie: srdData.hitDie.druid,
    flavor: 'A priest of the Old Faith wielding the powers of nature',
    tags: ['Spellcaster', 'Nature'],
    primaryAbility: 'Wisdom',
    saves: 'INT · WIS',
  },
  fighter: {
    glyph: '⚔', hitDie: srdData.hitDie.fighter,
    flavor: 'A master of martial combat, skilled with a variety of weapons and armor',
    tags: ['Martial', 'Versatile'],
    primaryAbility: 'Strength or Dexterity',
    saves: 'STR · CON',
  },
  monk: {
    glyph: '◎', hitDie: srdData.hitDie.monk,
    flavor: 'A master of martial arts, harnessing the power of body and ki',
    tags: ['Martial', 'Ki'],
    primaryAbility: 'Dexterity · Wisdom',
    saves: 'STR · DEX',
  },
  paladin: {
    glyph: '✚', hitDie: srdData.hitDie.paladin,
    flavor: 'A holy warrior bound to a sacred oath, wielding divine power',
    tags: ['Martial', 'Spellcaster', 'Melee'],
    primaryAbility: 'Strength · Charisma',
    saves: 'WIS · CHA',
  },
  ranger: {
    glyph: '⌖', hitDie: srdData.hitDie.ranger,
    flavor: 'A warrior of the wilderness, skilled hunter and tracker',
    tags: ['Martial', 'Nature', 'Spellcaster'],
    primaryAbility: 'Dexterity · Wisdom',
    saves: 'STR · DEX',
  },
  rogue: {
    glyph: '◆', hitDie: srdData.hitDie.rogue,
    flavor: 'A scoundrel who uses stealth and cunning to overcome obstacles',
    tags: ['Skilled', 'Stealth'],
    primaryAbility: 'Dexterity',
    saves: 'DEX · INT',
  },
  sorcerer: {
    glyph: '✶', hitDie: srdData.hitDie.sorcerer,
    flavor: 'A spellcaster who draws on inherent magic from a gift or bloodline',
    tags: ['Spellcaster', 'Arcane'],
    primaryAbility: 'Charisma',
    saves: 'CON · CHA',
  },
  warlock: {
    glyph: '⌬', hitDie: srdData.hitDie.warlock,
    flavor: 'A wielder of magic derived from a bargain with an otherworldly patron',
    tags: ['Spellcaster', 'Pact'],
    primaryAbility: 'Charisma',
    saves: 'WIS · CHA',
  },
  wizard: {
    glyph: '⎊', hitDie: srdData.hitDie.wizard,
    flavor: 'A scholarly magic-user capable of manipulating the structures of reality',
    tags: ['Spellcaster', 'Arcane', 'Knowledge'],
    primaryAbility: 'Intelligence',
    saves: 'INT · WIS',
  },
}

export function getClassGlyph(className: string): string {
  return CLASS_META[className.toLowerCase()]?.glyph ?? '⚔'
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

// Spell profiles — castingType and preparedAbility are editorial (no API equivalent).
// cantripsKnown/spellsKnown arrays are sourced from srd-class-data.json where available.
// Paladin spellsKnown (prepared-spell limit per level) and wizard spellsKnown (spellbook
// size per level) are not returned by the API and remain manually maintained.
export const SPELL_PROFILES: Partial<Record<string, SpellProfile>> = {
  bard: {
    castingType: 'known',
    cantripsKnown: srdData.cantripsKnown.bard,
    spellsKnown:   srdData.spellsKnown.bard,
  },
  cleric: {
    castingType: 'prepared',
    preparedAbility: 'wis',
    cantripsKnown: srdData.cantripsKnown.cleric,
  },
  druid: {
    castingType: 'prepared',
    preparedAbility: 'wis',
    cantripsKnown: srdData.cantripsKnown.druid,
  },
  paladin: {
    castingType: 'known',
    cantripsKnown: srdData.cantripsKnown.paladin,
    spellsKnown:   [0,2,3,3,4,4,5,5,6,6,7,7,8,8,9,9,10,10,10,11],
  },
  ranger: {
    castingType: 'known',
    cantripsKnown: srdData.cantripsKnown.ranger,
    spellsKnown:   srdData.spellsKnown.ranger,
  },
  sorcerer: {
    castingType: 'known',
    cantripsKnown: srdData.cantripsKnown.sorcerer,
    spellsKnown:   srdData.spellsKnown.sorcerer,
  },
  warlock: {
    castingType: 'known',
    cantripsKnown: srdData.cantripsKnown.warlock,
    spellsKnown:   srdData.spellsKnown.warlock,
  },
  wizard: {
    castingType: 'known',
    cantripsKnown: srdData.cantripsKnown.wizard,
    spellsKnown:   [3,5,7,9,11,12,13,14,15,16,17,18,19,20,21,22,23,24,25,26],
  },
}

export function getSpellProfile(classIndex: string): SpellProfile | null {
  return SPELL_PROFILES[classIndex] ?? null
}

/** Level at which the class first gains spell slots (1 for most casters, 2 for paladin/ranger). */
export function getFirstSpellLevel(classIndex: string): number {
  return (classIndex === 'paladin' || classIndex === 'ranger') ? 2 : 1
}


// ─── Spell slots ──────────────────────────────────────────────────────────────

// Per-class slot rows sourced from srd-class-data.json, index = level-1, each row = [l1..l9]
const SRD_SPELL_SLOTS = srdData.spellSlots as Record<string, number[][]>

export interface SpellSlotsMax {
  level1: number; level2: number; level3: number; level4: number; level5: number
  level6: number; level7: number; level8: number; level9: number
}

export function getSpellSlots(classIndex: string, level: number): SpellSlotsMax {
  const empty: SpellSlotsMax = { level1:0, level2:0, level3:0, level4:0, level5:0, level6:0, level7:0, level8:0, level9:0 }
  if (!getSpellProfile(classIndex)) return empty
  const classSlots = SRD_SPELL_SLOTS[classIndex]
  if (!classSlots) return empty
  const row = classSlots[Math.min(Math.max(level, 1), 20) - 1]
  if (!row) return empty
  return { level1:row[0], level2:row[1], level3:row[2], level4:row[3], level5:row[4], level6:row[5], level7:row[6], level8:row[7], level9:row[8] }
}

export function getMaxSpellLevel(classIndex: string, level: number): number {
  if (!getSpellProfile(classIndex)) return 0
  const classSlots = SRD_SPELL_SLOTS[classIndex]
  if (!classSlots) return 0
  const row = classSlots[Math.min(Math.max(level, 1), 20) - 1]
  if (!row) return 0
  for (let i = 8; i >= 0; i--) {
    if (row[i] > 0) return i + 1
  }
  return 0
}

// ─── Ability Score Improvements ───────────────────────────────────────────────

// SRD 5e 2014 — levels at which each class grants an ASI
const ASI_LEVELS: Record<string, readonly number[]> = {
  barbarian: [4, 8, 12, 16, 19],
  bard:      [4, 8, 12, 16, 19],
  cleric:    [4, 8, 12, 16, 19],
  druid:     [4, 8, 12, 16, 19],
  fighter:   [4, 6, 8, 12, 14, 16, 19],
  monk:      [4, 8, 12, 16, 19],
  paladin:   [4, 8, 12, 16, 19],
  ranger:    [4, 8, 12, 16, 19],
  rogue:     [4, 8, 10, 12, 16, 19],
  sorcerer:  [4, 8, 12, 16, 19],
  warlock:   [4, 8, 12, 16, 19],
  wizard:    [4, 8, 12, 16, 19],
}

/** Levels at which the class grants an Ability Score Improvement, in order. */
export function getAsiLevels(classIndex: string): number[] {
  return [...(ASI_LEVELS[classIndex] ?? [])]
}

// SRD 5e 2014 — class level at which the subclass is chosen
const SUBCLASS_LEVEL: Record<string, number> = {
  barbarian: 3, bard: 3, cleric: 1, druid: 2, fighter: 3,
  monk: 3, paladin: 3, ranger: 3, rogue: 3, sorcerer: 1, warlock: 1, wizard: 2,
}

/** Level at which this class chooses a subclass. */
export function getSubclassLevel(classIndex: string): number {
  return SUBCLASS_LEVEL[classIndex] ?? 3
}

export function getClassMeta(index: string): ClassMeta {
  return CLASS_META[index] ?? {
    glyph: '⚔', hitDie: 8, flavor: '', tags: [], primaryAbility: '—', saves: '—',
  }
}

export function getRaceMeta(index: string): RaceMeta {
  return RACE_META[index] ?? { glyph: '◈', flavor: '', traits: [] }
}

// ─── Level-based features ─────────────────────────────────────────────────────

export type ChoiceType =
  | { kind: 'fighting-style'; classIndex: string }
  | { kind: 'static'; label: string; options: { index: string; name: string; desc: string }[] }
  | { kind: 'skill'; label: string; from: string[]; count: number }
  | { kind: 'asi' }

export interface LevelEntry {
  features: string[]
  choices?: Record<string, ChoiceType>
  spellInfo?: string
}

const FIGHTER_STYLES = [
  { index: 'archery',      name: 'Archery',               desc: '+2 bonus to attack rolls with ranged weapons' },
  { index: 'defense',      name: 'Defense',               desc: '+1 to AC while wearing armor' },
  { index: 'dueling',      name: 'Dueling',               desc: '+2 damage when wielding a melee weapon in one hand and no other weapons' },
  { index: 'great-weapon', name: 'Great Weapon Fighting', desc: 'Reroll 1s and 2s on damage dice with two-handed weapons' },
  { index: 'protection',   name: 'Protection',            desc: 'Use reaction to impose disadvantage on attacks against adjacent allies' },
  { index: 'two-weapon',   name: 'Two-Weapon Fighting',   desc: 'Add ability modifier to off-hand attack damage' },
]
const PALADIN_STYLES = [
  { index: 'defense',      name: 'Defense',               desc: '+1 to AC while wearing armor' },
  { index: 'dueling',      name: 'Dueling',               desc: '+2 damage when wielding a melee weapon in one hand and no other weapons' },
  { index: 'great-weapon', name: 'Great Weapon Fighting', desc: 'Reroll 1s and 2s on damage dice with two-handed weapons' },
  { index: 'protection',   name: 'Protection',            desc: 'Use reaction to impose disadvantage on attacks against adjacent allies' },
]
const RANGER_STYLES = [
  { index: 'archery',      name: 'Archery',               desc: '+2 bonus to attack rolls with ranged weapons' },
  { index: 'defense',      name: 'Defense',               desc: '+1 to AC while wearing armor' },
  { index: 'dueling',      name: 'Dueling',               desc: '+2 damage when wielding a melee weapon in one hand and no other weapons' },
  { index: 'two-weapon',   name: 'Two-Weapon Fighting',   desc: 'Add ability modifier to off-hand attack damage' },
]

const WARLOCK_PACT_BOONS = [
  { index: 'chain', name: 'Pact of the Chain', desc: 'Learn Find Familiar; familiar can take the form of an imp, pseudodragon, quasit, or sprite' },
  { index: 'blade', name: 'Pact of the Blade',  desc: 'Create a pact weapon you are proficient with; it disappears if you dismiss it or perform the ritual again' },
  { index: 'tome',  name: 'Pact of the Tome',   desc: 'Receive a Book of Shadows granting three additional cantrips from any class list' },
]

export const CLASS_LEVELS: Partial<Record<string, Partial<Record<number, LevelEntry>>>> = {
  barbarian: {
    1:  { features: ['Rage (2/rest, +2 damage)', 'Unarmored Defense (10 + DEX mod + CON mod)'] },
    2:  { features: ['Reckless Attack', 'Danger Sense (adv on DEX saves vs seen hazards)'] },
    3:  { features: ['Primal Path (chosen in Step I)'] },
    4:  { features: ['Ability Score Improvement'] },
    5:  { features: ['Extra Attack', 'Fast Movement (+10 ft speed)'] },
    6:  { features: ['Primal Path feature', 'Rage (3/rest)'] },
    7:  { features: ['Feral Instinct (adv on Initiative; act while surprised if raging)'] },
    8:  { features: ['Ability Score Improvement'] },
    9:  { features: ['Brutal Critical (+1 damage die on critical hits)', 'Rage (4/rest)'] },
    10: { features: ['Primal Path feature'] },
    11: { features: ['Relentless Rage (DC 10 CON save to drop to 1 HP instead of 0 while raging)'] },
    12: { features: ['Ability Score Improvement', 'Rage (5/rest)'] },
    13: { features: ['Brutal Critical (+2 damage dice)'] },
    14: { features: ['Primal Path feature'] },
    15: { features: ['Persistent Rage (rage no longer ends if you fall unconscious)'] },
    16: { features: ['Ability Score Improvement', 'Rage (+3 damage)'] },
    17: { features: ['Brutal Critical (+3 damage dice)', 'Rage (6/rest)'] },
    18: { features: ['Indomitable Might (use STR score instead of roll for STR checks if lower)'] },
    19: { features: ['Ability Score Improvement'] },
    20: { features: ['Primal Champion (+4 STR, +4 CON)'] },
  },
  bard: {
    1:  { features: ['Spellcasting (CHA)', 'Bardic Inspiration (d6, CHA mod uses/rest)'] },
    2:  { features: ['Jack of All Trades (add half proficiency to non-proficient checks)', 'Song of Rest (d6)'] },
    3:  { features: ['Bard College (chosen in Step I)', 'Expertise (×2 already-proficient skills)'],
          spellInfo: 'New spells known at this level' },
    4:  { features: ['Ability Score Improvement'] },
    5:  { features: ['Bardic Inspiration (d8)', 'Font of Inspiration (regain uses on short rest)'] },
    6:  { features: ['Countercharm (action to end frighten/charm on nearby allies)', 'Bard College feature'] },
    7:  { features: [] },
    8:  { features: ['Ability Score Improvement'] },
    9:  { features: ['Song of Rest (d8)'] },
    10: { features: ['Bardic Inspiration (d10)', 'Expertise (×2 more skills)', 'Magical Secrets (learn 2 spells from any class list)'] },
    11: { features: ['Magical Secrets (learn 2 more spells from any class list)'] },
    12: { features: ['Ability Score Improvement'] },
    13: { features: ['Song of Rest (d10)'] },
    14: { features: ['Magical Secrets (learn 2 more spells from any class list)', 'Bard College feature'] },
    15: { features: ['Bardic Inspiration (d12)'] },
    16: { features: ['Ability Score Improvement'] },
    17: { features: ['Song of Rest (d12)'] },
    18: { features: ['Magical Secrets (learn 2 more spells from any class list)'] },
    19: { features: ['Ability Score Improvement'] },
    20: { features: ['Superior Inspiration (regain 1 Bardic Inspiration on initiative roll if none remaining)'] },
  },
  cleric: {
    1:  { features: ['Spellcasting (WIS)', 'Divine Domain (chosen in Step I)', 'Domain Spells (always prepared)'] },
    2:  { features: ['Channel Divinity (1/rest)', 'Divine Domain feature'] },
    3:  { features: [] },
    4:  { features: ['Ability Score Improvement'] },
    5:  { features: ['Destroy Undead (CR ½)'] },
    6:  { features: ['Channel Divinity (2/rest)', 'Divine Domain feature'] },
    7:  { features: ['Divine Domain feature'] },
    8:  { features: ['Destroy Undead (CR 1)', 'Ability Score Improvement', 'Divine Domain feature'] },
    9:  { features: [] },
    10: { features: ['Divine Intervention (call upon your deity for aid)'] },
    11: { features: ['Destroy Undead (CR 2)'] },
    12: { features: ['Ability Score Improvement'] },
    13: { features: [] },
    14: { features: ['Destroy Undead (CR 3)', 'Divine Domain feature'] },
    15: { features: [] },
    16: { features: ['Ability Score Improvement'] },
    17: { features: ['Destroy Undead (CR 4)', 'Divine Domain feature'] },
    18: { features: ['Channel Divinity (3/rest)'] },
    19: { features: ['Ability Score Improvement'] },
    20: { features: ['Divine Intervention improvement (guaranteed success if not used in 7 days)'] },
  },
  druid: {
    1:  { features: ['Druidic (secret language)', 'Spellcasting (WIS)'] },
    2:  { features: ['Wild Shape (CR ¼, no fly/swim)', 'Druid Circle (chosen in Step I)'] },
    3:  { features: [] },
    4:  { features: ['Wild Shape improvement (CR ½, no fly)', 'Ability Score Improvement'] },
    5:  { features: [] },
    6:  { features: ['Druid Circle feature'] },
    7:  { features: [] },
    8:  { features: ['Wild Shape improvement (CR 1)', 'Ability Score Improvement'] },
    9:  { features: [] },
    10: { features: ['Druid Circle feature'] },
    11: { features: [] },
    12: { features: ['Ability Score Improvement'] },
    13: { features: [] },
    14: { features: ['Druid Circle feature'] },
    15: { features: [] },
    16: { features: ['Wild Shape improvement (CR 3)', 'Ability Score Improvement'] },
    17: { features: [] },
    18: { features: ['Timeless Body (age 10× slower)', 'Beast Spells (cast spells while in Wild Shape)', 'Wild Shape improvement (CR 6)'] },
    19: { features: ['Ability Score Improvement'] },
    20: { features: ['Archdruid (unlimited Wild Shape uses)'] },
  },
  fighter: {
    1:  { features: ['Fighting Style', 'Second Wind (1d10 + fighter level HP, 1/short rest)'],
          choices: { 'fighting-style': { kind: 'fighting-style', classIndex: 'fighter' } } },
    2:  { features: ['Action Surge (take one additional action, 1/short rest)'] },
    3:  { features: ['Martial Archetype (chosen in Step I)'] },
    4:  { features: ['Ability Score Improvement'] },
    5:  { features: ['Extra Attack (attack twice when you take the Attack action)'] },
    6:  { features: ['Ability Score Improvement'] },
    7:  { features: ['Martial Archetype feature'] },
    8:  { features: ['Ability Score Improvement'] },
    9:  { features: ['Indomitable (reroll a saving throw, 1/long rest)'] },
    10: { features: ['Martial Archetype feature'] },
    11: { features: ['Extra Attack (attack 3 times when you take the Attack action)'] },
    12: { features: ['Ability Score Improvement'] },
    13: { features: ['Indomitable (2 uses/long rest)'] },
    14: { features: ['Ability Score Improvement'] },
    15: { features: ['Martial Archetype feature'] },
    16: { features: ['Ability Score Improvement'] },
    17: { features: ['Action Surge (2 uses/short rest)', 'Indomitable (3 uses/long rest)'] },
    18: { features: ['Martial Archetype feature'] },
    19: { features: ['Ability Score Improvement'] },
    20: { features: ['Extra Attack (attack 4 times when you take the Attack action)'] },
  },
  monk: {
    1:  { features: ['Unarmored Defense (10 + DEX mod + WIS mod)', 'Martial Arts (unarmed die, bonus unarmed attack)'] },
    2:  { features: ['Ki (ki points = monk level)', 'Unarmored Movement (+10 ft speed)'] },
    3:  { features: ['Monastic Tradition (chosen in Step I)', 'Deflect Missiles'] },
    4:  { features: ['Ability Score Improvement', 'Slow Fall (reduce fall damage by 5 × monk level)'] },
    5:  { features: ['Extra Attack', 'Stunning Strike'] },
    6:  { features: ['Ki-Empowered Strikes (unarmed strikes count as magical)', 'Monastic Tradition feature'] },
    7:  { features: ['Evasion', 'Stillness of Mind (end charm/frighten as action)'] },
    8:  { features: ['Ability Score Improvement'] },
    9:  { features: ['Unarmored Movement improvement (run up walls, across liquids)', '+15 ft speed'] },
    10: { features: ['Purity of Body (immune to disease and poison)'] },
    11: { features: ['Monastic Tradition feature'] },
    12: { features: ['Ability Score Improvement'] },
    13: { features: ['Tongue of the Sun and Moon (understand all spoken languages)'] },
    14: { features: ['Diamond Soul (proficiency in all saving throws; spend 1 ki to reroll any save)'] },
    15: { features: ['Timeless Body (no longer age; immune to magical aging)'] },
    16: { features: ['Ability Score Improvement'] },
    17: { features: ['Monastic Tradition feature'] },
    18: { features: ['Empty Body (4 ki: invisible 1 min; 8 ki: ethereal 1 min)'] },
    19: { features: ['Ability Score Improvement'] },
    20: { features: ['Perfect Self (regain 4 ki points on initiative roll if you have none)'] },
  },
  paladin: {
    1:  { features: ['Divine Sense', 'Lay on Hands (HP pool = 5 × paladin level)'] },
    2:  { features: ['Fighting Style', 'Spellcasting (CHA)', 'Divine Smite'],
          choices: { 'fighting-style': { kind: 'fighting-style', classIndex: 'paladin' } } },
    3:  { features: ['Divine Health (immune to disease)', 'Sacred Oath (chosen in Step I)', 'Channel Divinity'] },
    4:  { features: ['Ability Score Improvement'] },
    5:  { features: ['Extra Attack'] },
    6:  { features: ['Aura of Protection (add CHA modifier to saves, 10 ft radius)'] },
    7:  { features: ['Sacred Oath feature'] },
    8:  { features: ['Ability Score Improvement'] },
    9:  { features: [] },
    10: { features: ['Aura of Courage (immune to the frightened condition, 10 ft radius)'] },
    11: { features: ['Improved Divine Smite (melee weapon attacks deal extra 1d8 radiant damage)'] },
    12: { features: ['Ability Score Improvement'] },
    13: { features: [] },
    14: { features: ['Cleansing Touch (end one spell effect on a willing creature, CHA mod times/long rest)'] },
    15: { features: ['Sacred Oath feature'] },
    16: { features: ['Ability Score Improvement'] },
    17: { features: ['Aura of Protection and Aura of Courage extend to 30 ft radius'] },
    18: { features: ['Sacred Oath feature'] },
    19: { features: ['Ability Score Improvement'] },
    20: { features: ['Sacred Oath capstone feature'] },
  },
  ranger: {
    1:  { features: ['Favored Enemy (adv on survival/knowledge checks for one creature type)', 'Natural Explorer (double prof in one terrain type)'] },
    2:  { features: ['Fighting Style', 'Spellcasting (WIS)'],
          choices: { 'fighting-style': { kind: 'fighting-style', classIndex: 'ranger' } } },
    3:  { features: ['Ranger Archetype (chosen in Step I)', 'Primeval Awareness'] },
    4:  { features: ['Ability Score Improvement'] },
    5:  { features: ['Extra Attack'] },
    6:  { features: ['Favored Enemy improvement (one more type)', 'Natural Explorer improvement (one more terrain)'] },
    7:  { features: ['Ranger Archetype feature'] },
    8:  { features: ['Ability Score Improvement', "Land's Stride (ignore difficult terrain from non-magic plants)"] },
    9:  { features: [] },
    10: { features: ["Natural Explorer improvement (one more terrain)", 'Hide in Plain Sight'] },
    11: { features: ['Ranger Archetype feature'] },
    12: { features: ['Ability Score Improvement'] },
    13: { features: [] },
    14: { features: ['Vanish (Hide as a bonus action; cannot be tracked non-magically)'] },
    15: { features: ['Ranger Archetype feature'] },
    16: { features: ['Ability Score Improvement'] },
    17: { features: [] },
    18: { features: ['Feral Senses (no disadvantage while blind; detect invisible creatures within 30 ft)'] },
    19: { features: ['Ability Score Improvement'] },
    20: { features: ['Foe Slayer (add WIS modifier to one attack or damage roll vs favored enemy per turn)'] },
  },
  rogue: {
    1:  { features: ['Expertise (×2 skills or tools)', 'Sneak Attack (1d6)', "Thieves' Cant"] },
    2:  { features: ['Cunning Action (Dash, Disengage, or Hide as a bonus action)'] },
    3:  { features: ['Roguish Archetype (chosen in Step I)', 'Sneak Attack (2d6)'] },
    4:  { features: ['Ability Score Improvement'] },
    5:  { features: ['Uncanny Dodge (use reaction to halve damage)', 'Sneak Attack (3d6)'] },
    6:  { features: ['Expertise (×2 more skills)'] },
    7:  { features: ['Evasion (take no damage on successful DEX saves)', 'Sneak Attack (4d6)'] },
    8:  { features: ['Ability Score Improvement'] },
    9:  { features: ['Roguish Archetype feature', 'Sneak Attack (5d6)'] },
    10: { features: ['Ability Score Improvement', 'Sneak Attack (5d6)'] },
    11: { features: ['Reliable Talent (treat any skill prof d20 roll below 10 as 10)', 'Sneak Attack (6d6)'] },
    12: { features: ['Ability Score Improvement'] },
    13: { features: ['Sneak Attack (7d6)'] },
    14: { features: ['Blindsense (detect hidden creatures within 10 ft if you can hear)'] },
    15: { features: ['Slippery Mind (gain proficiency in WIS saving throws)', 'Sneak Attack (8d6)'] },
    16: { features: ['Ability Score Improvement'] },
    17: { features: ['Roguish Archetype feature', 'Sneak Attack (9d6)'] },
    18: { features: ['Elusive (attacks against you never have advantage unless incapacitated)'] },
    19: { features: ['Ability Score Improvement', 'Sneak Attack (10d6)'] },
    20: { features: ['Stroke of Luck (turn a missed attack into a hit or failed check into 20, 1/short rest)'] },
  },
  sorcerer: {
    1:  { features: ['Spellcasting (CHA)', 'Sorcerous Origin (chosen in Step I)'] },
    2:  { features: ['Font of Magic (sorcery points = level)'] },
    3:  { features: ['Metamagic (choose 2 options)',
          'Options: Careful, Distant, Empowered, Extended, Heightened, Quickened, Subtle, Twinned'] },
    4:  { features: ['Ability Score Improvement'] },
    5:  { features: [] },
    6:  { features: ['Sorcerous Origin feature'] },
    7:  { features: [] },
    8:  { features: ['Ability Score Improvement'] },
    9:  { features: [] },
    10: { features: ['Metamagic (choose 1 more option)'] },
    11: { features: [] },
    12: { features: ['Ability Score Improvement'] },
    13: { features: [] },
    14: { features: ['Sorcerous Origin feature'] },
    15: { features: [] },
    16: { features: ['Ability Score Improvement'] },
    17: { features: ['Metamagic (choose 1 more option)'] },
    18: { features: ['Sorcerous Origin feature'] },
    19: { features: ['Ability Score Improvement'] },
    20: { features: ['Sorcerous Restoration (regain 4 sorcery points on a short rest)'] },
  },
  warlock: {
    1:  { features: ['Otherworldly Patron (chosen in Step I)', 'Pact Magic (CHA)', 'Expanded Spell List'] },
    2:  { features: ['Eldritch Invocations (choose 2)'] },
    3:  { features: ['Pact Boon'],
          choices: { 'pact-boon': { kind: 'static', label: 'Pact Boon', options: WARLOCK_PACT_BOONS } } },
    4:  { features: ['Ability Score Improvement'] },
    5:  { features: ['Eldritch Invocations (+1 invocation)'] },
    6:  { features: ['Otherworldly Patron feature'] },
    7:  { features: ['Eldritch Invocations (+1 invocation)'] },
    8:  { features: ['Ability Score Improvement'] },
    9:  { features: ['Eldritch Invocations (+1 invocation)'] },
    10: { features: ['Otherworldly Patron feature'] },
    11: { features: ['Mystic Arcanum: one 6th-level spell (1/long rest)'] },
    12: { features: ['Ability Score Improvement', 'Eldritch Invocations (+1 invocation)'] },
    13: { features: ['Mystic Arcanum: one 7th-level spell (1/long rest)'] },
    14: { features: ['Otherworldly Patron feature'] },
    15: { features: ['Mystic Arcanum: one 8th-level spell (1/long rest)', 'Eldritch Invocations (+1 invocation)'] },
    16: { features: ['Ability Score Improvement'] },
    17: { features: ['Mystic Arcanum: one 9th-level spell (1/long rest)', 'Eldritch Invocations (+1 invocation)'] },
    18: { features: ['Otherworldly Patron feature'] },
    19: { features: ['Ability Score Improvement', 'Eldritch Invocations (+1 invocation)'] },
    20: { features: ['Eldritch Master (spend 1 min to regain all spell slots, 1/long rest)'] },
  },
  wizard: {
    1:  { features: ['Spellcasting (INT)', 'Arcane Recovery (recover spell slots up to half wizard level, 1/day)'] },
    2:  { features: ['Arcane Tradition (chosen in Step I)'] },
    3:  { features: [] },
    4:  { features: ['Ability Score Improvement'] },
    5:  { features: [] },
    6:  { features: ['Arcane Tradition feature'] },
    7:  { features: [] },
    8:  { features: ['Ability Score Improvement'] },
    9:  { features: [] },
    10: { features: ['Arcane Tradition feature'] },
    11: { features: [] },
    12: { features: ['Ability Score Improvement'] },
    13: { features: [] },
    14: { features: ['Arcane Tradition feature'] },
    15: { features: [] },
    16: { features: ['Ability Score Improvement'] },
    17: { features: [] },
    18: { features: ['Spell Mastery (cast one 1st- and one 2nd-level spell at will at their lowest level)'] },
    19: { features: ['Ability Score Improvement'] },
    20: { features: ['Signature Spells (two 3rd-level spells always prepared; cast each once/short rest for free)'] },
  },
}

export function getLevelEntry(classIndex: string, level: number): LevelEntry | null {
  return CLASS_LEVELS[classIndex]?.[level] ?? null
}

// ─── Per-level spell/cantrip gain counts ──────────────────────────────────────

/** How many cantrips a known-caster gains when they reach `charLevel`. */
export function cantripsGainedAtLevel(classIndex: string, charLevel: number): number {
  const profile = getSpellProfile(classIndex)
  if (!profile) return 0
  const curr = profile.cantripsKnown[charLevel - 1] ?? 0
  const prev = charLevel > 1 ? (profile.cantripsKnown[charLevel - 2] ?? 0) : 0
  return Math.max(0, curr - prev)
}

/** How many spells a known-caster gains when they reach `charLevel`. */
export function spellsGainedAtLevel(classIndex: string, charLevel: number): number {
  const profile = getSpellProfile(classIndex)
  if (!profile || !profile.spellsKnown) return 0
  const curr = profile.spellsKnown[charLevel - 1] ?? 0
  const prev = charLevel > 1 ? (profile.spellsKnown[charLevel - 2] ?? 0) : 0
  return Math.max(0, curr - prev)
}

// ─── Starting gold ────────────────────────────────────────────────────────────

export interface StartingGoldFormula {
  /** Number of dice to roll */
  dice: number
  /** Die sides */
  sides: number
  /** Multiplier applied to the total roll */
  multiplier: number
  /** Human-readable formula, e.g. "5d4 × 10" */
  label: string
}

const STARTING_GOLD: Record<string, StartingGoldFormula> = {
  barbarian: { dice: 2, sides: 4, multiplier: 10, label: '2d4 × 10 gp' },
  bard:      { dice: 5, sides: 4, multiplier: 10, label: '5d4 × 10 gp' },
  cleric:    { dice: 5, sides: 4, multiplier: 10, label: '5d4 × 10 gp' },
  druid:     { dice: 2, sides: 4, multiplier: 10, label: '2d4 × 10 gp' },
  fighter:   { dice: 5, sides: 4, multiplier: 10, label: '5d4 × 10 gp' },
  monk:      { dice: 5, sides: 4, multiplier: 1,  label: '5d4 gp' },
  paladin:   { dice: 5, sides: 4, multiplier: 10, label: '5d4 × 10 gp' },
  ranger:    { dice: 5, sides: 4, multiplier: 10, label: '5d4 × 10 gp' },
  rogue:     { dice: 4, sides: 4, multiplier: 10, label: '4d4 × 10 gp' },
  sorcerer:  { dice: 3, sides: 4, multiplier: 10, label: '3d4 × 10 gp' },
  warlock:   { dice: 4, sides: 4, multiplier: 10, label: '4d4 × 10 gp' },
  wizard:    { dice: 4, sides: 4, multiplier: 10, label: '4d4 × 10 gp' },
}

export function getStartingGoldFormula(classIndex: string): StartingGoldFormula | null {
  return STARTING_GOLD[classIndex] ?? null
}

export function rollStartingGold(classIndex: string): number {
  const formula = STARTING_GOLD[classIndex]
  if (!formula) return 0
  let total = 0
  for (let i = 0; i < formula.dice; i++) {
    total += Math.floor(Math.random() * formula.sides) + 1
  }
  return total * formula.multiplier
}

export function getFightingStyleOptions(classIndex: string): { index: string; name: string; desc: string }[] {
  if (classIndex === 'fighter') return FIGHTER_STYLES
  if (classIndex === 'paladin') return PALADIN_STYLES
  if (classIndex === 'ranger')  return RANGER_STYLES
  return []
}
