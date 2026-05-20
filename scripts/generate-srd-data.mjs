// Fetches SRD class data from the 5e API and writes src/shared/data/srd-class-data.json.
// Run: node scripts/generate-srd-data.mjs
import { writeFileSync, mkdirSync } from 'fs'

const BASE = 'https://www.dnd5eapi.co/api/2014'
const ALL_CLASSES = ['barbarian', 'bard', 'cleric', 'druid', 'fighter', 'monk', 'paladin', 'ranger', 'rogue', 'sorcerer', 'warlock', 'wizard']
const SPELLCASTERS = ['bard', 'cleric', 'druid', 'paladin', 'ranger', 'sorcerer', 'warlock', 'wizard']

async function fetchJson(path) {
  const res = await fetch(`${BASE}${path}`)
  if (!res.ok) throw new Error(`HTTP ${res.status} ${path}`)
  return res.json()
}

const output = {
  _generated: new Date().toISOString().split('T')[0],
  _source: BASE,
  hitDie: {},
  spellSlots: {},
  cantripsKnown: {},
  spellsKnown: {},
}

console.log('Fetching hit dice...')
for (const cls of ALL_CLASSES) {
  const data = await fetchJson(`/classes/${cls}`)
  output.hitDie[cls] = data.hit_die
  console.log(`  ${cls}: d${data.hit_die}`)
}

console.log('\nFetching spell data...')
for (const cls of SPELLCASTERS) {
  const levels = await fetchJson(`/classes/${cls}/levels`)
  const sorted = [...levels].sort((a, b) => a.level - b.level)

  output.spellSlots[cls] = sorted.map(lvl => {
    const sc = lvl.spellcasting ?? {}
    return [
      sc.spell_slots_level_1 ?? 0,
      sc.spell_slots_level_2 ?? 0,
      sc.spell_slots_level_3 ?? 0,
      sc.spell_slots_level_4 ?? 0,
      sc.spell_slots_level_5 ?? 0,
      sc.spell_slots_level_6 ?? 0,
      sc.spell_slots_level_7 ?? 0,
      sc.spell_slots_level_8 ?? 0,
      sc.spell_slots_level_9 ?? 0,
    ]
  })

  output.cantripsKnown[cls] = sorted.map(lvl => lvl.spellcasting?.cantrips_known ?? 0)

  const spellsKnown = sorted.map(lvl => lvl.spellcasting?.spells_known ?? 0)
  if (spellsKnown.some(n => n > 0)) {
    output.spellsKnown[cls] = spellsKnown
  }

  console.log(`  ${cls}: ✓`)
}

mkdirSync('src/shared/data', { recursive: true })
writeFileSync('src/shared/data/srd-class-data.json', JSON.stringify(output, null, 2))
console.log('\nWrote src/shared/data/srd-class-data.json')
