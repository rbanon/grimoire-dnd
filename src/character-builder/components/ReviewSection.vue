<template>
  <div class="card p-4 space-y-2.5">
    <p class="label">{{ title }}</p>
    <p v-if="!items.length" class="text-sm font-body text-mist italic">{{ empty }}</p>
    <div v-else class="flex flex-wrap gap-1.5">
      <span
        v-for="item in items"
        :key="item"
        class="px-2 py-0.5 rounded text-xs font-body text-ash bg-depths/60 border border-shadow"
      >
        {{ item }}
      </span>
    </div>
  </div>
</template>

<script setup lang="ts">
defineProps<{
  title: string
  items: string[]
  empty: string
}>()
</script>
