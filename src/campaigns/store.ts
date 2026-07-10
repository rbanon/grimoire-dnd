import { defineStore } from 'pinia'
import { ref, computed, watch } from 'vue'
import { z } from 'zod'
import type { Campaign } from '@/shared/types/campaign'
import { storageGet, storageSet } from '@/shared/lib/storage'
import { generateId, now } from '@/shared/lib/uuid'
import { supabase } from '@/shared/api/supabase.client'
import { useAuthStore } from '@/auth/store'
import { useToast } from '@/shared/composables/useToast'
import { withTimeout } from '@/shared/lib/withTimeout'

const LOCAL_KEY = 'campaigns'
let _persistTimer: ReturnType<typeof setTimeout> | null = null

export const MAX_CAMPAIGNS = 30

/** Fields a user can edit. createdAt/updatedAt/userId are managed by the store. */
export type CampaignInput = Pick<Campaign, 'name' | 'description' | 'tags' | 'myCharacterId' | 'myCharacterName'>

type CampaignRow = {
  id: string
  user_id: string
  name: string
  description: string | null
  tags: string[] | null
  my_character_id: string | null
  my_character_name: string | null
  created_at: string
  updated_at: string
}

function rowToCampaign(row: CampaignRow): Campaign {
  return {
    id: row.id,
    userId: row.user_id,
    name: row.name,
    description: row.description ?? undefined,
    tags: row.tags ?? [],
    myCharacterId: row.my_character_id,
    myCharacterName: row.my_character_name ?? undefined,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }
}

// Loosely validate local rows (own data), drop anything unparseable rather than crash.
const LocalCampaignSchema = z.object({
  id: z.string(),
  userId: z.string(),
  name: z.string().min(1),
  description: z.string().optional(),
  tags: z.array(z.string()).default([]),
  myCharacterId: z.string().nullable().default(null),
  myCharacterName: z.string().optional(),
  createdAt: z.string(),
  updatedAt: z.string(),
})

export const useCampaignsStore = defineStore('campaigns', () => {
  const auth = useAuthStore()
  const campaigns = ref<Campaign[]>([])
  const loaded = ref(false)

  const sorted = computed<Campaign[]>(() =>
    [...campaigns.value].sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()),
  )

  function getById(id: string): Campaign | undefined {
    return campaigns.value.find((c) => c.id === id)
  }

  // ── Load ──────────────────────────────────────────────────────────────────

  async function load() {
    if (auth.isAuthenticated) await loadFromCloud()
    else loadFromLocal()
    loaded.value = true
  }

  function loadFromLocal() {
    const stored = storageGet(LOCAL_KEY, z.array(z.unknown()))
    if (!stored) { campaigns.value = []; return }
    campaigns.value = stored.flatMap((raw) => {
      const parsed = LocalCampaignSchema.safeParse(raw)
      return parsed.success ? [parsed.data as Campaign] : []
    })
  }

  async function loadFromCloud(): Promise<boolean> {
    if (!auth.userId) { loadFromLocal(); return false }
    let data: CampaignRow[] | null = null
    let loadError: unknown = null
    try {
      const result = await withTimeout(
        supabase.from('campaigns').select('*').eq('user_id', auth.userId).order('updated_at', { ascending: false }),
        20_000,
        'Campaign load',
      )
      data = result.data as CampaignRow[] | null
      loadError = result.error
    } catch (err) {
      loadError = err
    }
    if (loadError) {
      console.error('[campaigns] Cloud load failed, falling back to local', loadError)
      loadFromLocal()
      return false
    }
    campaigns.value = (data ?? []).map(rowToCampaign)
    return true
  }

  // ── Persist ───────────────────────────────────────────────────────────────

  function persistLocal() {
    if (_persistTimer) clearTimeout(_persistTimer)
    _persistTimer = setTimeout(() => storageSet(LOCAL_KEY, campaigns.value), 500)
  }

  async function persistCloud(c: Campaign) {
    if (!auth.isAuthenticated || !auth.userId) return
    const { error } = await withTimeout(
      supabase.from('campaigns').upsert({
        id: c.id,
        user_id: auth.userId,
        name: c.name,
        description: c.description ?? null,
        tags: c.tags,
        my_character_id: c.myCharacterId,
        my_character_name: c.myCharacterName ?? null,
        created_at: c.createdAt,
        updated_at: c.updatedAt,
      }),
      20_000,
      'Campaign save',
    )
    if (error) throw error
  }

  // ── CRUD ──────────────────────────────────────────────────────────────────

  async function create(input: CampaignInput): Promise<Campaign> {
    if (campaigns.value.length >= MAX_CAMPAIGNS) {
      throw new Error(`You've reached the limit of ${MAX_CAMPAIGNS} campaigns. Delete one to create a new one.`)
    }
    const ts = now()
    const campaign: Campaign = {
      id: generateId(),
      userId: auth.userId ?? 'local',
      name: input.name,
      description: input.description,
      tags: input.tags,
      myCharacterId: input.myCharacterId,
      myCharacterName: input.myCharacterName,
      createdAt: ts,
      updatedAt: ts,
    }
    campaigns.value.push(campaign)
    if (auth.isAuthenticated) {
      try {
        await persistCloud(campaign)
      } catch {
        campaigns.value = campaigns.value.filter((c) => c.id !== campaign.id)
        useToast().error('Failed to save campaign to cloud. Check your connection and try again.')
        throw new Error('Cloud sync failed')
      }
    } else {
      persistLocal()
    }
    return campaign
  }

  async function update(id: string, updates: Partial<CampaignInput>): Promise<void> {
    const idx = campaigns.value.findIndex((c) => c.id === id)
    if (idx === -1) throw new Error(`Campaign ${id} not found`)
    const previous = campaigns.value[idx]
    const updated: Campaign = { ...previous, ...updates, updatedAt: now() }
    campaigns.value[idx] = updated
    if (auth.isAuthenticated) {
      try {
        await persistCloud(updated)
      } catch {
        campaigns.value[idx] = previous
        useToast().error('Changes could not be saved to cloud. Your data has been restored.')
        throw new Error('Cloud sync failed')
      }
    } else {
      persistLocal()
    }
  }

  async function remove(id: string): Promise<void> {
    const idx = campaigns.value.findIndex((c) => c.id === id)
    if (idx === -1) return
    const removed = campaigns.value[idx]
    campaigns.value = campaigns.value.filter((c) => c.id !== id)
    if (auth.isAuthenticated) {
      if (!auth.userId) throw new Error('Not authenticated')
      const { error } = await withTimeout(
        supabase.from('campaigns').delete().eq('id', id).eq('user_id', auth.userId),
        20_000,
        'Campaign delete',
      )
      if (error) {
        campaigns.value.splice(idx, 0, removed)
        useToast().error('Failed to delete campaign from cloud. Your data has been restored.')
        throw new Error('Cloud delete failed')
      }
    } else {
      persistLocal()
    }
  }

  // ── Auth sync ─────────────────────────────────────────────────────────────

  async function syncOnLogin() {
    const stored = storageGet(LOCAL_KEY, z.array(z.unknown()))
    const localCampaigns: Campaign[] = (stored ?? []).flatMap((raw) => {
      const parsed = LocalCampaignSchema.safeParse(raw)
      return parsed.success ? [parsed.data as Campaign] : []
    })
    const cloudLoaded = await loadFromCloud()
    if (!cloudLoaded) return
    storageSet(LOCAL_KEY, [])
    if (localCampaigns.length === 0) return

    let synced = 0
    for (const local of localCampaigns) {
      const cloudIdx = campaigns.value.findIndex((c) => c.id === local.id)
      const owned: Campaign = { ...local, userId: auth.userId ?? local.userId }
      if (cloudIdx === -1) {
        try { await persistCloud(owned); campaigns.value.push(owned); synced++ } catch { /* non-fatal */ }
      } else if (new Date(local.updatedAt) > new Date(campaigns.value[cloudIdx].updatedAt)) {
        try { await persistCloud(owned); campaigns.value[cloudIdx] = owned; synced++ } catch { /* non-fatal */ }
      }
    }
    if (synced > 0) {
      useToast().success(synced === 1 ? '1 local campaign synced to your account.' : `${synced} local campaigns synced to your account.`)
    }
  }

  function handleSignOut() {
    storageSet(LOCAL_KEY, campaigns.value)
    loadFromLocal()
  }

  watch(() => auth.lastAuthEvent, async (event) => {
    if (event === 'SIGNED_IN') await syncOnLogin()
    else if (event === 'SIGNED_OUT') handleSignOut()
  })

  return {
    campaigns,
    sorted,
    loaded,
    getById,
    load,
    create,
    update,
    remove,
  }
})
