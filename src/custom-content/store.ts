import { defineStore } from 'pinia'
import { ref } from 'vue'
import type {
  CustomRace, CustomRaceInput, CustomClass, CustomClassInput,
  CustomSubclass, CustomSubclassInput, CommunityItem,
} from '@/shared/types/customContent'
import { CustomRaceSchema, CustomClassSchema, CustomSubclassSchema } from '@/shared/types/customContent'
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

// Subclass rows carry parent_class (not primary_stat); parentClass/parentClassName live in the blob.
type SubclassRow = Omit<ContentRow, 'primary_stat'> & { parent_class: string }
function rowToSubclass(row: SubclassRow): CustomSubclass | null {
  const parsed = CustomSubclassSchema.safeParse({
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
  const subclasses = ref<CustomSubclass[]>([])
  const loaded = ref(false)
  // Copy id → true when the community original it was copied from now has a newer version.
  // Populated best-effort by refreshSourceUpdates(); consumed by the Profile "Update" action.
  const sourceUpdates = ref<Record<string, boolean>>({})

  function getRace(id: string): CustomRace | undefined {
    return races.value.find((r) => r.id === id)
  }

  // ── Load the signed-in user's own content ───────────────────────────────────
  async function loadMine(): Promise<void> {
    if (!auth.isAuthenticated || !auth.userId) {
      races.value = []; classes.value = []; subclasses.value = []; loaded.value = true; return
    }
    try {
      const [r, c, s] = await Promise.all([
        withTimeout(
          supabase.from('custom_races').select('*').eq('user_id', auth.userId).order('updated_at', { ascending: false }),
          20_000, 'Custom races load',
        ),
        withTimeout(
          supabase.from('custom_classes').select('*').eq('user_id', auth.userId).order('updated_at', { ascending: false }),
          20_000, 'Custom classes load',
        ),
        withTimeout(
          supabase.from('custom_subclasses').select('*').eq('user_id', auth.userId).order('updated_at', { ascending: false }),
          20_000, 'Custom subclasses load',
        ),
      ])
      if (r.error) throw r.error
      if (c.error) throw c.error
      if (s.error) throw s.error
      races.value = ((r.data ?? []) as ContentRow[]).flatMap((row) => { const x = rowToRace(row); return x ? [x] : [] })
      classes.value = ((c.data ?? []) as ContentRow[]).flatMap((row) => { const x = rowToClass(row); return x ? [x] : [] })
      subclasses.value = ((s.data ?? []) as SubclassRow[]).flatMap((row) => { const x = rowToSubclass(row); return x ? [x] : [] })
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

  // ── Class CRUD (mirrors race CRUD) ────────────────────────────────────────────
  function getClass(id: string): CustomClass | undefined {
    return classes.value.find((c) => c.id === id)
  }

  async function upsertClass(cls: CustomClass) {
    const { error } = await withTimeout(
      supabase.from('custom_classes').upsert({
        id: cls.id,
        user_id: cls.userId,
        name: cls.name,
        edition: cls.edition,
        primary_stat: classPrimaryStat(cls.primaryAbility),
        is_public: cls.isPublic,
        author_name: auth.nickname,
        data: toJsonValue(cls),
        created_at: cls.createdAt,
        updated_at: cls.updatedAt,
      }),
      20_000, 'Custom class save',
    )
    if (error) throw error
  }

  async function createClass(input: CustomClassInput): Promise<CustomClass | null> {
    if (!auth.isAuthenticated || !auth.userId) {
      useToast().error('Sign in to save custom content to your collection.')
      return null
    }
    const ts = now()
    const cls = CustomClassSchema.parse({ ...input, id: generateId(), userId: auth.userId, createdAt: ts, updatedAt: ts })
    classes.value.unshift(cls)
    try {
      await upsertClass(cls)
      useToast().success('Custom class saved to your collection.')
      return cls
    } catch (err) {
      classes.value = classes.value.filter((c) => c.id !== cls.id)
      console.error('[custom-content] createClass failed:', err)
      useToast().error('Failed to save custom class to the cloud.')
      return null
    }
  }

  async function updateClass(id: string, updates: Partial<CustomClassInput>): Promise<void> {
    const idx = classes.value.findIndex((c) => c.id === id)
    if (idx === -1) return
    const previous = classes.value[idx]
    const updated: CustomClass = { ...previous, ...updates, updatedAt: now() }
    classes.value[idx] = updated
    try {
      await upsertClass(updated)
    } catch (err) {
      classes.value[idx] = previous
      console.error('[custom-content] updateClass failed:', err)
      useToast().error('Changes could not be saved to the cloud.')
      throw err
    }
  }

  async function removeClass(id: string): Promise<void> {
    if (!auth.userId) return
    const idx = classes.value.findIndex((c) => c.id === id)
    if (idx === -1) return
    const removed = classes.value[idx]
    classes.value = classes.value.filter((c) => c.id !== id)
    const { error } = await withTimeout(
      supabase.from('custom_classes').delete().eq('id', id).eq('user_id', auth.userId),
      20_000, 'Custom class delete',
    )
    if (error) {
      classes.value.splice(idx, 0, removed)
      console.error('[custom-content] removeClass failed:', error)
      useToast().error('Failed to delete the custom class.')
      throw error
    }
  }

  /** Toggle whether a class is shared to the community. */
  function setClassPublic(id: string, isPublic: boolean): Promise<void> {
    return updateClass(id, { isPublic })
  }

  // ── Subclass CRUD (mirrors class CRUD; keyed by parent_class instead of primary_stat) ──
  function getSubclass(id: string): CustomSubclass | undefined {
    return subclasses.value.find((s) => s.id === id)
  }

  /** The user's custom subclasses for a given parent class (SRD index or custom class id). */
  function subclassesForParent(parentClass: string): CustomSubclass[] {
    return subclasses.value.filter((s) => s.parentClass === parentClass)
  }

  async function upsertSubclass(sc: CustomSubclass) {
    const { error } = await withTimeout(
      supabase.from('custom_subclasses').upsert({
        id: sc.id,
        user_id: sc.userId,
        name: sc.name,
        edition: sc.edition,
        parent_class: sc.parentClass,
        is_public: sc.isPublic,
        author_name: auth.nickname,
        data: toJsonValue(sc),
        created_at: sc.createdAt,
        updated_at: sc.updatedAt,
      }),
      20_000, 'Custom subclass save',
    )
    if (error) throw error
  }

  async function createSubclass(input: CustomSubclassInput): Promise<CustomSubclass | null> {
    if (!auth.isAuthenticated || !auth.userId) {
      useToast().error('Sign in to save custom content to your collection.')
      return null
    }
    const ts = now()
    const sc = CustomSubclassSchema.parse({ ...input, id: generateId(), userId: auth.userId, createdAt: ts, updatedAt: ts })
    subclasses.value.unshift(sc)
    try {
      await upsertSubclass(sc)
      useToast().success('Custom subclass saved to your collection.')
      return sc
    } catch (err) {
      subclasses.value = subclasses.value.filter((s) => s.id !== sc.id)
      console.error('[custom-content] createSubclass failed:', err)
      useToast().error('Failed to save custom subclass to the cloud.')
      return null
    }
  }

  async function updateSubclass(id: string, updates: Partial<CustomSubclassInput>): Promise<void> {
    const idx = subclasses.value.findIndex((s) => s.id === id)
    if (idx === -1) return
    const previous = subclasses.value[idx]
    const updated: CustomSubclass = { ...previous, ...updates, updatedAt: now() }
    subclasses.value[idx] = updated
    try {
      await upsertSubclass(updated)
    } catch (err) {
      subclasses.value[idx] = previous
      console.error('[custom-content] updateSubclass failed:', err)
      useToast().error('Changes could not be saved to the cloud.')
      throw err
    }
  }

  async function removeSubclass(id: string): Promise<void> {
    if (!auth.userId) return
    const idx = subclasses.value.findIndex((s) => s.id === id)
    if (idx === -1) return
    const removed = subclasses.value[idx]
    subclasses.value = subclasses.value.filter((s) => s.id !== id)
    const { error } = await withTimeout(
      supabase.from('custom_subclasses').delete().eq('id', id).eq('user_id', auth.userId),
      20_000, 'Custom subclass delete',
    )
    if (error) {
      subclasses.value.splice(idx, 0, removed)
      console.error('[custom-content] removeSubclass failed:', error)
      useToast().error('Failed to delete the custom subclass.')
      throw error
    }
  }

  /** Toggle whether a subclass is shared to the community. */
  function setSubclassPublic(id: string, isPublic: boolean): Promise<void> {
    return updateSubclass(id, { isPublic })
  }

  // ── Community-copy provenance: detect + re-sync from the original ─────────────

  /**
   * Best-effort check of whether any copied item's community original has a newer version.
   * Compares each copy's stored source.updatedAt against the original's current updated_at
   * (readable only if still public/owned — RLS hides the rest, which we simply skip).
   */
  async function refreshSourceUpdates(): Promise<void> {
    const raceCopies = races.value.filter((r) => r.source)
    const classCopies = classes.value.filter((c) => c.source)
    const raceIds = [...new Set(raceCopies.map((r) => r.source!.id))]
    const classIds = [...new Set(classCopies.map((c) => c.source!.id))]
    const next: Record<string, boolean> = {}
    try {
      const [r, c] = await Promise.all([
        raceIds.length
          ? withTimeout(supabase.from('custom_races').select('id, updated_at').in('id', raceIds), 20_000, 'Race source check')
          : Promise.resolve({ data: [], error: null }),
        classIds.length
          ? withTimeout(supabase.from('custom_classes').select('id, updated_at').in('id', classIds), 20_000, 'Class source check')
          : Promise.resolve({ data: [], error: null }),
      ])
      const raceLatest = new Map((((r.data ?? []) as { id: string; updated_at: string }[])).map((row) => [row.id, row.updated_at]))
      const classLatest = new Map((((c.data ?? []) as { id: string; updated_at: string }[])).map((row) => [row.id, row.updated_at]))
      // ISO timestamps compare correctly as strings.
      for (const r2 of raceCopies) {
        const cur = raceLatest.get(r2.source!.id)
        if (cur && cur > r2.source!.updatedAt) next[r2.id] = true
      }
      for (const c2 of classCopies) {
        const cur = classLatest.get(c2.source!.id)
        if (cur && cur > c2.source!.updatedAt) next[c2.id] = true
      }
      sourceUpdates.value = next
    } catch (err) {
      // Non-fatal: the update hint is an enhancement, not core.
      console.error('[custom-content] refreshSourceUpdates failed:', err)
    }
  }

  /**
   * Overwrite a copied race/class in place with its original's current version (user-confirmed,
   * destructive to local edits). Refreshes source.updatedAt so the "update available" flag clears.
   */
  async function resyncFromSource(copyId: string): Promise<void> {
    const race = races.value.find((r) => r.id === copyId && r.source)
    if (race) {
      const { data, error } = await withTimeout(
        supabase.from('custom_races').select('*').eq('id', race.source!.id).maybeSingle(), 20_000, 'Race re-sync',
      )
      const orig = !error && data ? rowToRace(data as ContentRow) : null
      if (!orig) { useToast().error('The original is no longer available.'); return }
      await updateRace(copyId, {
        name: orig.name, edition: orig.edition, abilityBonuses: { ...orig.abilityBonuses },
        size: orig.size, speed: orig.speed, darkvision: orig.darkvision,
        resistances: [...orig.resistances], skillProficiencies: [...orig.skillProficiencies],
        toolProficiencies: [...orig.toolProficiencies], languageChoices: orig.languageChoices,
        traits: orig.traits.map((t) => ({ name: t.name, desc: t.desc })),
        source: { id: orig.id, authorName: race.source!.authorName, updatedAt: orig.updatedAt },
      })
      delete sourceUpdates.value[copyId]
      useToast().success('Updated to the latest version from the original.')
      return
    }
    const cls = classes.value.find((c) => c.id === copyId && c.source)
    if (cls) {
      const { data, error } = await withTimeout(
        supabase.from('custom_classes').select('*').eq('id', cls.source!.id).maybeSingle(), 20_000, 'Class re-sync',
      )
      const orig = !error && data ? rowToClass(data as ContentRow) : null
      if (!orig) { useToast().error('The original is no longer available.'); return }
      await updateClass(copyId, {
        name: orig.name, edition: orig.edition, description: orig.description,
        hitDie: orig.hitDie, primaryAbility: orig.primaryAbility, saves: [...orig.saves],
        armorProficiencies: [...orig.armorProficiencies], weaponProficiencies: [...orig.weaponProficiencies],
        toolProficiencies: [...orig.toolProficiencies], skillChoices: orig.skillChoices,
        skillOptions: [...orig.skillOptions], spellcasting: orig.spellcasting ? { ...orig.spellcasting } : null,
        featuresByLevel: Object.fromEntries(
          Object.entries(orig.featuresByLevel).map(([lvl, feats]) => [lvl, feats.map((f) => ({ name: f.name, desc: f.desc }))]),
        ),
        source: { id: orig.id, authorName: cls.source!.authorName, updatedAt: orig.updatedAt },
      })
      delete sourceUpdates.value[copyId]
      useToast().success('Updated to the latest version from the original.')
    }
  }

  // ── Community feed (public content, used by the Community page) ───────────────
  async function loadCommunity(): Promise<CommunityItem[]> {
    // Subclasses are additive: load them best-effort so a missing table (before the
    // migration is applied) or a transient error can't break the public races/classes feed.
    const subclassesP = withTimeout(
      supabase.from('custom_subclasses').select('*').eq('is_public', true).order('name', { ascending: true }),
      20_000, 'Community subclasses',
    )
      .then((res) => (res.error ? [] : ((res.data ?? []) as SubclassRow[])))
      .catch((e) => { console.warn('[custom-content] community subclasses unavailable:', e); return [] as SubclassRow[] })

    const [r, c, subRows] = await Promise.all([
      withTimeout(
        supabase.from('custom_races').select('*').eq('is_public', true).order('primary_stat', { ascending: true }).order('name', { ascending: true }),
        20_000, 'Community races',
      ),
      withTimeout(
        supabase.from('custom_classes').select('*').eq('is_public', true).order('primary_stat', { ascending: true }).order('name', { ascending: true }),
        20_000, 'Community classes',
      ),
      subclassesP,
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
    // Subclasses have no primary stat of their own — they sort/filter by their parent class.
    for (const row of subRows) {
      const data = rowToSubclass(row)
      if (data) items.push({ id: row.id, userId: row.user_id, kind: 'subclass', name: row.name, edition: row.edition, primaryStat: null, authorName: row.author_name, updatedAt: row.updated_at, data })
    }
    return items
  }

  return {
    races, classes, subclasses, loaded, sourceUpdates,
    getRace, loadMine,
    createRace, updateRace, removeRace, setRacePublic,
    getClass, createClass, updateClass, removeClass, setClassPublic,
    getSubclass, subclassesForParent, createSubclass, updateSubclass, removeSubclass, setSubclassPublic,
    refreshSourceUpdates, resyncFromSource,
    loadCommunity,
  }
})
