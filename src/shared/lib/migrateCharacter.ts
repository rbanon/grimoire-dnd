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
 * remove existing blocks — they are the history of all schema changes.
 */
export function migrateCharacter(raw: unknown): Character {
  const result = VersionedSchema.safeParse(raw)
  if (!result.success) throw new Error('migrateCharacter: input is not a plain object')

  let data = result.data as Record<string, unknown>

  // ── 1.0 → 1.1 ────────────────────────────────────────────────────────────
  // if (data.schemaVersion === '1.0') {
  //   data = { ...data, newField: defaultValue, schemaVersion: '1.1' }
  // }
  // ─────────────────────────────────────────────────────────────────────────

  data = { ...data, schemaVersion: CURRENT_SCHEMA_VERSION }
  const char = CharacterSchema.parse(data)

  // Soft-populate resources for characters created before the resource tracker.
  // Runs every load; once resources are spent/modified they are no longer empty.
  if (char.resources.length === 0) {
    const mods = computeAllModifiers(char.abilityScores)
    const populated = getClassResources(char.identity.class.index, char.combat.level, mods)
    if (populated.length > 0) return { ...char, resources: populated }
  }

  return char
}
