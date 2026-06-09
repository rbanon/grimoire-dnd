<template>
  <div class="app-container py-8 max-w-2xl">
    <RouterLink :to="backTo" class="inline-flex items-center gap-1.5 text-sm font-body text-mist hover:text-ash transition-colors mb-5">
      <ArrowLeftIcon :size="14" /> {{ isEdit ? 'Back to campaign' : 'Back to campaigns' }}
    </RouterLink>

    <h1 class="font-display text-3xl text-vellum mb-6">{{ isEdit ? 'Edit Campaign' : 'New Campaign' }}</h1>

    <form class="space-y-6" @submit.prevent="onSubmit">
      <!-- Name -->
      <div class="space-y-1.5">
        <label class="label" for="campaign-name">Name *</label>
        <input
          id="campaign-name"
          v-model.trim="name"
          type="text"
          maxlength="120"
          placeholder="Curse of Strahd…"
          class="input-base w-full"
          :class="nameError ? 'border-blood-base/60' : ''"
        />
        <p v-if="nameError" class="text-xs font-body text-blood-bright">{{ nameError }}</p>
      </div>

      <!-- Description -->
      <div class="space-y-1.5">
        <label class="label" for="campaign-desc">Description</label>
        <textarea
          id="campaign-desc"
          v-model.trim="description"
          rows="4"
          maxlength="2000"
          placeholder="A gothic horror adventure in the mists of Barovia…"
          class="input-base w-full resize-y"
        />
        <p class="text-2xs font-body text-mist/60 text-right">{{ description.length }}/2000</p>
      </div>

      <!-- Tags -->
      <div class="space-y-1.5">
        <label class="label" for="campaign-tags">Tags</label>
        <input
          id="campaign-tags"
          v-model="tagsRaw"
          type="text"
          placeholder="horror, homebrew, weekly (comma-separated)"
          class="input-base w-full"
        />
        <div v-if="parsedTags.length" class="flex flex-wrap gap-1.5 pt-1">
          <span v-for="t in parsedTags" :key="t" class="badge-arcane text-2xs">{{ t }}</span>
        </div>
      </div>

      <!-- My character -->
      <div class="space-y-2">
        <label class="label">My character</label>
        <p class="text-2xs font-body text-mist/60">The character you play in this campaign.</p>

        <!-- Character picker from app -->
        <div v-if="characterStore.summaries.length > 0" class="grid grid-cols-1 sm:grid-cols-2 gap-2">
          <button
            v-for="c in characterStore.summaries"
            :key="c.id"
            type="button"
            class="flex items-center gap-3 px-3 py-2.5 rounded border text-left transition-all"
            :class="myCharacterId === c.id
              ? 'border-gold-mid/60 bg-gold-dim/10'
              : 'border-shadow bg-abyss hover:border-gold-dim/25 hover:bg-depths'"
            @click="selectCharacter(c.id)"
          >
            <div
              class="w-4 h-4 rounded-full border-2 flex items-center justify-center shrink-0 transition-all"
              :class="myCharacterId === c.id ? 'border-gold-mid bg-gold-mid' : 'border-mist/40'"
            />
            <div class="min-w-0">
              <p class="font-heading text-sm text-ash truncate">{{ c.name }}</p>
              <p class="text-2xs font-body text-mist">Lv {{ c.level }} {{ c.race }} {{ c.className }}</p>
            </div>
          </button>
        </div>
        <p v-else class="text-sm font-body text-mist/60 italic">
          No characters in the app yet.
        </p>

        <!-- Free text fallback (shown when no character selected) -->
        <div v-if="!myCharacterId" class="pt-1">
          <label class="text-2xs font-body text-mist/70 mb-1 block">
            {{ characterStore.summaries.length > 0 ? 'Or enter a name manually:' : 'Enter character name:' }}
          </label>
          <input
            v-model.trim="myCharacterName"
            type="text"
            maxlength="120"
            placeholder="Character name…"
            class="input-base w-full text-sm"
          />
        </div>

        <!-- Clear selection -->
        <button
          v-if="myCharacterId"
          type="button"
          class="text-2xs font-body text-mist/50 hover:text-mist transition-colors"
          @click="myCharacterId = null; myCharacterName = ''"
        >
          Clear selection
        </button>
      </div>

      <!-- Actions -->
      <div class="flex items-center gap-2 pt-2">
        <button type="submit" class="btn-primary gap-2" :disabled="saving">
          <SaveIcon :size="14" />
          {{ saving ? 'Saving…' : isEdit ? 'Save changes' : 'Create campaign' }}
        </button>
        <RouterLink :to="backTo" class="btn-secondary">Cancel</RouterLink>
      </div>
    </form>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { ArrowLeftIcon, SaveIcon } from 'lucide-vue-next'
import { useCampaignsStore } from '@/campaigns/store'
import { useCharactersStore } from '@/characters/store'
import { useToast } from '@/shared/composables/useToast'

const props = defineProps<{ id?: string }>()

const router = useRouter()
const store = useCampaignsStore()
const characterStore = useCharactersStore()
const toast = useToast()

const isEdit = computed(() => !!props.id)
const backTo = computed(() => (isEdit.value ? `/campaigns/${props.id}` : '/campaigns'))

const name = ref('')
const description = ref('')
const tagsRaw = ref('')
const myCharacterId = ref<string | null>(null)
const myCharacterName = ref('')
const saving = ref(false)
const nameError = ref('')

const parsedTags = computed(() =>
  [...new Set(tagsRaw.value.split(',').map((t) => t.trim()).filter(Boolean))].slice(0, 20),
)

function selectCharacter(id: string) {
  myCharacterId.value = myCharacterId.value === id ? null : id
  if (myCharacterId.value) myCharacterName.value = ''
}

onMounted(async () => {
  if (!store.loaded) await store.load()
  if (characterStore.summaries.length === 0) await characterStore.load()
  if (props.id) {
    const existing = store.getById(props.id)
    if (!existing) {
      toast.error('Campaign not found.')
      router.replace('/campaigns')
      return
    }
    name.value = existing.name
    description.value = existing.description ?? ''
    tagsRaw.value = existing.tags.join(', ')
    myCharacterId.value = existing.myCharacterId
    myCharacterName.value = existing.myCharacterName ?? ''
  }
})

async function onSubmit() {
  nameError.value = ''
  if (!name.value) {
    nameError.value = 'A campaign needs a name.'
    return
  }
  saving.value = true
  const payload = {
    name: name.value,
    description: description.value || undefined,
    tags: parsedTags.value,
    myCharacterId: myCharacterId.value,
    myCharacterName: myCharacterId.value ? undefined : (myCharacterName.value || undefined),
  }
  try {
    if (props.id) {
      await store.update(props.id, payload)
      toast.success('Campaign updated.')
      router.push(`/campaigns/${props.id}`)
    } else {
      const created = await store.create(payload)
      toast.success('Campaign created.')
      router.push(`/campaigns/${created.id}`)
    }
  } catch (e) {
    if (e instanceof Error && e.message.includes('limit')) toast.error(e.message)
  } finally {
    saving.value = false
  }
}
</script>
