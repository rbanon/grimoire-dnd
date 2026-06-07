<template>
  <div class="app-container py-8 max-w-3xl">
    <RouterLink to="/campaigns" class="inline-flex items-center gap-1.5 text-sm font-body text-mist hover:text-ash transition-colors mb-5">
      <ArrowLeftIcon :size="14" /> Back to campaigns
    </RouterLink>

    <div v-if="!store.loaded" class="space-y-4">
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
      <div class="flex items-start justify-between gap-4 mb-6">
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
      <div v-if="campaign.tags.length" class="flex flex-wrap gap-1.5 mb-6">
        <span v-for="t in campaign.tags" :key="t" class="badge-arcane text-2xs">{{ t }}</span>
      </div>

      <!-- Description -->
      <section class="mb-8">
        <div class="rule-gold mb-3"><span>Overview</span></div>
        <p v-if="campaign.description" class="font-body text-ash leading-relaxed whitespace-pre-line">
          {{ campaign.description }}
        </p>
        <p v-else class="font-body text-mist/60 italic">No description yet.</p>
      </section>

      <!-- Party -->
      <section>
        <div class="rule-gold mb-3"><span>Party</span></div>
        <p v-if="party.length === 0" class="font-body text-mist/60 italic">
          No characters linked. <RouterLink :to="`/campaigns/${campaign.id}/edit`" class="text-gold-mid hover:underline">Add party members.</RouterLink>
        </p>
        <div v-else class="grid grid-cols-1 sm:grid-cols-2 gap-2">
          <RouterLink
            v-for="c in party"
            :key="c.id"
            :to="`/characters/${c.id}`"
            class="flex items-center gap-3 px-3 py-2.5 rounded border border-shadow bg-abyss hover:border-gold-dim/30 hover:bg-depths transition-all"
          >
            <div class="w-9 h-9 rounded bg-depths border border-shadow overflow-hidden shrink-0 flex items-center justify-center">
              <img v-if="c.portraitUrl" :src="c.portraitUrl" :alt="c.name" class="w-full h-full object-cover" />
              <UserIcon v-else :size="16" class="text-mist/50" />
            </div>
            <div class="min-w-0">
              <p class="font-heading text-sm text-ash truncate">{{ c.name }}</p>
              <p class="text-2xs font-body text-mist">Lv {{ c.level }} {{ c.race }} {{ c.className }}</p>
            </div>
          </RouterLink>
        </div>
        <!-- Linked but missing (deleted) characters -->
        <p v-if="missingCount > 0" class="text-2xs font-body text-mist/50 italic mt-2">
          {{ missingCount }} linked {{ missingCount === 1 ? 'character is' : 'characters are' }} no longer available.
        </p>
      </section>
    </template>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { ArrowLeftIcon, PencilIcon, Trash2Icon, UserIcon } from 'lucide-vue-next'
import { useCampaignsStore } from '@/campaigns/store'
import { useCharactersStore } from '@/characters/store'
import { useConfirm } from '@/shared/composables/useConfirm'

const props = defineProps<{ id: string }>()

const router = useRouter()
const store = useCampaignsStore()
const characterStore = useCharactersStore()
const { confirm } = useConfirm()

const campaign = computed(() => store.getById(props.id))

const party = computed(() => {
  const ids = campaign.value?.linkedCharacterIds ?? []
  return characterStore.summaries.filter((s) => ids.includes(s.id))
})

const missingCount = computed(() => {
  const linked = campaign.value?.linkedCharacterIds.length ?? 0
  return Math.max(0, linked - party.value.length)
})

onMounted(async () => {
  if (!store.loaded) await store.load()
  if (characterStore.summaries.length === 0) await characterStore.load()
})

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })
}

async function onDelete() {
  if (!campaign.value) return
  const ok = await confirm({
    title: 'Delete campaign?',
    body: `"${campaign.value.name}" will be permanently removed. This cannot be undone.`,
    confirmLabel: 'Delete',
    variant: 'danger',
  })
  if (ok) {
    await store.remove(props.id)
    router.push('/campaigns')
  }
}
</script>
