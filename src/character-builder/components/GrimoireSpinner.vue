<template>
  <div class="flex flex-col items-center gap-3 py-6">
    <div class="relative w-10 h-10">
      <div class="absolute inset-0 border border-gold-dim/30 rotate-45" style="border-radius:2px" />
      <div
        class="absolute inset-1.5 border-2 border-t-gold-mid border-r-gold-dim/30 border-b-transparent border-l-transparent rounded-full animate-spin"
        style="animation-duration:1.2s"
      />
    </div>
    <span v-if="label" class="text-2xs font-heading tracking-widest text-mist uppercase">{{ label }}</span>
  </div>
</template>

<script setup lang="ts">
defineProps<{ label?: string }>()
</script>
