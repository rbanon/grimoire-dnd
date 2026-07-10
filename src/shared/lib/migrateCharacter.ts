import { z } from 'zod'
import { CharacterSchema, CURRENT_SCHEMA_VERSION, computeAllModifiers, type Character } from '@/shared/types/character'
import { getClassResources } from '@/character-builder/classMeta'

const VersionedSchema = z
  .object({ schemaVersion: z.string().default(CURRENT_SCHEMA_VERSION) })
  .passthrough()

/**
 * Migrates a raw (potentially stale) character record to the current schema version.
 *
 * Each `if` block handles one version hop: transform the data, bump schemaVersion.
 * At the end, the data is always stamped with CURRENT_SCHEMA_VERSION and parsed strictly.
 *
 * Add new migration blocks here when CURRENT_SCHEMA_VERSION changes. Never edit or
 * remove existing blocks, they are the history of all schema changes.
 */
export function migrateCharacter(raw: unknown): Character {
  const result = VersionedSchema.safeParse(raw)
  if (!result.success) throw new Error('migrateCharacter: input is not a plain object')

  let data = result.data as Record<string, unknown>

  // ── 1.0 → 1.1 ────────────────────────────────────────────────────────────
  // Removed the legacy `attacks` field (always []; superseded by combatFavorites).
  // No transform needed, CharacterSchema.parse strips the now-unknown key, but we
  // bump the version so the change is explicit and auditable.
  if (data.schemaVersion === '1.0') {
    data = { ...data, schemaVersion: '1.1' }
  }
  // ─────────────────────────────────────────────────────────────────────────

  data = { ...data, schemaVersion: CURRENT_SCHEMA_VERSION }
  let char = CharacterSchema.parse(data)

  // Soft-populate resources for characters created before the resource tracker.
  // Runs every load; once resources are spent/modified they are no longer empty.
  if (char.resources.length === 0) {
    const mods = computeAllModifiers(char.abilityScores)
    const populated = getClassResources(char.identity.class.index, char.combat.level, mods)
    if (populated.length > 0) char = { ...char, resources: populated }
  }

  // Soft-populate equipment slots for characters created before the slot system.
  // Back-fills equippedSlots from the legacy `equipped` boolean so old characters
  // can still roll attacks (rolls now require a hand-slot assignment).
  const slots = char.equippedSlots
  if (!slots.mainHand && !slots.offHand && !slots.armor) {
    const weapons = char.inventory.filter(i => i.equipped && i.itemType === 'weapon')
    const armor   = char.inventory.filter(i => i.equipped && i.itemType === 'armor')
    const shield    = armor.find(a => a.armorType === 'shield')
    const bodyArmor = armor.find(a => a.armorType !== 'shield')
    if (weapons.length > 0 || armor.length > 0) {
      char = {
        ...char,
        equippedSlots: {
          mainHand: weapons[0]?.id ?? null,
          offHand:  weapons[1]?.id ?? shield?.id ?? null,
          armor:    bodyArmor?.id ?? null,
        },
      }
    }
  }

  return char
}
