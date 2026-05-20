<template>
  <div class="min-h-screen flex flex-col bg-void">
    <AppNav />
    <main class="flex-1 min-h-0">
      <RouterView />
    </main>
    <AppFooter />
    <InfoPanel />
    <AppDialog />
    <ConfirmDialog />
    <ToastContainer />
  </div>
</template>

<script setup lang="ts">
import AppNav from './AppNav.vue'
import AppFooter from './AppFooter.vue'
import InfoPanel from '@/shared/components/InfoPanel.vue'
import AppDialog from '@/shared/components/AppDialog.vue'
import ConfirmDialog from '@/shared/components/ConfirmDialog.vue'
import ToastContainer from '@/shared/components/ToastContainer.vue'
</script>
