import { defineStore } from 'pinia'
import { ref } from 'vue'
import type {
  CustomRace, CustomRaceInput, CustomClass, CommunityItem,
} from '@/shared/types/customContent'
import { CustomRaceSchema, CustomClassSchema } from '@/shared/types/customContent'
import { generateId, now } from '@/shared/lib/uuid'
import { supabase } from '@/shared/api/supabase.client'
import { useAuthStore } from '@/auth/store'
import { useToast } from '@/shared/composables/useToast'
import { withTimeout } from '@/shared/lib/withTimeout'
import { toJsonValue } from '@/shared/lib/toJsonValue'
import { racePrimaryStat, classPrimaryStat } from '@/shared/lib/primaryStat'

// Row shape shared by custom_races / custom_classes.
type ContentRow = {
  id: string
  user_id: string
  name: string
  edition: string
  primary_stat: string | null
  is_public: boolean
  author_name: string | null
  data: unknown
  created_at: string
  updated_at: string
}

// Rebuild a full definition from a row: the JSONB blob is the source of truth for the
// authored fields; the denormalized columns win for identity/ownership/sharing/timestamps.
function rowToRace(row: ContentRow): CustomRace | null {
  const parsed = CustomRaceSchema.safeParse({
    ...(row.data as Record<string, unknown>),
    id: row.id, userId: row.user_id, isPublic: row.is_public,
    createdAt: row.created_at, updatedAt: row.updated_at,
  })
  return parsed.success ? parsed.data : null
}

function rowToClass(row: ContentRow): CustomClass | null {
  const parsed = CustomClassSchema.safeParse({
    ...(row.data as Record<string, unknown>),
    id: row.id, userId: row.user_id, isPublic: row.is_public,
    createdAt: row.created_at, updatedAt: row.updated_at,
  })
  return parsed.success ? parsed.data : null
}

/**
 * Cloud-only store for player-authored races/classes. Unlike characters/campaigns there is
 * no local-first mode: custom content requires login (guests build inline in the wizard),
 * and the community feed inherently needs the cloud. Mirrors the optimistic-with-rollback
 * CRUD pattern of the campaigns store.
 */
export const useCustomContentStore = defineStore('custom-content', () => {
  const auth = useAuthStore()
  const races = ref<CustomRace[]>([])
  const classes = ref<CustomClass[]>([])
  const loaded = ref(false)

  function getRace(id: string): CustomRace | undefined {
    return races.value.find((r) => r.id === id)
  }

  // ── Load the signed-in user's own content ───────────────────────────────────
  async function loadMine(): Promise<void> {
    if (!auth.isAuthenticated || !auth.userId) {
      races.value = []; classes.value = []; loaded.value = true; return
    }
    try {
      const [r, c] = await Promise.all([
        withTimeout(
          supabase.from('custom_races').select('*').eq('user_id', auth.userId).order('updated_at', { ascending: false }),
          20_000, 'Custom races load',
        ),
        withTimeout(
          supabase.from('custom_classes').select('*').eq('user_id', auth.userId).order('updated_at', { ascending: false }),
          20_000, 'Custom classes load',
        ),
      ])
      if (r.error) throw r.error
      if (c.error) throw c.error
      races.value = ((r.data ?? []) as ContentRow[]).flatMap((row) => { const x = rowToRace(row); return x ? [x] : [] })
      classes.value = ((c.data ?? []) as ContentRow[]).flatMap((row) => { const x = rowToClass(row); return x ? [x] : [] })
    } catch (err) {
      console.error('[custom-content] loadMine failed:', err)
      useToast().error('Could not load your custom content. Check your connection.')
    } finally {
      loaded.value = true
    }
  }

  // ── Race CRUD ────────────────────────────────────────────────────────────────
  async function upsertRace(race: CustomRace) {
    const { error } = await withTimeout(
      supabase.from('custom_races').upsert({
        id: race.id,
        user_id: race.userId,
        name: race.name,
        edition: race.edition,
        primary_stat: racePrimaryStat(race.abilityBonuses),
        is_public: race.isPublic,
        author_name: auth.nickname,
        data: toJsonValue(race),
        created_at: race.createdAt,
        updated_at: race.updatedAt,
      }),
      20_000, 'Custom race save',
    )
    if (error) throw error
  }

  async function createRace(input: CustomRaceInput): Promise<CustomRace | null> {
    if (!auth.isAuthenticated || !auth.userId) {
      useToast().error('Sign in to save custom content to your collection.')
      return null
    }
    const ts = now()
    const race = CustomRaceSchema.parse({ ...input, id: generateId(), userId: auth.userId, createdAt: ts, updatedAt: ts })
    races.value.unshift(race)
    try {
      await upsertRace(race)
      useToast().success('Custom race saved to your collection.')
      return race
    } catch (err) {
      races.value = races.value.filter((r) => r.id !== race.id)
      console.error('[custom-content] createRace failed:', err)
      useToast().error('Failed to save custom race to the cloud.')
      return null
    }
  }

  async function updateRace(id: string, updates: Partial<CustomRaceInput>): Promise<void> {
    const idx = races.value.findIndex((r) => r.id === id)
    if (idx === -1) return
    const previous = races.value[idx]
    const updated: CustomRace = { ...previous, ...updates, updatedAt: now() }
    races.value[idx] = updated
    try {
      await upsertRace(updated)
    } catch (err) {
      races.value[idx] = previous
      console.error('[custom-content] updateRace failed:', err)
      useToast().error('Changes could not be saved to the cloud.')
      throw err
    }
  }

  async function removeRace(id: string): Promise<void> {
    if (!auth.userId) return
    const idx = races.value.findIndex((r) => r.id === id)
    if (idx === -1) return
    const removed = races.value[idx]
    races.value = races.value.filter((r) => r.id !== id)
    const { error } = await withTimeout(
      supabase.from('custom_races').delete().eq('id', id).eq('user_id', auth.userId),
      20_000, 'Custom race delete',
    )
    if (error) {
      races.value.splice(idx, 0, removed)
      console.error('[custom-content] removeRace failed:', error)
      useToast().error('Failed to delete the custom race.')
      throw error
    }
  }

  /** Toggle whether a race is shared to the community. */
  function setRacePublic(id: string, isPublic: boolean): Promise<void> {
    return updateRace(id, { isPublic })
  }

  // ── Community feed (public content, used by the Community page) ───────────────
  async function loadCommunity(): Promise<CommunityItem[]> {
    const [r, c] = await Promise.all([
      withTimeout(
        supabase.from('custom_races').select('*').eq('is_public', true).order('primary_stat', { ascending: true }).order('name', { ascending: true }),
        20_000, 'Community races',
      ),
      withTimeout(
        supabase.from('custom_classes').select('*').eq('is_public', true).order('primary_stat', { ascending: true }).order('name', { ascending: true }),
        20_000, 'Community classes',
      ),
    ])
    if (r.error) throw r.error
    if (c.error) throw c.error

    const items: CommunityItem[] = []
    for (const row of (r.data ?? []) as ContentRow[]) {
      const data = rowToRace(row)
      if (data) items.push({ id: row.id, userId: row.user_id, kind: 'race', name: row.name, edition: row.edition, primaryStat: row.primary_stat, authorName: row.author_name, updatedAt: row.updated_at, data })
    }
    for (const row of (c.data ?? []) as ContentRow[]) {
      const data = rowToClass(row)
      if (data) items.push({ id: row.id, userId: row.user_id, kind: 'class', name: row.name, edition: row.edition, primaryStat: row.primary_stat ?? classPrimaryStat(data.primaryAbility), authorName: row.author_name, updatedAt: row.updated_at, data })
    }
    return items
  }

  return {
    races, classes, loaded,
    getRace, loadMine,
    createRace, updateRace, removeRace, setRacePublic,
    loadCommunity,
  }
})
