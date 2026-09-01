// D&D Beyond character JSON.
//
// D&D Beyond has no official export button. What people actually save is the payload from
// their character service, either the whole envelope `{ id, success, data: {...} }` or the
// inner `data` object on its own, so both are accepted here.
//
// Shape (the parts we use):
//   data.name, data.race.fullName, data.classes[] ({ level, definition.name, subclassDefinition }),
//   data.background.definition.name, data.alignmentId (1-9),
//   data.stats[] / data.bonusStats[] / data.overrideStats[]  (each [{ id: 1..6, value }]),
//   data.currencies { cp, sp, ep, gp, pp }, data.inventory[], data.spells, data.classSpells[]
//
// Everything is keyed by numeric id, and those ids are the fragile part: this is an
// unpublished internal API. Ids that are not recognized fall back to neutral values rather
// than guessing.

import { generateId } from '@/shared/lib/uuid'
import {
  baseCharacter, slugify, hitDieFor, spellcastingAbilityFor,
  clampLevel, toInt, toAbilityScore, type AdapterResult, type ImportWarning,
} from './shared'
import type { Alignment } from '@/shared/types/character'

// stats[] entries are ordered by this id, 1 = STR through 6 = CHA.
const STAT_ID_TO_ABILITY: Record<number, string> = {
  1: 'str', 2: 'dex', 3: 'con', 4: 'int', 5: 'wis', 6: 'cha',
}

// data.alignmentId, in D&D Beyond's own order.
const ALIGNMENT_BY_ID: Record<number, Alignment> = {
  1: 'Lawful Good',    2: 'Neutral Good',    3: 'Chaotic Good',
  4: 'Lawful Neutral', 5: 'True Neutral',    6: 'Chaotic Neutral',
  7: 'Lawful Evil',    8: 'Neutral Evil',    9: 'Chaotic Evil',
}

function isRecord(v: unknown): v is Record<string, unknown> {
  return typeof v === 'object' && v !== null && !Array.isArray(v)
}

function sub(obj: unknown, ...path: string[]): unknown {
  let cur: unknown = obj
  for (const key of path) {
    if (!isRecord(cur)) return undefined
    cur = cur[key]
  }
  return cur
}

function asArray(v: unknown): unknown[] {
  return Array.isArray(v) ? v : []
}

function stripHtml(v: unknown): string {
  return String(v ?? '').replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim().slice(0, 5000)
}

/** Unwraps the service envelope so both `{data:{...}}` and a bare character work. */
function unwrap(raw: unknown): Record<string, unknown> | null {
  if (!isRecord(raw)) return null
  if (isRecord(raw.data)) return raw.data
  return raw
}

/** Recognizes a D&D Beyond character payload without fully parsing it. */
export function isDndBeyondCharacter(raw: unknown): boolean {
  const data = unwrap(raw)
  if (!data) return false
  // stats[] with numeric ids is the distinctive marker; classes[] rules out a monster blob.
  const stats = asArray(data.stats)
  const looksLikeStats = stats.length >= 6 && stats.every(s => isRecord(s) && 'id' in s && 'value' in s)
  return looksLikeStats && Array.isArray(data.classes)
}

/**
 * Final ability scores. D&D Beyond keeps the base roll in `stats`, racial and item bonuses
 * in `bonusStats`, and a manual override in `overrideStats`; an override wins outright.
 */
function readAbilities(data: Record<string, unknown>): Record<string, number> {
  const result: Record<string, number> = { str: 10, dex: 10, con: 10, int: 10, wis: 10, cha: 10 }
  const readInto = (list: unknown, apply: (ability: string, value: number) => void) => {
    for (const entry of asArray(list)) {
      if (!isRecord(entry)) continue
      const ability = STAT_ID_TO_ABILITY[toInt(entry.id, 0)]
      if (!ability) continue
      if (entry.value === null || entry.value === undefined) continue
      apply(ability, toInt(entry.value, 0))
    }
  }
  readInto(data.stats, (a, v) => { result[a] = v })
  readInto(data.bonusStats, (a, v) => { result[a] += v })
  readInto(data.overrideStats, (a, v) => { result[a] = v })
  for (const key of Object.keys(result)) result[key] = toAbilityScore(result[key])
  return result
}

export function fromDndBeyond(raw: unknown): AdapterResult {
  const warnings: ImportWarning[] = []
  const out = baseCharacter()
  const data = unwrap(raw)
  if (!data) return { character: out, warnings }

  out.abilityScores = readAbilities(data)

  // ── Class, subclass, level ──────────────────────────────────────────────────
  const classes = asArray(data.classes).filter(isRecord)
  const totalLevel = classes.reduce((sum, c) => sum + toInt(c.level, 0), 0)
  let primary: Record<string, unknown> | undefined
  if (classes.length) {
    // `isStartingClass` marks the one the character began as; otherwise take the deepest.
    primary = classes.find(c => c.isStartingClass === true)
      ?? classes.reduce((a, b) => (toInt(b.level, 0) > toInt(a.level, 0) ? b : a))
    if (classes.length > 1) {
      const kept = String(sub(primary, 'definition', 'name') ?? 'the starting class')
      warnings.push({ message: `Multiclass character: kept ${kept} only, this sheet holds one class.` })
    }
  } else {
    warnings.push({ message: 'No class found in the export. Set it on the sheet after importing.' })
  }

  const className = String(sub(primary, 'definition', 'name') ?? 'Unknown')
  const classIndex = primary ? slugify(className) : ''
  const level = clampLevel(totalLevel || 1)
  const subclassName = sub(primary, 'subclassDefinition', 'name')

  // ── Race & background ───────────────────────────────────────────────────────
  // fullName carries the subrace ("Hill Dwarf"); baseName is the race alone.
  const raceFull = String(sub(data, 'race', 'fullName') ?? sub(data, 'race', 'baseName') ?? '') || 'Unknown'
  const raceBase = String(sub(data, 'race', 'baseName') ?? raceFull)
  const bgName = String(sub(data, 'background', 'definition', 'name') ?? '') || 'Unknown'

  out.identity = {
    name: String(data.name ?? '').trim() || 'Imported Character',
    race: {
      index: raceBase === 'Unknown' ? '' : slugify(raceBase),
      name: raceBase,
      speed: toInt(sub(data, 'race', 'weightSpeeds', 'normal', 'walk'), 30) || 30,
      sizeCategory: String(sub(data, 'race', 'size') ?? 'Medium'),
      edition: '2014',
    },
    // Only record a subrace when fullName actually differs from the base race.
    subrace: raceFull !== raceBase && raceFull !== 'Unknown'
      ? { index: slugify(raceFull), name: raceFull }
      : null,
    class: {
      index: classIndex, name: className, hitDie: hitDieFor(classIndex),
      spellcastingAbility: spellcastingAbilityFor(classIndex), edition: '2014',
    },
    subclass: subclassName
      ? { index: slugify(subclassName), name: String(subclassName) }
      : null,
    background: {
      index: bgName === 'Unknown' ? '' : slugify(bgName),
      name: bgName, skillProficiencies: [], edition: '2014',
    },
    alignment: ALIGNMENT_BY_ID[toInt(data.alignmentId, 0)] ?? 'True Neutral',
  }

  out.personality = {
    personalityTraits: stripHtml(sub(data, 'traits', 'personalityTraits')) || undefined,
    ideals: stripHtml(sub(data, 'traits', 'ideals')) || undefined,
    bonds: stripHtml(sub(data, 'traits', 'bonds')) || undefined,
    flaws: stripHtml(sub(data, 'traits', 'flaws')) || undefined,
    biography: stripHtml(sub(data, 'notes', 'backstory')) || undefined,
  }

  // ── Combat ──────────────────────────────────────────────────────────────────
  // baseHitPoints excludes the CON contribution, which D&D Beyond applies at display time.
  // Recreate it here, otherwise every imported character looks badly under-leveled.
  const conMod = Math.floor((out.abilityScores as Record<string, number>).con / 2) - 5
  const baseHp = toInt(data.baseHitPoints, 0)
  const bonusHp = toInt(data.bonusHitPoints, 0)
  const overrideHp = data.overrideHitPoints
  const computedMax = baseHp + bonusHp + conMod * level
  const maxHp = Math.max(1, overrideHp !== null && overrideHp !== undefined
    ? toInt(overrideHp, computedMax)
    : computedMax)
  const removed = Math.max(0, toInt(data.removedHitPoints, 0))

  out.combat = {
    level,
    maxHp,
    currentHp: Math.max(0, maxHp - removed),
    tempHp: Math.max(0, toInt(data.temporaryHitPoints, 0)),
    // AC is fully derived from equipment and effects on D&D Beyond and is not stored as a
    // number anywhere in the payload. Leave the sheet's own default and say so.
    armorClass: 10,
    inspiration: Boolean(data.inspiration),
    hitDiceRemaining: level,
    conditions: [],
    exhaustion: 0,
    useMilestones: false,
    concentrationSpell: null,
  }
  warnings.push({ message: 'Armor Class was not imported, D&D Beyond computes it from equipment. Set it on the sheet.' })

  // ── Currency ────────────────────────────────────────────────────────────────
  const cur = data.currencies
  out.currency = {
    cp: Math.max(0, toInt(sub(cur, 'cp'), 0)),
    sp: Math.max(0, toInt(sub(cur, 'sp'), 0)),
    ep: Math.max(0, toInt(sub(cur, 'ep'), 0)),
    gp: Math.max(0, toInt(sub(cur, 'gp'), 0)),
    pp: Math.max(0, toInt(sub(cur, 'pp'), 0)),
  }

  // ── Inventory ───────────────────────────────────────────────────────────────
  out.inventory = asArray(data.inventory).filter(isRecord).map((entry) => {
    const def = sub(entry, 'definition')
    const filterType = String(sub(def, 'filterType') ?? '')
    const itemType = filterType === 'Weapon' ? 'weapon'
      : filterType === 'Armor' ? 'armor'
      : 'gear'
    const item: Record<string, unknown> = {
      id: generateId(),
      itemType,
      item: {
        index: slugify(sub(def, 'name')),
        name: String(sub(def, 'name') ?? 'Unnamed item'),
      },
      quantity: Math.max(0, toInt(entry.quantity, 1)),
      equipped: Boolean(entry.equipped),
    }
    if (itemType === 'armor') item.armorClass = toInt(sub(def, 'armorClass'), 10)
    return item
  })

  // ── Spells ──────────────────────────────────────────────────────────────────
  // Spells arrive spread across data.spells.{class,race,item,...} and data.classSpells[],
  // so gather every list and de-duplicate by name.
  const spellEntries: unknown[] = []
  const spellBuckets = data.spells
  if (isRecord(spellBuckets)) {
    for (const bucket of Object.values(spellBuckets)) spellEntries.push(...asArray(bucket))
  }
  for (const cs of asArray(data.classSpells)) {
    if (isRecord(cs)) spellEntries.push(...asArray(cs.spells))
  }

  const seen = new Set<string>()
  const cantrips: Record<string, unknown>[] = []
  const known: Record<string, unknown>[] = []
  for (const raw2 of spellEntries) {
    if (!isRecord(raw2)) continue
    const name = String(sub(raw2, 'definition', 'name') ?? '')
    if (!name) continue
    const key = name.toLowerCase()
    if (seen.has(key)) continue
    seen.add(key)
    const lvl = toInt(sub(raw2, 'definition', 'level'), 0)
    const ref = { index: slugify(name), name, level: lvl }
    if (lvl === 0) cantrips.push(ref)
    else known.push(ref)
  }

  if (cantrips.length || known.length) {
    const emptySlots = {
      level1: 0, level2: 0, level3: 0, level4: 0, level5: 0,
      level6: 0, level7: 0, level8: 0, level9: 0,
    }
    out.spellcasting = {
      spellcastingAbility: spellcastingAbilityFor(classIndex) ?? 'int',
      slotsMax: { ...emptySlots },
      slotsUsed: { ...emptySlots },
      spellsKnown: known,
      spellsPrepared: [],
      cantripsKnown: cantrips,
      alwaysPreparedSpells: [],
      ritualCasting: false,
    }
    const n = cantrips.length + known.length
    warnings.push({
      message: `Imported ${n} spell${n > 1 ? 's' : ''}. Spell slots were not imported, set them on the sheet.`,
    })
  }

  // ── Notes ───────────────────────────────────────────────────────────────────
  const notes = stripHtml(sub(data, 'notes', 'otherNotes'))
  if (notes) out.notes = notes.slice(0, 10000)

  return { character: out, warnings }
}
