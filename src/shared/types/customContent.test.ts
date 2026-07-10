import { describe, it, expect } from 'vitest'
import { CustomRaceSchema, CustomClassSchema } from './customContent'

const baseRace = {
  id: 'r1', userId: 'u1', name: 'Stormborn', createdAt: 't', updatedAt: 't',
}
const baseClass = {
  id: 'c1', userId: 'u1', name: 'Runesmith', createdAt: 't', updatedAt: 't',
}

describe('content provenance (source)', () => {
  it('round-trips a source on a copied race', () => {
    const parsed = CustomRaceSchema.parse({
      ...baseRace,
      source: { id: 'orig-1', authorName: 'Alice', updatedAt: '2026-01-01' },
    })
    expect(parsed.source).toEqual({ id: 'orig-1', authorName: 'Alice', updatedAt: '2026-01-01' })
  })

  it('round-trips a source on a copied class', () => {
    const parsed = CustomClassSchema.parse({
      ...baseClass,
      source: { id: 'orig-2', authorName: null, updatedAt: '2026-02-02' },
    })
    expect(parsed.source?.id).toBe('orig-2')
    expect(parsed.source?.authorName).toBeNull()
  })

  it('is absent on originally-authored content (backward compatible)', () => {
    // Rows saved before provenance existed have no `source` — must still parse.
    expect(CustomRaceSchema.parse(baseRace).source).toBeUndefined()
    expect(CustomClassSchema.parse(baseClass).source).toBeUndefined()
  })
})
