<template>
  <div class="inline-flex items-center gap-1 p-0.5 rounded-lg border border-shadow bg-depths/40">
    <RouterLink
      v-for="s in SECTIONS"
      :key="s.to"
      :to="s.to"
      custom
      v-slot="{ isActive, href, navigate }"
    >
      <a
        :href="href"
        class="px-3 py-1.5 rounded-md text-sm font-heading tracking-wide transition-colors"
        :class="isActive ? 'bg-arcane-base/20 text-arcane-pale' : 'text-stone hover:text-vellum'"
        @click="navigate"
      >{{ s.label }}</a>
    </RouterLink>
  </div>
</template>

<script setup lang="ts">
const SECTIONS = [
  { to: '/community/classes',    label: 'Classes' },
  { to: '/community/subclasses', label: 'Subclasses' },
  { to: '/community/races',      label: 'Races & Species' },
]
</script>
