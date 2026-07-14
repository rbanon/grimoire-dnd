// Slim, prebaked SRD indexes for the Bestiary / Spells / Items browsers.
//
// The 5e API only returns { index, name, url } from its list endpoints, so the old
// browsers fetched every entry's full detail one-by-one (300+ rate-limited requests
// per page, 50-90s on first visit) just to power filtering, sorting and card stats.
//
// These indexes ship exactly the fields those views need, generated offline by
// scripts/generate-srd-index.mjs. First load is a single ~5-10 KB (gzipped) chunk,
// lazily code-split per dataset, and works fully offline. Full detail for the info
// panel (on click) still comes from the live API, a single cached request.
//
// Regenerate after an upstream data change with: npm run gen-srd-index
import type { ApiReference } from '@/shared/types/api'
import type { NormalizedItem } from '@/shared/types/items'

export interface SlimMonster {
  index: string
  name: string
  challenge_rating: number
  type: string
  subtype?: string | null
  size: string
}

export interface SlimSpell {
  index: string
  name: string
  level: number
  school: ApiReference
  casting_time: string
  concentration: boolean
  ritual: boolean
  classes: ApiReference[]
}

// Compact weapon/armor stat block for grid cards (see slimEquipment in the generator).
export interface SlimItemStats {
  damageDice?: string
  damageType?: string
  twoHandedDamageDice?: string
  properties?: string[]
  acBase?: number
  strMinimum?: number
  stealthDisadvantage?: boolean
}

export interface SlimItem extends NormalizedItem {
  stats?: SlimItemStats
}

export function loadMonsterIndex(): Promise<SlimMonster[]> {
  return import('./monsters-index.json').then(m => m.default as unknown as SlimMonster[])
}

export function loadSpellIndex(): Promise<SlimSpell[]> {
  return import('./spells-index.json').then(m => m.default as unknown as SlimSpell[])
}

export function loadItemIndex(): Promise<SlimItem[]> {
  return import('./items-index.json').then(m => m.default as unknown as SlimItem[])
}
