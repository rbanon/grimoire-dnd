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
]

// ── Assemble ────────────────────────────────────────────────────────────────
const CLASS_NAME = {
  barbarian: 'Barbarian', bard: 'Bard', cleric: 'Cleric', druid: 'Druid', fighter: 'Fighter',
  monk: 'Monk', paladin: 'Paladin', ranger: 'Ranger', rogue: 'Rogue', sorcerer: 'Sorcerer',
  warlock: 'Warlock', wizard: 'Wizard',
}
const RACE_NAME = {
  'half-orc': 'Half-Orc', human: 'Human', tiefling: 'Tiefling', dragonborn: 'Dragonborn',
  'half-elf': 'Half-Elf',
}
const ABILITY_FULL = { str: 'Strength', dex: 'Dexterity', con: 'Constitution', int: 'Intelligence', wis: 'Wisdom', cha: 'Charisma' }
// SRD 5e 2014 — class level at which the subclass is chosen (mirrors classMeta SUBCLASS_LEVEL).
const SUBCLASS_LEVEL = {
  barbarian: 3, bard: 3, cleric: 1, druid: 2, fighter: 3,
  monk: 3, paladin: 3, ranger: 3, rogue: 3, sorcerer: 1, warlock: 1, wizard: 2,
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

  const spellcastingAbility = cls.spellcasting?.spellcasting_ability?.index ?? null

  // A subclass is only offered once the character reaches its unlock level. Below that we leave
  // availableSubclasses empty so the wizard doesn't demand a subclass choice at level 1.
  const subclassUnlocked = spec.level >= (SUBCLASS_LEVEL[spec.klass] ?? 3)
  const availableSubclasses = subclassUnlocked
    ? cls.subclasses.map(s => ({ index: s.index, name: s.name }))
    : []

  // Primary ability = the highest pre-racial score (for the display chip / sorting).
  const primary = Object.entries(spec.abilities).sort((a, b) => b[1] - a[1])[0][0]

  // Resolve spell references (name + level) for prepared/known caster prefill.
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
    // Spells
    selectedCantrips: cantrips,
    selectedSpells: spells,
    currentStep: 1,
  }

  return {
    id: spec.id,
    title: spec.title,
    charName: spec.charName,
    subtitle: `${RACE_NAME[spec.race]} ${CLASS_NAME[spec.klass]} · Level ${spec.level}`,
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
