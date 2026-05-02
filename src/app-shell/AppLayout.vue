<template>
  <div class="min-h-screen flex flex-col bg-void">
    <AppNav />
    <main class="flex-1">
      <RouterView />
    </main>
    <AppFooter />
    <InfoPanel />
  </div>
</template>

<script setup lang="ts">
import AppNav from './AppNav.vue'
import AppFooter from './AppFooter.vue'
import InfoPanel from '@/shared/components/InfoPanel.vue'
</script>
