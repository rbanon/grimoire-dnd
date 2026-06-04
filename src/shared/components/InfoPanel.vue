<template>
  <Teleport to="body">
    <!-- Backdrop -->
    <Transition name="ip-fade">
      <div
        v-if="panel.target.value"
        class="fixed inset-0 z-[59] bg-black/40"
        aria-hidden="true"
        @click="panel.close()"
      />
    </Transition>
    <!-- Drawer -->
    <Transition name="ip-slide">
      <aside
        v-if="panel.target.value"
        class="fixed top-0 right-0 h-full w-full sm:w-[440px] z-[60] flex flex-col bg-void border-l border-shadow overflow-hidden"
      >
        <!-- Header -->
        <header class="flex flex-col px-5 py-4 border-b border-shadow shrink-0 bg-abyss/50 gap-1">
          <div class="flex items-center gap-3">
            <button type="button" class="btn-icon shrink-0" aria-label="Close panel" @click="panel.close()">
              <XIcon :size="16" />
            </button>
            <div class="flex items-center gap-2 min-w-0 flex-1">
              <span class="text-xl leading-none shrink-0">{{ entityGlyph }}</span>
              <h2 class="font-heading text-base text-vellum truncate">{{ entityName }}</h2>
            </div>
            <span v-if="kindBadge" class="badge-arcane text-2xs shrink-0 capitalize">{{ kindBadge }}</span>
          </div>
        </header>

        <!-- Body -->
          <div class="flex-1 overflow-y-auto px-5 py-5 space-y-5">
          <div v-if="isLoading" class="flex justify-center py-20">
            <GrimoireSpinner />
          </div>
          <p v-else-if="isError" class="text-center py-20 text-blood-bright text-sm font-body">
            Could not load details.
          </p>

          <!-- Race -->
          <template v-else-if="panel.target.value?.kind === 'race' && raceData">
            <div class="flex flex-wrap gap-2">
              <span class="badge-gold text-xs">Speed {{ raceData.speed }} ft.</span>
              <span class="badge-gold text-xs">Size {{ raceData.size }}</span>
            </div>
            <div v-if="raceData.ability_bonuses.length" class="space-y-1.5">
              <p class="label">Ability Score Bonuses</p>
              <div class="flex flex-wrap gap-1.5">
                <span
                  v-for="ab in raceData.ability_bonuses"
                  :key="ab.ability_score.index"
                  class="px-2 py-0.5 rounded text-xs font-heading text-gold-deep bg-gold-dim/15 border border-gold-dim/30"
                >{{ ab.ability_score.name.slice(0, 3).toUpperCase() }} +{{ ab.bonus }}</span>
              </div>
            </div>
            <div v-if="raceData.age" class="space-y-1">
              <p class="label">Age</p>
              <p class="text-sm font-body text-ash leading-relaxed">{{ raceData.age }}</p>
            </div>
            <div v-if="raceData.size_description" class="space-y-1">
              <p class="label">Size</p>
              <p class="text-sm font-body text-ash leading-relaxed">{{ raceData.size_description }}</p>
            </div>
            <div v-if="raceData.alignment" class="space-y-1">
              <p class="label">Alignment</p>
              <p class="text-sm font-body text-ash leading-relaxed">{{ raceData.alignment }}</p>
            </div>
            <div v-if="raceData.traits.length" class="space-y-1.5">
              <p class="label">Racial Traits</p>
              <div class="flex flex-wrap gap-1.5">
                <span
                  v-for="t in raceData.traits"
                  :key="t.index"
                  class="px-2 py-0.5 rounded text-xs font-body text-stone bg-depths/60 border border-shadow"
                >{{ t.name }}</span>
              </div>
            </div>
            <div v-if="raceData.languages.length" class="space-y-1.5">
              <p class="label">Languages</p>
              <div class="flex flex-wrap gap-1.5">
                <span
                  v-for="l in raceData.languages"
                  :key="l.index"
                  class="px-2 py-0.5 rounded text-xs font-body text-mist bg-depths/40 border border-shadow"
                >{{ l.name }}</span>
              </div>
            </div>
            <p v-if="raceData.language_desc" class="text-xs font-body text-mist italic leading-relaxed">
              {{ raceData.language_desc }}
            </p>
          </template>

          <!-- Class -->
          <template v-else-if="panel.target.value?.kind === 'class' && classData">
            <div class="flex flex-wrap gap-2">
              <span class="badge-gold text-xs">Hit Die d{{ classData.hit_die }}</span>
              <span
                v-for="st in classData.saving_throws"
                :key="st.index"
                class="px-2 py-0.5 rounded text-xs font-heading text-stone bg-depths/60 border border-shadow"
              >{{ st.name }} Save</span>
            </div>
            <div v-if="classData.proficiencies.length" class="space-y-1.5">
              <p class="label">Proficiencies</p>
              <div class="flex flex-wrap gap-1.5">
                <span
                  v-for="p in classData.proficiencies"
                  :key="p.index"
                  class="px-2 py-0.5 rounded text-xs font-body text-stone bg-depths/60 border border-shadow"
                >{{ p.name }}</span>
              </div>
            </div>
            <div v-if="classData.spellcasting" class="space-y-2">
              <p class="label">Spellcasting</p>
              <div class="card p-3 border-arcane-base/20 bg-arcane-deep/10 space-y-2">
                <p class="text-xs font-heading text-arcane-pale">
                  Ability: {{ classData.spellcasting.spellcasting_ability.name }}
                </p>
                <div
                  v-for="info in classData.spellcasting.info.slice(0, 3)"
                  :key="info.name"
                  class="space-y-0.5"
                >
                  <p class="text-xs font-heading text-stone">{{ info.name }}</p>
                  <p class="text-xs font-body text-mist leading-relaxed">{{ info.desc[0] }}</p>
                </div>
              </div>
            </div>
            <div v-if="classData.subclasses.length" class="space-y-1.5">
              <p class="label">Subclasses</p>
              <div class="flex flex-wrap gap-1.5">
                <span
                  v-for="sc in classData.subclasses"
                  :key="sc.index"
                  class="px-2 py-0.5 rounded text-xs font-body text-mist bg-depths/40 border border-shadow"
                >{{ sc.name }}</span>
              </div>
            </div>
          </template>

          <!-- Background -->
          <template v-else-if="panel.target.value?.kind === 'background' && bgData">
            <div v-if="bgData.starting_proficiencies.length" class="space-y-1.5">
              <p class="label">Skill Proficiencies</p>
              <div class="flex flex-wrap gap-1.5">
                <span
                  v-for="p in bgData.starting_proficiencies"
                  :key="p.index"
                  class="badge-gold text-xs"
                >{{ p.name }}</span>
              </div>
            </div>
            <div v-if="bgData.feature" class="space-y-1.5">
              <p class="label">Feature: {{ bgData.feature.name }}</p>
              <p
                v-for="(para, i) in bgData.feature.desc"
                :key="i"
                class="text-sm font-body text-ash leading-relaxed"
              >{{ para }}</p>
            </div>
            <div v-if="bgData.starting_equipment.length" class="space-y-1.5">
              <p class="label">Starting Equipment</p>
              <div class="flex flex-wrap gap-1.5">
                <span
                  v-for="e in bgData.starting_equipment"
                  :key="e.equipment.index"
                  class="px-2 py-0.5 rounded text-xs font-body text-stone bg-depths/60 border border-shadow"
                >{{ e.quantity > 1 ? `${e.quantity}× ` : '' }}{{ e.equipment.name }}</span>
              </div>
            </div>
          </template>

          <!-- Spell -->
          <template v-else-if="panel.target.value?.kind === 'spell' && spellData">
            <div class="flex flex-wrap gap-2">
              <span class="badge-arcane text-xs">{{ spellData.level === 0 ? 'Cantrip' : `Level ${spellData.level}` }}</span>
              <span class="px-2 py-0.5 rounded text-xs font-heading text-mist bg-depths/60 border border-shadow">
                {{ spellData.school.name }}
              </span>
              <span v-if="spellData.ritual" class="px-2 py-0.5 rounded text-xs font-heading text-stone bg-depths/60 border border-shadow">Ritual</span>
              <span v-if="spellData.concentration" class="px-2 py-0.5 rounded text-xs font-heading text-stone bg-depths/60 border border-shadow">Concentration</span>
            </div>
            <div class="grid grid-cols-2 gap-2">
              <div class="card p-2.5 space-y-0.5">
                <p class="text-2xs font-heading tracking-wide text-mist uppercase">Casting Time</p>
                <p class="text-sm font-body text-stone">{{ spellData.casting_time }}</p>
              </div>
              <div class="card p-2.5 space-y-0.5">
                <p class="text-2xs font-heading tracking-wide text-mist uppercase">Range</p>
                <p class="text-sm font-body text-stone">{{ spellData.range }}</p>
              </div>
              <div class="card p-2.5 space-y-0.5">
                <p class="text-2xs font-heading tracking-wide text-mist uppercase">Duration</p>
                <p class="text-sm font-body text-stone">{{ spellData.duration }}</p>
              </div>
              <div class="card p-2.5 space-y-0.5">
                <p class="text-2xs font-heading tracking-wide text-mist uppercase">Components</p>
                <p class="text-sm font-body text-stone">{{ spellData.components.join(', ') }}</p>
              </div>
            </div>
            <p v-if="spellData.material" class="text-xs font-body text-mist italic">
              Material: {{ spellData.material }}
            </p>
            <p
              v-for="(para, i) in spellData.desc"
              :key="i"
              class="text-sm font-body text-ash leading-relaxed"
            >{{ para }}</p>
            <div v-if="spellData.higher_level?.length" class="space-y-1">
              <p class="label">At Higher Levels</p>
              <p
                v-for="(para, i) in spellData.higher_level"
                :key="i"
                class="text-sm font-body text-ash leading-relaxed"
              >{{ para }}</p>
            </div>
            <div v-if="spellData.classes.length" class="space-y-1.5">
              <p class="label">Available To</p>
              <div class="flex flex-wrap gap-1.5">
                <span
                  v-for="c in spellData.classes"
                  :key="c.index"
                  class="px-2 py-0.5 rounded text-xs font-body text-mist bg-depths/40 border border-shadow"
                >{{ c.name }}</span>
              </div>
            </div>
          </template>

          <!-- Skill -->
          <template v-else-if="panel.target.value?.kind === 'skill' && skillData">
            <div class="flex flex-wrap gap-2">
              <span class="badge-gold text-xs">{{ skillData.ability_score.name }}</span>
            </div>
            <p
              v-for="(para, i) in skillData.desc"
              :key="i"
              class="text-sm font-body text-ash leading-relaxed"
            >{{ para }}</p>
          </template>

          <!-- Item -->
          <template v-else-if="panel.target.value?.kind === 'item' && itemData">
            <div class="flex flex-wrap gap-2">
              <span class="badge-gold text-xs">{{ itemData.equipment_category.name }}</span>
              <span v-if="itemData.weapon_category" class="px-2 py-0.5 rounded text-xs font-heading text-stone bg-depths/60 border border-shadow capitalize">
                {{ itemData.weapon_category }}
              </span>
              <span v-if="itemData.armor_category" class="px-2 py-0.5 rounded text-xs font-heading text-stone bg-depths/60 border border-shadow">
                {{ itemData.armor_category }}
              </span>
              <span v-if="itemData.tool_category" class="px-2 py-0.5 rounded text-xs font-heading text-stone bg-depths/60 border border-shadow">
                {{ itemData.tool_category }}
              </span>
            </div>

            <div class="grid grid-cols-2 gap-2">
              <div v-if="itemData.cost" class="card p-2.5 space-y-0.5">
                <p class="text-2xs font-heading tracking-wide text-mist uppercase">Cost</p>
                <p class="text-sm font-body text-stone">{{ itemData.cost.quantity }} {{ itemData.cost.unit }}</p>
              </div>
              <div v-if="itemData.weight !== undefined" class="card p-2.5 space-y-0.5">
                <p class="text-2xs font-heading tracking-wide text-mist uppercase">Weight</p>
                <p class="text-sm font-body text-stone">{{ itemData.weight }} lb</p>
              </div>
            </div>

            <div v-if="itemData.damage" class="card p-3 space-y-1 border-blood-base/20 bg-blood-deep/10">
              <p class="text-2xs font-heading tracking-wide text-mist uppercase">Damage</p>
              <p class="text-xl font-heading text-vellum">{{ itemData.damage.damage_dice }}</p>
              <p class="text-xs font-body text-stone">{{ itemData.damage.damage_type.name }}</p>
            </div>

            <div v-if="itemData.two_handed_damage" class="card p-2.5 space-y-0.5">
              <p class="text-2xs font-heading tracking-wide text-mist uppercase">Two-Handed</p>
              <p class="text-sm font-body text-stone">
                {{ itemData.two_handed_damage.damage_dice }} {{ itemData.two_handed_damage.damage_type.name }}
              </p>
            </div>

            <div v-if="itemData.range || itemData.throw_range" class="grid grid-cols-2 gap-2">
              <div v-if="itemData.range" class="card p-2.5 space-y-0.5">
                <p class="text-2xs font-heading tracking-wide text-mist uppercase">Range</p>
                <p class="text-sm font-body text-stone">
                  {{ itemData.range.normal }}{{ itemData.range.long ? ` / ${itemData.range.long}` : '' }} ft.
                </p>
              </div>
              <div v-if="itemData.throw_range" class="card p-2.5 space-y-0.5">
                <p class="text-2xs font-heading tracking-wide text-mist uppercase">Throw</p>
                <p class="text-sm font-body text-stone">{{ itemData.throw_range.normal }} / {{ itemData.throw_range.long }} ft.</p>
              </div>
            </div>

            <div v-if="itemData.armor_class" class="card p-3 space-y-1">
              <p class="text-2xs font-heading tracking-wide text-mist uppercase">Armor Class</p>
              <p class="text-xl font-heading text-vellum">{{ itemData.armor_class.base }}</p>
              <p v-if="itemData.armor_class.dex_bonus" class="text-xs font-body text-stone">
                + Dex modifier{{ itemData.armor_class.max_bonus ? ` (max ${itemData.armor_class.max_bonus})` : '' }}
              </p>
              <p v-if="itemData.str_minimum" class="text-xs font-body text-mist">Requires Str {{ itemData.str_minimum }}</p>
              <p v-if="itemData.stealth_disadvantage" class="text-xs text-blood-pale">Stealth disadvantage</p>
            </div>

            <div v-if="itemData.properties?.length" class="space-y-1.5">
              <p class="label">Properties</p>
              <div class="flex flex-wrap gap-1.5">
                <span
                  v-for="prop in itemData.properties"
                  :key="prop.index"
                  class="px-2 py-0.5 rounded text-xs font-body text-stone bg-depths/60 border border-shadow"
                >{{ prop.name }}</span>
              </div>
            </div>

            <div v-if="itemData.contents?.length" class="space-y-1.5">
              <p class="label">Contents</p>
              <div class="space-y-1">
                <div
                  v-for="c in itemData.contents"
                  :key="c.item.index"
                  class="flex items-center justify-between text-xs"
                >
                  <span class="font-body text-stone">{{ c.item.name }}</span>
                  <span class="text-mist">×{{ c.quantity }}</span>
                </div>
              </div>
            </div>

            <p v-if="itemData.capacity" class="text-sm font-body text-ash leading-relaxed">
              Capacity: {{ itemData.capacity }}
            </p>

            <p
              v-for="(note, i) in itemData.special"
              :key="i"
              class="text-sm font-body text-ash leading-relaxed italic"
            >{{ note }}</p>
          </template>

          <!-- Feature -->
          <template v-else-if="panel.target.value?.kind === 'feature' && featureData">
            <div class="flex flex-wrap gap-2">
              <span class="badge-gold text-xs">Level {{ featureData.level }}</span>
              <span class="px-2 py-0.5 rounded text-xs font-heading text-stone bg-depths/60 border border-shadow capitalize">
                {{ featureData.class.name }}
              </span>
              <span v-if="featureData.subclass" class="px-2 py-0.5 rounded text-xs font-heading text-mist bg-depths/40 border border-shadow">
                {{ featureData.subclass.name }}
              </span>
            </div>
            <p
              v-for="(para, i) in featureData.desc"
              :key="i"
              class="text-sm font-body text-ash leading-relaxed"
            >{{ para }}</p>
          </template>

          <!-- Alignment -->
          <template v-else-if="panel.target.value?.kind === 'alignment' && alignmentInfo">
            <p class="text-xs font-heading tracking-widest text-mist uppercase">{{ alignmentInfo.nickname }}</p>
            <p
              v-for="(para, i) in alignmentInfo.paragraphs"
              :key="i"
              class="text-sm font-body text-ash leading-relaxed"
            >{{ para }}</p>
          </template>

          <!-- Exhaustion -->
          <template v-else-if="panel.target.value?.kind === 'exhaustion'">
            <p class="text-sm font-body text-ash leading-relaxed">
              Exhaustion is measured in six levels. An effect can give a creature one or more levels. If an exhausted creature suffers another effect that causes exhaustion, its current level of exhaustion increases by the amount specified.
            </p>
            <div class="space-y-1.5">
              <p class="label">Effects by Level</p>
              <div class="divide-y divide-shadow/40 rounded border border-shadow overflow-hidden">
                <div
                  v-for="row in EXHAUSTION_LEVELS"
                  :key="row.level"
                  class="flex items-start gap-3 px-3 py-2.5"
                  :class="row.level === 6 ? 'bg-blood-deep/15' : ''"
                >
                  <span class="font-heading text-sm shrink-0 w-4 text-center" :class="row.level === 6 ? 'text-blood-bright' : 'text-gold-dim'">{{ row.level }}</span>
                  <span class="text-sm font-body text-ash">{{ row.effect }}</span>
                </div>
              </div>
            </div>
            <p class="text-xs font-body text-mist italic leading-relaxed">
              A creature's exhaustion level is reduced by 1 after finishing a long rest, provided it has also ingested food and drink.
            </p>
          </template>
        </div>
      </aside>
    </Transition>
  </Teleport>
</template>

<script setup lang="ts">
import { computed, onMounted, onUnmounted } from 'vue'
import { useQuery } from '@tanstack/vue-query'
import { XIcon } from 'lucide-vue-next'
import { useInfoPanel } from '@/shared/composables/useInfoPanel'
import { fiveEApi } from '@/shared/api/fiveE.client'
import { getClassMeta, getRaceMeta } from '@/character-builder/classMeta'
import GrimoireSpinner from '@/character-builder/components/GrimoireSpinner.vue'

const panel = useInfoPanel()

function onKeydown(e: KeyboardEvent) {
  if (e.key === 'Escape' && panel.target.value) panel.close()
}
onMounted(() => window.addEventListener('keydown', onKeydown))
onUnmounted(() => window.removeEventListener('keydown', onKeydown))

const isRace       = computed(() => panel.target.value?.kind === 'race')
const isClass      = computed(() => panel.target.value?.kind === 'class')
const isBackground = computed(() => panel.target.value?.kind === 'background')
const isSpell      = computed(() => panel.target.value?.kind === 'spell')
const isSkill      = computed(() => panel.target.value?.kind === 'skill')
const isItem       = computed(() => panel.target.value?.kind === 'item')
const isFeature    = computed(() => panel.target.value?.kind === 'feature')

const raceIndex    = computed(() => isRace.value    ? (panel.target.value as Extract<typeof panel.target.value, { kind: 'race' }>)!.index : '')
const classIndex   = computed(() => isClass.value   ? (panel.target.value as Extract<typeof panel.target.value, { kind: 'class' }>)!.index : '')
const bgIndex      = computed(() => isBackground.value ? (panel.target.value as Extract<typeof panel.target.value, { kind: 'background' }>)!.index : '')
const spellIndex   = computed(() => isSpell.value   ? (panel.target.value as Extract<typeof panel.target.value, { kind: 'spell' }>)!.index : '')
const skillIndex   = computed(() => isSkill.value   ? (panel.target.value as Extract<typeof panel.target.value, { kind: 'skill' }>)!.index : '')
const itemIndex    = computed(() => isItem.value    ? (panel.target.value as Extract<typeof panel.target.value, { kind: 'item' }>)!.index : '')
const featureIndex = computed(() => isFeature.value ? (panel.target.value as Extract<typeof panel.target.value, { kind: 'feature' }>)!.index : '')

const { data: raceData,  isFetching: raceFetching,  isError: raceError  } = useQuery({
  queryKey: computed(() => ['race-detail',  raceIndex.value]),
  queryFn:  () => fiveEApi.getRace(raceIndex.value),
  staleTime: Infinity,
  enabled:  isRace,
})
const { data: classData, isFetching: classFetching, isError: classError } = useQuery({
  queryKey: computed(() => ['class-detail', classIndex.value]),
  queryFn:  () => fiveEApi.getClass(classIndex.value),
  staleTime: Infinity,
  enabled:  isClass,
})
const { data: bgData,    isFetching: bgFetching,    isError: bgError    } = useQuery({
  queryKey: computed(() => ['bg-detail',    bgIndex.value]),
  queryFn:  () => fiveEApi.getBackground(bgIndex.value),
  staleTime: Infinity,
  enabled:  isBackground,
})
const { data: spellData, isFetching: spellFetching, isError: spellError } = useQuery({
  queryKey: computed(() => ['spell-detail', spellIndex.value]),
  queryFn:  () => fiveEApi.getSpell(spellIndex.value),
  staleTime: Infinity,
  enabled:  isSpell,
})
const { data: skillData, isFetching: skillFetching, isError: skillError } = useQuery({
  queryKey: computed(() => ['skill-detail', skillIndex.value]),
  queryFn:  () => fiveEApi.getSkill(skillIndex.value),
  staleTime: Infinity,
  enabled:  isSkill,
})
const { data: itemData, isFetching: itemFetching, isError: itemError } = useQuery({
  queryKey: computed(() => ['item-detail', itemIndex.value]),
  queryFn:  () => fiveEApi.getEquipment(itemIndex.value),
  staleTime: Infinity,
  enabled:  isItem,
})
const { data: featureData, isFetching: featureFetching, isError: featureError } = useQuery({
  queryKey: computed(() => ['feature-detail', featureIndex.value]),
  queryFn:  () => fiveEApi.getFeature(featureIndex.value),
  staleTime: Infinity,
  enabled:  isFeature,
})

const isLoading = computed(() => {
  const k = panel.target.value?.kind
  if (k === 'race')       return raceFetching.value
  if (k === 'class')      return classFetching.value
  if (k === 'background') return bgFetching.value
  if (k === 'spell')      return spellFetching.value
  if (k === 'skill')      return skillFetching.value
  if (k === 'item')       return itemFetching.value
  if (k === 'feature')    return featureFetching.value
  return false
})

const isError = computed(() => {
  const k = panel.target.value?.kind
  if (k === 'race')       return raceError.value
  if (k === 'class')      return classError.value
  if (k === 'background') return bgError.value
  if (k === 'spell')      return spellError.value
  if (k === 'skill')      return skillError.value
  if (k === 'item')       return itemError.value
  if (k === 'feature')    return featureError.value
  return false
})

const ALIGNMENT_INFO: Record<string, { glyph: string; nickname: string; paragraphs: string[] }> = {
  'Lawful Good': {
    glyph: '⚖',
    nickname: 'The Crusader',
    paragraphs: [
      'A lawful good character acts as a good person expects to act. They combine a commitment to oppose evil with the discipline to fight relentlessly. They tell the truth, keep their word, help those in need, and speak out against injustice.',
      'Paladins, knights, and most dwarves are lawful good. They may seem inflexible at times, but their moral compass rarely wavers.',
    ],
  },
  'Neutral Good': {
    glyph: '✦',
    nickname: 'The Benefactor',
    paragraphs: [
      'A neutral good character does the best a good person can do. They are devoted to helping others without concern for law or chaos — only for doing what is right.',
      'Most clerics and many druids are neutral good. They believe each situation should be judged on its own merits, and will work with law or chaos as needed to achieve the greater good.',
    ],
  },
  'Chaotic Good': {
    glyph: '☀',
    nickname: 'The Rebel',
    paragraphs: [
      'A chaotic good character acts as their conscience directs, with little regard for what others expect. They make their own way, chafing at rules and resenting restrictions that get in the way of helping others.',
      'Rangers, bards, and many rogues are chaotic good. They combine a good heart with a free spirit, following their own moral code rather than law or tradition.',
    ],
  },
  'Lawful Neutral': {
    glyph: '▣',
    nickname: 'The Judge',
    paragraphs: [
      'A lawful neutral character acts in accordance with law, tradition, or a personal code, with no moral bias toward good or evil. Order and organization are paramount.',
      'Monks and soldiers often fall here. They follow orders, uphold contracts, and respect the structure of society — but that structure is the goal, not merely a means to an end.',
    ],
  },
  'True Neutral': {
    glyph: '◎',
    nickname: 'The Undecided',
    paragraphs: [
      'A true neutral character does what seems best at the time, with no great interest in the cosmic struggle between law, chaos, good, and evil.',
      'Druids often hold this alignment as a philosophy: nature itself is neither good nor evil, and balance between all forces is the deepest truth.',
    ],
  },
  'Chaotic Neutral': {
    glyph: '⟳',
    nickname: 'The Free Spirit',
    paragraphs: [
      'A chaotic neutral character follows their whims wherever they lead. They are an individualist above all else, valuing personal liberty but making little effort to protect others.',
      'Barbarians and free-roaming adventurers often fall here. They are unpredictable and resist attempts to constrain their behavior, though they are not intentionally cruel.',
    ],
  },
  'Lawful Evil': {
    glyph: '⛧',
    nickname: 'The Dominator',
    paragraphs: [
      'A lawful evil character methodically takes what they want within the limits of a code of conduct, without compassion or scruples. They use law, tradition, or hierarchy to oppress and dominate others.',
      'Devils and tyrants are lawful evil. They may keep their word, but only when it serves their purposes — agreements are tools, not moral obligations.',
    ],
  },
  'Neutral Evil': {
    glyph: '◈',
    nickname: 'The Malefactor',
    paragraphs: [
      'A neutral evil character does whatever they can get away with, following neither law nor chaos. They are fundamentally selfish, with no loyalty to anyone but themselves.',
      'Assassins and many dark spellcasters are neutral evil. They feel the pull of neither order nor chaos — only self-interest — and ally with anyone who serves their goals.',
    ],
  },
  'Chaotic Evil': {
    glyph: '⚡',
    nickname: 'The Destroyer',
    paragraphs: [
      'A chaotic evil character does whatever their greed, hatred, and lust for destruction drive them to do. They are hot-tempered, vicious, arbitrarily violent, and deeply unpredictable.',
      'Demons and many monsters are chaotic evil. They have no respect for rules, the lives of others, or anything but their own whims and desires.',
    ],
  },
}

const alignmentInfo = computed(() => {
  if (panel.target.value?.kind !== 'alignment') return null
  return ALIGNMENT_INFO[panel.target.value.value] ?? null
})

const ITEM_CATEGORY_GLYPH: Record<string, string> = {
  weapon: '⚔',
  armor: '🛡',
  'adventuring-gear': '🎒',
  tools: '🔧',
  mounts: '🐴',
  vehicles: '⛵',
  'trade-goods': '💰',
}

const EXHAUSTION_LEVELS = [
  { level: 1, effect: 'Disadvantage on ability checks' },
  { level: 2, effect: 'Speed halved' },
  { level: 3, effect: 'Disadvantage on attack rolls and saving throws' },
  { level: 4, effect: 'Hit point maximum halved' },
  { level: 5, effect: 'Speed reduced to 0' },
  { level: 6, effect: 'Death' },
]

const entityGlyph = computed(() => {
  const t = panel.target.value
  if (!t) return ''
  if (t.kind === 'race')        return getRaceMeta(t.index).glyph
  if (t.kind === 'class')       return getClassMeta(t.index).glyph
  if (t.kind === 'background')  return '📜'
  if (t.kind === 'spell')       return '✶'
  if (t.kind === 'skill')       return '🎯'
  if (t.kind === 'alignment')   return ALIGNMENT_INFO[t.value]?.glyph ?? '◎'
  if (t.kind === 'item')        return ITEM_CATEGORY_GLYPH[itemData.value?.equipment_category.index ?? ''] ?? '⚙'
  if (t.kind === 'feature')     return getClassMeta(featureData.value?.class.index ?? '').glyph
  if (t.kind === 'exhaustion')  return '😵'
  return ''
})

const entityName = computed(() => {
  const t = panel.target.value
  if (!t) return ''
  if (t.kind === 'race')        return raceData.value?.name    ?? t.index
  if (t.kind === 'class')       return classData.value?.name   ?? t.index
  if (t.kind === 'background')  return bgData.value?.name      ?? t.index
  if (t.kind === 'spell')       return spellData.value?.name   ?? t.index
  if (t.kind === 'skill')       return skillData.value?.name   ?? t.index
  if (t.kind === 'item')        return itemData.value?.name    ?? t.index
  if (t.kind === 'feature')     return featureData.value?.name ?? t.name
  if (t.kind === 'alignment')   return t.value
  if (t.kind === 'exhaustion')  return 'Exhaustion'
  return ''
})

const kindBadge = computed(() => {
  const k = panel.target.value?.kind
  if (k === 'exhaustion') return 'condition'
  if (k === 'feature')    return 'feature'
  return k ?? ''
})
</script>

<style scoped>
.ip-slide-enter-active,
.ip-slide-leave-active { transition: transform 0.25s ease-out; }
.ip-slide-enter-from,
.ip-slide-leave-to { transform: translateX(100%); }

.ip-fade-enter-active,
.ip-fade-leave-active { transition: opacity 0.2s ease; }
.ip-fade-enter-from,
.ip-fade-leave-to { opacity: 0; }
</style>
