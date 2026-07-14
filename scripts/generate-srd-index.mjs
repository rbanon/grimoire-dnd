// Fetches SRD reference data (monsters, spells, items) from the 5e API and writes
// slim index files to src/shared/data/. These power the Bestiary, Spells and Items
// browsers instantly and offline, replacing the old per-entry N+1 detail fetches
// that made the first visit take 50-90s (300+ rate-limited round trips per page).
//
// Run: npm run gen-srd-index   (or: node scripts/generate-srd-index.mjs)
//
// The SRD is immutable, so the generated JSON is committed to the repo and only needs
// regenerating if the upstream API data changes. The slim shapes produced here MUST
// stay in sync with SlimMonster/SlimSpell/SlimItem in src/shared/data/srdIndex.ts.
import { writeFileSync, mkdirSync } from 'fs'

const BASE = 'https://www.dnd5eapi.co/api/2014'
const OUT_DIR = 'src/shared/data'
const CONCURRENCY = 12

async function fetchJson(path) {
  for (let attempt = 1; attempt <= 4; attempt++) {
    try {
      const res = await fetch(`${BASE}${path}`)
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      return await res.json()
    } catch (err) {
      if (attempt === 4) throw new Error(`Failed ${path}: ${err.message}`)
      await new Promise(r => setTimeout(r, 300 * attempt))
    }
  }
}

// Fetch details for a list of refs with bounded concurrency, preserving input order.
async function fetchAll(refs, pathFor, label) {
  const out = new Array(refs.length)
  let next = 0
  let done = 0
  async function worker() {
    while (next < refs.length) {
      const i = next++
      out[i] = await fetchJson(pathFor(refs[i].index))
      done++
      if (done % 25 === 0 || done === refs.length) {
        process.stdout.write(`\r  ${label}: ${done}/${refs.length}`)
      }
    }
  }
  await Promise.all(Array.from({ length: CONCURRENCY }, worker))
  process.stdout.write('\n')
  return out
}

// Valid item categories (mirrors ItemCategorySchema in src/shared/types/items.ts)
const ITEM_CATEGORIES = new Set([
  'weapon', 'armor', 'adventuring-gear', 'tools',
  'mounts-and-vehicles', 'trade-goods', 'other', 'magic-item',
])

function slimMonster(m) {
  return {
    index: m.index,
    name: m.name,
    challenge_rating: m.challenge_rating,
    type: m.type,
    subtype: m.subtype ?? null,
    size: m.size,
  }
}

function slimSpell(s) {
  // Keep school/classes as { index, name, url } references so the browser template
  // reads spell.school.name / spell.classes.map(c => c.name) unchanged.
  return {
    index: s.index,
    name: s.name,
    level: s.level,
    school: s.school,
    casting_time: s.casting_time,
    concentration: s.concentration,
    ritual: s.ritual,
    classes: s.classes,
  }
}

// Mirrors normalizeEquipment() in ItemBrowserPage.vue, plus a compact stat block
// so grid cards can show weapon/armor stats without a runtime detail fetch.
function slimEquipment(e) {
  const catIdx = e.equipment_category?.index
  const item = {
    index: e.index,
    name: e.name,
    category: ITEM_CATEGORIES.has(catIdx) ? catIdx : 'other',
    subCategory: e.weapon_category ?? e.armor_category ?? e.gear_category?.name,
    cost: e.cost,
    weight: e.weight,
    isMagic: false,
  }
  const stats = {}
  if (e.damage) {
    stats.damageDice = e.damage.damage_dice
    stats.damageType = e.damage.damage_type?.name
  }
  if (e.two_handed_damage) stats.twoHandedDamageDice = e.two_handed_damage.damage_dice
  if (e.properties?.length) stats.properties = e.properties.map(p => p.name)
  if (e.armor_class) stats.acBase = e.armor_class.base
  if (e.str_minimum) stats.strMinimum = e.str_minimum
  if (e.stealth_disadvantage) stats.stealthDisadvantage = true
  if (Object.keys(stats).length) item.stats = stats
  return item
}

// Mirrors normalizeMagicItem() in ItemBrowserPage.vue
function slimMagicItem(m) {
  return {
    index: m.index,
    name: m.name,
    category: 'magic-item',
    subCategory: m.equipment_category?.name,
    rarity: m.rarity?.name,
    requiresAttunement: m.desc?.[0]?.toLowerCase().includes('requires attunement') ?? false,
    isMagic: true,
  }
}

async function main() {
  mkdirSync(OUT_DIR, { recursive: true })

  console.log('Fetching monsters...')
  const monsterList = await fetchJson('/monsters')
  const monsters = (await fetchAll(monsterList.results, i => `/monsters/${i}`, 'monsters')).map(slimMonster)
  writeFileSync(`${OUT_DIR}/monsters-index.json`, JSON.stringify(monsters))

  console.log('Fetching spells...')
  const spellList = await fetchJson('/spells')
  const spells = (await fetchAll(spellList.results, i => `/spells/${i}`, 'spells')).map(slimSpell)
  writeFileSync(`${OUT_DIR}/spells-index.json`, JSON.stringify(spells))

  console.log('Fetching items...')
  const [equipList, magicList] = await Promise.all([fetchJson('/equipment'), fetchJson('/magic-items')])
  const equip = (await fetchAll(equipList.results, i => `/equipment/${i}`, 'equipment')).map(slimEquipment)
  const magic = (await fetchAll(magicList.results, i => `/magic-items/${i}`, 'magic-items')).map(slimMagicItem)
  const items = [...equip, ...magic]
  writeFileSync(`${OUT_DIR}/items-index.json`, JSON.stringify(items))

  const dist = {}
  for (const it of items) dist[it.category] = (dist[it.category] ?? 0) + 1
  console.log('\nWrote to', OUT_DIR + ':')
  console.log(`  monsters-index.json (${monsters.length})`)
  console.log(`  spells-index.json   (${spells.length})`)
  console.log(`  items-index.json    (${items.length})`, dist)
}

main().catch(err => { console.error('\n' + err.message); process.exit(1) })
