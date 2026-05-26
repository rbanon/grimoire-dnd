<template>
  <div>

    <!-- ── Header ──────────────────────────────────────────────────────────── -->
    <header class="border-b border-shadow bg-void relative overflow-hidden">
      <!-- Atmospheric gradient -->
      <div class="absolute inset-0 bg-gradient-to-b from-gold-dim/5 to-transparent pointer-events-none" />
      <div class="app-container py-8 sm:py-10 relative">
        <div class="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-5">

          <div>
            <p class="font-mono text-2xs tracking-[0.22em] uppercase text-mist mb-2">Your Chronicles</p>
            <h1 class="font-display text-4xl sm:text-5xl text-vellum leading-tight">Characters</h1>
            <p class="font-body text-base text-ash mt-1.5">
              <template v-if="store.summaries.length > 0">
                {{ store.summaries.length }} {{ store.summaries.length === 1 ? 'hero' : 'heroes' }} in your tome
              </template>
              <template v-else>Your story has yet to begin</template>
              <span v-if="!auth.isAuthenticated" class="ml-2 badge-gold">Local</span>
            </p>
          </div>

          <div class="flex items-center gap-2 shrink-0">
            <label
              class="btn-secondary cursor-pointer gap-2 text-sm"
              title="Import a .json file exported from The Grimoire"
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
    </header>

    <!-- ── Body ────────────────────────────────────────────────────────────── -->
    <main class="app-container py-8">

      <!-- Cloud nudge -->
      <div
        v-if="!auth.isAuthenticated && store.summaries.length > 0"
        class="mb-6 flex items-center gap-3 px-4 py-3 rounded border border-gold-dim/30 bg-abyss"
      >
        <CloudIcon :size="16" class="text-mist shrink-0" />
        <p class="font-body text-sm text-ash">
          Characters are saved in your browser only.
          <RouterLink to="/login" class="text-gold-mid hover:underline underline-offset-2 transition-colors">
            Sign in to sync to the cloud.
          </RouterLink>
        </p>
      </div>

      <!-- Import toast -->
      <Transition name="toast">
        <div
          v-if="importResult"
          class="mb-5 flex items-start gap-3 px-4 py-3 rounded border"
          :class="importResult.errors.length
            ? 'border-blood-base/40 bg-blood-deep/10 text-blood-mid'
            : 'border-verdant-base/30 bg-verdant-deep/10 text-verdant-base'"
        >
          <CheckIcon v-if="!importResult.errors.length" :size="15" class="mt-0.5 shrink-0" />
          <XCircleIcon v-else :size="15" class="mt-0.5 shrink-0" />
          <p class="font-body text-sm">
            <span v-if="importResult.imported > 0">
              {{ importResult.imported }} character{{ importResult.imported === 1 ? '' : 's' }} imported.
            </span>
            <span v-if="importResult.errors.length" class="ml-1">{{ importResult.errors.join(' · ') }}</span>
          </p>
        </div>
      </Transition>

      <!-- Skeleton loading — mirrors CharacterCard grid -->
      <div v-if="!store.loaded" class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        <div
          v-for="i in 8"
          :key="i"
          class="rounded-lg border border-gold-dim/15 bg-abyss overflow-hidden"
        >
          <div class="aspect-[4/3] skeleton" />
          <div class="px-3.5 pt-2.5 pb-3 flex flex-col gap-2">
            <div class="h-4 w-2/3 skeleton rounded-sm" />
            <div class="h-3 w-1/2 skeleton rounded-sm" />
            <div class="flex gap-1.5 mt-1">
              <div class="h-4 w-10 skeleton rounded-sm" />
              <div class="h-4 w-16 skeleton rounded-sm" />
            </div>
          </div>
        </div>
      </div>

      <!-- Empty state -->
      <div
        v-else-if="store.summaries.length === 0"
        class="flex flex-col items-center gap-6 py-24 text-center"
      >
        <div class="w-20 h-20 rounded border border-gold-dim/25 bg-abyss flex items-center justify-center">
          <BookOpenIcon :size="32" class="text-gold-dim" />
        </div>
        <div class="max-w-xs">
          <h2 class="font-display text-2xl text-vellum mb-1.5">An empty tome</h2>
          <p class="font-body text-ash leading-relaxed text-sm">
            Every legend begins with a blank page. Create your first character or import an existing hero.
          </p>
        </div>
        <div class="flex flex-col sm:flex-row gap-2.5">
          <RouterLink to="/characters/new" class="btn-primary gap-2">
            <PlusIcon :size="14" /> Create a Character
          </RouterLink>
          <label
            class="btn-secondary cursor-pointer gap-2"
            title="Import a .json file exported from The Grimoire"
          >
            <UploadIcon :size="14" /> Import from File
            <input type="file" accept=".json" class="sr-only" @change="onImport" />
          </label>
          <p class="text-2xs font-body text-mist/60 mt-1 text-center">
            Accepts .json files exported from The Grimoire
          </p>
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
          @duplicate="confirmDuplicate(summary.id)"
          @delete="confirmDelete(summary.id)"
          @export="downloadExport(summary.id)"
        />
      </div>

    </main>

    <!-- Footer divider -->
    <div class="app-container pb-8 pt-2">
      <div class="rule-gold"><span>✦</span></div>
    </div>

  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { PlusIcon, UploadIcon, CloudIcon, BookOpenIcon, CheckIcon, XCircleIcon } from 'lucide-vue-next'
import { useCharactersStore } from '@/characters/store'
import { useAuthStore } from '@/auth/store'
import { useConfirm } from '@/shared/composables/useConfirm'
import CharacterCard from '@/characters/components/CharacterCard.vue'

const store = useCharactersStore()
const auth = useAuthStore()
const { confirm } = useConfirm()
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

async function confirmDuplicate(id: string) {
  const c = store.getById(id)
  if (!c) return
  const race = c.identity.subrace
    ? `${c.identity.subrace.name} (${c.identity.race.name})`
    : c.identity.race.name
  const cls = c.identity.subclass
    ? `${c.identity.class.name} — ${c.identity.subclass.name}`
    : c.identity.class.name
  const ok = await confirm({
    title: 'Duplicate Character',
    body: `Create a copy of "${c.identity.name}"?`,
    confirmLabel: 'Duplicate',
    detail: [
      { label: 'Level', value: String(c.combat.level) },
      { label: 'Race',  value: race },
      { label: 'Class', value: cls },
    ],
  })
  if (ok) store.duplicate(id)
}

async function confirmDelete(id: string) {
  const c = store.getById(id)
  const ok = await confirm({
    title: 'Remove Character',
    body: `Remove "${c?.identity.name}" from your tome? This cannot be undone.`,
    confirmLabel: 'Remove',
    variant: 'danger',
  })
  if (ok) store.remove(id)
}
</script>

<style scoped>
.toast-enter-active, .toast-leave-active { transition: all 0.25s ease; }
.toast-enter-from, .toast-leave-to { opacity: 0; transform: translateY(-6px); }
</style>
