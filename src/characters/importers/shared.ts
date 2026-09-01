// Shared helpers for the external-format importers.
//
// Every adapter's job is to produce a plain object that CharacterSchema can parse. They do
// NOT need to be complete: `baseCharacter()` supplies a valid skeleton and an adapter fills
// in what its source actually carries. Anything it cannot map is reported, not guessed, so
// an import never silently invents rules data.

import { CLASS_META } from '@/character-builder/classMeta'
import type { Alignment } from '@/shared/types/character'

export interface ImportWarning {
  /** Short, user-facing. Shown in the import result list. */
  message: string
}

export interface AdapterResult {
  /** Parsed by CharacterSchema downstream; id/timestamps are stamped by the store. */
  character: Record<string, unknown>
  warnings: ImportWarning[]
}

const ALIGNMENTS: Alignment[] = [
  'Lawful Good', 'Neutral Good', 'Chaotic Good',
  'Lawful Neutral', 'True Neutral', 'Chaotic Neutral',
  'Lawful Evil', 'Neutral Evil', 'Chaotic Evil',
]

/** Loose alignment matcher: external tools write "CG", "chaotic good", "Chaotic Good". */
export function normalizeAlignment(raw: unknown): Alignment {
  const s = String(raw ?? '').trim().toLowerCase()
  if (!s) return 'True Neutral'
  const exact = ALIGNMENTS.find(a => a.toLowerCase() === s)
  if (exact) return exact
  if (s === 'n' || s === 'tn' || s === 'neutral') return 'True Neutral'
  // Two-letter codes: LG, NG, CG, LN, N, CN, LE, NE, CE
  const codes: Record<string, Alignment> = {
    lg: 'Lawful Good',    ng: 'Neutral Good',    cg: 'Chaotic Good',
    ln: 'Lawful Neutral', cn: 'Chaotic Neutral',
    le: 'Lawful Evil',    ne: 'Neutral Evil',    ce: 'Chaotic Evil',
  }
  if (codes[s]) return codes[s]
  const loose = ALIGNMENTS.find(a => a.toLowerCase().replace(/\s+/g, '') === s.replace(/\s+/g, ''))
  return loose ?? 'True Neutral'
}

/** "Fighter" -> "fighter". Non-SRD names still slugify, they just won't match CLASS_META. */
export function slugify(name: unknown): string {
  return String(name ?? '')
    .trim().toLowerCase()
    .replace(/['’]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

/** Hit die for an SRD class index, or a neutral d8 for anything homebrew. */
export function hitDieFor(classIndex: string): number {
  return CLASS_META[classIndex]?.hitDie ?? 8
}

const SPELLCASTING_ABILITY: Record<string, string> = {
  bard: 'cha', cleric: 'wis', druid: 'wis', paladin: 'cha',
  ranger: 'wis', sorcerer: 'cha', warlock: 'cha', wizard: 'int',
}

/** Spellcasting ability for an SRD class index, or null for martials and unknowns. */
export function spellcastingAbilityFor(classIndex: string): string | null {
  return SPELLCASTING_ABILITY[classIndex] ?? null
}

export function clampLevel(raw: unknown): number {
  const n = Math.trunc(Number(raw))
  if (!Number.isFinite(n)) return 1
  return Math.min(20, Math.max(1, n))
}

export function toInt(raw: unknown, fallback = 0): number {
  const n = Math.trunc(Number(raw))
  return Number.isFinite(n) ? n : fallback
}

/** Ability score clamped to the 1-30 the sheet accepts. */
export function toAbilityScore(raw: unknown, fallback = 10): number {
  const n = Math.trunc(Number(raw))
  if (!Number.isFinite(n)) return fallback
  return Math.min(30, Math.max(1, n))
}

/**
 * A schema-valid character with nothing in it. Adapters spread their mapped fields over
 * this, so a source that omits (say) personality still produces something that parses.
 */
export function baseCharacter(): Record<string, unknown> {
  return {
    schemaVersion: '1.1',
    portrait: { type: 'none' },
    identity: {
      name: 'Imported Character',
      race: { index: '', name: 'Unknown', speed: 30, sizeCategory: 'Medium', edition: '2014' },
      subrace: null,
      class: { index: '', name: 'Unknown', hitDie: 8, spellcastingAbility: null, edition: '2014' },
      subclass: null,
      background: { index: '', name: 'Unknown', skillProficiencies: [], edition: '2014' },
      alignment: 'True Neutral',
    },
    personality: {},
    abilityScores: { str: 10, dex: 10, con: 10, int: 10, wis: 10, cha: 10 },
    combat: {
      level: 1, maxHp: 1, currentHp: 1, tempHp: 0, armorClass: 10,
      inspiration: false, hitDiceRemaining: 1, conditions: [], exhaustion: 0,
      useMilestones: false, concentrationSpell: null,
    },
    skillProficiencies: {},
    // z.record with an enum key requires EVERY key in Zod v4, so all six are always present.
    savingThrowProficiencies: { str: false, dex: false, con: false, int: false, wis: false, cha: false },
    languages: [],
    otherProficiencies: [],
    resistances: [], immunities: [], vulnerabilities: [], senses: [],
    fightingStyles: [],
    combatFavorites: [],
    inventory: [],
    currency: { cp: 0, sp: 0, ep: 0, gp: 0, pp: 0 },
    spellcasting: null,
    resources: [],
    favoriteSpells: [],
    features: [],
    overrides: {},
  }
}
