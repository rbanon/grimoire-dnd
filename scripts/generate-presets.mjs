// Fetches SRD class/race/spell data from the 5e API and assembles complete, valid builder
// drafts for the "Ready-Made" creation mode. Writes src/character-builder/presets.ts.
// Run: node scripts/generate-presets.mjs
//
// Each preset is a fully hydrated BuilderDraft partial (the same shape the wizard persists),
// so opening one drops the user into a complete, buildable character they can tweak or save.
// Backgrounds are authored as lightweight custom backgrounds (name + 2 skills) so we don't
// depend on the SRD API, which only ships the Acolyte background for the 2014 ruleset.
import { writeFileSync } from 'fs'

const BASE = 'https://www.dnd5eapi.co/api/2014'

async function fetchJson(path) {
  const res = await fetch(`${BASE}${path}`)
  if (!res.ok) throw new Error(`HTTP ${res.status} ${path}`)
  return res.json()
}

// Standard-array (15/14/13/12/10/8) distributions, pre-racial — racial bonuses add on top.
const ARR = { p1: 15, p2: 14, p3: 13, p4: 12, p5: 10, p6: 8 }
const scores = (order) => {
  const keys = ['p1', 'p2', 'p3', 'p4', 'p5', 'p6']
  const out = {}
  order.forEach((ab, i) => { out[ab] = ARR[keys[i]] })
  return out
}

// ── Preset specs ────────────────────────────────────────────────────────────
// classSkills / expertise / cantrips / spells use SRD indices. bg is a custom background.
const SPECS = [
  {
    id: 'half-orc-berserker', title: 'The Berserker', charName: 'Grosh',
    blurb: 'A towering half-orc who answers every problem with fury and a greataxe. Rage first, ask questions never.',
    race: 'half-orc', klass: 'barbarian', level: 3, subclass: { index: 'berserker', name: 'Path of the Berserker' },
    abilities: scores(['str', 'con', 'dex', 'wis', 'int', 'cha']),
    classSkills: ['athletics', 'intimidation'],
    bg: { name: 'Outlander', skills: ['survival', 'perception'] },
  },
  {
    id: 'human-vanguard', title: 'The Vanguard', charName: 'Aldric',
    blurb: 'A disciplined human soldier who holds the line. Sword, shield, and an unbreakable Defense.',
    race: 'human', klass: 'fighter', level: 1, fightingStyle: 'defense',
    abilities: scores(['str', 'con', 'dex', 'wis', 'int', 'cha']),
    classSkills: ['athletics', 'perception'],
    languages: ['dwarvish'],
    bg: { name: 'Soldier', skills: ['survival', 'intimidation'] },
  },
  {
    id: 'tiefling-shadow', title: 'The Shadow', charName: 'Vesper',
    blurb: 'A silver-tongued tiefling who thrives in the dark — picking locks, pockets, and fights on their own terms.',
    race: 'tiefling', klass: 'rogue', level: 1,
    abilities: scores(['dex', 'con', 'int', 'wis', 'cha', 'str']),
    classSkills: ['stealth', 'perception', 'acrobatics', 'investigation'],
    expertise: ['stealth', 'perception'],
    bg: { name: 'Charlatan', skills: ['deception', 'sleight-of-hand'] },
  },
  {
    id: 'dragonborn-oathsworn', title: 'The Oathsworn', charName: 'Rhogar',
    blurb: 'A dragonborn paladin bound by a sacred oath, smiting the wicked with radiant steel and unshakeable resolve.',
    race: 'dragonborn', klass: 'paladin', level: 1,
    abilities: scores(['str', 'cha', 'con', 'wis', 'int', 'dex']),
    classSkills: ['athletics', 'intimidation'],
    bg: { name: 'Acolyte', skills: ['insight', 'religion'] },
  },
  {
    id: 'human-ascetic', title: 'The Ascetic', charName: 'Mei',
    blurb: 'A human monk who turned discipline into a weapon. Strikes like water — swift, flowing, and impossible to hold.',
    race: 'human', klass: 'monk', level: 2,
    abilities: scores(['dex', 'wis', 'con', 'str', 'int', 'cha']),
    classSkills: ['acrobatics', 'stealth'],
    languages: ['celestial'],
    bg: { name: 'Hermit', skills: ['medicine', 'religion'] },
  },
  {
    id: 'tiefling-evoker', title: 'The Evoker', charName: 'Ignis',
    blurb: 'A tiefling wizard with fire in their blood and their spellbook. Six spells memorized, endless ambition.',
    race: 'tiefling', klass: 'wizard', level: 1,
    abilities: scores(['int', 'con', 'dex', 'wis', 'cha', 'str']),
    classSkills: ['arcana', 'investigation'],
    cantrips: ['fire-bolt', 'mage-hand', 'prestidigitation'],
    spells: ['magic-missile', 'shield', 'mage-armor', 'detect-magic', 'burning-hands', 'sleep'],
    bg: { name: 'Sage', skills: ['history', 'insight'] },
  },
  {
    id: 'dwarf-lightbearer', title: 'The Lightbearer', charName: 'Thora',
    blurb: 'A hill dwarf cleric of the Life domain — a beacon of healing and hope who mends wounds and turns back the dark.',
    race: 'dwarf', subrace: 'hill-dwarf', klass: 'cleric', level: 1, subclass: { index: 'life', name: 'Life Domain' },
    abilities: scores(['wis', 'con', 'str', 'cha', 'dex', 'int']),
    classSkills: ['medicine', 'persuasion'],
    cantrips: ['sacred-flame', 'guidance', 'light'],
    spells: ['cure-wounds', 'bless', 'guiding-bolt', 'shield-of-faith'],
    bg: { name: 'Acolyte', skills: ['insight', 'religion'] },
  },
  {
    id: 'human-warden', title: 'The Warden', charName: 'Rowan',
    blurb: 'A human druid who speaks for the wild — calling on thorns, flame and the fury of nature to guard the balance.',
    race: 'human', klass: 'druid', level: 1,
    abilities: scores(['wis', 'con', 'dex', 'int', 'str', 'cha']),
    classSkills: ['perception', 'survival'],
    languages: ['elvish'],
    cantrips: ['produce-flame', 'shillelagh'],
    spells: ['cure-wounds', 'entangle', 'thunderwave', 'faerie-fire'],
    bg: { name: 'Hermit', skills: ['medicine', 'nature'] },
  },
  {
    id: 'halfling-troubadour', title: 'The Troubadour', charName: 'Pip',
    blurb: 'A lightfoot halfling bard whose wit cuts deeper than a blade — inspiring allies and unmaking foes with a song.',
    race: 'halfling', subrace: 'lightfoot-halfling', klass: 'bard', level: 1,
    abilities: scores(['cha', 'dex', 'con', 'wis', 'int', 'str']),
    classSkills: ['performance', 'persuasion', 'deception'],
    cantrips: ['vicious-mockery', 'minor-illusion'],
    spells: ['healing-word', 'thunderwave', 'charm-person', 'faerie-fire'],
    bg: { name: 'Entertainer', skills: ['acrobatics', 'sleight-of-hand'] },
  },
  {
    id: 'dragonborn-flamecaller', title: 'The Flamecaller', charName: 'Kalix',
    blurb: 'A dragonborn sorcerer with draconic blood ablaze — raw arcane power flows through their veins, no study required.',
    race: 'dragonborn', klass: 'sorcerer', level: 1, subclass: { index: 'draconic', name: 'Draconic Bloodline' },
    abilities: scores(['cha', 'con', 'dex', 'wis', 'int', 'str']),
    classSkills: ['arcana', 'intimidation'],
    cantrips: ['fire-bolt', 'prestidigitation', 'mage-hand', 'light'],
    spells: ['magic-missile', 'shield'],
    bg: { name: 'Noble', skills: ['history', 'persuasion'] },
  },
  {
    id: 'tiefling-fiendbound', title: 'The Fiendbound', charName: 'Malice',
    blurb: 'A tiefling warlock who struck a bargain with a fiend — eldritch fire at their fingertips and a price yet to pay.',
    race: 'tiefling', klass: 'warlock', level: 1, subclass: { index: 'fiend', name: 'The Fiend' },
    abilities: scores(['cha', 'con', 'dex', 'wis', 'int', 'str']),
    classSkills: ['deception', 'arcana'],
    cantrips: ['eldritch-blast', 'chill-touch'],
    spells: ['hellish-rebuke', 'charm-person'],
    bg: { name: 'Charlatan', skills: ['intimidation', 'sleight-of-hand'] },
  },
  {
    id: 'human-strider', title: 'The Strider', charName: 'Nyla',
    blurb: 'A human ranger and peerless tracker — bow in hand, she reads the wilds like a book and never loses a trail.',
    race: 'human', klass: 'ranger', level: 1,
    abilities: scores(['dex', 'wis', 'con', 'str', 'int', 'cha']),
    classSkills: ['survival', 'perception', 'stealth'],
    languages: ['elvish'],
    bg: { name: 'Outlander', skills: ['athletics', 'nature'] },
  },
]

// ── Assemble ────────────────────────────────────────────────────────────────
const CLASS_NAME = {
  barbarian: 'Barbarian', bard: 'Bard', cleric: 'Cleric', druid: 'Druid', fighter: 'Fighter',
  monk: 'Monk', paladin: 'Paladin', ranger: 'Ranger', rogue: 'Rogue', sorcerer: 'Sorcerer',
  warlock: 'Warlock', wizard: 'Wizard',
}
const RACE_NAME = {
  'half-orc': 'Half-Orc', human: 'Human', tiefling: 'Tiefling', dragonborn: 'Dragonborn',
  'half-elf': 'Half-Elf', dwarf: 'Dwarf', elf: 'Elf', halfling: 'Halfling', gnome: 'Gnome',
}
// Display name for a subrace + base race (e.g. hill-dwarf → "Hill Dwarf").
const SUBRACE_NAME = {
  'hill-dwarf': 'Hill Dwarf', 'high-elf': 'High Elf',
  'lightfoot-halfling': 'Lightfoot Halfling', 'rock-gnome': 'Rock Gnome',
}
const ABILITY_FULL = { str: 'Strength', dex: 'Dexterity', con: 'Constitution', int: 'Intelligence', wis: 'Wisdom', cha: 'Charisma' }
// SRD 5e 2014 — class level at which the subclass is chosen (mirrors classMeta SUBCLASS_LEVEL).
const SUBCLASS_LEVEL = {
  barbarian: 3, bard: 3, cleric: 1, druid: 2, fighter: 3,
  monk: 3, paladin: 3, ranger: 3, rogue: 3, sorcerer: 1, warlock: 1, wizard: 2,
}
// How each class stores its known spells, so we prefill the right draft fields.
const CASTER_TYPE = {
  wizard: 'spellbook', cleric: 'prepared', druid: 'prepared', paladin: 'prepared',
  bard: 'known', sorcerer: 'known', warlock: 'known', ranger: 'known',
}

async function buildPreset(spec) {
  const cls = await fetchJson(`/classes/${spec.klass}`)
  const race = await fetchJson(`/races/${spec.race}`)

  const skillChoice = (cls.proficiency_choices ?? []).find(c =>
    c.from.options.some(o => o.item?.index?.startsWith('skill-')))
  const classSkillOptions = skillChoice
    ? skillChoice.from.options.filter(o => o.item?.index?.startsWith('skill-'))
        .map(o => o.item.index.replace(/^skill-/, ''))
    : []

  const raceAbilityBonuses = {}
  for (const ab of race.ability_bonuses) {
    const k = ab.ability_score.index
    raceAbilityBonuses[k] = (raceAbilityBonuses[k] ?? 0) + ab.bonus
  }
  const raceAutoLanguages = race.languages.map(l => l.index)
  const raceLanguageChoices = race.language_options?.choose ?? 0
  const selectedLanguages = [...new Set([...raceAutoLanguages, ...(spec.languages ?? [])])]

  // Subrace (Hill Dwarf, Lightfoot Halfling, …) — its ability bonuses stack on the base race's.
  const availableSubraces = race.subraces.map(s => ({ index: s.index, name: s.name }))
  let subraceAbilityBonuses = {}
  if (spec.subrace) {
    const sub = await fetchJson(`/subraces/${spec.subrace}`)
    for (const ab of sub.ability_bonuses) {
      const k = ab.ability_score.index
      subraceAbilityBonuses[k] = (subraceAbilityBonuses[k] ?? 0) + ab.bonus
    }
  }

  const spellcastingAbility = cls.spellcasting?.spellcasting_ability?.index ?? null

  // A subclass is only offered once the character reaches its unlock level. Below that we leave
  // availableSubclasses empty so the wizard doesn't demand a subclass choice at level 1.
  const subclassUnlocked = spec.level >= (SUBCLASS_LEVEL[spec.klass] ?? 3)
  const availableSubclasses = subclassUnlocked
    ? cls.subclasses.map(s => ({ index: s.index, name: s.name }))
    : []

  // Primary ability = the highest pre-racial score (for the display chip / sorting).
  const primary = Object.entries(spec.abilities).sort((a, b) => b[1] - a[1])[0][0]

  // Resolve spell references (name + level) for the spell prefill.
  const cantrips = []
  for (const idx of spec.cantrips ?? []) {
    const s = await fetchJson(`/spells/${idx}`)
    cantrips.push({ index: s.index, name: s.name })
  }
  const spells = []
  for (const idx of spec.spells ?? []) {
    const s = await fetchJson(`/spells/${idx}`)
    spells.push({ index: s.index, name: s.name, level: s.level })
  }

  // Route the resolved spells into the draft fields the builder validates for this caster type:
  //  · spellbook (wizard):  selectedCantrips + selectedSpells
  //  · prepared (cleric…):  selectedCantrips + selectedPreparedSpells
  //  · known (bard…):       spellsByLevel[level] = { cantripsGained, spellsGained }
  const casterType = CASTER_TYPE[spec.klass]
  let selectedCantrips = [], selectedSpells = [], selectedPreparedSpells = [], spellsByLevel = {}
  if (casterType === 'known') {
    if (cantrips.length || spells.length) {
      spellsByLevel = { [spec.level]: { cantripsGained: cantrips, spellsGained: spells, spellReplaced: null } }
    }
  } else if (casterType === 'prepared') {
    selectedCantrips = cantrips
    selectedPreparedSpells = spells
  } else {
    // spellbook or non-caster
    selectedCantrips = cantrips
    selectedSpells = spells
  }

  const draft = {
    name: spec.charName,
    level: spec.level,
    // Class
    classIndex: spec.klass,
    className: CLASS_NAME[spec.klass],
    classEdition: '2014',
    classHitDie: cls.hit_die,
    classSpellcastingAbility: spellcastingAbility,
    classSkillChoices: skillChoice?.choose ?? 2,
    classSkillOptions,
    availableSubclasses,
    subclassIndex: subclassUnlocked ? (spec.subclass?.index ?? '') : '',
    subclassName: subclassUnlocked ? (spec.subclass?.name ?? '') : '',
    // Race
    raceIndex: spec.race,
    raceName: RACE_NAME[spec.race],
    raceEdition: '2014',
    raceSpeed: race.speed,
    raceSizeCategory: race.size,
    raceAbilityBonuses,
    raceLanguageCount: race.languages.length || 1,
    raceAutoLanguages,
    raceLanguageChoices,
    // Subrace
    availableSubraces,
    subraceIndex: spec.subrace ?? '',
    subraceName: spec.subrace ? (SUBRACE_NAME[spec.subrace] ?? spec.subrace) : '',
    subraceAbilityBonuses,
    // Background (lightweight custom — SRD 2014 only ships Acolyte)
    backgroundIndex: 'custom',
    backgroundName: spec.bg.name,
    backgroundEdition: '2014',
    backgroundSkillProficiencies: spec.bg.skills,
    // Abilities (manual entry — pre-racial; racial bonuses add via effectiveScores)
    abilityMethod: 'manual',
    baseScores: spec.abilities,
    // Proficiencies
    selectedSkills: spec.classSkills,
    expertiseSkills: spec.expertise ?? [],
    selectedLanguages,
    // Level choices (fighting style etc.)
    levelChoices: spec.fightingStyle ? { 1: { 'fighting-style': spec.fightingStyle } } : {},
    // Spells (routed by caster type above)
    selectedCantrips,
    selectedSpells,
    selectedPreparedSpells,
    spellsByLevel,
    currentStep: 1,
  }

  const raceLabel = spec.subrace ? (SUBRACE_NAME[spec.subrace] ?? RACE_NAME[spec.race]) : RACE_NAME[spec.race]
  return {
    id: spec.id,
    title: spec.title,
    charName: spec.charName,
    subtitle: `${raceLabel} ${CLASS_NAME[spec.klass]} · Level ${spec.level}`,
    blurb: spec.blurb,
    level: spec.level,
    primaryAbility: ABILITY_FULL[primary],
    primaryStat: primary,
    isSpellcaster: spellcastingAbility !== null,
    draft,
  }
}

console.log('Building presets from the 5e SRD API…')
const presets = []
for (const spec of SPECS) {
  console.log(`  ${spec.id}…`)
  presets.push(await buildPreset(spec))
}

const header = `// AUTO-GENERATED by scripts/generate-presets.mjs — do not edit by hand.
// Regenerate: node scripts/generate-presets.mjs
// Ready-made, level 1–3 character builds for the "Ready-Made" creation mode. Each 'draft' is a
// complete BuilderDraft partial (merged over defaults by builder.applyDraft).
import type { BuilderDraft } from '@/character-builder/builderStore'

export interface CharacterPreset {
  id: string
  title: string
  charName: string
  subtitle: string
  blurb: string
  level: number
  primaryAbility: string
  primaryStat: string
  isSpellcaster: boolean
  draft: Partial<BuilderDraft>
}

export const PRESETS: CharacterPreset[] = ${JSON.stringify(presets, null, 2)}
`

writeFileSync('src/character-builder/presets.ts', header)
console.log(`\nWrote src/character-builder/presets.ts (${presets.length} presets).`)
