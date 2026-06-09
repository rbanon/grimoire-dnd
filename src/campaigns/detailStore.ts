import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { CampaignSession, NPC, PartyMember, CampaignNote, KeyObject } from '@/shared/types/campaign'
import { generateId, now } from '@/shared/lib/uuid'
import { supabase } from '@/shared/api/supabase.client'
import { withTimeout } from '@/shared/lib/withTimeout'

// ── Input types ───────────────────────────────────────────────────────────────

export type SessionInput = Pick<CampaignSession, 'sessionNumber' | 'title' | 'date' | 'body'>
export type NpcInput = Pick<NPC, 'name' | 'description'>
export type PartyMemberInput = Pick<PartyMember, 'name' | 'player' | 'description' | 'notes'>
export type NoteInput = Pick<CampaignNote, 'title' | 'body'>
export type KeyObjectInput = Pick<KeyObject, 'name' | 'description'>

// ── Row → domain converters ───────────────────────────────────────────────────

type SessionRow     = { id: string; campaign_id: string; session_number: number; title: string | null; date: string | null; body: string; created_at: string; updated_at: string }
type NpcRow         = { id: string; campaign_id: string; session_id: string | null; name: string; description: string | null; created_at: string; updated_at: string }
type PartyMemberRow = { id: string; campaign_id: string; name: string; player: string | null; description: string | null; notes: string | null; created_at: string; updated_at: string }
type NoteRow        = { id: string; campaign_id: string; session_id: string | null; title: string; body: string; created_at: string; updated_at: string }
type KeyObjRow      = { id: string; campaign_id: string; session_id: string | null; name: string; description: string | null; created_at: string; updated_at: string }

function rowToSession(r: SessionRow): CampaignSession {
  return { id: r.id, campaignId: r.campaign_id, sessionNumber: r.session_number, title: r.title ?? undefined, date: r.date ?? undefined, body: r.body ?? '', createdAt: r.created_at, updatedAt: r.updated_at }
}
function rowToNpc(r: NpcRow): NPC {
  return { id: r.id, campaignId: r.campaign_id, sessionId: r.session_id, name: r.name, description: r.description ?? undefined, createdAt: r.created_at, updatedAt: r.updated_at }
}
function rowToPartyMember(r: PartyMemberRow): PartyMember {
  return { id: r.id, campaignId: r.campaign_id, name: r.name, player: r.player ?? undefined, description: r.description ?? undefined, notes: r.notes ?? undefined, createdAt: r.created_at, updatedAt: r.updated_at }
}
function rowToNote(r: NoteRow): CampaignNote {
  return { id: r.id, campaignId: r.campaign_id, sessionId: r.session_id, title: r.title, body: r.body, createdAt: r.created_at, updatedAt: r.updated_at }
}
function rowToKeyObj(r: KeyObjRow): KeyObject {
  return { id: r.id, campaignId: r.campaign_id, sessionId: r.session_id, name: r.name, description: r.description ?? undefined, createdAt: r.created_at, updatedAt: r.updated_at }
}

const TIMEOUT = 20_000

// ── Store ─────────────────────────────────────────────────────────────────────

export const useCampaignDetailStore = defineStore('campaignDetail', () => {
  const campaignId = ref<string | null>(null)
  const loading = ref(false)

  const sessions      = ref<CampaignSession[]>([])
  const npcs          = ref<NPC[]>([])
  const partyMembers  = ref<PartyMember[]>([])
  const notes         = ref<CampaignNote[]>([])
  const keyObjects    = ref<KeyObject[]>([])

  const sortedSessions   = computed(() => [...sessions.value].sort((a, b) => a.sessionNumber - b.sessionNumber))
  const nextSessionNumber = computed(() => (sortedSessions.value.at(-1)?.sessionNumber ?? 0) + 1)

  // ── Load ───────────────────────────────────────────────────────────────────

  async function load(cId: string) {
    campaignId.value = cId
    loading.value = true
    try {
      await Promise.all([
        _loadSessions(cId),
        _loadNpcs(cId),
        _loadPartyMembers(cId),
        _loadNotes(cId),
        _loadKeyObjects(cId),
      ])
    } finally {
      loading.value = false
    }
  }

  function clear() {
    campaignId.value = null
    sessions.value = []
    npcs.value = []
    partyMembers.value = []
    notes.value = []
    keyObjects.value = []
  }

  async function _loadSessions(cId: string) {
    const { data, error } = await withTimeout(
      supabase.from('campaign_sessions').select('*').eq('campaign_id', cId).order('session_number'),
      TIMEOUT, 'Load sessions',
    )
    if (error) throw error
    sessions.value = (data as SessionRow[]).map(rowToSession)
  }

  async function _loadPartyMembers(cId: string) {
    const { data, error } = await withTimeout(
      supabase.from('campaign_party_members').select('*').eq('campaign_id', cId).order('created_at'),
      TIMEOUT, 'Load party members',
    )
    if (error) throw error
    partyMembers.value = (data as PartyMemberRow[]).map(rowToPartyMember)
  }

  async function _loadNpcs(cId: string) {
    const { data, error } = await withTimeout(
      supabase.from('npcs').select('*').eq('campaign_id', cId).order('created_at'),
      TIMEOUT, 'Load NPCs',
    )
    if (error) throw error
    npcs.value = (data as NpcRow[]).map(rowToNpc)
  }

  async function _loadNotes(cId: string) {
    const { data, error } = await withTimeout(
      supabase.from('campaign_notes').select('*').eq('campaign_id', cId).order('updated_at', { ascending: false }),
      TIMEOUT, 'Load notes',
    )
    if (error) throw error
    notes.value = (data as NoteRow[]).map(rowToNote)
  }

  async function _loadKeyObjects(cId: string) {
    const { data, error } = await withTimeout(
      supabase.from('campaign_key_objects').select('*').eq('campaign_id', cId).order('created_at'),
      TIMEOUT, 'Load key objects',
    )
    if (error) throw error
    keyObjects.value = (data as KeyObjRow[]).map(rowToKeyObj)
  }

  // ── Sessions CRUD ──────────────────────────────────────────────────────────

  async function createSession(input: SessionInput): Promise<void> {
    const cId = campaignId.value!
    const ts = now()
    const row = { id: generateId(), campaign_id: cId, session_number: input.sessionNumber, title: input.title ?? null, date: input.date ?? null, body: input.body ?? '', created_at: ts, updated_at: ts }
    const { error } = await withTimeout(supabase.from('campaign_sessions').insert(row), TIMEOUT, 'Create session')
    if (error) throw error
    sessions.value.push(rowToSession(row))
  }

  async function updateSession(id: string, input: Partial<SessionInput>): Promise<void> {
    const idx = sessions.value.findIndex(s => s.id === id)
    if (idx === -1) return
    const ts = now()
    const patch = { session_number: input.sessionNumber, title: input.title ?? null, date: input.date ?? null, body: input.body, updated_at: ts }
    const { error } = await withTimeout(supabase.from('campaign_sessions').update(patch).eq('id', id), TIMEOUT, 'Update session')
    if (error) throw error
    sessions.value[idx] = { ...sessions.value[idx], ...input, updatedAt: ts }
  }

  async function removeSession(id: string): Promise<void> {
    const idx = sessions.value.findIndex(s => s.id === id)
    if (idx === -1) return
    const removed = sessions.value[idx]
    sessions.value.splice(idx, 1)
    const { error } = await withTimeout(supabase.from('campaign_sessions').delete().eq('id', id), TIMEOUT, 'Delete session')
    if (error) { sessions.value.splice(idx, 0, removed); throw error }
  }

  // ── Party Members CRUD ────────────────────────────────────────────────────

  async function createPartyMember(input: PartyMemberInput): Promise<void> {
    const cId = campaignId.value!
    const ts = now()
    const row = { id: generateId(), campaign_id: cId, name: input.name, player: input.player ?? null, description: input.description ?? null, notes: input.notes ?? null, created_at: ts, updated_at: ts }
    const { error } = await withTimeout(supabase.from('campaign_party_members').insert(row), TIMEOUT, 'Create party member')
    if (error) throw error
    partyMembers.value.push(rowToPartyMember(row))
  }

  async function updatePartyMember(id: string, input: Partial<PartyMemberInput>): Promise<void> {
    const idx = partyMembers.value.findIndex(p => p.id === id)
    if (idx === -1) return
    const ts = now()
    const patch = { name: input.name, player: input.player ?? null, description: input.description ?? null, notes: input.notes ?? null, updated_at: ts }
    const { error } = await withTimeout(supabase.from('campaign_party_members').update(patch).eq('id', id), TIMEOUT, 'Update party member')
    if (error) throw error
    partyMembers.value[idx] = { ...partyMembers.value[idx], ...input, updatedAt: ts }
  }

  async function removePartyMember(id: string): Promise<void> {
    const idx = partyMembers.value.findIndex(p => p.id === id)
    if (idx === -1) return
    const removed = partyMembers.value[idx]
    partyMembers.value.splice(idx, 1)
    const { error } = await withTimeout(supabase.from('campaign_party_members').delete().eq('id', id), TIMEOUT, 'Delete party member')
    if (error) { partyMembers.value.splice(idx, 0, removed); throw error }
  }

  // ── NPCs CRUD ──────────────────────────────────────────────────────────────

  async function createNpc(input: NpcInput): Promise<void> {
    const cId = campaignId.value!
    const ts = now()
    const row = { id: generateId(), campaign_id: cId, session_id: null as string | null, name: input.name, description: input.description ?? null, created_at: ts, updated_at: ts }
    const { error } = await withTimeout(supabase.from('npcs').insert(row), TIMEOUT, 'Create NPC')
    if (error) throw error
    npcs.value.push(rowToNpc(row))
  }

  async function updateNpc(id: string, input: Partial<NpcInput>): Promise<void> {
    const idx = npcs.value.findIndex(n => n.id === id)
    if (idx === -1) return
    const ts = now()
    const patch = { name: input.name, description: input.description ?? null, updated_at: ts }
    const { error } = await withTimeout(supabase.from('npcs').update(patch).eq('id', id), TIMEOUT, 'Update NPC')
    if (error) throw error
    npcs.value[idx] = { ...npcs.value[idx], ...input, updatedAt: ts }
  }

  async function removeNpc(id: string): Promise<void> {
    const idx = npcs.value.findIndex(n => n.id === id)
    if (idx === -1) return
    const removed = npcs.value[idx]
    npcs.value.splice(idx, 1)
    const { error } = await withTimeout(supabase.from('npcs').delete().eq('id', id), TIMEOUT, 'Delete NPC')
    if (error) { npcs.value.splice(idx, 0, removed); throw error }
  }

  // ── Notes CRUD ─────────────────────────────────────────────────────────────

  async function createNote(input: NoteInput): Promise<void> {
    const cId = campaignId.value!
    const ts = now()
    const row = { id: generateId(), campaign_id: cId, session_id: null as string | null, title: input.title, body: input.body, created_at: ts, updated_at: ts }
    const { error } = await withTimeout(supabase.from('campaign_notes').insert(row), TIMEOUT, 'Create note')
    if (error) throw error
    notes.value.unshift(rowToNote(row))
  }

  async function updateNote(id: string, input: Partial<NoteInput>): Promise<void> {
    const idx = notes.value.findIndex(n => n.id === id)
    if (idx === -1) return
    const ts = now()
    const patch = { title: input.title, body: input.body, updated_at: ts }
    const { error } = await withTimeout(supabase.from('campaign_notes').update(patch).eq('id', id), TIMEOUT, 'Update note')
    if (error) throw error
    notes.value[idx] = { ...notes.value[idx], ...input, updatedAt: ts }
  }

  async function removeNote(id: string): Promise<void> {
    const idx = notes.value.findIndex(n => n.id === id)
    if (idx === -1) return
    const removed = notes.value[idx]
    notes.value.splice(idx, 1)
    const { error } = await withTimeout(supabase.from('campaign_notes').delete().eq('id', id), TIMEOUT, 'Delete note')
    if (error) { notes.value.splice(idx, 0, removed); throw error }
  }

  // ── Key Objects CRUD ───────────────────────────────────────────────────────

  async function createKeyObject(input: KeyObjectInput): Promise<void> {
    const cId = campaignId.value!
    const ts = now()
    const row = { id: generateId(), campaign_id: cId, session_id: null as string | null, name: input.name, description: input.description ?? null, created_at: ts, updated_at: ts }
    const { error } = await withTimeout(supabase.from('campaign_key_objects').insert(row), TIMEOUT, 'Create key object')
    if (error) throw error
    keyObjects.value.push(rowToKeyObj(row))
  }

  async function updateKeyObject(id: string, input: Partial<KeyObjectInput>): Promise<void> {
    const idx = keyObjects.value.findIndex(k => k.id === id)
    if (idx === -1) return
    const ts = now()
    const patch = { name: input.name, description: input.description ?? null, updated_at: ts }
    const { error } = await withTimeout(supabase.from('campaign_key_objects').update(patch).eq('id', id), TIMEOUT, 'Update key object')
    if (error) throw error
    keyObjects.value[idx] = { ...keyObjects.value[idx], ...input, updatedAt: ts }
  }

  async function removeKeyObject(id: string): Promise<void> {
    const idx = keyObjects.value.findIndex(k => k.id === id)
    if (idx === -1) return
    const removed = keyObjects.value[idx]
    keyObjects.value.splice(idx, 1)
    const { error } = await withTimeout(supabase.from('campaign_key_objects').delete().eq('id', id), TIMEOUT, 'Delete key object')
    if (error) { keyObjects.value.splice(idx, 0, removed); throw error }
  }

  return {
    campaignId,
    loading,
    sessions: sortedSessions,
    npcs,
    partyMembers,
    notes,
    keyObjects,
    nextSessionNumber,
    load,
    clear,
    createSession,     updateSession,     removeSession,
    createPartyMember, updatePartyMember, removePartyMember,
    createNpc,         updateNpc,         removeNpc,
    createNote,        updateNote,        removeNote,
    createKeyObject,   updateKeyObject,   removeKeyObject,
  }
})
