import { defineStore } from 'pinia'
import { ref, computed, watch } from 'vue'
import { z } from 'zod'
import type { Character, CharacterSummary, EquippedSlots } from '@/shared/types/character'
import {
  CharacterSchema,
  CharacterExportEnvelopeSchema,
  CharacterCollectionExportEnvelopeSchema,
  toCharacterSummary,
} from '@/shared/types/character'
import { storageGet, storageSet } from '@/shared/lib/storage'
import { migrateCharacter } from '@/shared/lib/migrateCharacter'
import { toJsonValue } from '@/shared/lib/toJsonValue'
import { generateId, now } from '@/shared/lib/uuid'
import { supabase } from '@/shared/api/supabase.client'
import { useAuthStore } from '@/auth/store'
import { useToast } from '@/shared/composables/useToast'
import { withTimeout } from '@/shared/lib/withTimeout'

const LOCAL_KEY = 'characters'
// Characters whose cloud write failed are queued here so a transient Supabase/network
// failure never loses the user's work — they are retried on the next load.
const PENDING_KEY = 'characters:pending'
let _persistTimer: ReturnType<typeof setTimeout> | null = null

export const MAX_CHARACTERS = 15

function makeDefaultCharacter(partial: Partial<Character> = {}): Character {
  const id = generateId()
  const ts = now()
  return CharacterSchema.parse({
    id,
    schemaVersion: '1.0',
    createdAt: ts,
    updatedAt: ts,
    portrait: { type: 'none' },
    identity: {
      name: 'New Character',
      race: { index: '', name: '', speed: 30, sizeCategory: 'Medium' },
      subrace: null,
      class: { index: '', name: '', hitDie: 8, spellcastingAbility: null },
      subclass: null,
      background: { index: '', name: '' },
      alignment: 'True Neutral',
    },
    personality: {},
    abilityScores: { str: 10, dex: 10, con: 10, int: 10, wis: 10, cha: 10 },
    combat: {
      level: 1,
      maxHp: 8,
      currentHp: 8,
      tempHp: 0,
      armorClass: 10,
      inspiration: false,
      hitDiceRemaining: 1,
      useMilestones: false,
    },
    skillProficiencies: {},
    savingThrowProficiencies: { str: false, dex: false, con: false, int: false, wis: false, cha: false },
    languages: [],
    otherProficiencies: [],
    resistances: [],
    immunities: [],
    vulnerabilities: [],
    senses: [],
    inventory: [],
    currency: { cp: 0, sp: 0, ep: 0, gp: 0, pp: 0 },
    spellcasting: null,
    favoriteSpells: [],
    features: [],
    overrides: {},
    ...partial,
  })
}

export const useCharactersStore = defineStore('characters', () => {
  const auth = useAuthStore()
  const characters = ref<Character[]>([])
  const loaded = ref(false)

  const summaries = computed<CharacterSummary[]>(() =>
    characters.value.map(toCharacterSummary).sort(
      (a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime(),
    ),
  )

  function getById(id: string): Character | undefined {
    return characters.value.find((c) => c.id === id)
  }

  // ── Load ──────────────────────────────────────────────────────────────────

  async function load() {
    if (auth.isAuthenticated) {
      await loadFromCloud()
      await retryPending()
    } else {
      loadFromLocal()
    }
    loaded.value = true
  }

  function loadFromLocal() {
    const stored = storageGet(LOCAL_KEY, z.array(z.unknown()))
    if (!stored) { characters.value = []; return }
    characters.value = stored.flatMap((raw) => {
      try { return [migrateCharacter(raw)] } catch (e) { console.warn('[characters] Failed to migrate character:', e); return [] }
    })
  }

  async function loadFromCloud(): Promise<boolean> {
    if (!auth.userId) { loadFromLocal(); return false }

    let data: Array<{ data: unknown }> | null = null
    let loadError: unknown = null
    try {
      const result = await withTimeout(
        supabase.from('characters').select('data').eq('user_id', auth.userId).order('updated_at', { ascending: false }),
        20_000,
        'Character load',
      )
      data = result.data as Array<{ data: unknown }> | null
      loadError = result.error
    } catch (err) {
      loadError = err
    }

    if (loadError) {
      console.error('[characters] Cloud load failed, falling back to local', loadError)
      loadFromLocal()
      return false
    }
    const rows = (data ?? []) as Array<{ data: unknown }>
    characters.value = rows.flatMap((row) => {
      try { return [migrateCharacter(row.data)] } catch (e) { console.warn('[characters] Failed to migrate cloud character:', e); return [] }
    })
    return true
  }

  // ── Persist ───────────────────────────────────────────────────────────────

  function persistLocal() {
    if (_persistTimer) clearTimeout(_persistTimer)
    _persistTimer = setTimeout(() => storageSet(LOCAL_KEY, characters.value), 500)
  }

  async function persistCloud(character: Character) {
    if (!auth.isAuthenticated || !auth.userId) return
    const { error } = await withTimeout(
      supabase.from('characters').upsert({
        id: character.id,
        user_id: auth.userId,
        name: character.identity.name,
        level: character.combat.level,
        class_name: character.identity.class.name,
        race_name: character.identity.race.name,
        portrait_url: character.portrait.type === 'url' ? character.portrait.url : null,
        data: toJsonValue(character),
      }),
      20_000,
      'Character save',
    )
    if (error) throw error
  }

  // ── Offline "pending sync" queue ────────────────────────────────────────────
  // A failed cloud write keeps the character in memory AND stashes it here, so a
  // transient Supabase/network hiccup never loses the user's work. Pending characters
  // are re-uploaded on the next load; one is only re-added to in-memory state after a
  // successful cloud write, so characters deleted on another device are never resurrected.

  function readPending(): Character[] {
    const stored = storageGet(PENDING_KEY, z.array(z.unknown()))
    return (stored ?? []).flatMap((raw) => {
      try { return [migrateCharacter(raw)] } catch { return [] }
    })
  }

  function stashPending(character: Character) {
    const list = readPending().filter((c) => c.id !== character.id)
    list.push(character)
    storageSet(PENDING_KEY, list)
  }

  function unstashPending(id: string) {
    storageSet(PENDING_KEY, readPending().filter((c) => c.id !== id))
  }

  // Shared handler for a failed cloud write. Logs the REAL error (so the cause is
  // visible in the console instead of a generic toast), keeps the character in memory,
  // and queues it for retry. Non-fatal by design — the caller does not throw.
  function handleCloudFailure(character: Character, err: unknown, op: string) {
    console.error(`[characters] cloud ${op} failed — kept on this device, will retry:`, err)
    stashPending(character)
    useToast().error('Cloud sync failed — saved on this device and will retry when you reconnect.')
  }

  // Re-upload any characters that previously failed to sync. Called after a cloud load.
  async function retryPending() {
    if (!auth.isAuthenticated || !auth.userId) return
    const pending = readPending()
    if (pending.length === 0) return
    let synced = 0
    for (const c of pending) {
      try {
        await persistCloud(c)
        unstashPending(c.id)
        const idx = characters.value.findIndex((x) => x.id === c.id)
        if (idx === -1) characters.value.push(c)
        else characters.value[idx] = c
        synced++
      } catch { /* leave in the queue for the next attempt */ }
    }
    if (synced > 0) {
      useToast().success(
        synced === 1
          ? '1 offline character synced to the cloud.'
          : `${synced} offline characters synced to the cloud.`,
      )
    }
  }

  // ── CRUD ──────────────────────────────────────────────────────────────────

  async function create(partial?: Partial<Character>): Promise<Character> {
    if (characters.value.length >= MAX_CHARACTERS) {
      throw new Error(`You've reached the limit of ${MAX_CHARACTERS} characters. Delete one to create a new one.`)
    }
    const character = makeDefaultCharacter(partial)
    characters.value.push(character)
    if (auth.isAuthenticated) {
      try {
        await persistCloud(character)
      } catch (err) {
        // Non-fatal: keep the character in memory + queue it for retry so a cloud
        // hiccup never loses the user's work (they still reach the sheet).
        handleCloudFailure(character, err, 'create')
      }
    } else {
      persistLocal()
    }
    return character
  }

  async function update(id: string, updates: Partial<Character>): Promise<void> {
    const idx = characters.value.findIndex((c) => c.id === id)
    if (idx === -1) throw new Error(`Character ${id} not found`)
    const previous = characters.value[idx]
    const updated: Character = { ...previous, ...updates, updatedAt: now() }
    characters.value[idx] = updated
    if (auth.isAuthenticated) {
      try {
        await persistCloud(updated)
      } catch (err) {
        // Non-fatal: keep the edit in memory + queue it for retry.
        handleCloudFailure(updated, err, 'update')
      }
    } else {
      persistLocal()
    }
  }

  async function remove(id: string): Promise<void> {
    const idx = characters.value.findIndex(c => c.id === id)
    if (idx === -1) return
    const removed = characters.value[idx]
    characters.value = characters.value.filter((c) => c.id !== id)
    if (auth.isAuthenticated) {
      if (!auth.userId) throw new Error('Not authenticated')
      const { error } = await withTimeout(
        supabase.from('characters').delete().eq('id', id).eq('user_id', auth.userId),
        20_000,
        'Character delete',
      )
      if (error) {
        characters.value.splice(idx, 0, removed)
        useToast().error('Failed to delete character from cloud. Your data has been restored.')
        throw new Error('Cloud delete failed')
      }
    } else {
      persistLocal()
    }
  }

  async function duplicate(id: string): Promise<Character> {
    const original = getById(id)
    if (!original) throw new Error(`Character ${id} not found`)
    const ts = now()
    return create({
      ...original,
      id: generateId(),
      identity: { ...original.identity, name: `${original.identity.name} (copy)` },
      createdAt: ts,
      updatedAt: ts,
    })
  }

  // ── Import / Export ───────────────────────────────────────────────────────

  function exportOne(id: string): string {
    const c = getById(id)
    if (!c) throw new Error(`Character ${id} not found`)
    const envelope = {
      $schema: 'dnd-creator:character:v1' as const,
      exportedAt: now(),
      data: c,
    }
    return JSON.stringify(envelope, null, 2)
  }

  function exportMany(ids: string[]): string {
    const selected = characters.value.filter((c) => ids.includes(c.id))
    const envelope = {
      $schema: 'dnd-creator:characters:v1' as const,
      exportedAt: now(),
      count: selected.length,
      data: selected,
    }
    return JSON.stringify(envelope, null, 2)
  }

  const IMPORT_MAX_BYTES = 5 * 1024 * 1024 // 5 MB

  async function importFromJson(json: string): Promise<{ imported: number; errors: string[] }> {
    if (new TextEncoder().encode(json).length > IMPORT_MAX_BYTES) {
      return { imported: 0, errors: ['File is too large. Maximum size is 5 MB.'] }
    }
    let parsed: unknown
    try {
      parsed = JSON.parse(json)
    } catch {
      return { imported: 0, errors: ['Invalid JSON'] }
    }

    const errors: string[] = []
    const toAdd: Character[] = []

    // Try single character envelope
    const singleResult = CharacterExportEnvelopeSchema.safeParse(parsed)
    if (singleResult.success) {
      try {
        const c = migrateCharacter({ ...singleResult.data.data, id: generateId(), updatedAt: now() })
        toAdd.push(c)
      } catch { errors.push('Character in envelope failed validation.') }
    } else {
      // Try collection envelope
      const collResult = CharacterCollectionExportEnvelopeSchema.safeParse(parsed)
      if (collResult.success) {
        for (const raw of collResult.data.data) {
          try {
            toAdd.push(migrateCharacter({ ...raw, id: generateId(), updatedAt: now() }))
          } catch { errors.push(`A character in the collection failed validation.`) }
        }
      } else {
        // Try bare character
        try {
          toAdd.push(migrateCharacter({ ...(parsed as object), id: generateId(), updatedAt: now() }))
        } catch {
          errors.push('Unrecognized file format. Please use a .json file exported from The Grimoire (via the Export button on a character card).')
        }
      }
    }

    const remaining = MAX_CHARACTERS - characters.value.length
    const skipped = toAdd.length - Math.min(toAdd.length, remaining)
    if (skipped > 0) errors.push(`${skipped} character${skipped > 1 ? 's were' : ' was'} not imported: you've reached the ${MAX_CHARACTERS}-character limit.`)

    for (const c of toAdd.slice(0, remaining)) {
      characters.value.push(c)
      if (auth.isAuthenticated) {
        try {
          await persistCloud(c)
        } catch {
          errors.push(`Failed to save "${c.identity.name}" to cloud. Check your connection and try again.`)
        }
      }
    }
    if (!auth.isAuthenticated) persistLocal()

    return { imported: Math.min(toAdd.length, remaining), errors }
  }

  // ── Auth sync ─────────────────────────────────────────────────────────────

  // Called when the user signs in mid-session (not on app boot session restore).
  // Reads local characters, loads cloud, merges by "newer wins", uploads local-only
  // or locally-updated chars, clears localStorage (cloud is now source of truth).
  async function syncOnLogin() {
    const stored = storageGet(LOCAL_KEY, z.array(z.unknown()))
    const localChars: Character[] = (stored ?? []).flatMap((raw) => {
      try { return [migrateCharacter(raw)] } catch { return [] }
    })

    const cloudLoaded = await loadFromCloud()
    if (!cloudLoaded) return // cloud unreachable — keep local data as-is

    // Cloud is now source of truth; clear local
    storageSet(LOCAL_KEY, [])

    // Re-upload anything that failed to sync in a previous session
    await retryPending()

    if (localChars.length === 0) return

    let syncedCount = 0
    for (const local of localChars) {
      const cloudIdx = characters.value.findIndex(c => c.id === local.id)
      if (cloudIdx === -1) {
        // Local-only: upload and add to in-memory state
        try {
          await persistCloud(local)
          characters.value.push(local)
          syncedCount++
        } catch { /* non-fatal: char stays accessible in memory this session */ }
      } else {
        const cloud = characters.value[cloudIdx]
        if (new Date(local.updatedAt) > new Date(cloud.updatedAt)) {
          // Local version is newer: overwrite cloud
          try {
            await persistCloud(local)
            characters.value[cloudIdx] = local
            syncedCount++
          } catch { /* non-fatal */ }
        }
        // else cloud is newer or same — keep cloud version
      }
    }

    if (syncedCount > 0) {
      useToast().success(
        syncedCount === 1
          ? '1 local character synced to your account.'
          : `${syncedCount} local characters synced to your account.`,
      )
    }
  }

  // Called when the user signs out. Persists current (cloud) characters to
  // localStorage so they remain accessible offline, then switches to local mode.
  function handleSignOut() {
    storageSet(LOCAL_KEY, characters.value)
    loadFromLocal()
  }

  // React to auth transitions that happen mid-session (not initial session restore).
  watch(() => auth.lastAuthEvent, async (event) => {
    if (event === 'SIGNED_IN') await syncOnLogin()
    else if (event === 'SIGNED_OUT') handleSignOut()
  })

  // ── Favorite spells ───────────────────────────────────────────────────────

  async function toggleFavoriteSpell(
    characterId: string,
    spell: { index: string; name: string; level: number; school?: string },
  ): Promise<void> {
    const c = getById(characterId)
    if (!c) return
    const exists = c.favoriteSpells.find((f) => f.index === spell.index)
    const favoriteSpells = exists
      ? c.favoriteSpells.filter((f) => f.index !== spell.index)
      : [...c.favoriteSpells, { ...spell, addedAt: now() }]
    await update(characterId, { favoriteSpells })
  }

  // ── Equipment slots ─────────────────────────────────────────────────────────
  // Single source of truth for slot ↔ inventory.equipped sync, reusable from any
  // component (Equipment tab, future Level Up auto-equip, etc.).

  function syncEquippedFlags(c: Character, slots: EquippedSlots) {
    const equippedIds = new Set([slots.mainHand, slots.offHand, slots.armor].filter(Boolean) as string[])
    return c.inventory.map((i) => ({ ...i, equipped: equippedIds.has(i.id) }))
  }

  async function setEquipmentSlot(
    characterId: string,
    slot: keyof EquippedSlots,
    itemId: string,
  ): Promise<void> {
    const c = getById(characterId)
    if (!c) return
    const slots: EquippedSlots = { ...c.equippedSlots }
    // Remove the item from any slot it already occupies, then assign the target.
    if (slots.mainHand === itemId) slots.mainHand = null
    if (slots.offHand === itemId) slots.offHand = null
    if (slots.armor === itemId) slots.armor = null
    slots[slot] = itemId
    await update(characterId, { equippedSlots: slots, inventory: syncEquippedFlags(c, slots) })
  }

  async function clearEquipmentSlot(characterId: string, slot: keyof EquippedSlots): Promise<void> {
    const c = getById(characterId)
    if (!c) return
    const slots: EquippedSlots = { ...c.equippedSlots, [slot]: null }
    await update(characterId, { equippedSlots: slots, inventory: syncEquippedFlags(c, slots) })
  }

  return {
    characters,
    summaries,
    loaded,
    getById,
    load,
    create,
    update,
    remove,
    duplicate,
    exportOne,
    exportMany,
    importFromJson,
    toggleFavoriteSpell,
    setEquipmentSlot,
    clearEquipmentSlot,
  }
})
