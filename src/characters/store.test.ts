import { describe, it, expect, beforeEach, vi } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'

// ── Shared mock state (vi.hoisted so vi.mock factories can capture them) ────────

const auth = vi.hoisted(() => ({
  isAuthenticated: false,
  userId: null as string | null,
}))

const sbMock = vi.hoisted(() => ({
  result: { data: null as unknown, error: null as unknown },
  ok()  { this.result = { data: null, error: null } },
  fail(msg = 'DB error') { this.result = { data: null, error: new Error(msg) } },
  rows(data: unknown[]) { this.result = { data, error: null } },
}))

const toast = vi.hoisted(() => ({ error: vi.fn(), success: vi.fn(), info: vi.fn() }))

// ── Module mocks ────────────────────────────────────────────────────────────────

vi.mock('@/auth/store', () => ({
  useAuthStore: () => ({
    get isAuthenticated() { return auth.isAuthenticated },
    get userId()          { return auth.userId },
    lastAuthEvent: { value: null },
  }),
}))

vi.mock('@/shared/lib/storage', () => ({
  storageGet: vi.fn().mockReturnValue(null),
  storageSet: vi.fn(),
  storageRemove: vi.fn(),
}))

vi.mock('@/shared/api/supabase.client', () => {
  function chain() {
    const c: Record<string, unknown> = {
      select: vi.fn().mockReturnThis(),
      eq:     vi.fn().mockReturnThis(),
      order:  vi.fn().mockImplementation(() => Promise.resolve(sbMock.result)),
      upsert: vi.fn().mockImplementation(() => Promise.resolve(sbMock.result)),
      delete: vi.fn().mockReturnThis(),
    }
    // Make chain thenable so withTimeout(chain) resolves correctly for delete().eq().eq()
    c.then = (ok: (v: unknown) => unknown, fail?: (e: unknown) => unknown) =>
      Promise.resolve(sbMock.result).then(ok, fail)
    return c
  }
  return { supabase: { from: vi.fn().mockImplementation(chain) } }
})

vi.mock('@/shared/composables/useToast', () => ({ useToast: () => toast }))

vi.mock('@/shared/lib/withTimeout', () => ({
  withTimeout: (p: PromiseLike<unknown>) => Promise.resolve(p),
}))

vi.mock('@/shared/lib/migrateCharacter', () => ({
  migrateCharacter: vi.fn((raw: unknown) => raw),
}))

let _seq = 0
vi.mock('@/shared/lib/uuid', () => ({
  generateId: () => `aaaaaaaa-bbbb-4ccc-8ddd-${String(++_seq).padStart(12, '0')}`,
  now: () => '2026-01-01T00:00:00.000Z',
}))

// ── Import store AFTER mocks ────────────────────────────────────────────────────

import { useCharactersStore, MAX_CHARACTERS } from './store'
import { storageGet, storageSet } from '@/shared/lib/storage'

// ── Helpers ─────────────────────────────────────────────────────────────────────

function makeStore() {
  return useCharactersStore()
}

/** Directly fills the store to `count` fake characters (skips cloud/local I/O). */
function fill(store: ReturnType<typeof makeStore>, count: number) {
  store.characters = Array.from({ length: count }, (_, i) => ({ id: `fill-${i}` } as never))
}

/** Minimal CharacterSchema-valid fixture for import/export tests. */
function makeValidChar(n: number) {
  return {
    id: `00000000-0000-4000-8000-${String(n).padStart(12, '0')}`,
    schemaVersion: '1.1',
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
    identity: {
      name: 'A',
      race: { index: '', name: '', speed: 30, sizeCategory: 'Medium' },
      subrace: null,
      class: { index: '', name: '', hitDie: 8, spellcastingAbility: null },
      subclass: null,
      background: { index: '', name: '' },
      alignment: 'True Neutral',
    },
    personality: {},
    abilityScores: { str: 10, dex: 10, con: 10, int: 10, wis: 10, cha: 10 },
    combat: { level: 1, maxHp: 8, currentHp: 8, armorClass: 10, hitDiceRemaining: 1 },
    skillProficiencies: {},
    savingThrowProficiencies: { str: false, dex: false, con: false, int: false, wis: false, cha: false },
    languages: [],
    otherProficiencies: [],
    inventory: [],
    currency: { cp: 0, sp: 0, ep: 0, gp: 0, pp: 0 },
    spellcasting: null,
    favoriteSpells: [],
    features: [],
  }
}

// ── Setup / teardown ────────────────────────────────────────────────────────────

beforeEach(() => {
  setActivePinia(createPinia())
  _seq = 0
  auth.isAuthenticated = false
  auth.userId = null
  sbMock.ok()
  vi.mocked(storageSet).mockClear()
  toast.error.mockClear()
  toast.success.mockClear()
})

// ── importFromJson ──────────────────────────────────────────────────────────────

describe('importFromJson, validation', () => {
  it('rejects files larger than 5 MB', async () => {
    const big = 'a'.repeat(5 * 1024 * 1024 + 1)
    const store = makeStore()
    const result = await store.importFromJson(big)
    expect(result.imported).toBe(0)
    expect(result.errors[0]).toMatch(/too large/i)
  })

  it('rejects invalid JSON', async () => {
    const store = makeStore()
    const result = await store.importFromJson('not json {{{')
    expect(result.imported).toBe(0)
    expect(result.errors[0]).toMatch(/invalid json/i)
  })

  it('rejects unrecognized format (migrateCharacter throws)', async () => {
    // Override migrateCharacter to throw for this test
    const { migrateCharacter } = await import('@/shared/lib/migrateCharacter')
    vi.mocked(migrateCharacter).mockImplementationOnce(() => { throw new Error('bad') })
    const store = makeStore()
    const result = await store.importFromJson('{}')
    expect(result.imported).toBe(0)
    expect(result.errors[0]).toMatch(/unrecognized/i)
  })
})

describe('importFromJson, character limit enforcement', () => {
  it('returns imported: 0 and adds a limit error when already at MAX_CHARACTERS', async () => {
    const store = makeStore()
    fill(store, MAX_CHARACTERS)
    const result = await store.importFromJson('{}')
    expect(result.imported).toBe(0)
    expect(result.errors.some(e => /limit/i.test(e))).toBe(true)
  })

  it('imports only the characters that fit within the limit', async () => {
    // Arrange: 2 slots remaining, try to import 3 characters via collection envelope
    const store = makeStore()
    fill(store, MAX_CHARACTERS - 2)

    const envelope = JSON.stringify({
      $schema: 'dnd-creator:characters:v1',
      exportedAt: '2026-01-01T00:00:00.000Z',
      count: 3,
      data: [makeValidChar(1), makeValidChar(2), makeValidChar(3)],
    })

    const result = await store.importFromJson(envelope)

    // Only 2 should be imported
    expect(result.imported).toBe(2)
    // 1 should be reported as skipped
    expect(result.errors.some(e => /not imported/i.test(e) || /limit/i.test(e))).toBe(true)
  })

  it('reports the correct imported count (not total-parsed count) when some are skipped', async () => {
    const store = makeStore()
    fill(store, MAX_CHARACTERS - 1)  // 1 slot left

    const envelope = JSON.stringify({
      $schema: 'dnd-creator:characters:v1',
      exportedAt: '2026-01-01T00:00:00.000Z',
      count: 3,
      data: [makeValidChar(1), makeValidChar(2), makeValidChar(3)],
    })

    const result = await store.importFromJson(envelope)

    // imported should be 1, not 3 (the bug we fixed)
    expect(result.imported).toBe(1)
  })
})

// ── create, local mode ─────────────────────────────────────────────────────────

describe('create, local mode', () => {
  it('adds a character to the store', async () => {
    const store = makeStore()
    expect(store.characters).toHaveLength(0)
    await store.create()
    expect(store.characters).toHaveLength(1)
  })

  it('schedules a localStorage write', async () => {
    vi.useFakeTimers()
    try {
      const store = makeStore()
      await store.create()
      await vi.runAllTimersAsync()
      expect(vi.mocked(storageSet)).toHaveBeenCalled()
    } finally {
      vi.useRealTimers()
    }
  })

  it('throws when at MAX_CHARACTERS limit', async () => {
    const store = makeStore()
    fill(store, MAX_CHARACTERS)
    await expect(store.create()).rejects.toThrow(/limit/i)
  })

  it('returns the created character with an id', async () => {
    const store = makeStore()
    const char = await store.create()
    expect(char.id).toBeTruthy()
  })
})

// ── create, cloud mode ─────────────────────────────────────────────────────────

describe('create, cloud mode', () => {
  beforeEach(() => {
    auth.isAuthenticated = true
    auth.userId = 'user-123'
    sbMock.ok()
  })

  it('calls supabase upsert on success', async () => {
    const { supabase } = await import('@/shared/api/supabase.client')
    const store = makeStore()
    await store.create()
    expect(vi.mocked(supabase.from)).toHaveBeenCalledWith('characters')
  })

  it('keeps the character and queues it for retry on cloud failure (no data loss)', async () => {
    sbMock.fail('Network error')
    const store = makeStore()
    // Non-fatal: create resolves and the character is retained in memory
    const char = await store.create()
    expect(store.characters).toHaveLength(1)
    expect(store.getById(char.id)).toBeTruthy()
    expect(toast.error).toHaveBeenCalledOnce()
    // Queued into the pending-sync stash for a later retry
    expect(vi.mocked(storageSet)).toHaveBeenCalledWith(
      'characters:pending',
      expect.arrayContaining([expect.objectContaining({ id: char.id })]),
    )
  })
})

// ── update, cloud resilience ────────────────────────────────────────────────────

describe('update, cloud resilience', () => {
  beforeEach(() => {
    auth.isAuthenticated = true
    auth.userId = 'user-123'
  })

  it('keeps the edit in memory (no rollback) and shows an error toast on cloud failure', async () => {
    sbMock.ok()
    const store = makeStore()
    const char = await store.create()

    sbMock.fail('Save failed')
    // Non-fatal: update resolves without throwing
    await store.update(char.id, {
      identity: { ...char.identity, name: 'Updated Name' },
    })

    // Edit is preserved, not rolled back
    expect(store.getById(char.id)?.identity.name).toBe('Updated Name')
    expect(toast.error).toHaveBeenCalledOnce()
  })
})

// ── retryPending, offline sync queue ─────────────────────────────────────────────

describe('retryPending, offline sync queue', () => {
  beforeEach(() => {
    auth.isAuthenticated = true
    auth.userId = 'user-123'
  })

  it('re-uploads a queued character on load and clears it from the queue', async () => {
    // Build a full, valid character in memory via a successful create…
    sbMock.ok()
    const store = makeStore()
    const char = await store.create()

    // …then simulate it having been left in the pending queue from a previous session.
    vi.mocked(storageGet).mockReturnValueOnce([char]) // read by retryPending
    sbMock.ok()                                        // cloud load empty + retry upload OK
    await store.load()

    // The queued character is present and the queue was cleared
    expect(store.getById(char.id)).toBeTruthy()
    expect(vi.mocked(storageSet)).toHaveBeenCalledWith('characters:pending', [])
    expect(toast.success).toHaveBeenCalledOnce()
  })
})

// ── remove, cloud rollback ─────────────────────────────────────────────────────

describe('remove, cloud rollback', () => {
  beforeEach(() => {
    auth.isAuthenticated = true
    auth.userId = 'user-123'
  })

  it('restores deleted character when cloud delete fails', async () => {
    sbMock.ok()
    const store = makeStore()
    const char = await store.create()
    expect(store.characters).toHaveLength(1)

    sbMock.fail('Delete failed')
    await expect(store.remove(char.id)).rejects.toThrow()

    // Character should be restored
    expect(store.characters).toHaveLength(1)
    expect(store.getById(char.id)).toBeTruthy()
    expect(toast.error).toHaveBeenCalledOnce()
  })
})

// ── duplicate ───────────────────────────────────────────────────────────────────

describe('duplicate', () => {
  it('creates a copy with a different id and "(copy)" suffix', async () => {
    const store = makeStore()
    const original = await store.create()
    const copy = await store.duplicate(original.id)

    expect(copy.id).not.toBe(original.id)
    expect(copy.identity.name).toContain('(copy)')
    expect(store.characters).toHaveLength(2)
  })

  it('throws when the original character does not exist', async () => {
    const store = makeStore()
    await expect(store.duplicate('non-existent-id')).rejects.toThrow()
  })
})

// ── loadFromCloud ───────────────────────────────────────────────────────────────

describe('loadFromCloud', () => {
  beforeEach(() => {
    auth.isAuthenticated = true
    auth.userId = 'user-123'
  })

  it('falls back to localStorage when cloud returns an error', async () => {
    const { storageGet } = await import('@/shared/lib/storage')
    const localChar = { id: 'local-char' }
    vi.mocked(storageGet).mockReturnValueOnce([localChar])

    sbMock.fail('Supabase down')
    const store = makeStore()
    await store.load()

    // Should have the local character (migrateCharacter returns input as-is)
    expect(store.characters).toHaveLength(1)
    expect(store.characters[0]).toMatchObject({ id: 'local-char' })
  })

  it('loads characters from cloud rows on success', async () => {
    sbMock.rows([
      { data: { id: 'cloud-char-1', identity: { name: 'Aragorn' } } },
      { data: { id: 'cloud-char-2', identity: { name: 'Gandalf' } } },
    ])
    const store = makeStore()
    await store.load()
    expect(store.characters).toHaveLength(2)
  })
})

// ── getById ─────────────────────────────────────────────────────────────────────

describe('getById', () => {
  it('returns the character when it exists', async () => {
    const store = makeStore()
    const char = await store.create()
    expect(store.getById(char.id)).toStrictEqual(char)
  })

  it('returns undefined for unknown ids', async () => {
    const store = makeStore()
    expect(store.getById('ghost')).toBeUndefined()
  })
})
