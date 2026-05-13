import { z } from 'zod'

export const ItemCategorySchema = z.enum([
  'weapon',
  'armor',
  'adventuring-gear',
  'tools',
  'mounts-and-vehicles',
  'trade-goods',
  'other',
  'magic-item',
])
export type ItemCategory = z.infer<typeof ItemCategorySchema>

export const ItemRaritySchema = z.enum([
  'Common',
  'Uncommon',
  'Rare',
  'Very Rare',
  'Legendary',
  'Artifact',
  'Varies',
  'Unknown',
])
export type ItemRarity = z.infer<typeof ItemRaritySchema>

// Normalized item used throughout the app (from ApiEquipment or ApiMagicItem)
export interface NormalizedItem {
  index: string
  name: string
  category: ItemCategory
  subCategory?: string // e.g. "Simple Melee Weapons"
  cost?: { quantity: number; unit: string }
  weight?: number
  weaponRange?: 'Melee' | 'Ranged'
  armorCategory?: string
  rarity?: ItemRarity
  requiresAttunement?: boolean
  description?: string[]
  isMagic: boolean
}

// Client-side filter state
export const ItemSearchFilterStateSchema = z.object({
  query: z.string(),
  category: ItemCategorySchema.nullable(),
  weaponRange: z.enum(['Melee', 'Ranged']).nullable(),
  armorCategory: z.string().nullable(),
  rarity: ItemRaritySchema.nullable(),
  requiresAttunement: z.boolean().nullable(),
  minCostGp: z.number().nullable(),
  maxCostGp: z.number().nullable(),
  minWeight: z.number().nullable(),
  maxWeight: z.number().nullable(),
  sortBy: z.enum(['name', 'cost', 'weight', 'rarity', 'category']),
  sortDir: z.enum(['asc', 'desc']),
})
export type ItemSearchFilterState = z.infer<typeof ItemSearchFilterStateSchema>

export const DEFAULT_ITEM_FILTERS: ItemSearchFilterState = {
  query: '',
  category: null,
  weaponRange: null,
  armorCategory: null,
  rarity: null,
  requiresAttunement: null,
  minCostGp: null,
  maxCostGp: null,
  minWeight: null,
  maxWeight: null,
  sortBy: 'name',
  sortDir: 'asc',
}
