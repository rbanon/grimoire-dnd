import type { ApiEquipment } from '@/shared/types/api'
import type { InventoryItem } from '@/shared/types/character'
import { generateId } from '@/shared/lib/uuid'

function fmtBonus(n: number): string {
  return n >= 0 ? `+${n}` : String(n)
}

export function equipmentToInventoryItem(
  eq: ApiEquipment,
  strMod: number,
  dexMod: number,
  profBonus: number,
): InventoryItem {
  const catIndex = eq.equipment_category?.index ?? 'other'
  const isWeapon = catIndex === 'weapon'
  const isArmor  = catIndex === 'armor'

  const base = {
    id:       generateId(),
    item:     { index: eq.index, name: eq.name, weight: eq.weight },
    quantity: 1,
    equipped: false,
  }

  if (isWeapon) {
    const props     = eq.properties?.map(p => p.index) ?? []
    const isFinesse = props.includes('finesse')
    const isRanged  = eq.weapon_range === 'Ranged'
    const abilMod   = isFinesse ? Math.max(strMod, dexMod) : isRanged ? dexMod : strMod

    let range: string | undefined
    if (eq.range) {
      range = eq.range.long ? `${eq.range.normal}/${eq.range.long} ft.` : `${eq.range.normal} ft.`
    } else if (eq.throw_range) {
      range = `${eq.throw_range.normal}/${eq.throw_range.long} ft. (thrown)`
    }

    const weaponCategory = isRanged ? 'ranged' : 'melee'
    const handedness = props.includes('two-handed') ? 'two-handed'
      : props.includes('versatile') ? 'versatile'
      : 'one-handed'

    return {
      ...base,
      itemType:   'weapon',
      attackBonus: fmtBonus(abilMod + profBonus),
      damage:      eq.damage?.damage_dice,
      damageType:  eq.damage?.damage_type.name,
      range,
      weaponCategory,
      handedness,
    }
  }

  if (isArmor) {
    const cat       = (eq.armor_category ?? '').toLowerCase()
    const armorType = (['light', 'medium', 'heavy', 'shield'] as const).find(t => t === cat)
    return {
      ...base,
      itemType:           'armor',
      armorClass:         eq.armor_class?.base,
      armorType,
      stealthDisadvantage: eq.stealth_disadvantage,
    }
  }

  return { ...base, itemType: 'gear' }
}
