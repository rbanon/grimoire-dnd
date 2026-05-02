<template>
  <div class="app-container py-8">
    <div class="flex items-center justify-between mb-8">
      <h1 class="heading-display text-3xl font-semibold">Campaigns</h1>
      <RouterLink to="/campaigns/new" class="btn-primary">
        <PlusIcon :size="16" />
        New campaign
      </RouterLink>
    </div>

    <div class="card p-8 text-center">
      <BookOpenIcon :size="48" class="mx-auto text-parchment-400 mb-4" />
      <h2 class="heading-display text-xl font-semibold mb-2">Campaign Area</h2>
      <p class="text-muted">Campaign management is under construction.</p>
      <p class="text-sm text-muted mt-2">Here you will manage campaigns, sessions, NPCs, and notes.</p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { PlusIcon, BookOpenIcon } from 'lucide-vue-next'
</script>
