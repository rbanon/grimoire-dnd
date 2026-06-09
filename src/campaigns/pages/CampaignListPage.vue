<template>
  <div>
    <!-- Header -->
    <header class="border-b border-shadow bg-void relative overflow-hidden">
      <div class="absolute inset-0 bg-gradient-to-b from-gold-dim/5 to-transparent pointer-events-none" />
      <div class="app-container py-8 sm:py-10 relative">
        <div class="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-5">
          <div>
            <p class="font-mono text-2xs tracking-[0.22em] uppercase text-mist mb-2">Your Chronicles</p>
            <h1 class="font-display text-4xl sm:text-5xl text-vellum leading-tight">Campaigns</h1>
            <p class="font-body text-base text-ash mt-1.5">
              <template v-if="store.sorted.length > 0">
                {{ store.sorted.length }}/{{ MAX_CAMPAIGNS }} {{ store.sorted.length === 1 ? 'chronicle' : 'chronicles' }} recorded
              </template>
              <template v-else>No chronicles yet</template>
            </p>
          </div>
          <RouterLink
            to="/campaigns/new"
            class="btn-primary gap-2 text-sm shrink-0"
            :class="atLimit ? 'opacity-50 pointer-events-none' : ''"
            :title="atLimit ? `Limit of ${MAX_CAMPAIGNS} campaigns reached` : undefined"
            :aria-disabled="atLimit"
          >
            <PlusIcon :size="14" /> New Campaign
          </RouterLink>
        </div>
      </div>
    </header>

    <main class="app-container py-8">
      <!-- Loading -->
      <div v-if="!store.loaded" class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <div v-for="i in 6" :key="i" class="rounded-lg border border-gold-dim/15 bg-abyss p-5">
          <div class="h-5 w-2/3 skeleton rounded-sm mb-3" />
          <div class="h-3 w-full skeleton rounded-sm mb-1.5" />
          <div class="h-3 w-1/2 skeleton rounded-sm" />
        </div>
      </div>

      <!-- Empty -->
      <div v-else-if="store.sorted.length === 0" class="flex flex-col items-center gap-6 py-24 text-center">
        <div class="w-20 h-20 rounded border border-gold-dim/25 bg-abyss flex items-center justify-center">
          <BookOpenIcon :size="32" class="text-gold-dim" />
        </div>
        <div class="max-w-xs">
          <h2 class="font-display text-2xl text-vellum mb-1.5">No chronicles yet</h2>
          <p class="font-body text-ash leading-relaxed text-sm">
            Gather your party, track your sessions, and keep your world in one place. Start your first campaign.
          </p>
        </div>
        <RouterLink to="/campaigns/new" class="btn-primary gap-2">
          <PlusIcon :size="14" /> Create a Campaign
        </RouterLink>
      </div>

      <!-- Grid -->
      <div v-else class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <div
          v-for="c in store.sorted"
          :key="c.id"
          class="group relative card p-5 flex flex-col gap-3 hover:border-gold-dim/40 transition-all cursor-pointer"
          @click="router.push(`/campaigns/${c.id}`)"
        >
          <div class="flex items-start justify-between gap-2">
            <h3 class="font-display text-xl text-vellum leading-tight truncate">{{ c.name }}</h3>
            <button
              type="button"
              class="shrink-0 w-7 h-7 flex items-center justify-center rounded text-mist/40 hover:text-blood-bright hover:bg-blood-deep/20 opacity-0 group-hover:opacity-100 transition-all"
              title="Delete campaign"
              @click.stop="onDelete(c.id, c.name)"
            >
              <Trash2Icon :size="14" />
            </button>
          </div>

          <p v-if="c.description" class="font-body text-sm text-ash leading-relaxed line-clamp-2">
            {{ c.description }}
          </p>
          <p v-else class="font-body text-sm text-mist/50 italic">No description</p>

          <div v-if="c.tags.length" class="flex flex-wrap gap-1.5">
            <span v-for="t in c.tags.slice(0, 4)" :key="t" class="badge-arcane text-2xs">{{ t }}</span>
            <span v-if="c.tags.length > 4" class="text-2xs font-body text-mist self-center">+{{ c.tags.length - 4 }}</span>
          </div>

          <div class="flex items-center gap-3 mt-auto pt-2 text-2xs font-body text-mist border-t border-shadow/50">
            <span>Updated {{ formatDate(c.updatedAt) }}</span>
          </div>
        </div>
      </div>
    </main>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { PlusIcon, BookOpenIcon, Trash2Icon } from 'lucide-vue-next'
import { useCampaignsStore, MAX_CAMPAIGNS } from '@/campaigns/store'
import { useConfirm } from '@/shared/composables/useConfirm'

const router = useRouter()
const store = useCampaignsStore()
const { confirm } = useConfirm()

const atLimit = computed(() => store.sorted.length >= MAX_CAMPAIGNS)

onMounted(() => store.load())

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })
}

async function onDelete(id: string, name: string) {
  const ok = await confirm({
    title: 'Delete campaign?',
    body: `"${name}" and its details will be permanently removed. This cannot be undone.`,
    confirmLabel: 'Delete',
    variant: 'danger',
  })
  if (ok) await store.remove(id)
}
</script>
