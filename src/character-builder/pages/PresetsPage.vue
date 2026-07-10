<template>
  <div class="app-container py-10">
    <RouterLink to="/characters/new" class="inline-flex items-center gap-1.5 group mb-4">
      <ChevronLeftIcon :size="13" class="text-mist group-hover:text-ash transition-colors" />
      <span class="font-mono text-2xs text-mist group-hover:text-ash transition-colors tracking-wide">Creation modes</span>
    </RouterLink>
    <p class="font-mono text-2xs tracking-[0.22em] uppercase text-mist mb-2">Ready-Made · Levels 1–3</p>
    <h1 class="font-display text-4xl text-vellum leading-tight mb-6">Pregenerated Heroes</h1>
    <div class="card p-8 text-center text-ash">Coming soon.</div>
  </div>
</template>

<script setup lang="ts">
import { ChevronLeftIcon } from 'lucide-vue-next'
</script>
