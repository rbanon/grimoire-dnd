import { z } from 'zod'

const PREFIX = 'dnd:'

export function storageGet<T>(key: string, schema: z.ZodSchema<T>): T | null {
  try {
    const raw = localStorage.getItem(PREFIX + key)
    if (raw === null) return null
    const parsed = JSON.parse(raw)
    const result = schema.safeParse(parsed)
    if (!result.success) {
      console.warn(`[storage] Invalid data for key "${key}":`, result.error.flatten())
      return null
    }
    return result.data
  } catch {
    return null
  }
}

export function storageSet(key: string, value: unknown): void {
  try {
    localStorage.setItem(PREFIX + key, JSON.stringify(value))
  } catch (e) {
    console.error('[storage] Failed to write:', e)
  }
}

export function storageRemove(key: string): void {
  localStorage.removeItem(PREFIX + key)
}

export function storageClear(keyPrefix: string): void {
  const keys = Object.keys(localStorage).filter((k) => k.startsWith(PREFIX + keyPrefix))
  keys.forEach((k) => localStorage.removeItem(k))
}
