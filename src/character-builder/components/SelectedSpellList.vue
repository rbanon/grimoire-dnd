<template>
  <p v-if="spells.length === 0" class="text-xs font-body text-mist">No spells selected yet.</p>
  <div v-else class="space-y-1.5">
    <div
      v-for="s in spells"
      :key="s.index"
      class="group flex items-center gap-2 px-3 py-2 rounded border border-arcane-base/25 bg-arcane-deep/8"
    >
      <span class="flex-1 text-sm font-heading text-arcane-pale/90">{{ s.name }}</span>
      <span class="badge-arcane text-2xs">Lv {{ s.level }}</span>
      <button
        type="button"
        class="shrink-0 w-5 h-5 flex items-center justify-center rounded text-mist/30 hover:text-blood-bright transition-colors opacity-0 group-hover:opacity-100"
        @click="$emit('remove', s.index)"
      >
        <XIcon :size="11" />
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { XIcon } from 'lucide-vue-next'

defineProps<{ spells: { index: string; name: string; level: number }[] }>()
defineEmits<{ remove: [index: string] }>()
</script>
