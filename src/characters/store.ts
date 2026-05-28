import { defineStore } from 'pinia'
import { ref, computed, watch } from 'vue'
import { z } from 'zod'
import type { Character, CharacterSummary } from '@/shared/types/character'
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

const LOCAL_KEY = 'characters'
let _persistTimer: ReturnType<typeof setTimeout> | null = null

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
    savingThrowProficiencies: {},
    languages: [],
    otherProficiencies: [],
    resistances: [],
    immunities: [],
    vulnerabilities: [],
    senses: [],
    attacks: [],
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
    } else {
      loadFromLocal()
    }
    loaded.value = true
  }

  function loadFromLocal() {
    const stored = storageGet(LOCAL_KEY, z.array(z.unknown()))
    if (!stored) { characters.value = []; return }
    characters.value = stored.flatMap((raw) => {
      try { return [migrateCharacter(raw)] } catch { return [] }
    })
  }

  async function loadFromCloud(): Promise<boolean> {
    if (!auth.userId) { loadFromLocal(); return false }
    const { data, error } = await supabase
      .from('characters')
      .select('data')
      .eq('user_id', auth.userId)
      .order('updated_at', { ascending: false })

    if (error) {
      console.error('[characters] Cloud load failed, falling back to local', error)
      loadFromLocal()
      return false
    }
    const rows = (data ?? []) as Array<{ data: unknown }>
    characters.value = rows.flatMap((row) => {
      try { return [migrateCharacter(row.data)] } catch { return [] }
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
    const { error } = await supabase.from('characters').upsert({
      id: character.id,
      user_id: auth.userId,
      name: character.identity.name,
      level: character.combat.level,
      class_name: character.identity.class.name,
      race_name: character.identity.race.name,
      portrait_url: character.portrait.type === 'url' ? character.portrait.url : null,
      data: toJsonValue(character),
    })
    if (error) throw error
  }

  // ── CRUD ──────────────────────────────────────────────────────────────────

  async function create(partial?: Partial<Character>): Promise<Character> {
    const character = makeDefaultCharacter(partial)
    characters.value.push(character)
    if (auth.isAuthenticated) {
      try {
        await persistCloud(character)
      } catch {
        characters.value = characters.value.filter(c => c.id !== character.id)
        useToast().error('Failed to save character to cloud. Check your connection and try again.')
        throw new Error('Cloud sync failed')
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
      } catch {
        characters.value[idx] = previous
        useToast().error('Changes could not be saved to cloud. Your data has been restored.')
        throw new Error('Cloud sync failed')
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
      const { error } = await supabase.from('characters').delete().eq('id', id).eq('user_id', auth.userId)
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
    if (json.length > IMPORT_MAX_BYTES) {
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

    for (const c of toAdd) {
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

    return { imported: toAdd.length, errors }
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
  }
})
