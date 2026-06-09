<template>
  <div class="app-container py-8 max-w-3xl">
    <RouterLink :to="`/campaigns/${props.campaignId}`" class="inline-flex items-center gap-1.5 text-sm font-body text-mist hover:text-ash transition-colors mb-5">
      <ArrowLeftIcon :size="14" /> Back to campaign
    </RouterLink>

    <div v-if="store.loading" class="space-y-4">
      <div class="h-8 w-1/3 skeleton rounded-sm" />
      <div class="h-4 w-1/2 skeleton rounded-sm" />
      <div class="h-32 skeleton rounded" />
    </div>

    <template v-else-if="store.session">
      <!-- Header -->
      <div class="flex items-start justify-between gap-4 mb-6">
        <div>
          <p class="font-mono text-xs text-mist/60 tracking-widest uppercase mb-1">
            Session #{{ store.session.sessionNumber }}
          </p>
          <h1 class="font-display text-3xl text-vellum leading-tight">
            {{ store.session.title || 'Untitled session' }}
          </h1>
          <p v-if="store.session.date" class="text-sm font-body text-mist mt-1">
            {{ formatDate(store.session.date) }}
          </p>
        </div>
        <button class="btn-secondary gap-1.5 text-sm shrink-0" @click="openEditModal">
          <PencilIcon :size="14" /> Edit
        </button>
      </div>

      <!-- Body -->
      <section class="mb-8">
        <div class="rule-gold mb-3"><span>What happened</span></div>
        <textarea
          v-model="bodyDraft"
          rows="8"
          maxlength="20000"
          placeholder="Describe what happened this session…"
          class="input-base w-full resize-y font-body text-sm leading-relaxed"
          @blur="onBodyBlur"
        />
        <div class="flex items-center justify-between mt-1.5">
          <p v-if="bodySaved" class="text-2xs font-body text-emerald-400 transition-opacity">Saved</p>
          <p v-else-if="bodyError" class="text-2xs font-body text-blood-bright">{{ bodyError }}</p>
          <span v-else />
          <p class="text-2xs font-body text-mist/40">{{ bodyDraft.length }}/20000</p>
        </div>
      </section>

      <!-- Tabs: NPCs | Notes | Key Objects -->
      <div class="border-b border-gold-dim/25 flex overflow-x-auto scroll-hidden mb-6">
        <button
          v-for="tab in tabs"
          :key="tab.id"
          class="relative px-4 py-2.5 font-mono text-xs tracking-[0.16em] uppercase transition-colors duration-150 whitespace-nowrap shrink-0"
          :class="activeTab === tab.id ? 'text-gold-mid bg-gold-dim/5' : 'text-mist hover:text-stone'"
          @click="activeTab = tab.id"
        >
          {{ tab.label }}
          <span v-if="tab.count" class="ml-1.5 text-2xs text-mist/60">{{ tab.count }}</span>
          <span v-if="activeTab === tab.id" class="absolute inset-x-0 -bottom-px h-[2px] bg-gradient-to-r from-transparent via-gold-mid to-transparent" />
        </button>
      </div>

      <!-- NPCs tab -->
      <div v-if="activeTab === 'npcs'">
        <div class="flex items-center justify-between mb-4">
          <p class="label">NPCs in this session</p>
          <button class="btn-secondary gap-1.5 text-sm" @click="openNpcModal()">
            <PlusIcon :size="14" /> Add NPC
          </button>
        </div>
        <div v-if="store.npcs.length === 0" class="sdp-empty-state">
          <UsersIcon :size="26" class="text-mist/30 mb-2" />
          <p class="font-body text-mist/60 text-sm">No NPCs yet for this session.</p>
        </div>
        <div v-else class="space-y-2">
          <div v-for="n in store.npcs" :key="n.id" class="sdp-entity-card">
            <div class="flex items-start justify-between gap-3">
              <div class="min-w-0 flex-1">
                <p class="font-heading text-sm text-ash">{{ n.name }}</p>
                <p v-if="n.description" class="font-body text-2xs text-mist/70 mt-0.5 line-clamp-2">{{ n.description }}</p>
              </div>
              <div class="flex items-center gap-1 shrink-0">
                <button class="sdp-icon-btn" @click="openNpcModal(n)"><PencilIcon :size="13" /></button>
                <button class="sdp-icon-btn text-blood-bright/70 hover:text-blood-bright" @click="onRemoveNpc(n.id)"><Trash2Icon :size="13" /></button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Notes tab -->
      <div v-else-if="activeTab === 'notes'">
        <div class="flex items-center justify-between mb-4">
          <p class="label">Notes from this session</p>
          <button class="btn-secondary gap-1.5 text-sm" @click="openNoteModal()">
            <PlusIcon :size="14" /> Add note
          </button>
        </div>
        <div v-if="store.notes.length === 0" class="sdp-empty-state">
          <NotebookPenIcon :size="26" class="text-mist/30 mb-2" />
          <p class="font-body text-mist/60 text-sm">No notes for this session yet.</p>
        </div>
        <div v-else class="space-y-2">
          <div v-for="n in store.notes" :key="n.id" class="sdp-entity-card cursor-pointer" @click="openNoteModal(n)">
            <div class="flex items-start justify-between gap-3">
              <div class="min-w-0 flex-1">
                <p class="font-heading text-sm text-ash">{{ n.title || 'Untitled' }}</p>
                <p v-if="n.body" class="font-body text-2xs text-mist/70 mt-0.5 line-clamp-2">{{ n.body }}</p>
              </div>
              <div class="flex items-center gap-1 shrink-0">
                <button class="sdp-icon-btn text-blood-bright/70 hover:text-blood-bright" @click.stop="onRemoveNote(n.id)"><Trash2Icon :size="13" /></button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Key Objects tab -->
      <div v-else-if="activeTab === 'objects'">
        <div class="flex items-center justify-between mb-4">
          <p class="label">Key objects from this session</p>
          <button class="btn-secondary gap-1.5 text-sm" @click="openObjectModal()">
            <PlusIcon :size="14" /> Add object
          </button>
        </div>
        <div v-if="store.keyObjects.length === 0" class="sdp-empty-state">
          <PackageIcon :size="26" class="text-mist/30 mb-2" />
          <p class="font-body text-mist/60 text-sm">No key objects for this session yet.</p>
        </div>
        <div v-else class="space-y-2">
          <div v-for="o in store.keyObjects" :key="o.id" class="sdp-entity-card">
            <div class="flex items-start justify-between gap-3">
              <div class="min-w-0 flex-1">
                <p class="font-heading text-sm text-ash">{{ o.name }}</p>
                <p v-if="o.description" class="font-body text-2xs text-mist/70 mt-0.5 line-clamp-2">{{ o.description }}</p>
              </div>
              <div class="flex items-center gap-1 shrink-0">
                <button class="sdp-icon-btn" @click="openObjectModal(o)"><PencilIcon :size="13" /></button>
                <button class="sdp-icon-btn text-blood-bright/70 hover:text-blood-bright" @click="onRemoveObject(o.id)"><Trash2Icon :size="13" /></button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </template>

    <div v-else class="card p-12 text-center">
      <p class="font-body text-ash">Session not found.</p>
      <RouterLink :to="`/campaigns/${props.campaignId}`" class="btn-secondary mt-4 inline-flex">Back to campaign</RouterLink>
    </div>
  </div>

  <!-- ── Edit session metadata modal ───────────────────────────────────────── -->
  <Teleport to="body">
    <Transition name="sdp-fade">
      <div v-if="editModal.open" class="sdp-backdrop" @click.self="editModal.open = false">
        <div class="sdp-panel">
          <div class="sdp-accent" />
          <div class="px-5 py-4">
            <p class="font-heading text-base text-gold-mid tracking-wide mb-4">Edit session</p>
            <div class="space-y-3">
              <div class="grid grid-cols-2 gap-3">
                <div>
                  <label class="label mb-1"># Number</label>
                  <input v-model.number="editModal.sessionNumber" type="number" min="1" class="input-base w-full text-sm" />
                </div>
                <div>
                  <label class="label mb-1">Date</label>
                  <input v-model="editModal.date" type="date" class="input-base w-full text-sm" />
                </div>
              </div>
              <div>
                <label class="label mb-1">Title</label>
                <input v-model="editModal.title" type="text" maxlength="200" placeholder="Optional title…" class="input-base w-full text-sm" />
              </div>
            </div>
            <div class="flex gap-2 mt-5">
              <button class="btn-secondary flex-1 text-sm" @click="editModal.open = false">Cancel</button>
              <button class="btn-primary flex-1 text-sm" :disabled="editModal.saving" @click="saveEdit">
                {{ editModal.saving ? 'Saving…' : 'Save' }}
              </button>
            </div>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>

  <!-- ── NPC modal ─────────────────────────────────────────────────────────── -->
  <Teleport to="body">
    <Transition name="sdp-fade">
      <div v-if="npcModal.open" class="sdp-backdrop" @click.self="npcModal.open = false">
        <div class="sdp-panel">
          <div class="sdp-accent" />
          <div class="px-5 py-4">
            <p class="font-heading text-base text-gold-mid tracking-wide mb-4">{{ npcModal.id ? 'Edit NPC' : 'New NPC' }}</p>
            <div class="space-y-3">
              <div>
                <label class="label mb-1">Name <span class="text-blood-bright">*</span></label>
                <input v-model="npcModal.name" type="text" maxlength="120" class="input-base w-full text-sm" />
              </div>
              <div>
                <label class="label mb-1">Description</label>
                <textarea v-model="npcModal.description" rows="3" maxlength="5000" class="input-base w-full text-sm resize-y" />
              </div>
            </div>
            <div class="flex gap-2 mt-5">
              <button class="btn-secondary flex-1 text-sm" @click="npcModal.open = false">Cancel</button>
              <button class="btn-primary flex-1 text-sm" :disabled="!npcModal.name.trim() || npcModal.saving" @click="saveNpc">
                {{ npcModal.saving ? 'Saving…' : 'Save' }}
              </button>
            </div>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>

  <!-- ── Note modal ────────────────────────────────────────────────────────── -->
  <Teleport to="body">
    <Transition name="sdp-fade">
      <div v-if="noteModal.open" class="sdp-backdrop" @click.self="noteModal.open = false">
        <div class="sdp-panel sdp-panel--lg">
          <div class="sdp-accent" />
          <div class="px-5 py-4">
            <p class="font-heading text-base text-gold-mid tracking-wide mb-4">{{ noteModal.id ? 'Edit note' : 'New note' }}</p>
            <div class="space-y-3">
              <div>
                <label class="label mb-1">Title</label>
                <input v-model="noteModal.title" type="text" maxlength="200" placeholder="Untitled" class="input-base w-full text-sm" />
              </div>
              <div>
                <label class="label mb-1">Body</label>
                <textarea v-model="noteModal.body" rows="7" maxlength="20000" class="input-base w-full text-sm resize-y font-body leading-relaxed" />
              </div>
            </div>
            <div class="flex gap-2 mt-5">
              <button class="btn-secondary flex-1 text-sm" @click="noteModal.open = false">Cancel</button>
              <button class="btn-primary flex-1 text-sm" :disabled="noteModal.saving" @click="saveNote">
                {{ noteModal.saving ? 'Saving…' : 'Save' }}
              </button>
            </div>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>

  <!-- ── Key Object modal ───────────────────────────────────────────────────── -->
  <Teleport to="body">
    <Transition name="sdp-fade">
      <div v-if="objectModal.open" class="sdp-backdrop" @click.self="objectModal.open = false">
        <div class="sdp-panel">
          <div class="sdp-accent" />
          <div class="px-5 py-4">
            <p class="font-heading text-base text-gold-mid tracking-wide mb-4">{{ objectModal.id ? 'Edit key object' : 'New key object' }}</p>
            <div class="space-y-3">
              <div>
                <label class="label mb-1">Name <span class="text-blood-bright">*</span></label>
                <input v-model="objectModal.name" type="text" maxlength="120" class="input-base w-full text-sm" />
              </div>
              <div>
                <label class="label mb-1">Description</label>
                <textarea v-model="objectModal.description" rows="3" maxlength="5000" class="input-base w-full text-sm resize-y" />
              </div>
            </div>
            <div class="flex gap-2 mt-5">
              <button class="btn-secondary flex-1 text-sm" @click="objectModal.open = false">Cancel</button>
              <button class="btn-primary flex-1 text-sm" :disabled="!objectModal.name.trim() || objectModal.saving" @click="saveObject">
                {{ objectModal.saving ? 'Saving…' : 'Save' }}
              </button>
            </div>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup lang="ts">
import { ref, reactive, watch, onMounted, onUnmounted } from 'vue'
import { ArrowLeftIcon, PencilIcon, Trash2Icon, PlusIcon, UsersIcon, NotebookPenIcon, PackageIcon } from 'lucide-vue-next'
import { useSessionStore } from '@/campaigns/sessionStore'
import { useConfirm } from '@/shared/composables/useConfirm'
import { useToast } from '@/shared/composables/useToast'
import type { NPC, CampaignNote, KeyObject } from '@/shared/types/campaign'

const props = defineProps<{ campaignId: string; id: string }>()

const store = useSessionStore()
const { confirm } = useConfirm()
const toast = useToast()

const activeTab = ref('npcs')
const tabs = [
  { id: 'npcs',    label: 'NPCs',        get count() { return store.npcs.length || 0 } },
  { id: 'notes',   label: 'Notes',       get count() { return store.notes.length || 0 } },
  { id: 'objects', label: 'Key Objects', get count() { return store.keyObjects.length || 0 } },
]

onMounted(() => store.load(props.id))
onUnmounted(() => store.clear())

// ── Body auto-save on blur ─────────────────────────────────────────────────

const bodyDraft = ref('')
const bodySaved = ref(false)
const bodyError = ref('')
let bodySavedTimer: ReturnType<typeof setTimeout> | null = null

watch(() => store.session?.body, (v) => { if (v !== undefined) bodyDraft.value = v }, { immediate: true })

async function onBodyBlur() {
  if (!store.session || bodyDraft.value === store.session.body) return
  bodyError.value = ''
  try {
    await store.saveBody(bodyDraft.value)
    bodySaved.value = true
    if (bodySavedTimer) clearTimeout(bodySavedTimer)
    bodySavedTimer = setTimeout(() => { bodySaved.value = false }, 2000)
  } catch {
    bodyError.value = 'Failed to save. Check your connection.'
  }
}

// ── Date helper ────────────────────────────────────────────────────────────

function formatDate(iso: string) {
  return new Date(iso + 'T00:00:00').toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })
}

// ── Edit session metadata modal ────────────────────────────────────────────

const editModal = reactive({ open: false, sessionNumber: 1, title: '', date: '', saving: false })

function openEditModal() {
  editModal.sessionNumber = store.session!.sessionNumber
  editModal.title = store.session!.title ?? ''
  editModal.date = store.session!.date ?? ''
  editModal.saving = false
  editModal.open = true
}

async function saveEdit() {
  if (editModal.saving) return
  editModal.saving = true
  try {
    await store.saveMetadata({ sessionNumber: editModal.sessionNumber, title: editModal.title || undefined, date: editModal.date || undefined })
    editModal.open = false
  } catch {
    toast.error('Failed to save. Check your connection.')
  } finally {
    editModal.saving = false
  }
}

// ── NPC modal ──────────────────────────────────────────────────────────────

const npcModal = reactive({ open: false, id: null as string | null, name: '', description: '', saving: false })

function openNpcModal(n?: NPC) {
  npcModal.id = n?.id ?? null
  npcModal.name = n?.name ?? ''
  npcModal.description = n?.description ?? ''
  npcModal.saving = false
  npcModal.open = true
}

async function saveNpc() {
  if (!npcModal.name.trim() || npcModal.saving) return
  npcModal.saving = true
  try {
    const input = { name: npcModal.name.trim(), description: npcModal.description.trim() || undefined }
    if (npcModal.id) await store.updateNpc(npcModal.id, input)
    else await store.createNpc(input)
    npcModal.open = false
  } catch { toast.error('Failed to save NPC.') }
  finally { npcModal.saving = false }
}

async function onRemoveNpc(id: string) {
  const n = store.npcs.find(x => x.id === id)
  const ok = await confirm({ title: 'Delete NPC', body: `Delete "${n?.name}"?`, variant: 'danger', confirmLabel: 'Delete' })
  if (!ok) return
  try { await store.removeNpc(id) } catch { toast.error('Failed to delete NPC.') }
}

// ── Note modal ─────────────────────────────────────────────────────────────

const noteModal = reactive({ open: false, id: null as string | null, title: '', body: '', saving: false })

function openNoteModal(n?: CampaignNote) {
  noteModal.id = n?.id ?? null
  noteModal.title = n?.title ?? ''
  noteModal.body = n?.body ?? ''
  noteModal.saving = false
  noteModal.open = true
}

async function saveNote() {
  if (noteModal.saving) return
  noteModal.saving = true
  try {
    const input = { title: noteModal.title.trim() || 'Untitled', body: noteModal.body }
    if (noteModal.id) await store.updateNote(noteModal.id, input)
    else await store.createNote(input)
    noteModal.open = false
  } catch { toast.error('Failed to save note.') }
  finally { noteModal.saving = false }
}

async function onRemoveNote(id: string) {
  const n = store.notes.find(x => x.id === id)
  const ok = await confirm({ title: 'Delete note', body: `Delete "${n?.title || 'Untitled'}"?`, variant: 'danger', confirmLabel: 'Delete' })
  if (!ok) return
  try { await store.removeNote(id) } catch { toast.error('Failed to delete note.') }
}

// ── Key Object modal ───────────────────────────────────────────────────────

const objectModal = reactive({ open: false, id: null as string | null, name: '', description: '', saving: false })

function openObjectModal(o?: KeyObject) {
  objectModal.id = o?.id ?? null
  objectModal.name = o?.name ?? ''
  objectModal.description = o?.description ?? ''
  objectModal.saving = false
  objectModal.open = true
}

async function saveObject() {
  if (!objectModal.name.trim() || objectModal.saving) return
  objectModal.saving = true
  try {
    const input = { name: objectModal.name.trim(), description: objectModal.description.trim() || undefined }
    if (objectModal.id) await store.updateKeyObject(objectModal.id, input)
    else await store.createKeyObject(input)
    objectModal.open = false
  } catch { toast.error('Failed to save key object.') }
  finally { objectModal.saving = false }
}

async function onRemoveObject(id: string) {
  const o = store.keyObjects.find(x => x.id === id)
  const ok = await confirm({ title: 'Delete key object', body: `Delete "${o?.name}"?`, variant: 'danger', confirmLabel: 'Delete' })
  if (!ok) return
  try { await store.removeKeyObject(id) } catch { toast.error('Failed to delete key object.') }
}
</script>

<style scoped>
.sdp-empty-state {
  @apply flex flex-col items-center justify-center py-12 rounded border border-dashed border-shadow text-center;
}
.sdp-entity-card {
  @apply px-3 py-3 rounded border border-shadow bg-abyss hover:border-gold-dim/20 transition-colors;
}
.sdp-icon-btn {
  @apply p-1.5 rounded text-mist/50 hover:text-ash hover:bg-depths transition-colors;
}
</style>

<style>
.sdp-backdrop {
  position: fixed;
  inset: 0;
  z-index: 60;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 1rem;
  background: rgb(0 0 0 / 0.6);
}
.sdp-panel {
  position: relative;
  width: 100%;
  max-width: 24rem;
  background: var(--color-void, #0a0a0f);
  border: 1px solid var(--color-shadow, #2a2a3a);
  border-radius: 0.5rem;
  box-shadow: 0 25px 50px -12px rgb(0 0 0 / 0.8);
  overflow: hidden;
}
.sdp-panel--lg { max-width: 32rem; }
.sdp-accent {
  height: 2px;
  width: 100%;
  background: var(--color-gold-mid, #c9a84c);
}
.sdp-fade-enter-active,
.sdp-fade-leave-active {
  transition: opacity 0.15s ease;
}
.sdp-fade-enter-active .sdp-panel,
.sdp-fade-leave-active .sdp-panel {
  transition: opacity 0.15s ease, transform 0.15s ease;
}
.sdp-fade-enter-from,
.sdp-fade-leave-to { opacity: 0; }
.sdp-fade-enter-from .sdp-panel { transform: scale(0.95); }
</style>
