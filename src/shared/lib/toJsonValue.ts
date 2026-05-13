import type { Json } from '@/shared/types/supabase'

/**
 * Converts any serializable value to a Supabase-compatible Json type.
 * The JSON roundtrip guarantees the result is a plain JSON value:
 * no undefined properties, no class instances, no non-serializable types.
 */
export function toJsonValue(value: unknown): Json {
  return JSON.parse(JSON.stringify(value)) as Json
}
