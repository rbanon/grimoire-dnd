import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { CampaignSession, NPC, CampaignNote, KeyObject } from '@/shared/types/campaign'
import { generateId, now } from '@/shared/lib/uuid'
import { supabase } from '@/shared/api/supabase.client'
import { withTimeout } from '@/shared/lib/withTimeout'

export type SessionNpcInput    = Pick<NPC, 'name' | 'description'>
export type SessionNoteInput   = Pick<CampaignNote, 'title' | 'body'>
export type SessionObjectInput = Pick<KeyObject, 'name' | 'description'>

type SessionRow  = { id: string; campaign_id: string; session_number: number; title: string | null; date: string | null; body: string; created_at: string; updated_at: string }
type NpcRow      = { id: string; campaign_id: string; session_id: string | null; name: string; description: string | null; created_at: string; updated_at: string }
type NoteRow     = { id: string; campaign_id: string; session_id: string | null; title: string; body: string; created_at: string; updated_at: string }
type KeyObjRow   = { id: string; campaign_id: string; session_id: string | null; name: string; description: string | null; created_at: string; updated_at: string }

function rowToSession(r: SessionRow): CampaignSession {
  return { id: r.id, campaignId: r.campaign_id, sessionNumber: r.session_number, title: r.title ?? undefined, date: r.date ?? undefined, body: r.body ?? '', createdAt: r.created_at, updatedAt: r.updated_at }
}
function rowToNpc(r: NpcRow): NPC {
  return { id: r.id, campaignId: r.campaign_id, sessionId: r.session_id, name: r.name, description: r.description ?? undefined, createdAt: r.created_at, updatedAt: r.updated_at }
}
function rowToNote(r: NoteRow): CampaignNote {
  return { id: r.id, campaignId: r.campaign_id, sessionId: r.session_id, title: r.title, body: r.body, createdAt: r.created_at, updatedAt: r.updated_at }
}
function rowToKeyObj(r: KeyObjRow): KeyObject {
  return { id: r.id, campaignId: r.campaign_id, sessionId: r.session_id, name: r.name, description: r.description ?? undefined, createdAt: r.created_at, updatedAt: r.updated_at }
}

const TIMEOUT = 20_000

export const useSessionStore = defineStore('sessionDetail', () => {
  const session    = ref<CampaignSession | null>(null)
  const npcs       = ref<NPC[]>([])
  const notes      = ref<CampaignNote[]>([])
  const keyObjects = ref<KeyObject[]>([])
  const loading    = ref(false)

  const sessionId  = computed(() => session.value?.id ?? null)
  const campaignId = computed(() => session.value?.campaignId ?? null)

  // ── Load ───────────────────────────────────────────────────────────────────

  async function load(sid: string) {
    loading.value = true
    try {
      await Promise.all([_loadSession(sid), _loadNpcs(sid), _loadNotes(sid), _loadKeyObjects(sid)])
    } finally {
      loading.value = false
    }
  }

  function clear() {
    session.value = null
    npcs.value = []
    notes.value = []
    keyObjects.value = []
  }

  async function _loadSession(sid: string) {
    const { data, error } = await withTimeout(
      supabase.from('campaign_sessions').select('*').eq('id', sid).single(),
      TIMEOUT, 'Load session',
    )
    if (error) throw error
    session.value = rowToSession(data as SessionRow)
  }

  async function _loadNpcs(sid: string) {
    const { data, error } = await withTimeout(
      supabase.from('npcs').select('*').eq('session_id', sid).order('created_at'),
      TIMEOUT, 'Load session NPCs',
    )
    if (error) throw error
    npcs.value = (data as NpcRow[]).map(rowToNpc)
  }

  async function _loadNotes(sid: string) {
    const { data, error } = await withTimeout(
      supabase.from('campaign_notes').select('*').eq('session_id', sid).order('updated_at', { ascending: false }),
      TIMEOUT, 'Load session notes',
    )
    if (error) throw error
    notes.value = (data as NoteRow[]).map(rowToNote)
  }

  async function _loadKeyObjects(sid: string) {
    const { data, error } = await withTimeout(
      supabase.from('campaign_key_objects').select('*').eq('session_id', sid).order('created_at'),
      TIMEOUT, 'Load session key objects',
    )
    if (error) throw error
    keyObjects.value = (data as KeyObjRow[]).map(rowToKeyObj)
  }

  // ── Session body ───────────────────────────────────────────────────────────

  async function saveBody(body: string) {
    if (!session.value) return
    const ts = now()
    const { error } = await withTimeout(
      supabase.from('campaign_sessions').update({ body, updated_at: ts }).eq('id', session.value.id),
      TIMEOUT, 'Save session body',
    )
    if (error) throw error
    session.value = { ...session.value, body, updatedAt: ts }
  }

  // ── Session metadata (title, date) ────────────────────────────────────────

  async function saveMetadata(patch: { title?: string; date?: string; sessionNumber?: number }) {
    if (!session.value) return
    const ts = now()
    const { error } = await withTimeout(
      supabase.from('campaign_sessions').update({
        title: patch.title ?? null,
        date: patch.date ?? null,
        session_number: patch.sessionNumber ?? session.value.sessionNumber,
        updated_at: ts,
      }).eq('id', session.value.id),
      TIMEOUT, 'Save session metadata',
    )
    if (error) throw error
    session.value = { ...session.value, ...patch, updatedAt: ts }
  }

  // ── NPCs CRUD ──────────────────────────────────────────────────────────────

  async function createNpc(input: SessionNpcInput): Promise<void> {
    const ts = now()
    const row = { id: generateId(), campaign_id: campaignId.value!, session_id: sessionId.value!, name: input.name, description: input.description ?? null, created_at: ts, updated_at: ts }
    const { error } = await withTimeout(supabase.from('npcs').insert(row), TIMEOUT, 'Create NPC')
    if (error) throw error
    npcs.value.push(rowToNpc(row))
  }

  async function updateNpc(id: string, input: Partial<SessionNpcInput>): Promise<void> {
    const idx = npcs.value.findIndex(n => n.id === id)
    if (idx === -1) return
    const ts = now()
    const { error } = await withTimeout(supabase.from('npcs').update({ name: input.name, description: input.description ?? null, updated_at: ts }).eq('id', id), TIMEOUT, 'Update NPC')
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

  async function createNote(input: SessionNoteInput): Promise<void> {
    const ts = now()
    const row = { id: generateId(), campaign_id: campaignId.value!, session_id: sessionId.value!, title: input.title, body: input.body, created_at: ts, updated_at: ts }
    const { error } = await withTimeout(supabase.from('campaign_notes').insert(row), TIMEOUT, 'Create note')
    if (error) throw error
    notes.value.unshift(rowToNote(row))
  }

  async function updateNote(id: string, input: Partial<SessionNoteInput>): Promise<void> {
    const idx = notes.value.findIndex(n => n.id === id)
    if (idx === -1) return
    const ts = now()
    const { error } = await withTimeout(supabase.from('campaign_notes').update({ title: input.title, body: input.body, updated_at: ts }).eq('id', id), TIMEOUT, 'Update note')
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

  async function createKeyObject(input: SessionObjectInput): Promise<void> {
    const ts = now()
    const row = { id: generateId(), campaign_id: campaignId.value!, session_id: sessionId.value!, name: input.name, description: input.description ?? null, created_at: ts, updated_at: ts }
    const { error } = await withTimeout(supabase.from('campaign_key_objects').insert(row), TIMEOUT, 'Create key object')
    if (error) throw error
    keyObjects.value.push(rowToKeyObj(row))
  }

  async function updateKeyObject(id: string, input: Partial<SessionObjectInput>): Promise<void> {
    const idx = keyObjects.value.findIndex(k => k.id === id)
    if (idx === -1) return
    const ts = now()
    const { error } = await withTimeout(supabase.from('campaign_key_objects').update({ name: input.name, description: input.description ?? null, updated_at: ts }).eq('id', id), TIMEOUT, 'Update key object')
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
    session,
    npcs,
    notes,
    keyObjects,
    loading,
    load,
    clear,
    saveBody,
    saveMetadata,
    createNpc,     updateNpc,     removeNpc,
    createNote,    updateNote,    removeNote,
    createKeyObject, updateKeyObject, removeKeyObject,
  }
})
