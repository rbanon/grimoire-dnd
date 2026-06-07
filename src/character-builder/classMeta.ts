// Local metadata for classes and races — flavor + glyphs, spell limits
// Supplements the 5e-bits API (which only returns index + name in list responses)
// SRD numeric data (hit dice, spell slots, cantrips/spells known) is sourced from
// srd-class-data.json — regenerate with: node scripts/generate-srd-data.mjs
import srdData from '@/shared/data/srd-class-data.json'
import type { ResourcePool } from '@/shared/types/character'

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
  // 2014 SRD races
  dragonborn: { glyph: '🐉', flavor: 'Born of dragons, proud and self-sufficient', traits: ['Breath Weapon', 'Damage Resistance'] },
  dwarf:      { glyph: '⛏', flavor: 'Stout and hardy, known for their determination and skill', traits: ['Darkvision', 'Dwarven Resilience', 'Stonecunning'] },
  elf:        { glyph: '✧', flavor: 'A magical people of otherworldly grace', traits: ['Darkvision', 'Keen Senses', 'Fey Ancestry', 'Trance'] },
  gnome:      { glyph: '⚙', flavor: 'Gnomes are small folk with boundless enthusiasm', traits: ['Darkvision', 'Gnome Cunning'] },
  'half-elf': { glyph: '✦', flavor: 'Combining the best of elven and human heritage', traits: ['Darkvision', 'Fey Ancestry', 'Skill Versatility'] },
  'half-orc': { glyph: '🪓', flavor: 'Powerful and enduring, half-orcs are survivors', traits: ['Darkvision', 'Relentless Endurance', 'Savage Attacks'] },
  halfling:   { glyph: '◉', flavor: 'Small but nimble folk with surprising luck', traits: ['Lucky', 'Brave', 'Halfling Nimbleness'] },
  human:      { glyph: '⊕', flavor: 'Ambitious and adaptable, humans shape the world', traits: ['Extra Skill Proficiency', 'Bonus Feat (optional)'] },
  tiefling:   { glyph: '⌬', flavor: 'Marked by infernal heritage, tieflings are both feared and alluring', traits: ['Darkvision', 'Hellish Resistance', 'Infernal Legacy'] },
  // 2024 SRD species (new entries)
  goliath:    { glyph: '⛰', flavor: 'Towering descendants of giants, blessed with giant ancestry', traits: ['Giant Ancestry', 'Large Form', 'Powerful Build'] },
  orc:        { glyph: '🪓', flavor: 'Fierce and relentless, orcs carry the might of ancient warriors', traits: ['Darkvision', 'Adrenaline Rush', 'Relentless Endurance'] },
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
    castingType: 'prepared',
    preparedAbility: 'cha',
    cantripsKnown: srdData.cantripsKnown.paladin,
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
    castingType: 'spellbook',
    preparedAbility: 'int',
    cantripsKnown: srdData.cantripsKnown.wizard,
    // Spellbook size per level: 6 at L1, +2 per level (copying from scrolls/spellbooks)
    spellsKnown: [6,8,10,12,14,16,18,20,22,24,26,28,30,32,34,36,38,40,42,44],
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

export const ELDRITCH_INVOCATIONS: { index: string; name: string; desc: string; prereqLevel: number }[] = [
  // Level 2+
  { index: 'agonizing-blast',          name: 'Agonizing Blast',           desc: 'Add your Charisma modifier to the damage of Eldritch Blast',                               prereqLevel: 2 },
  { index: 'armor-of-shadows',         name: 'Armor of Shadows',          desc: 'Cast Mage Armor on yourself at will, without expending a spell slot',                       prereqLevel: 2 },
  { index: 'beast-speech',             name: 'Beast Speech',              desc: 'Cast Speak with Animals at will, without expending a spell slot',                           prereqLevel: 2 },
  { index: 'beguiling-influence',      name: 'Beguiling Influence',       desc: 'Gain proficiency in the Deception and Persuasion skills',                                   prereqLevel: 2 },
  { index: 'book-of-ancient-secrets',  name: 'Book of Ancient Secrets',   desc: 'Inscribe ritual spells in your Book of Shadows and cast them as rituals (req: Pact of the Tome)', prereqLevel: 2 },
  { index: 'devils-sight',             name: "Devil's Sight",             desc: 'See normally in darkness, magical and nonmagical, out to 120 feet',                         prereqLevel: 2 },
  { index: 'eldritch-sight',           name: 'Eldritch Sight',            desc: 'Cast Detect Magic at will, without expending a spell slot',                                 prereqLevel: 2 },
  { index: 'eldritch-spear',           name: 'Eldritch Spear',            desc: 'Eldritch Blast range extends to 300 feet',                                                  prereqLevel: 2 },
  { index: 'eyes-of-the-rune-keeper',  name: 'Eyes of the Rune Keeper',   desc: 'Read all writing, regardless of language',                                                  prereqLevel: 2 },
  { index: 'fiendish-vigor',           name: 'Fiendish Vigor',            desc: 'Cast False Life on yourself at will as a 1st-level spell, without expending a spell slot',  prereqLevel: 2 },
  { index: 'gaze-of-two-minds',        name: 'Gaze of Two Minds',         desc: 'Touch a willing humanoid to perceive through its senses until the end of your next turn',   prereqLevel: 2 },
  { index: 'mask-of-many-faces',       name: 'Mask of Many Faces',        desc: 'Cast Disguise Self at will, without expending a spell slot',                                prereqLevel: 2 },
  { index: 'misty-visions',            name: 'Misty Visions',             desc: 'Cast Silent Image at will, without expending a spell slot',                                 prereqLevel: 2 },
  { index: 'repelling-blast',          name: 'Repelling Blast',           desc: 'Knock creatures hit by Eldritch Blast up to 10 feet in a straight line',                   prereqLevel: 2 },
  { index: 'voice-of-the-chain-master',name: 'Voice of the Chain Master', desc: 'Communicate telepathically with your familiar and perceive through its senses (req: Pact of the Chain)', prereqLevel: 2 },
  // Level 5+
  { index: 'mire-the-mind',            name: 'Mire the Mind',             desc: 'Cast Slow once using a warlock spell slot, 1/long rest',                                    prereqLevel: 5 },
  { index: 'one-with-shadows',         name: 'One with Shadows',          desc: 'Become invisible as an action while in dim light or darkness',                              prereqLevel: 5 },
  { index: 'sign-of-ill-omen',         name: 'Sign of Ill Omen',          desc: 'Cast Bestow Curse once using a warlock spell slot, 1/long rest',                            prereqLevel: 5 },
  { index: 'thief-of-five-fates',      name: 'Thief of Five Fates',       desc: 'Cast Bane once using a warlock spell slot, 1/long rest',                                    prereqLevel: 5 },
  { index: 'thirsting-blade',          name: 'Thirsting Blade',           desc: 'Attack twice with your pact weapon when you take the Attack action (req: Pact of the Blade)', prereqLevel: 5 },
  // Level 7+
  { index: 'bewitching-whispers',      name: 'Bewitching Whispers',       desc: 'Cast Compulsion once using a warlock spell slot, 1/long rest',                              prereqLevel: 7 },
  { index: 'dreadful-word',            name: 'Dreadful Word',             desc: 'Cast Confusion once using a warlock spell slot, 1/long rest',                               prereqLevel: 7 },
  { index: 'sculptor-of-flesh',        name: 'Sculptor of Flesh',         desc: 'Cast Polymorph once using a warlock spell slot, 1/long rest',                               prereqLevel: 7 },
  // Level 9+
  { index: 'ascendant-step',           name: 'Ascendant Step',            desc: 'Cast Levitate on yourself at will, without expending a spell slot',                         prereqLevel: 9 },
  { index: 'minions-of-chaos',         name: 'Minions of Chaos',          desc: 'Cast Conjure Elemental once using a warlock spell slot, 1/long rest',                       prereqLevel: 9 },
  { index: 'otherworldly-leap',        name: 'Otherworldly Leap',         desc: 'Cast Jump on yourself at will, without expending a spell slot',                             prereqLevel: 9 },
  { index: 'whispers-of-the-grave',    name: 'Whispers of the Grave',     desc: 'Cast Speak with Dead at will, without expending a spell slot',                              prereqLevel: 9 },
  // Level 12+
  { index: 'lifedrinker',              name: 'Lifedrinker',               desc: 'Add Charisma modifier as necrotic damage on pact weapon attacks (req: Pact of the Blade)',  prereqLevel: 12 },
  // Level 15+
  { index: 'chains-of-carceri',        name: 'Chains of Carceri',         desc: 'Cast Hold Monster at will on celestials, fiends, and elementals (req: Pact of the Chain)', prereqLevel: 15 },
  { index: 'master-of-myriad-forms',   name: 'Master of Myriad Forms',    desc: 'Cast Alter Self at will, without expending a spell slot',                                   prereqLevel: 15 },
  { index: 'visions-of-distant-realms',name: 'Visions of Distant Realms', desc: 'Cast Arcane Eye at will, without expending a spell slot',                                   prereqLevel: 15 },
  { index: 'witch-sight',              name: 'Witch Sight',               desc: 'See the true form of any shapechanger or creature concealed by illusion within 30 feet',   prereqLevel: 15 },
]

export function getInvocationsCount(level: number): number {
  if (level < 2) return 0
  let count = 2
  if (level >= 5)  count++
  if (level >= 7)  count++
  if (level >= 9)  count++
  if (level >= 12) count++
  if (level >= 15) count++
  if (level >= 17) count++
  if (level >= 19) count++
  return count
}

export function getAvailableInvocations(level: number) {
  return ELDRITCH_INVOCATIONS.filter(i => i.prereqLevel <= level)
}

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

// ─── Race traits ──────────────────────────────────────────────────────────────

export interface RaceTraits {
  resistances: string[]
  immunities: string[]
  senses: string[]
}

// Dragonborn: subraceIndex from the 5e API e.g. 'dragonborn-black', 'dragonborn-red'
// Damage resistance by dragon color. Keyed by the color suffix so it works for both the
// 2014 style (`dragonborn-red`) and the 2024 subspecies style (`draconic-ancestor-red`).
const DRAGON_COLOR_RESISTANCE: Record<string, string> = {
  black:  'acid',
  blue:   'lightning',
  brass:  'fire',
  bronze: 'lightning',
  copper: 'acid',
  gold:   'fire',
  green:  'poison',
  red:    'fire',
  silver: 'cold',
  white:  'cold',
}

export function getRaceTraits(raceIndex: string, subraceIndex?: string): RaceTraits {
  const resistances: string[] = []
  const immunities:  string[] = []
  const senses:      string[] = []

  if (['elf', 'dwarf', 'gnome', 'half-elf', 'half-orc', 'tiefling'].includes(raceIndex)) {
    senses.push('Darkvision 60 ft.')
  }
  // 2024 species with different darkvision range
  if (raceIndex === 'orc') senses.push('Darkvision 120 ft.')
  if (raceIndex === 'dwarf') resistances.push('poison')
  if (raceIndex === 'tiefling') {
    // 2024 Tiefling resistance depends on the Fiendish Legacy subspecies;
    // 2014 Tiefling (no subrace in the SRD) is always fire.
    const legacy = subraceIndex?.startsWith('fiendish-legacy-')
      ? (subraceIndex.split('-').pop() ?? '')
      : ''
    const byLegacy: Record<string, string> = { abyssal: 'poison', chthonic: 'necrotic', infernal: 'fire' }
    resistances.push(byLegacy[legacy] ?? 'fire')
  }
  if (raceIndex === 'dragonborn' && subraceIndex) {
    const color = subraceIndex.split('-').pop() ?? ''
    const dmgType = DRAGON_COLOR_RESISTANCE[color]
    if (dmgType) resistances.push(dmgType)
  }

  return { resistances, immunities, senses }
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

/** Look up a fighting style by index across all classes. FIGHTER_STYLES is the superset. */
export function getFightingStyleByIndex(index: string): { index: string; name: string; desc: string } | null {
  return FIGHTER_STYLES.find(s => s.index === index) ?? null
}

/**
 * Resolves a level choice selection to a displayable feature entry.
 * Returns null for choices that don't produce a visible feature (ASI, skill picks).
 */
export function resolveChoiceFeature(
  classIndex: string,
  level: number,
  choiceKey: string,
  chosenIndex: string,
): { name: string; description: string; source: string } | null {
  const entry = getLevelEntry(classIndex, level)
  if (!entry?.choices) return null
  const choice = entry.choices[choiceKey]
  if (!choice) return null

  if (choice.kind === 'fighting-style') {
    const opt = getFightingStyleOptions(choice.classIndex).find(o => o.index === chosenIndex)
    if (!opt) return null
    return { name: opt.name, description: opt.desc, source: `Level ${level} Fighting Style` }
  }

  if (choice.kind === 'static') {
    const opt = choice.options.find(o => o.index === chosenIndex)
    if (!opt) return null
    return { name: opt.name, description: opt.desc, source: `Level ${level} ${choice.label}` }
  }

  return null  // 'asi' and 'skill' choices don't produce a feature entry
}

// ─── Class resources ──────────────────────────────────────────────────────────

type AbilityMods = { str: number; dex: number; con: number; int: number; wis: number; cha: number }

interface ResourceDef {
  id: string
  name: string
  refreshOn: 'short' | 'long' | ((level: number) => 'short' | 'long')
  max: (level: number, mods: AbilityMods) => number
}

const RESOURCE_DEFINITIONS: Partial<Record<string, ResourceDef[]>> = {
  barbarian: [{
    id: 'rage', name: 'Rage',
    refreshOn: 'long',
    max: (level) => level >= 17 ? 6 : level >= 12 ? 5 : level >= 6 ? 4 : level >= 3 ? 3 : 2,
  }],
  bard: [{
    id: 'bardic-inspiration', name: 'Bardic Inspiration',
    refreshOn: (level) => level >= 5 ? 'short' : 'long',
    max: (_, mods) => Math.max(1, mods.cha),
  }],
  cleric: [{
    id: 'channel-divinity', name: 'Channel Divinity',
    refreshOn: 'short',
    max: (level) => level >= 18 ? 3 : level >= 6 ? 2 : 1,
  }],
  druid: [{
    id: 'wild-shape', name: 'Wild Shape',
    refreshOn: 'short',
    max: () => 2,
  }],
  fighter: [
    { id: 'second-wind',  name: 'Second Wind',  refreshOn: 'short', max: () => 1 },
    { id: 'action-surge', name: 'Action Surge', refreshOn: 'short', max: (level) => level >= 17 ? 2 : 1 },
    { id: 'indomitable',  name: 'Indomitable',  refreshOn: 'long',
      max: (level) => level >= 17 ? 3 : level >= 13 ? 2 : level >= 9 ? 1 : 0 },
  ],
  monk: [{
    id: 'ki-points', name: 'Ki Points',
    refreshOn: 'short',
    max: (level) => level,
  }],
  paladin: [
    { id: 'channel-divinity', name: 'Channel Divinity', refreshOn: 'short', max: () => 1 },
    { id: 'lay-on-hands',     name: 'Lay on Hands',     refreshOn: 'long',  max: (level) => level * 5 },
  ],
  sorcerer: [{
    id: 'sorcery-points', name: 'Sorcery Points',
    refreshOn: 'long',
    max: (level) => level >= 2 ? level : 0,
  }],
  warlock: [
    {
      id: 'pact-slots', name: 'Pact Magic Slots',
      refreshOn: 'short',
      max: (level) => level >= 17 ? 4 : level >= 11 ? 3 : level >= 2 ? 2 : 1,
    },
    // Mystic Arcanum: one free casting each of a 6th–9th-level spell, 1/long rest,
    // unlocked at warlock 11/13/15/17. Tracked as separate 1-use pools; getClassResources
    // filters out levels not yet reached (max 0).
    { id: 'mystic-arcanum-6', name: 'Mystic Arcanum (6th)', refreshOn: 'long', max: (level) => level >= 11 ? 1 : 0 },
    { id: 'mystic-arcanum-7', name: 'Mystic Arcanum (7th)', refreshOn: 'long', max: (level) => level >= 13 ? 1 : 0 },
    { id: 'mystic-arcanum-8', name: 'Mystic Arcanum (8th)', refreshOn: 'long', max: (level) => level >= 15 ? 1 : 0 },
    { id: 'mystic-arcanum-9', name: 'Mystic Arcanum (9th)', refreshOn: 'long', max: (level) => level >= 17 ? 1 : 0 },
  ],
  wizard: [{
    id: 'arcane-recovery', name: 'Arcane Recovery',
    refreshOn: 'long',
    max: () => 1,
  }],
}

/**
 * Returns a short annotation for a resource pool that scales with level,
 * e.g. "d8" for Bardic Inspiration, "+3 dmg" for Rage, "Martial Arts d6" for Ki.
 */
export function getResourceNote(classIndex: string, resourceId: string, level: number): string | null {
  switch (`${classIndex}:${resourceId}`) {
    case 'bard:bardic-inspiration': {
      const die = level >= 15 ? 'd12' : level >= 10 ? 'd10' : level >= 5 ? 'd8' : 'd6'
      return die
    }
    case 'barbarian:rage': {
      const bonus = level >= 16 ? 4 : level >= 9 ? 3 : 2
      return `+${bonus} dmg`
    }
    case 'monk:ki-points': {
      const die = level >= 17 ? 'd10' : level >= 11 ? 'd8' : level >= 5 ? 'd6' : 'd4'
      return `Martial Arts ${die}`
    }
    default:
      return null
  }
}

/** Number of Sneak Attack d6 dice for a Rogue at the given level. */
export function getSneakAttackDice(level: number): number {
  return Math.ceil(level / 2)
}

/**
 * Total number of skills that gain Expertise (double proficiency) at the given level.
 * Rogue: 2 at level 1, +2 at level 6. Bard: 2 at level 3, +2 at level 10.
 * (Uses the 2014-SRD timing the rest of CLASS_LEVELS is built on.)
 */
export function getExpertiseCount(classIndex: string, level: number): number {
  if (classIndex === 'rogue') return level >= 6 ? 4 : 2
  if (classIndex === 'bard')  return level >= 10 ? 4 : level >= 3 ? 2 : 0
  return 0
}

export function getClassResources(classIndex: string, level: number, mods: AbilityMods): ResourcePool[] {
  const defs = RESOURCE_DEFINITIONS[classIndex] ?? []
  return defs.flatMap(def => {
    const refreshOn = typeof def.refreshOn === 'function' ? def.refreshOn(level) : def.refreshOn
    const max = def.max(level, mods)
    if (max <= 0) return []
    return [{ id: def.id, name: def.name, current: max, max, refreshOn }]
  })
}
