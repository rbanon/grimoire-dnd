<template>
  <div class="card flex flex-col items-center justify-center p-3 gap-0.5 group hover:border-gold-dim/30 transition-colors duration-200">
    <p class="text-2xs font-heading tracking-[0.15em] uppercase text-mist">{{ label }}</p>
    <p class="font-heading text-lg text-vellum leading-none">{{ value }}</p>
  </div>
</template>

<script setup lang="ts">
defineProps<{ label: string; value: string | number }>()
</script>
