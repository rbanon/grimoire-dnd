<template>
  <div class="max-w-3xl mx-auto px-6 py-8 space-y-10">

    <!-- Class picker -->
    <section class="space-y-4">
      <div class="rule-gold"><span>Class</span></div>

      <div v-if="classesLoading" class="flex justify-center py-8">
        <GrimoireSpinner label="Loading classes" />
      </div>
      <div v-else-if="classesError" class="text-sm text-blood-bright">Failed to load classes.</div>
      <template v-else>
        <!-- 2014 Classes -->
        <div class="grid grid-cols-2 sm:grid-cols-3 gap-2">
          <PickerCard
            v-for="cls in classes2014"
            :key="`2014:${cls.index}`"
            :name="cls.name"
            :glyph="getClassMeta(cls.index).glyph"
            :flavor="getClassMeta(cls.index).flavor"
            :tags="getClassMeta(cls.index).tags.slice(0, 2)"
            :stats="`d${getClassMeta(cls.index).hitDie}`"
            :selected="builder.draft.classIndex === cls.index && builder.draft.classEdition === '2014'"
            :edition="cls.edition"
            show-info
            @select="selectClass(cls.index, cls.name, cls.edition)"
            @info="infoPanel.open({ kind: 'class', index: cls.index, edition: cls.edition })"
          />
        </div>

        <!-- 2014 / 2024 separator -->
        <div v-if="classes2024.length" class="flex items-center gap-3 py-1">
          <div class="flex-1 h-px bg-shadow/50" />
          <span class="text-2xs font-heading tracking-widest uppercase text-arcane-pale/50">2024 Classes</span>
          <div class="flex-1 h-px bg-shadow/50" />
        </div>

        <!-- 2024 Classes -->
        <div v-if="classes2024.length" class="grid grid-cols-2 sm:grid-cols-3 gap-2">
          <PickerCard
            v-for="cls in classes2024"
            :key="`2024:${cls.index}`"
            :name="cls.name"
            :glyph="getClassMeta(cls.index).glyph"
            :flavor="getClassMeta(cls.index).flavor"
            :tags="getClassMeta(cls.index).tags.slice(0, 2)"
            :stats="`d${getClassMeta(cls.index).hitDie}`"
            :selected="builder.draft.classIndex === cls.index && builder.draft.classEdition === '2024'"
            :edition="cls.edition"
            show-info
            @select="selectClass(cls.index, cls.name, cls.edition)"
            @info="infoPanel.open({ kind: 'class', index: cls.index, edition: cls.edition })"
          />
        </div>

        <!-- Homebrew separator + custom classes -->
        <div class="flex items-center gap-3 py-1">
          <div class="flex-1 h-px bg-shadow/50" />
          <span class="text-2xs font-heading tracking-widest uppercase text-arcane-pale/50">Homebrew</span>
          <div class="flex-1 h-px bg-shadow/50" />
        </div>
        <div class="grid grid-cols-2 sm:grid-cols-3 gap-2">
          <PickerCard
            v-for="cls in customContent.classes"
            :key="`custom:${cls.id}`"
            :name="cls.name"
            glyph="✦"
            :flavor="cls.description || 'Homebrew class'"
            :tags="cls.spellcasting ? ['Spellcaster'] : []"
            :stats="`d${cls.hitDie}`"
            :selected="isCustomClass && builder.draft.customClassDef?.id === cls.id"
            :edition="cls.edition"
            @select="applyCustomClass(cls)"
          />
          <div
            v-if="auth.isAuthenticated"
            class="flex items-center rounded border border-shadow border-dashed bg-abyss text-mist hover:border-arcane-base/30 hover:text-ash hover:bg-depths text-sm font-heading tracking-wide transition-all duration-150 cursor-pointer"
            @click="openClassEditor(null)"
          >
            <span class="flex-1 px-4 py-3 text-left flex items-center gap-2">
              <PencilIcon :size="12" class="shrink-0 opacity-60" />
              Custom Class
            </span>
          </div>
        </div>
        <p v-if="!auth.isAuthenticated" class="text-2xs font-body text-mist/50 italic">
          Sign in to create and use custom classes.
        </p>
      </template>

      <p v-if="showValidation && !builder.draft.classIndex" class="text-xs font-body text-blood-bright">
        Selecciona una clase para continuar.
      </p>

      <!-- Class detail panel -->
      <Transition name="fade">
        <div
          v-if="builder.draft.classIndex"
          class="card p-5 border-gold-dim/20"
          style="background: linear-gradient(135deg, rgba(212,168,67,0.04) 0%, transparent 60%)"
        >
          <div class="flex items-start gap-4 flex-wrap">
            <div class="text-3xl leading-none">{{ classDisplay.glyph }}</div>
            <div class="flex-1 min-w-0">
              <div class="flex items-center gap-2">
                <p class="font-heading text-lg text-vellum">{{ builder.draft.className }}</p>
                <span v-if="isCustomClass" class="text-2xs font-heading tracking-wide uppercase text-arcane-pale/70 px-1.5 py-0.5 rounded border border-arcane-base/30">Homebrew</span>
                <button
                  v-if="isCustomClass && builder.draft.customClassDef"
                  type="button"
                  class="text-2xs font-heading text-arcane-pale/70 hover:text-arcane-pale transition-colors"
                  @click="openClassEditor(builder.draft.customClassDef.id)"
                >Edit</button>
              </div>
              <p class="font-body text-sm text-ash mt-0.5">{{ classDisplay.flavor }}</p>
              <div class="flex gap-4 mt-3 text-xs font-heading text-mist flex-wrap">
                <span>Hit Die: <span class="text-gold-mid">d{{ builder.draft.classHitDie }}</span></span>
                <span>Primary: <span class="text-stone">{{ classDisplay.primary }}</span></span>
                <span>Saves: <span class="text-stone">{{ classDisplay.saves }}</span></span>
                <span v-if="builder.isSpellcaster" class="text-arcane-pale">✶ Spellcaster</span>
              </div>
            </div>
          </div>
        </div>
      </Transition>

      <!-- Subclass picker -->
      <Transition name="expand">
        <div v-if="builder.draft.classIndex && (subclassOptions.length > 0 || auth.isAuthenticated)" class="space-y-2">
          <div class="flex items-center justify-between gap-2">
            <div class="flex items-center gap-2">
              <label class="label mb-0">Subclass</label>
              <span v-if="builder.draft.level < 3" class="text-2xs font-body text-mist/60">(unlocks at level 3, set in Step II)</span>
            </div>
            <button
              v-if="auth.isAuthenticated"
              type="button"
              class="shrink-0 text-2xs font-heading text-arcane-pale/80 hover:text-arcane-pale transition-colors"
              @click="openNewSubclass"
            >+ Custom subclass</button>
          </div>
          <div v-if="subclassOptions.length" class="flex flex-wrap gap-2">
            <button
              v-for="sub in subclassOptions"
              :key="sub.index"
              type="button"
              class="px-3 py-1.5 rounded text-sm font-heading tracking-wide border transition-all duration-150"
              :class="subclassButtonClass(sub.index)"
              @click="toggleSubclass(sub.index, sub.name)"
            >
              {{ sub.name }}<span v-if="sub.index.startsWith('custom:')" class="text-2xs text-arcane-pale/50 ml-1">homebrew</span>
            </button>
          </div>
          <p v-else class="text-xs font-body text-mist/50 italic">No subclasses for this class yet, create one above.</p>
          <p v-if="showValidation && builder.draft.availableSubclasses.length > 0 && !builder.draft.subclassIndex" class="text-xs font-body text-blood-bright">
            Select a subclass to continue.
          </p>

          <!-- Subclass detail -->
          <Transition name="fade">
            <div v-if="builder.draft.subclassIndex" class="mt-2 space-y-2">
              <!-- Custom (homebrew) subclass: its authored features -->
              <template v-if="builder.draft.customSubclassDef">
                <p v-if="builder.draft.customSubclassDef.description" class="text-xs font-body text-ash leading-relaxed">
                  {{ builder.draft.customSubclassDef.description }}
                </p>
                <div v-for="(feats, lvl) in builder.draft.customSubclassDef.featuresByLevel" :key="lvl" class="space-y-1">
                  <p class="text-2xs font-heading text-mist/60 uppercase tracking-wide">Level {{ lvl }}</p>
                  <div v-for="(f, i) in feats" :key="i" class="px-3 py-2 rounded border border-shadow/50 bg-depths/20">
                    <p class="text-sm font-heading text-vellum">{{ f.name }}</p>
                    <p v-if="f.desc" class="text-xs font-body text-ash leading-relaxed">{{ f.desc }}</p>
                  </div>
                </div>
              </template>
              <!-- SRD subclass detail (from the API) -->
              <template v-else>
                <div v-if="subclassDetailLoading" class="flex justify-center py-3">
                  <GrimoireSpinner />
                </div>
                <template v-else-if="subclassDetail">
                  <p class="text-2xs font-heading text-mist/60 uppercase tracking-wide">{{ subclassDetail.subclass_flavor }}</p>
                  <p
                    v-for="(para, i) in subclassDetail.desc"
                    :key="i"
                    class="text-xs font-body text-ash leading-relaxed"
                  >{{ para }}</p>
                </template>
              </template>
            </div>
          </Transition>

          <!-- Druid Circle of the Land, land-type choice -->
          <Transition name="expand">
            <div v-if="isDruidLand" class="mt-3 space-y-2">
              <div class="flex items-center gap-2">
                <label class="label mb-0">Land Type</label>
                <span class="text-2xs font-body text-mist/60">determines your Circle Spells</span>
              </div>
              <div class="flex flex-wrap gap-2">
                <button
                  v-for="opt in landTypeOptions"
                  :key="opt.value"
                  type="button"
                  class="px-3 py-1.5 rounded text-sm font-heading tracking-wide border transition-all duration-150"
                  :class="builder.draft.druidLandType === opt.value
                    ? 'border-gold-mid/60 bg-gold-dim/15 text-gold-deep'
                    : 'border-gold-dim/25 bg-depths text-stone hover:border-gold-dim/50 hover:text-vellum hover:bg-gold-dim/5'"
                  @click="builder.draft.druidLandType = opt.value"
                >{{ opt.label }}</button>
              </div>
              <p v-if="showValidation && !builder.draft.druidLandType" class="text-xs font-body text-blood-bright">
                Choose a land type to continue.
              </p>
            </div>
          </Transition>
        </div>
      </Transition>
    </section>

    <div class="h-4" />

    <CustomClassModal :show="showClassEditor" :edit-id="editClassId" @close="showClassEditor = false" @saved="onClassSaved" />
    <CustomSubclassModal
      :show="showSubclassEditor"
      :edit-id="null"
      :preset-parent="parentClassKey"
      @close="showSubclassEditor = false"
      @saved="onSubclassSaved"
    />
  </div>
</template>

<script setup lang="ts">
import { computed, ref, watch, onMounted } from 'vue'
import { useQuery } from '@tanstack/vue-query'
import { PencilIcon } from 'lucide-vue-next'
import { useBuilderStore } from '@/character-builder/builderStore'
import { getClassMeta, parseSubclassSpells } from '@/character-builder/classMeta'
import { fiveEApi } from '@/shared/api/fiveE.client'
import { useInfoPanel } from '@/shared/composables/useInfoPanel'
import { useBuilderValidation } from '@/shared/composables/useBuilderValidation'
import { useAuthStore } from '@/auth/store'
import { useCustomContentStore } from '@/custom-content/store'
import type { ApiClass, ApiProfChoiceOption, ApiSubclass } from '@/shared/types/api'
import type { EditionTag } from '@/shared/types/api'
import type { CustomClass } from '@/shared/types/customContent'
import PickerCard from '@/character-builder/components/PickerCard.vue'
import GrimoireSpinner from '@/character-builder/components/GrimoireSpinner.vue'
import CustomClassModal from '@/custom-content/components/CustomClassModal.vue'
import CustomSubclassModal from '@/custom-content/components/CustomSubclassModal.vue'

const builder = useBuilderStore()
const infoPanel = useInfoPanel()
const { showValidation } = useBuilderValidation()
const auth = useAuthStore()
const customContent = useCustomContentStore()

onMounted(() => { if (auth.isAuthenticated && !customContent.loaded) customContent.loadMine() })

// ── Custom (homebrew) class ─────────────────────────────────────────────────────
const isCustomClass = computed(() => builder.draft.classIndex === 'custom')

// Display fields for the detail panel: custom classes aren't in CLASS_META, so read the
// applied definition; SRD classes fall back to the metadata table.
const classDisplay = computed(() => {
  if (isCustomClass.value && builder.draft.customClassDef) {
    const c = builder.draft.customClassDef
    return {
      glyph: '✦',
      flavor: c.description || 'Homebrew class',
      primary: c.primaryAbility || '-',
      saves: c.saves.map(s => s.toUpperCase()).join(' · ') || '-',
    }
  }
  const m = getClassMeta(builder.draft.classIndex)
  return { glyph: m.glyph, flavor: m.flavor, primary: m.primaryAbility, saves: m.saves }
})

function applyCustomClass(cls: CustomClass) {
  const d = builder.draft
  d.classIndex = 'custom'          // fires the classIndex watcher (resets spell/level state)
  d.classEdition = cls.edition
  d.customClassDef = cls           // fires the registry watcher (spell profile)
  d.className = cls.name
  d.classHitDie = cls.hitDie
  d.classSpellcastingAbility = cls.spellcasting?.ability ?? null
  d.classSkillChoices = cls.skillChoices
  d.classSkillOptions = [...cls.skillOptions]
  d.selectedSkills = []
  d.subclassIndex = ''
  d.subclassName = ''
  d.availableSubclasses = []
  d.subclassSpells = []
  // Re-applying custom→custom leaves classIndex unchanged (watcher won't fire), so clear picks here.
  d.selectedCantrips = []
  d.selectedSpells = []
  d.selectedPreparedSpells = []
  d.spellsByLevel = {}
  d.tomeCantrips = []
  d.selectedInvocations = []
}

const showClassEditor = ref(false)
const editClassId = ref<string | null>(null)
function openClassEditor(id: string | null) { editClassId.value = id; showClassEditor.value = true }
function onClassSaved(id: string) {
  const cls = customContent.getClass(id)
  if (cls) applyCustomClass(cls)
}

const { data: classList2014, isPending: classesLoading2014, isError: classesError2014 } = useQuery({
  queryKey: ['classes-2014'],
  queryFn: () => fiveEApi.listClasses(),
  staleTime: Infinity,
})
const { data: classList2024, isPending: classesLoading2024 } = useQuery({
  queryKey: ['classes-2024'],
  queryFn: () => fiveEApi.listClasses2024(),
  staleTime: Infinity,
})

const classesLoading = computed(() => classesLoading2014.value || classesLoading2024.value)
const classesError   = computed(() => classesError2014.value)

const classes2014 = computed(() =>
  (classList2014.value?.results ?? []).map(c => ({ ...c, edition: '2014' as EditionTag }))
)
const classes2024 = computed(() =>
  (classList2024.value?.results ?? []).map(c => ({ ...c, edition: '2024' as EditionTag }))
)

// Selected class edition (tracked separately from index since same index exists in both)
const selectedEdition = computed(() => builder.draft.classEdition ?? '2014')

const subclassIndex = computed(() => builder.draft.subclassIndex)
const { data: subclassDetail, isPending: subclassDetailLoading } = useQuery({
  queryKey: computed(() => ['subclass-detail', subclassIndex.value, selectedEdition.value]),
  queryFn: () => selectedEdition.value === '2024'
    ? fiveEApi.getSubclass2024(subclassIndex.value) as Promise<ApiSubclass>
    : fiveEApi.getSubclass(subclassIndex.value) as Promise<ApiSubclass>,
  staleTime: Infinity,
  // Custom subclasses aren't in the SRD API, their detail comes from customSubclassDef.
  enabled: computed(() => !!subclassIndex.value && !subclassIndex.value.startsWith('custom:')),
})

// ── Custom (homebrew) subclasses ─────────────────────────────────────────────────
// A subclass's parent is an SRD class index, or a custom class's id.
const parentClassKey = computed(() =>
  isCustomClass.value ? (builder.draft.customClassDef?.id ?? '') : builder.draft.classIndex,
)
const customSubclasses = computed(() =>
  parentClassKey.value ? customContent.subclassesForParent(parentClassKey.value) : [],
)
// SRD subclasses (from the API, in the draft) + the user's custom ones for this parent.
const subclassOptions = computed(() => [
  ...builder.draft.availableSubclasses,
  ...customSubclasses.value.map(sc => ({ index: `custom:${sc.id}`, name: sc.name })),
])

function subclassButtonClass(index: string): string {
  const selected = builder.draft.subclassIndex === index
  const custom = index.startsWith('custom:')
  if (selected) {
    return custom
      ? 'border-arcane-base bg-arcane-base/25 text-arcane-pale'
      : 'border-gold-mid/60 bg-gold-dim/15 text-gold-deep'
  }
  return custom
    ? 'border-arcane-base/30 bg-depths text-stone hover:border-arcane-base/50 hover:text-arcane-pale'
    : 'border-gold-dim/25 bg-depths text-stone hover:border-gold-dim/50 hover:text-vellum hover:bg-gold-dim/5'
}

const showSubclassEditor = ref(false)
function openNewSubclass() { showSubclassEditor.value = true }
function onSubclassSaved(id: string) {
  const sc = customContent.getSubclass(id)
  if (sc) selectSubclass(`custom:${sc.id}`, sc.name)
}

async function selectClass(index: string, name: string, edition: EditionTag) {
  builder.draft.classIndex = index
  builder.draft.className = name
  builder.draft.classEdition = edition
  builder.draft.subclassIndex = ''
  builder.draft.subclassName = ''
  builder.draft.availableSubclasses = []

  const meta = getClassMeta(index)
  builder.draft.classHitDie = meta.hitDie
  builder.draft.selectedSkills = []

  try {
    const detail: ApiClass = edition === '2024'
      ? await fiveEApi.getClass2024(index)
      : await fiveEApi.getClass(index)
    builder.draft.classSpellcastingAbility = detail.spellcasting?.spellcasting_ability?.index ?? null
    builder.draft.availableSubclasses = detail.subclasses.map(s => ({ index: s.index, name: s.name }))

    const skillChoice = detail.proficiency_choices?.find(c =>
      c.from.options.some((o: ApiProfChoiceOption) => o.item?.index?.startsWith('skill-'))
    )
    builder.draft.classSkillChoices = skillChoice?.choose ?? 2
    builder.draft.classSkillOptions = skillChoice
      ? skillChoice.from.options
          .filter((o: ApiProfChoiceOption) => o.item?.index?.startsWith('skill-'))
          .map((o: ApiProfChoiceOption) => o.item.index.replace(/^skill-/, ''))
      : []
  } catch { /* ignore */ }
}

// Druid Circle of the Land: spells are gated by a chosen land type (feature prereq).
const isDruidLand = computed(() =>
  builder.draft.classIndex === 'druid' && builder.draft.subclassSpells.some(s => s.feature),
)
const landTypeOptions = computed(() => {
  const feats = [...new Set(builder.draft.subclassSpells.map(s => s.feature).filter(Boolean) as string[])]
  return feats
    .map(f => ({ value: f, label: f.replace(/^Circle of the Land:\s*/i, '') }))
    .sort((a, b) => a.label.localeCompare(b.label))
})

function clearSubclass() {
  builder.draft.subclassIndex = ''
  builder.draft.subclassName = ''
  builder.draft.subclassSpells = []
  builder.draft.druidLandType = ''
  builder.draft.customSubclassDef = null
}

function selectSubclass(index: string, name: string) {
  builder.draft.subclassIndex = index
  builder.draft.subclassName = name
  if (index.startsWith('custom:')) {
    // Homebrew subclass: features come from the stored definition; no SRD spell grants.
    builder.draft.customSubclassDef = customContent.getSubclass(index.slice('custom:'.length)) ?? null
    builder.draft.subclassSpells = []
    builder.draft.druidLandType = ''
  } else {
    builder.draft.customSubclassDef = null
  }
}

function toggleSubclass(index: string, name: string) {
  if (builder.draft.subclassIndex === index) clearSubclass()
  else selectSubclass(index, name)
}

// Capture subclass-granted spells (2014 spellcasting subclasses) into the draft.
// Each entry keeps the unlock level (class level) and, for Druid Circle of the Land,
// the land-type feature gate. Actual spell levels are resolved later (build / pickers).
watch(subclassDetail, (detail) => {
  if (!builder.draft.subclassIndex || detail?.index !== builder.draft.subclassIndex) return
  builder.draft.subclassSpells = parseSubclassSpells(detail.spells)
  // Drop a stale land-type pick if it's no longer offered
  const features = new Set(builder.draft.subclassSpells.map(s => s.feature).filter(Boolean) as string[])
  if (builder.draft.druidLandType && !features.has(builder.draft.druidLandType)) {
    builder.draft.druidLandType = ''
  }
}, { immediate: true })
</script>

<style scoped>
.fade-enter-active, .fade-leave-active { transition: all 0.2s ease; }
.fade-enter-from, .fade-leave-to { opacity: 0; transform: translateY(4px); }

.expand-enter-active, .expand-leave-active { transition: all 0.25s ease; overflow: hidden; }
.expand-enter-from, .expand-leave-to { opacity: 0; max-height: 0; }
.expand-enter-to, .expand-leave-from { max-height: 400px; }
</style>
