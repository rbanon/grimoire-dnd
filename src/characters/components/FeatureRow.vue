<template>
  <div
    class="card overflow-hidden transition-all duration-150"
    :class="open ? 'border-shadow/80' : 'hover:border-shadow/60'"
  >
    <!-- Header -->
    <button
      type="button"
      class="w-full flex items-center justify-between gap-3 px-4 py-3 text-left"
      @click="$emit('toggle')"
    >
      <div class="flex items-center gap-2 min-w-0">
        <span class="font-heading text-sm text-vellum truncate">{{ name }}</span>
        <span
          v-if="isSubclass"
          class="shrink-0 px-1.5 py-0.5 rounded text-2xs font-heading tracking-wide border border-arcane-base/30 text-arcane-pale bg-arcane-deep/10"
        >{{ source }}</span>
        <span
          v-else
          class="shrink-0 badge-gold text-2xs"
        >{{ source }}</span>
      </div>
      <ChevronDownIcon
        :size="14"
        class="shrink-0 text-mist transition-transform duration-200"
        :class="open ? 'rotate-180' : ''"
      />
    </button>

    <!-- Description -->
    <div v-show="open" class="px-4 pb-4">
      <div class="border-t border-shadow/40 pt-3">
        <template v-if="loading">
          <div class="h-3 skeleton rounded-sm w-4/5 mb-2" />
          <div class="h-3 skeleton rounded-sm w-3/5" />
        </template>
        <template v-else-if="paragraphs.length === 0">
          <p class="font-body text-sm text-mist/50 italic">No description available.</p>
        </template>
        <template v-else>
          <p
            v-for="(para, i) in paragraphs"
            :key="i"
            class="font-body text-sm text-ash leading-relaxed"
            :class="i > 0 ? 'mt-2' : ''"
          >{{ para }}</p>
        </template>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { ChevronDownIcon } from 'lucide-vue-next'

const props = defineProps<{
  name: string
  description: string
  source: string
  isSubclass?: boolean
  open: boolean
  loading?: boolean
}>()

defineEmits<{ toggle: [] }>()

const paragraphs = computed(() =>
  props.description.split('\n\n').filter(p => p.trim()),
)
</script>
