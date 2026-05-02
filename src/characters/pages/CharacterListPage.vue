<template>
  <div>
    <!-- Hero section -->
    <section class="relative border-b border-shadow overflow-hidden">
      <!-- Background decoration -->
      <div class="absolute inset-0 pointer-events-none">
        <div
          class="absolute top-0 right-0 w-96 h-96 rounded-full opacity-[0.035]"
          style="background: radial-gradient(circle, #d4a843 0%, transparent 70%); transform: translate(30%, -40%);"
        />
        <div
          class="absolute bottom-0 left-0 w-64 h-64 rounded-full opacity-[0.025]"
          style="background: radial-gradient(circle, #6b82d4 0%, transparent 70%); transform: translate(-40%, 40%);"
        />
        <!-- Decorative rune grid -->
        <div
          class="absolute inset-0 opacity-[0.025]"
          style="background-image: radial-gradient(circle, #d4a843 1px, transparent 1px); background-size: 32px 32px;"
        />
      </div>

      <div class="app-container relative py-10 sm:py-14">
        <div class="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-6">
          <div>
            <p class="text-caption text-gold-dim mb-3 tracking-[0.3em]">⌬ &nbsp; Your Chronicles &nbsp; ⌬</p>
            <h1 class="font-display text-4xl sm:text-5xl text-vellum leading-tight">
              Characters
            </h1>
            <p class="font-body text-ash mt-2 text-lg">
              {{ store.summaries.length > 0
                ? `${store.summaries.length} ${store.summaries.length === 1 ? 'hero' : 'heroes'} in your tome`
                : 'Your story has yet to begin' }}
              <span
                v-if="!auth.isAuthenticated"
                class="ml-2 badge-gold"
              >Saved locally</span>
            </p>
          </div>

          <div class="flex items-center gap-2 shrink-0">
            <label
              class="btn-secondary cursor-pointer gap-2 text-xs"
              title="Import character JSON"
            >
              <UploadIcon :size="14" />
              Import
              <input type="file" accept=".json" class="sr-only" @change="onImport" />
            </label>
            <RouterLink to="/characters/new" class="btn-primary gap-2 text-sm">
              <PlusIcon :size="14" />
              New Character
            </RouterLink>
          </div>
        </div>
      </div>
    </section>

    <!-- Main content -->
    <div class="app-container py-8">

      <!-- Cloud nudge -->
      <div
        v-if="!auth.isAuthenticated && store.summaries.length > 0"
        class="mb-7 flex items-center gap-4 px-5 py-3.5 rounded border border-arcane-base/25 bg-arcane-deep/20"
        style="backdrop-filter: blur(4px)"
      >
        <CloudIcon :size="18" class="text-arcane-pale shrink-0" />
        <p class="font-body text-sm text-stone">
          Characters are saved in your browser only.
          <RouterLink to="/login" class="text-gold-mid hover:text-gold-bright underline underline-offset-2 transition-colors">
            Sign in to sync to the cloud.
          </RouterLink>
        </p>
      </div>

      <!-- Import result toast -->
      <Transition name="toast">
        <div
          v-if="importResult"
          class="mb-6 flex items-start gap-3 px-5 py-3.5 rounded border"
          :class="importResult.errors.length
            ? 'border-blood-base/40 bg-blood-deep/30 text-blood-bright'
            : 'border-verdant-base/40 bg-verdant-deep/30 text-verdant-bright'"
        >
          <CheckIcon v-if="!importResult.errors.length" :size="16" class="mt-0.5 shrink-0" />
          <XCircleIcon v-else :size="16" class="mt-0.5 shrink-0" />
          <p class="font-body text-sm">
            <span v-if="importResult.imported > 0">
              {{ importResult.imported }} character{{ importResult.imported === 1 ? '' : 's' }} imported.
            </span>
            <span v-if="importResult.errors.length" class="ml-1">{{ importResult.errors.join(' · ') }}</span>
          </p>
        </div>
      </Transition>

      <!-- Loading -->
      <div v-if="!store.loaded" class="flex flex-col items-center gap-4 py-24">
        <div class="relative w-10 h-10">
          <div class="absolute inset-0 border border-gold-dim/30 rotate-45" />
          <div class="absolute inset-1 border border-gold-mid/20 animate-spin" style="border-radius: 2px; animation-duration: 2s;" />
          <div class="absolute inset-0 flex items-center justify-center text-gold-dim text-xs">⚔</div>
        </div>
        <p class="text-caption text-mist">Summoning your characters…</p>
      </div>

      <!-- Empty state -->
      <div
        v-else-if="store.summaries.length === 0"
        class="flex flex-col items-center gap-8 py-24 text-center"
      >
        <div class="relative">
          <!-- Ornamental ring -->
          <div class="w-28 h-28 rounded-full border border-gold-dim/20 flex items-center justify-center relative">
            <div class="absolute inset-2 rounded-full border border-gold-dim/10" />
            <div class="absolute inset-4 rounded-full border border-gold-dim/10 rotate-45 transition-transform duration-1000" />
            <BookOpenIcon :size="36" class="text-gold-dim relative z-10" />
          </div>
        </div>
        <div class="max-w-xs">
          <h2 class="font-display text-2xl text-vellum mb-2">An empty tome</h2>
          <p class="font-body text-ash leading-relaxed">
            Every legend begins with a blank page. Create your first character or import an existing hero.
          </p>
        </div>
        <div class="flex flex-col sm:flex-row gap-3">
          <RouterLink to="/characters/new" class="btn-primary">
            <PlusIcon :size="14" />
            Create a Character
          </RouterLink>
          <label class="btn-secondary cursor-pointer">
            <UploadIcon :size="14" />
            Import from File
            <input type="file" accept=".json" class="sr-only" @change="onImport" />
          </label>
        </div>
      </div>

      <!-- Character grid -->
      <div
        v-else
        class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 stagger-children"
      >
        <CharacterCard
          v-for="summary in store.summaries"
          :key="summary.id"
          :summary="summary"
          @duplicate="store.duplicate(summary.id)"
          @delete="confirmDelete(summary.id)"
          @export="downloadExport(summary.id)"
        />
      </div>
    </div>

    <!-- Footer ornament -->
    <div class="app-container pb-6 pt-2">
      <div class="rule-gold">
        <span>⌬</span>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import {
  PlusIcon, UploadIcon, CloudIcon, BookOpenIcon,
  CheckIcon, XCircleIcon,
} from 'lucide-vue-next'
import { useCharactersStore } from '@/characters/store'
import { useAuthStore } from '@/auth/store'
import CharacterCard from '@/characters/components/CharacterCard.vue'

const store = useCharactersStore()
const auth = useAuthStore()
const importResult = ref<{ imported: number; errors: string[] } | null>(null)

onMounted(() => store.load())

async function onImport(e: Event) {
  const file = (e.target as HTMLInputElement).files?.[0]
  if (!file) return
  const text = await file.text()
  importResult.value = await store.importFromJson(text)
  ;(e.target as HTMLInputElement).value = ''
  setTimeout(() => (importResult.value = null), 6000)
}

function downloadExport(id: string) {
  const json = store.exportOne(id)
  const blob = new Blob([json], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `${store.getById(id)?.identity.name ?? id}.grimoire.json`
  a.click()
  URL.revokeObjectURL(url)
}

function confirmDelete(id: string) {
  const c = store.getById(id)
  if (confirm(`Remove "${c?.identity.name}" from your tome? This cannot be undone.`)) {
    store.remove(id)
  }
}
</script>

<style scoped>
.toast-enter-active, .toast-leave-active { transition: all 0.3s ease; }
.toast-enter-from, .toast-leave-to { opacity: 0; transform: translateY(-8px); }
</style>
