<template>
  <div class="app-container py-8 max-w-4xl">
    <RouterLink to="/campaigns" class="inline-flex items-center gap-1.5 text-sm font-body text-mist hover:text-ash transition-colors mb-5">
      <ArrowLeftIcon :size="14" /> Back to campaigns
    </RouterLink>

    <!-- Skeleton -->
    <div v-if="!campaignsStore.loaded" class="space-y-4">
      <div class="h-9 w-1/2 skeleton rounded-sm" />
      <div class="h-4 w-full skeleton rounded-sm" />
      <div class="h-4 w-2/3 skeleton rounded-sm" />
    </div>

    <div v-else-if="!campaign" class="card p-12 text-center">
      <p class="font-body text-ash">This campaign could not be found.</p>
      <RouterLink to="/campaigns" class="btn-secondary mt-4 inline-flex">Back to campaigns</RouterLink>
    </div>

    <template v-else>
      <!-- Header -->
      <div class="flex items-start justify-between gap-4 mb-4">
        <div class="min-w-0">
          <h1 class="font-display text-4xl text-vellum leading-tight">{{ campaign.name }}</h1>
          <p class="text-2xs font-body text-mist mt-2">
            Created {{ formatDate(campaign.createdAt) }} · Updated {{ formatDate(campaign.updatedAt) }}
          </p>
        </div>
        <div class="flex items-center gap-2 shrink-0">
          <RouterLink :to="`/campaigns/${campaign.id}/edit`" class="btn-secondary gap-2 text-sm">
            <PencilIcon :size="14" /> Edit
          </RouterLink>
          <button type="button" class="btn-danger gap-2 text-sm" @click="onDelete">
            <Trash2Icon :size="14" /> Delete
          </button>
        </div>
      </div>

      <!-- Tags -->
      <div v-if="campaign.tags.length" class="flex flex-wrap gap-1.5 mb-5">
        <span v-for="t in campaign.tags" :key="t" class="badge-arcane text-2xs">{{ t }}</span>
      </div>

      <!-- Tab bar -->
      <div class="border-b border-gold-dim/25 flex overflow-x-auto scroll-hidden mb-6">
        <button
          v-for="tab in tabs"
          :key="tab.id"
          class="relative px-4 py-2.5 font-mono text-xs tracking-[0.16em] uppercase transition-colors duration-150 whitespace-nowrap shrink-0"
          :class="activeTab === tab.id ? 'text-gold-mid bg-gold-dim/5' : 'text-mist hover:text-stone'"
          @click="activeTab = tab.id"
        >
          {{ tab.label }}
          <span v-if="tab.count !== undefined" class="ml-1.5 text-2xs text-mist/60">{{ tab.count }}</span>
          <span v-if="activeTab === tab.id" class="absolute inset-x-0 -bottom-px h-[2px] bg-gradient-to-r from-transparent via-gold-mid to-transparent" />
        </button>
      </div>

      <!-- Loading sub-entities -->
      <div v-if="detail.loading" class="space-y-3">
        <div v-for="i in 3" :key="i" class="h-14 skeleton rounded" />
      </div>

      <template v-else>

        <!-- ── Overview ────────────────────────────────────────────── -->
        <div v-if="activeTab === 'overview'" class="space-y-8">

          <!-- Description -->
          <section v-if="campaign.description">
            <div class="rule-gold mb-3"><span>Overview</span></div>
            <p class="font-body text-ash leading-relaxed whitespace-pre-line">{{ campaign.description }}</p>
          </section>

          <!-- My character -->
          <section>
            <div class="rule-gold mb-3"><span>My character</span></div>
            <RouterLink
              v-if="myCharacter"
              :to="`/characters/${myCharacter.id}`"
              class="inline-flex items-center gap-3 px-3 py-2.5 rounded border border-shadow bg-abyss hover:border-gold-dim/30 hover:bg-depths transition-all max-w-xs"
            >
              <div class="w-9 h-9 rounded bg-depths border border-shadow overflow-hidden shrink-0 flex items-center justify-center">
                <img v-if="myCharacter.portraitUrl" :src="myCharacter.portraitUrl" :alt="myCharacter.name" class="w-full h-full object-cover" />
                <SwordIcon v-else :size="16" class="text-mist/50" />
              </div>
              <div class="min-w-0">
                <p class="font-heading text-sm text-ash truncate">{{ myCharacter.name }}</p>
                <p class="text-2xs font-body text-mist">Lv {{ myCharacter.level }} {{ myCharacter.race }} {{ myCharacter.className }}</p>
              </div>
            </RouterLink>
            <div
              v-else-if="campaign.myCharacterName"
              class="inline-flex items-center gap-3 px-3 py-2.5 rounded border border-shadow bg-abyss max-w-xs"
            >
              <SwordIcon :size="16" class="text-mist/50 shrink-0" />
              <p class="font-heading text-sm text-ash">{{ campaign.myCharacterName }}</p>
            </div>
            <p v-else class="font-body text-mist/60 italic text-sm">
              No character set.
              <RouterLink :to="`/campaigns/${campaign.id}/edit`" class="text-gold-mid hover:underline">Edit campaign</RouterLink>
              to add one.
            </p>
          </section>

          <!-- Party preview -->
          <section v-if="detail.partyMembers.length > 0">
            <div class="rule-gold mb-3">
              <span>Party <span class="text-mist/50 font-body normal-case text-xs">({{ detail.partyMembers.length }})</span></span>
            </div>
            <div class="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <div
                v-for="p in detail.partyMembers"
                :key="p.id"
                class="flex items-center gap-3 px-3 py-2.5 rounded border border-shadow bg-abyss"
              >
                <UsersIcon :size="14" class="text-mist/40 shrink-0" />
                <div class="min-w-0">
                  <p class="font-heading text-sm text-ash truncate">{{ p.name }}</p>
                  <p v-if="p.player" class="text-2xs font-body text-mist/60">{{ p.player }}</p>
                </div>
              </div>
            </div>
            <button class="text-2xs font-body text-gold-mid/70 hover:text-gold-mid mt-2 transition-colors" @click="activeTab = 'party'">
              Manage party →
            </button>
          </section>
        </div>

        <!-- ── Sessions ───────────────────────────────────────────── -->
        <div v-else-if="activeTab === 'sessions'">
          <div class="flex items-center justify-between mb-4">
            <p class="label">Sessions</p>
            <button class="btn-secondary gap-1.5 text-sm" @click="openSessionModal()">
              <PlusIcon :size="14" /> Add session
            </button>
          </div>
          <div v-if="detail.sessions.length === 0" class="empty-state">
            <ScrollTextIcon :size="28" class="text-mist/30 mb-2" />
            <p class="font-body text-mist/60 text-sm">No sessions yet. Add your first one.</p>
          </div>
          <div v-else class="space-y-2">
            <div
              v-for="s in detail.sessions"
              :key="s.id"
              class="entity-row cursor-pointer"
              @click="router.push(`/campaigns/${props.id}/sessions/${s.id}`)"
            >
              <div class="min-w-0 flex-1">
                <span class="font-mono text-xs text-mist/60 mr-2">#{{ s.sessionNumber }}</span>
                <span class="font-heading text-sm text-ash">{{ s.title || 'Untitled session' }}</span>
                <span v-if="s.date" class="ml-3 text-2xs font-body text-mist/60">{{ formatShortDate(s.date) }}</span>
              </div>
              <div class="flex items-center gap-1 shrink-0">
                <button class="icon-btn" title="Edit" @click.stop="openSessionModal(s)"><PencilIcon :size="13" /></button>
                <button class="icon-btn text-blood-bright/70 hover:text-blood-bright" title="Delete" @click.stop="onRemoveSession(s.id)"><Trash2Icon :size="13" /></button>
              </div>
            </div>
          </div>
        </div>

        <!-- ── Party ──────────────────────────────────────────────── -->
        <div v-else-if="activeTab === 'party'">
          <div class="flex items-center justify-between mb-4">
            <p class="label">Party members</p>
            <button class="btn-secondary gap-1.5 text-sm" @click="openPartyModal()">
              <PlusIcon :size="14" /> Add member
            </button>
          </div>
          <div v-if="detail.partyMembers.length === 0" class="empty-state">
            <UsersIcon :size="28" class="text-mist/30 mb-2" />
            <p class="font-body text-mist/60 text-sm">No party members yet.</p>
          </div>
          <div v-else class="space-y-2">
            <div v-for="p in detail.partyMembers" :key="p.id" class="entity-card">
              <div class="flex items-start justify-between gap-3">
                <div class="min-w-0 flex-1">
                  <div class="flex items-baseline gap-2 flex-wrap">
                    <p class="font-heading text-sm text-ash">{{ p.name }}</p>
                    <span v-if="p.player" class="text-2xs font-body text-mist/60">· {{ p.player }}</span>
                  </div>
                  <p v-if="p.description" class="font-body text-2xs text-mist/70 mt-0.5 line-clamp-2">{{ p.description }}</p>
                  <p v-if="p.notes" class="font-body text-2xs text-mist/50 mt-0.5 line-clamp-1 italic">{{ p.notes }}</p>
                </div>
                <div class="flex items-center gap-1 shrink-0">
                  <button class="icon-btn" title="Edit" @click="openPartyModal(p)"><PencilIcon :size="13" /></button>
                  <button class="icon-btn text-blood-bright/70 hover:text-blood-bright" title="Delete" @click="onRemovePartyMember(p.id)"><Trash2Icon :size="13" /></button>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- ── NPCs ───────────────────────────────────────────────── -->
        <div v-else-if="activeTab === 'npcs'">
          <div class="flex items-center justify-between mb-4">
            <p class="label">NPCs</p>
            <button class="btn-secondary gap-1.5 text-sm" @click="openNpcModal()">
              <PlusIcon :size="14" /> Add NPC
            </button>
          </div>
          <div v-if="detail.npcs.length === 0" class="empty-state">
            <UserIcon :size="28" class="text-mist/30 mb-2" />
            <p class="font-body text-mist/60 text-sm">No NPCs yet.</p>
          </div>
          <div v-else class="space-y-2">
            <div v-for="n in detail.npcs" :key="n.id" class="entity-card">
              <div class="flex items-start justify-between gap-3">
                <div class="min-w-0 flex-1">
                  <p class="font-heading text-sm text-ash">{{ n.name }}</p>
                  <p v-if="n.description" class="font-body text-2xs text-mist/70 mt-0.5 line-clamp-2">{{ n.description }}</p>
                </div>
                <div class="flex items-center gap-1 shrink-0">
                  <button class="icon-btn" title="Edit" @click="openNpcModal(n)"><PencilIcon :size="13" /></button>
                  <button class="icon-btn text-blood-bright/70 hover:text-blood-bright" title="Delete" @click="onRemoveNpc(n.id)"><Trash2Icon :size="13" /></button>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- ── Notes ──────────────────────────────────────────────── -->
        <div v-else-if="activeTab === 'notes'">
          <div class="flex items-center justify-between mb-4">
            <p class="label">Notes</p>
            <button class="btn-secondary gap-1.5 text-sm" @click="openNoteModal()">
              <PlusIcon :size="14" /> Add note
            </button>
          </div>
          <div v-if="detail.notes.length === 0" class="empty-state">
            <NotebookPenIcon :size="28" class="text-mist/30 mb-2" />
            <p class="font-body text-mist/60 text-sm">No notes yet.</p>
          </div>
          <div v-else class="space-y-2">
            <div v-for="n in detail.notes" :key="n.id" class="entity-card cursor-pointer" @click="openNoteModal(n)">
              <div class="flex items-start justify-between gap-3">
                <div class="min-w-0 flex-1">
                  <p class="font-heading text-sm text-ash">{{ n.title || 'Untitled' }}</p>
                  <p v-if="n.body" class="font-body text-2xs text-mist/70 mt-0.5 line-clamp-2">{{ n.body }}</p>
                  <p class="text-2xs font-body text-mist/40 mt-1">{{ formatDate(n.updatedAt) }}</p>
                </div>
                <div class="flex items-center gap-1 shrink-0">
                  <button class="icon-btn text-blood-bright/70 hover:text-blood-bright" title="Delete" @click.stop="onRemoveNote(n.id)"><Trash2Icon :size="13" /></button>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- ── Key Objects ─────────────────────────────────────────── -->
        <div v-else-if="activeTab === 'objects'">
          <div class="flex items-center justify-between mb-4">
            <p class="label">Key Objects</p>
            <button class="btn-secondary gap-1.5 text-sm" @click="openObjectModal()">
              <PlusIcon :size="14" /> Add object
            </button>
          </div>
          <div v-if="detail.keyObjects.length === 0" class="empty-state">
            <PackageIcon :size="28" class="text-mist/30 mb-2" />
            <p class="font-body text-mist/60 text-sm">No key objects yet.</p>
          </div>
          <div v-else class="space-y-2">
            <div v-for="o in detail.keyObjects" :key="o.id" class="entity-card">
              <div class="flex items-start justify-between gap-3">
                <div class="min-w-0 flex-1">
                  <p class="font-heading text-sm text-ash">{{ o.name }}</p>
                  <p v-if="o.description" class="font-body text-2xs text-mist/70 mt-0.5 line-clamp-2">{{ o.description }}</p>
                </div>
                <div class="flex items-center gap-1 shrink-0">
                  <button class="icon-btn" title="Edit" @click="openObjectModal(o)"><PencilIcon :size="13" /></button>
                  <button class="icon-btn text-blood-bright/70 hover:text-blood-bright" title="Delete" @click="onRemoveObject(o.id)"><Trash2Icon :size="13" /></button>
                </div>
              </div>
            </div>
          </div>
        </div>

      </template>
    </template>
  </div>

  <!-- ── Session modal ─────────────────────────────────────────────────────── -->
  <Teleport to="body">
    <Transition name="cdp-modal-fade">
      <div v-if="sessionModal.open" class="cdp-modal-backdrop" @click.self="sessionModal.open = false">
        <div class="cdp-modal-panel">
          <div class="cdp-modal-accent" />
          <div class="px-5 py-4">
            <p class="font-heading text-base text-gold-mid tracking-wide mb-4">
              {{ sessionModal.id ? 'Edit Session' : 'New Session' }}
            </p>
            <div class="space-y-3">
              <div class="grid grid-cols-2 gap-3">
                <div>
                  <label class="label mb-1"># Number</label>
                  <input v-model.number="sessionModal.sessionNumber" type="number" min="1" class="input-base w-full text-sm" />
                </div>
                <div>
                  <label class="label mb-1">Date</label>
                  <input v-model="sessionModal.date" type="date" class="input-base w-full text-sm" />
                </div>
              </div>
              <div>
                <label class="label mb-1">Title</label>
                <input v-model="sessionModal.title" type="text" maxlength="200" placeholder="Optional title…" class="input-base w-full text-sm" />
              </div>
            </div>
            <div class="flex gap-2 mt-5">
              <button class="btn-secondary flex-1 text-sm" @click="sessionModal.open = false">Cancel</button>
              <button class="btn-primary flex-1 text-sm" :disabled="sessionModal.saving" @click="saveSession">
                {{ sessionModal.saving ? 'Saving…' : 'Save' }}
              </button>
            </div>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>

  <!-- ── Party member modal ─────────────────────────────────────────────────── -->
  <Teleport to="body">
    <Transition name="cdp-modal-fade">
      <div v-if="partyModal.open" class="cdp-modal-backdrop" @click.self="partyModal.open = false">
        <div class="cdp-modal-panel cdp-modal-panel--md">
          <div class="cdp-modal-accent" />
          <div class="px-5 py-4">
            <p class="font-heading text-base text-gold-mid tracking-wide mb-4">
              {{ partyModal.id ? 'Edit party member' : 'New party member' }}
            </p>
            <div class="space-y-3">
              <div class="grid grid-cols-2 gap-3">
                <div>
                  <label class="label mb-1">Character name <span class="text-blood-bright">*</span></label>
                  <input v-model="partyModal.name" type="text" maxlength="120" placeholder="Aragorn…" class="input-base w-full text-sm" />
                </div>
                <div>
                  <label class="label mb-1">Player</label>
                  <input v-model="partyModal.player" type="text" maxlength="120" placeholder="Real name…" class="input-base w-full text-sm" />
                </div>
              </div>
              <div>
                <label class="label mb-1">Description</label>
                <input v-model="partyModal.description" type="text" maxlength="1000" placeholder="Class, race, brief concept…" class="input-base w-full text-sm" />
              </div>
              <div>
                <label class="label mb-1">Notes</label>
                <textarea v-model="partyModal.notes" rows="3" maxlength="5000" placeholder="Anything else worth remembering…" class="input-base w-full text-sm resize-y" />
              </div>
            </div>
            <div class="flex gap-2 mt-5">
              <button class="btn-secondary flex-1 text-sm" @click="partyModal.open = false">Cancel</button>
              <button class="btn-primary flex-1 text-sm" :disabled="!partyModal.name.trim() || partyModal.saving" @click="savePartyMember">
                {{ partyModal.saving ? 'Saving…' : 'Save' }}
              </button>
            </div>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>

  <!-- ── NPC modal ─────────────────────────────────────────────────────────── -->
  <Teleport to="body">
    <Transition name="cdp-modal-fade">
      <div v-if="npcModal.open" class="cdp-modal-backdrop" @click.self="npcModal.open = false">
        <div class="cdp-modal-panel">
          <div class="cdp-modal-accent" />
          <div class="px-5 py-4">
            <p class="font-heading text-base text-gold-mid tracking-wide mb-4">
              {{ npcModal.id ? 'Edit NPC' : 'New NPC' }}
            </p>
            <div class="space-y-3">
              <div>
                <label class="label mb-1">Name <span class="text-blood-bright">*</span></label>
                <input v-model="npcModal.name" type="text" maxlength="120" placeholder="NPC name…" class="input-base w-full text-sm" />
              </div>
              <div>
                <label class="label mb-1">Description</label>
                <textarea v-model="npcModal.description" rows="4" maxlength="5000" placeholder="Optional description…" class="input-base w-full text-sm resize-y" />
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
    <Transition name="cdp-modal-fade">
      <div v-if="noteModal.open" class="cdp-modal-backdrop" @click.self="noteModal.open = false">
        <div class="cdp-modal-panel cdp-modal-panel--lg">
          <div class="cdp-modal-accent" />
          <div class="px-5 py-4">
            <p class="font-heading text-base text-gold-mid tracking-wide mb-4">
              {{ noteModal.id ? 'Edit Note' : 'New Note' }}
            </p>
            <div class="space-y-3">
              <div>
                <label class="label mb-1">Title</label>
                <input v-model="noteModal.title" type="text" maxlength="200" placeholder="Untitled" class="input-base w-full text-sm" />
              </div>
              <div>
                <label class="label mb-1">Body</label>
                <textarea v-model="noteModal.body" rows="8" maxlength="20000" placeholder="Write your note…" class="input-base w-full text-sm resize-y font-body leading-relaxed" />
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
    <Transition name="cdp-modal-fade">
      <div v-if="objectModal.open" class="cdp-modal-backdrop" @click.self="objectModal.open = false">
        <div class="cdp-modal-panel">
          <div class="cdp-modal-accent" />
          <div class="px-5 py-4">
            <p class="font-heading text-base text-gold-mid tracking-wide mb-4">
              {{ objectModal.id ? 'Edit Key Object' : 'New Key Object' }}
            </p>
            <div class="space-y-3">
              <div>
                <label class="label mb-1">Name <span class="text-blood-bright">*</span></label>
                <input v-model="objectModal.name" type="text" maxlength="120" placeholder="Object name…" class="input-base w-full text-sm" />
              </div>
              <div>
                <label class="label mb-1">Description</label>
                <textarea v-model="objectModal.description" rows="4" maxlength="5000" placeholder="Optional description…" class="input-base w-full text-sm resize-y" />
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
import { computed, onMounted, onUnmounted, reactive, ref } from 'vue'
import { useRouter } from 'vue-router'
import {
  ArrowLeftIcon, PencilIcon, Trash2Icon, UserIcon, UsersIcon, SwordIcon, PlusIcon,
  ScrollTextIcon, NotebookPenIcon, PackageIcon,
} from 'lucide-vue-next'
import { useCampaignsStore } from '@/campaigns/store'
import { useCampaignDetailStore } from '@/campaigns/detailStore'
import { useCharactersStore } from '@/characters/store'
import { useConfirm } from '@/shared/composables/useConfirm'
import { useToast } from '@/shared/composables/useToast'
import type { CampaignSession, PartyMember, NPC, CampaignNote, KeyObject } from '@/shared/types/campaign'

const props = defineProps<{ id: string }>()

const router = useRouter()
const campaignsStore = useCampaignsStore()
const detail = useCampaignDetailStore()
const characterStore = useCharactersStore()
const { confirm } = useConfirm()
const toast = useToast()

const campaign = computed(() => campaignsStore.getById(props.id))

const myCharacter = computed(() => {
  const cid = campaign.value?.myCharacterId
  return cid ? characterStore.summaries.find(s => s.id === cid) : undefined
})

const activeTab = ref('overview')

const tabs = computed(() => [
  { id: 'overview', label: 'Overview' },
  { id: 'sessions', label: 'Sessions',    count: detail.sessions.length || undefined },
  { id: 'party',    label: 'Party',       count: detail.partyMembers.length || undefined },
  { id: 'npcs',     label: 'NPCs',        count: detail.npcs.length || undefined },
  { id: 'notes',    label: 'Notes',       count: detail.notes.length || undefined },
  { id: 'objects',  label: 'Key Objects', count: detail.keyObjects.length || undefined },
])

// ── Lifecycle ─────────────────────────────────────────────────────────────────

onMounted(() => {
  if (campaign.value) detail.load(props.id)
})

onUnmounted(() => detail.clear())

// ── Campaign delete ───────────────────────────────────────────────────────────

async function onDelete() {
  const ok = await confirm({
    title: 'Delete campaign',
    body: `Delete "${campaign.value?.name}"? This cannot be undone.`,
    variant: 'danger',
    confirmLabel: 'Delete',
  })
  if (!ok) return
  await campaignsStore.remove(props.id)
  router.push('/campaigns')
}

// ── Date helpers ──────────────────────────────────────────────────────────────

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })
}
function formatShortDate(iso: string) {
  return new Date(iso + 'T00:00:00').toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })
}

// ── Session modal ─────────────────────────────────────────────────────────────

const sessionModal = reactive({ open: false, id: null as string | null, sessionNumber: 1, title: '', date: '', saving: false })

function openSessionModal(s?: CampaignSession) {
  sessionModal.id = s?.id ?? null
  sessionModal.sessionNumber = s?.sessionNumber ?? detail.nextSessionNumber
  sessionModal.title = s?.title ?? ''
  sessionModal.date = s?.date ?? ''
  sessionModal.saving = false
  sessionModal.open = true
}

async function saveSession() {
  if (sessionModal.saving) return
  sessionModal.saving = true
  try {
    const input = { sessionNumber: sessionModal.sessionNumber, title: sessionModal.title || undefined, date: sessionModal.date || undefined }
    if (sessionModal.id) await detail.updateSession(sessionModal.id, input)
    else await detail.createSession(input)
    sessionModal.open = false
  } catch {
    toast.error('Failed to save session. Check your connection.')
  } finally {
    sessionModal.saving = false
  }
}

async function onRemoveSession(id: string) {
  const s = detail.sessions.find(x => x.id === id)
  const ok = await confirm({ title: 'Delete session', body: `Delete session #${s?.sessionNumber}?`, variant: 'danger', confirmLabel: 'Delete' })
  if (!ok) return
  try { await detail.removeSession(id) } catch { toast.error('Failed to delete session.') }
}

// ── Party member modal ────────────────────────────────────────────────────────

const partyModal = reactive({ open: false, id: null as string | null, name: '', player: '', description: '', notes: '', saving: false })

function openPartyModal(p?: PartyMember) {
  partyModal.id = p?.id ?? null
  partyModal.name = p?.name ?? ''
  partyModal.player = p?.player ?? ''
  partyModal.description = p?.description ?? ''
  partyModal.notes = p?.notes ?? ''
  partyModal.saving = false
  partyModal.open = true
}

async function savePartyMember() {
  if (!partyModal.name.trim() || partyModal.saving) return
  partyModal.saving = true
  try {
    const input = {
      name: partyModal.name.trim(),
      player: partyModal.player.trim() || undefined,
      description: partyModal.description.trim() || undefined,
      notes: partyModal.notes.trim() || undefined,
    }
    if (partyModal.id) await detail.updatePartyMember(partyModal.id, input)
    else await detail.createPartyMember(input)
    partyModal.open = false
  } catch {
    toast.error('Failed to save party member. Check your connection.')
  } finally {
    partyModal.saving = false
  }
}

async function onRemovePartyMember(id: string) {
  const p = detail.partyMembers.find(x => x.id === id)
  const ok = await confirm({ title: 'Remove party member', body: `Remove "${p?.name}" from the party?`, variant: 'danger', confirmLabel: 'Remove' })
  if (!ok) return
  try { await detail.removePartyMember(id) } catch { toast.error('Failed to remove party member.') }
}

// ── NPC modal ─────────────────────────────────────────────────────────────────

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
    if (npcModal.id) await detail.updateNpc(npcModal.id, input)
    else await detail.createNpc(input)
    npcModal.open = false
  } catch {
    toast.error('Failed to save NPC. Check your connection.')
  } finally {
    npcModal.saving = false
  }
}

async function onRemoveNpc(id: string) {
  const n = detail.npcs.find(x => x.id === id)
  const ok = await confirm({ title: 'Delete NPC', body: `Delete "${n?.name}"?`, variant: 'danger', confirmLabel: 'Delete' })
  if (!ok) return
  try { await detail.removeNpc(id) } catch { toast.error('Failed to delete NPC.') }
}

// ── Note modal ────────────────────────────────────────────────────────────────

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
    if (noteModal.id) await detail.updateNote(noteModal.id, input)
    else await detail.createNote(input)
    noteModal.open = false
  } catch {
    toast.error('Failed to save note. Check your connection.')
  } finally {
    noteModal.saving = false
  }
}

async function onRemoveNote(id: string) {
  const n = detail.notes.find(x => x.id === id)
  const ok = await confirm({ title: 'Delete note', body: `Delete "${n?.title || 'Untitled'}"?`, variant: 'danger', confirmLabel: 'Delete' })
  if (!ok) return
  try { await detail.removeNote(id) } catch { toast.error('Failed to delete note.') }
}

// ── Key Object modal ──────────────────────────────────────────────────────────

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
    if (objectModal.id) await detail.updateKeyObject(objectModal.id, input)
    else await detail.createKeyObject(input)
    objectModal.open = false
  } catch {
    toast.error('Failed to save key object. Check your connection.')
  } finally {
    objectModal.saving = false
  }
}

async function onRemoveObject(id: string) {
  const o = detail.keyObjects.find(x => x.id === id)
  const ok = await confirm({ title: 'Delete key object', body: `Delete "${o?.name}"?`, variant: 'danger', confirmLabel: 'Delete' })
  if (!ok) return
  try { await detail.removeKeyObject(id) } catch { toast.error('Failed to delete key object.') }
}
</script>

<style scoped>
.empty-state {
  @apply flex flex-col items-center justify-center py-14 rounded border border-dashed border-shadow text-center;
}
.entity-row {
  @apply flex items-center gap-3 px-3 py-2.5 rounded border border-shadow bg-abyss hover:border-gold-dim/20 transition-colors;
}
.entity-card {
  @apply px-3 py-3 rounded border border-shadow bg-abyss hover:border-gold-dim/20 transition-colors;
}
.icon-btn {
  @apply p-1.5 rounded text-mist/50 hover:text-ash hover:bg-depths transition-colors;
}
</style>

<!-- Modal styles must be non-scoped: Teleport moves nodes outside the component
     tree, so scoped attribute selectors never match them. -->
<style>
.cdp-modal-backdrop {
  position: fixed;
  inset: 0;
  z-index: 60;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 1rem;
  background: rgb(0 0 0 / 0.6);
}
.cdp-modal-panel {
  position: relative;
  width: 100%;
  max-width: 24rem;
  background: var(--color-void, #0a0a0f);
  border: 1px solid var(--color-shadow, #2a2a3a);
  border-radius: 0.5rem;
  box-shadow: 0 25px 50px -12px rgb(0 0 0 / 0.8);
  overflow: hidden;
}
.cdp-modal-panel--md  { max-width: 28rem; }
.cdp-modal-panel--lg  { max-width: 32rem; }
.cdp-modal-accent {
  height: 2px;
  width: 100%;
  background: var(--color-gold-mid, #c9a84c);
}
.cdp-modal-fade-enter-active,
.cdp-modal-fade-leave-active {
  transition: opacity 0.15s ease;
}
.cdp-modal-fade-enter-active .cdp-modal-panel,
.cdp-modal-fade-leave-active .cdp-modal-panel {
  transition: opacity 0.15s ease, transform 0.15s ease;
}
.cdp-modal-fade-enter-from,
.cdp-modal-fade-leave-to {
  opacity: 0;
}
.cdp-modal-fade-enter-from .cdp-modal-panel {
  transform: scale(0.95);
}
</style>
