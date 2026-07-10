<template>
  <Teleport to="body">
    <Transition name="dialog-fade">
      <div
        v-if="show"
        class="fixed inset-0 z-[60] flex items-center justify-center p-4"
        @keydown.esc="$emit('close')"
      >
        <div class="absolute inset-0 bg-black/60" @click="$emit('close')" />

        <div
          role="dialog"
          aria-modal="true"
          v-focus-trap
          aria-labelledby="custom-subclass-title"
          class="relative w-full max-w-2xl bg-void border border-shadow rounded-lg shadow-2xl overflow-hidden flex flex-col"
          style="max-height: 90vh"
        >
          <div class="h-0.5 w-full bg-arcane-base" />

          <!-- Header -->
          <div class="px-5 py-4 border-b border-shadow flex items-center justify-between shrink-0">
            <div>
              <p id="custom-subclass-title" class="font-heading text-base text-arcane-pale">{{ editId ? 'Edit Custom Subclass' : 'Custom Subclass' }}</p>
              <p class="text-2xs font-body text-mist mt-0.5">A homebrew subclass for any class — features land at the levels you set</p>
            </div>
            <button type="button" class="text-mist hover:text-ash transition-colors" aria-label="Close" @click="$emit('close')">
              <XIcon :size="16" />
            </button>
          </div>

          <!-- Body -->
          <div class="flex-1 overflow-y-auto px-5 py-5 space-y-6">

            <!-- Name -->
            <div class="space-y-1.5">
              <label class="text-2xs font-heading tracking-wide uppercase text-mist">Subclass Name</label>
              <input v-model.trim="form.name" type="text" maxlength="60" placeholder="e.g. Path of the Stormheart" class="input-base w-full text-sm" />
            </div>

            <!-- Parent class -->
            <div class="space-y-1.5">
              <label class="text-2xs font-heading tracking-wide uppercase text-mist">Parent Class</label>
              <AppSelect v-model="form.parentClass" class="text-sm">
                <option value="" disabled>— choose a class —</option>
                <optgroup label="SRD Classes">
                  <option v-for="c in SRD_CLASSES" :key="c.index" :value="c.index">{{ c.name }}</option>
                </optgroup>
                <optgroup v-if="customContent.classes.length" label="My Custom Classes">
                  <option v-for="c in customContent.classes" :key="c.id" :value="c.id">{{ c.name }}</option>
                </optgroup>
              </AppSelect>
              <p class="text-2xs font-body text-mist/60">Your subclass will be offered when this class is chosen in the builder.</p>
            </div>

            <!-- Description -->
            <div class="space-y-1.5">
              <label class="text-2xs font-heading tracking-wide uppercase text-mist">Description <span class="normal-case font-body text-mist/50">(optional)</span></label>
              <textarea v-model="form.description" rows="2" maxlength="1000" placeholder="A short flavor description…" class="input-base w-full text-sm resize-none" />
            </div>

            <!-- Features -->
            <div class="space-y-2">
              <div class="flex items-center justify-between">
                <p class="text-2xs font-heading tracking-wide uppercase text-mist">Features</p>
                <button type="button" class="text-2xs font-heading text-arcane-pale/80 hover:text-arcane-pale transition-all" @click="addFeature">+ Add feature</button>
              </div>
              <div v-if="features.length" class="space-y-2">
                <div
                  v-for="(feat, i) in features"
                  :key="i"
                  class="px-3 py-2.5 rounded border border-shadow/50 bg-depths/20 space-y-2"
                >
                  <div class="flex gap-2 items-center">
                    <div class="flex items-center gap-1.5 shrink-0">
                      <span class="text-2xs font-heading tracking-wide uppercase text-mist">Lvl</span>
                      <input v-model.number="feat.level" type="number" min="1" max="20" class="input-base w-14 text-sm text-center" />
                    </div>
                    <input v-model="feat.name" type="text" maxlength="60" placeholder="Feature name" class="input-base flex-1 text-sm" />
                    <button type="button" class="px-2 text-mist/50 hover:text-blood-mid" aria-label="Remove feature" @click="removeFeature(i)">×</button>
                  </div>
                  <textarea v-model="feat.desc" rows="2" maxlength="600" placeholder="Describe the feature…" class="input-base w-full text-sm resize-none" />
                </div>
              </div>
              <p v-else class="text-2xs font-body text-mist/40 italic">No features yet. Add the subclass's features and the level each is gained.</p>
            </div>
          </div>

          <!-- Footer -->
          <div class="px-5 py-3 border-t border-shadow flex items-center justify-between gap-3 shrink-0">
            <p v-if="!canSave" class="text-2xs font-body text-blood-bright">{{ !form.name.trim() ? 'Name your subclass.' : 'Choose a parent class.' }}</p>
            <span v-else />
            <div class="flex items-center gap-2 shrink-0">
              <button type="button" class="btn-secondary text-sm" @click="$emit('close')">Cancel</button>
              <button type="button" class="btn-primary text-sm" :disabled="!canSave || saving" @click="save">
                {{ saving ? 'Saving…' : (editId ? 'Update subclass' : 'Save to my collection') }}
              </button>
            </div>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup lang="ts">
import { reactive, ref, watch, computed, onMounted } from 'vue'
import { XIcon } from 'lucide-vue-next'
import { useAuthStore } from '@/auth/store'
import { useCustomContentStore } from '@/custom-content/store'
import type { CustomSubclass, CustomSubclassInput } from '@/shared/types/customContent'
import AppSelect from '@/shared/ui/AppSelect.vue'

const props = defineProps<{ show: boolean; editId?: string | null; presetParent?: string | null }>()
const emit = defineEmits<{ close: []; saved: [id: string] }>()

const auth = useAuthStore()
const customContent = useCustomContentStore()
const saving = ref(false)

const SRD_CLASSES = [
  { index: 'barbarian', name: 'Barbarian' }, { index: 'bard', name: 'Bard' },
  { index: 'cleric', name: 'Cleric' }, { index: 'druid', name: 'Druid' },
  { index: 'fighter', name: 'Fighter' }, { index: 'monk', name: 'Monk' },
  { index: 'paladin', name: 'Paladin' }, { index: 'ranger', name: 'Ranger' },
  { index: 'rogue', name: 'Rogue' }, { index: 'sorcerer', name: 'Sorcerer' },
  { index: 'warlock', name: 'Warlock' }, { index: 'wizard', name: 'Wizard' },
]

type FeatureRow = { level: number; name: string; desc: string }

function emptyForm(): { name: string; parentClass: string; description: string } {
  return { name: '', parentClass: props.presetParent ?? '', description: '' }
}
const form = reactive(emptyForm())
const features = ref<FeatureRow[]>([])

const canSave = computed(() => !!form.name.trim() && !!form.parentClass)

function addFeature() { features.value.push({ level: 1, name: '', desc: '' }) }
function removeFeature(i: number) { features.value.splice(i, 1) }

function parentNameFor(value: string): string {
  const srd = SRD_CLASSES.find((c) => c.index === value)
  if (srd) return srd.name
  return customContent.classes.find((c) => c.id === value)?.name ?? ''
}

function loadFrom(sc: CustomSubclass) {
  form.name = sc.name
  form.parentClass = sc.parentClass
  form.description = sc.description ?? ''
  // Flatten featuresByLevel into an editable list, sorted by level.
  features.value = Object.entries(sc.featuresByLevel)
    .flatMap(([lvl, feats]) => feats.map((f) => ({ level: Number(lvl) || 1, name: f.name, desc: f.desc })))
    .sort((a, b) => a.level - b.level)
}
function resetForm() {
  Object.assign(form, emptyForm())
  features.value = []
}

watch(() => props.show, (open) => {
  if (!open) return
  const existing = props.editId ? customContent.getSubclass(props.editId) : null
  if (existing) loadFrom(existing)
  else resetForm()
})

onMounted(() => { if (auth.isAuthenticated && !customContent.loaded) customContent.loadMine() })

async function save() {
  if (saving.value || !canSave.value) return
  saving.value = true
  try {
    // Group the flat feature list back into featuresByLevel.
    const featuresByLevel: Record<string, { name: string; desc: string }[]> = {}
    for (const f of features.value) {
      if (!f.name.trim()) continue
      const key = String(Math.min(20, Math.max(1, Math.round(f.level || 1))))
      ;(featuresByLevel[key] ??= []).push({ name: f.name.trim(), desc: f.desc.trim() })
    }
    const payload: CustomSubclassInput = {
      name: form.name.trim(),
      edition: '2014',
      parentClass: form.parentClass,
      parentClassName: parentNameFor(form.parentClass),
      description: form.description?.trim() || undefined,
      featuresByLevel,
      isPublic: props.editId ? (customContent.getSubclass(props.editId)?.isPublic ?? false) : false,
    }
    if (props.editId) {
      await customContent.updateSubclass(props.editId, payload)
      emit('saved', props.editId)
    } else {
      const created = await customContent.createSubclass(payload)
      if (created) emit('saved', created.id)
    }
    emit('close')
  } finally {
    saving.value = false
  }
}
</script>

<style scoped>
.dialog-fade-enter-active, .dialog-fade-leave-active { transition: opacity 0.15s ease; }
.dialog-fade-enter-from, .dialog-fade-leave-to { opacity: 0; }
</style>
