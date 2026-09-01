// Format detection for character import.
//
// The importer used to accept only this app's own envelope, which is what a tester ran into
// when they tried a file from elsewhere. It now recognizes Foundry VTT and D&D Beyond too,
// mapping what those formats carry and reporting what they do not.
//
// Detection is by shape, not by a declared format field, because neither external source
// stamps one. Each adapter's `is*` guard keys off structures that only that format has.

import { isFoundryActor, fromFoundry } from './foundry'
import { isDndBeyondCharacter, fromDndBeyond } from './dndbeyond'
import type { AdapterResult } from './shared'

export type ImportFormat = 'grimoire' | 'foundry' | 'dndbeyond' | 'unknown'

export interface DetectedImport {
  format: ImportFormat
  /** Human-readable, used in the import result summary. */
  label: string
}

const LABELS: Record<ImportFormat, string> = {
  grimoire: 'The Grimoire',
  foundry: 'Foundry VTT',
  dndbeyond: 'D&D Beyond',
  unknown: 'Unrecognized',
}

function isRecord(v: unknown): v is Record<string, unknown> {
  return typeof v === 'object' && v !== null && !Array.isArray(v)
}

/** True for this app's own single or collection envelope. */
function isGrimoireEnvelope(raw: unknown): boolean {
  if (!isRecord(raw)) return false
  const schema = raw.$schema
  return schema === 'dnd-creator:character:v1' || schema === 'dnd-creator:characters:v1'
}

export function detectFormat(raw: unknown): DetectedImport {
  // Grimoire first: its envelope is explicit, so it never needs shape-guessing.
  if (isGrimoireEnvelope(raw)) return { format: 'grimoire', label: LABELS.grimoire }
  if (isDndBeyondCharacter(raw)) return { format: 'dndbeyond', label: LABELS.dndbeyond }
  if (isFoundryActor(raw)) return { format: 'foundry', label: LABELS.foundry }
  return { format: 'unknown', label: LABELS.unknown }
}

/**
 * Converts a recognized external payload into something CharacterSchema can parse.
 * Returns null for formats this module does not own (grimoire, unknown), which the store
 * handles on its own path.
 */
export function convertExternal(format: ImportFormat, raw: unknown): AdapterResult | null {
  if (format === 'foundry') return fromFoundry(raw)
  if (format === 'dndbeyond') return fromDndBeyond(raw)
  return null
}

export type { AdapterResult, ImportWarning } from './shared'
