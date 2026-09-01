// Foundry VTT (dnd5e system) actor export.
//
// Shape, as produced by "Export Data" on an actor:
//   { name, type: 'character', system: { abilities, attributes, details, skills, currency },
//     items: [ { name, type: 'class'|'subclass'|'race'|'background'|'spell'|'weapon'|
//                       'equipment'|'consumable'|'feat'|'tool'|'loot', system: {...} } ] }
//
// Class, level, race and background all live in `items`, not in `system`, which is the main
// thing that makes this format look unlike ours. Anything outside the SRD imports by name
// with a blank index: it shows on the sheet but has no API detail to expand.

import { generateId } from '@/shared/lib/uuid'
import {
  baseCharacter, normalizeAlignment, slugify, hitDieFor, spellcastingAbilityFor,
  clampLevel, toInt, toAbilityScore, type AdapterResult, type ImportWarning,
} from './shared'

interface FoundryItem {
  name?: unknown
  type?: unknown
  system?: Record<string, unknown>
}

const ABILITY_KEYS = ['str', 'dex', 'con', 'int', 'wis', 'cha'] as const

// Foundry uses three-letter skill keys and 0/1/2 for none/proficient/expertise.
const FOUNDRY_SKILLS: Record<string, string> = {
  acr: 'acrobatics', ani: 'animal-handling', arc: 'arcana', ath: 'athletics',
  dec: 'deception', his: 'history', ins: 'insight', itm: 'intimidation',
  inv: 'investigation', med: 'medicine', nat: 'nature', prc: 'perception',
  prf: 'performance', per: 'persuasion', rel: 'religion', slt: 'sleight-of-hand',
  ste: 'stealth', sur: 'survival',
}

const PHYSICAL_ITEM_TYPES = new Set([
  'weapon', 'equipment', 'consumable', 'tool', 'loot', 'container', 'backpack',
])

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

function stripHtml(v: unknown): string {
  return String(v ?? '').replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim().slice(0, 5000)
}

/** Recognizes a Foundry dnd5e actor without fully parsing it. */
export function isFoundryActor(raw: unknown): boolean {
  if (!isRecord(raw)) return false
  // `type: 'character'` is the strongest signal but older exports omit it, so key off the
  // two structures every dnd5e actor has.
  return isRecord(sub(raw, 'system', 'abilities')) && Array.isArray(raw.items)
}

export function fromFoundry(raw: unknown): AdapterResult {
  const warnings: ImportWarning[] = []
  const out = baseCharacter()
  if (!isRecord(raw)) return { character: out, warnings }

  const system = isRecord(raw.system) ? raw.system : {}
  const items: FoundryItem[] = Array.isArray(raw.items) ? raw.items as FoundryItem[] : []
  const itemsOfType = (t: string) => items.filter(i => String(i.type) === t)

  // ── Abilities ───────────────────────────────────────────────────────────────
  const abilities: Record<string, number> = {}
  for (const key of ABILITY_KEYS) {
    abilities[key] = toAbilityScore(sub(system, 'abilities', key, 'value'))
  }
  out.abilityScores = abilities

  // ── Class, subclass, level ──────────────────────────────────────────────────
  // A multiclass character carries several class items. Keep the highest-level one and say
  // so, rather than inventing a multiclass model this sheet does not have.
  const classItems = itemsOfType('class')
  const classLevels = classItems.map(c => toInt(sub(c.system, 'levels'), 0))
  const totalLevel = classLevels.reduce((a, b) => a + b, 0)

  let primaryClass: FoundryItem | undefined
  if (classItems.length) {
    let best = 0
    classItems.forEach((_c, i) => { if (classLevels[i] > classLevels[best]) best = i })
    primaryClass = classItems[best]
    if (classItems.length > 1) {
      const kept = String(primaryClass?.name ?? 'the highest-level class')
      warnings.push({ message: `Multiclass character: kept ${kept} only, this sheet holds one class.` })
    }
  } else {
    warnings.push({ message: 'No class found in the export. Set it on the sheet after importing.' })
  }

  const className = String(primaryClass?.name ?? 'Unknown')
  const classIndex = primaryClass ? slugify(className) : ''
  const level = clampLevel(totalLevel || 1)
  const subclassItem = itemsOfType('subclass')[0]

  // ── Race & background ───────────────────────────────────────────────────────
  // dnd5e moved race from `system.details.race` (a plain string) to a `race` item.
  // Support both so older exports still import.
  const raceItem = itemsOfType('race')[0]
  const raceName = String(raceItem?.name ?? sub(system, 'details', 'race') ?? '') || 'Unknown'
  const bgItem = itemsOfType('background')[0]
  const bgName = String(bgItem?.name ?? sub(system, 'details', 'background') ?? '') || 'Unknown'
  const speed = toInt(sub(system, 'attributes', 'movement', 'walk'), 30) || 30

  out.identity = {
    name: String(raw.name ?? '').trim() || 'Imported Character',
    race: {
      index: raceName === 'Unknown' ? '' : slugify(raceName),
      name: raceName, speed, sizeCategory: 'Medium', edition: '2014',
    },
    subrace: null,
    class: {
      index: classIndex, name: className, hitDie: hitDieFor(classIndex),
      spellcastingAbility: spellcastingAbilityFor(classIndex), edition: '2014',
    },
    subclass: subclassItem
      ? { index: slugify(subclassItem.name), name: String(subclassItem.name) }
      : null,
    background: {
      index: bgName === 'Unknown' ? '' : slugify(bgName),
      name: bgName, skillProficiencies: [], edition: '2014',
    },
    alignment: normalizeAlignment(sub(system, 'details', 'alignment')),
  }

  // ── Personality (Foundry stores these as HTML) ──────────────────────────────
  out.personality = {
    personalityTraits: stripHtml(sub(system, 'details', 'trait')) || undefined,
    ideals: stripHtml(sub(system, 'details', 'ideal')) || undefined,
    bonds: stripHtml(sub(system, 'details', 'bond')) || undefined,
    flaws: stripHtml(sub(system, 'details', 'flaw')) || undefined,
    biography: stripHtml(sub(system, 'details', 'biography', 'value')) || undefined,
  }

  // ── Combat ──────────────────────────────────────────────────────────────────
  const maxHp = Math.max(1, toInt(sub(system, 'attributes', 'hp', 'max'), 1))
  const rawCurrentHp = sub(system, 'attributes', 'hp', 'value')
  // dnd5e computes AC into `value`; `flat` is only set when the player overrode it.
  const acRaw = sub(system, 'attributes', 'ac', 'flat') ?? sub(system, 'attributes', 'ac', 'value')

  out.combat = {
    level,
    maxHp,
    currentHp: rawCurrentHp === undefined ? maxHp : toInt(rawCurrentHp, maxHp),
    tempHp: Math.max(0, toInt(sub(system, 'attributes', 'hp', 'temp'), 0)),
    armorClass: Math.max(0, toInt(acRaw, 10)),
    inspiration: Boolean(sub(system, 'attributes', 'inspiration')),
    hitDiceRemaining: level,
    conditions: [],
    exhaustion: Math.min(6, Math.max(0, toInt(sub(system, 'attributes', 'exhaustion'), 0))),
    useMilestones: false,
    concentrationSpell: null,
  }

  // ── Saving throws ───────────────────────────────────────────────────────────
  // Every ability must be present, not just the proficient ones (see baseCharacter).
  const saves: Record<string, boolean> = {}
  for (const key of ABILITY_KEYS) {
    saves[key] = toInt(sub(system, 'abilities', key, 'proficient'), 0) > 0
  }
  out.savingThrowProficiencies = saves

  // ── Skills ──────────────────────────────────────────────────────────────────
  const skills: Record<string, string> = {}
  const foundrySkills = sub(system, 'skills')
  if (isRecord(foundrySkills)) {
    for (const [key, val] of Object.entries(foundrySkills)) {
      const ours = FOUNDRY_SKILLS[key]
      if (!ours) continue
      const rank = toInt(sub(val, 'value'), 0)
      if (rank >= 2) skills[ours] = 'expertise'
      else if (rank >= 1) skills[ours] = 'proficient'
    }
  }
  out.skillProficiencies = skills

  // ── Currency ────────────────────────────────────────────────────────────────
  const cur = sub(system, 'currency')
  out.currency = {
    cp: Math.max(0, toInt(sub(cur, 'cp'), 0)),
    sp: Math.max(0, toInt(sub(cur, 'sp'), 0)),
    ep: Math.max(0, toInt(sub(cur, 'ep'), 0)),
    gp: Math.max(0, toInt(sub(cur, 'gp'), 0)),
    pp: Math.max(0, toInt(sub(cur, 'pp'), 0)),
  }

  // ── Inventory ───────────────────────────────────────────────────────────────
  out.inventory = items
    .filter(i => PHYSICAL_ITEM_TYPES.has(String(i.type)))
    .map(i => {
      const type = String(i.type)
      const armorValue = sub(i.system, 'armor', 'value')
      const itemType = type === 'weapon'
        ? 'weapon'
        : (type === 'equipment' && armorValue !== undefined) ? 'armor' : 'gear'
      const entry: Record<string, unknown> = {
        id: generateId(),
        itemType,
        item: { index: slugify(i.name), name: String(i.name ?? 'Unnamed item') },
        quantity: Math.max(0, toInt(sub(i.system, 'quantity'), 1)),
        equipped: Boolean(sub(i.system, 'equipped')),
      }
      if (itemType === 'armor') entry.armorClass = toInt(armorValue, 10)
      return entry
    })

  // ── Spells ──────────────────────────────────────────────────────────────────
  const spellItems = itemsOfType('spell')
  if (spellItems.length) {
    const cantrips: Record<string, unknown>[] = []
    const known: Record<string, unknown>[] = []
    for (const sp of spellItems) {
      const lvl = toInt(sub(sp.system, 'level'), 0)
      const ref = { index: slugify(sp.name), name: String(sp.name ?? 'Unnamed spell'), level: lvl }
      if (lvl === 0) cantrips.push(ref)
      else known.push(ref)
    }
    const emptySlots = {
      level1: 0, level2: 0, level3: 0, level4: 0, level5: 0,
      level6: 0, level7: 0, level8: 0, level9: 0,
    }
    out.spellcasting = {
      spellcastingAbility: spellcastingAbilityFor(classIndex) ?? 'int',
      // Our slot maxima are class/level derived and Foundry's per-level slot objects do not
      // map cleanly onto them, so leave them empty rather than import a wrong maximum.
      slotsMax: { ...emptySlots },
      slotsUsed: { ...emptySlots },
      spellsKnown: known,
      spellsPrepared: [],
      cantripsKnown: cantrips,
      alwaysPreparedSpells: [],
      ritualCasting: false,
    }
    const n = spellItems.length
    warnings.push({
      message: `Imported ${n} spell${n > 1 ? 's' : ''}. Spell slots were not imported, set them on the sheet.`,
    })
  }

  // ── Features ────────────────────────────────────────────────────────────────
  out.features = itemsOfType('feat').slice(0, 100).map(f => ({
    id: generateId(),
    name: String(f.name ?? 'Unnamed feature'),
    source: 'Imported',
    description: stripHtml(sub(f.system, 'description', 'value')).slice(0, 2000),
  }))

  return { character: out, warnings }
}
