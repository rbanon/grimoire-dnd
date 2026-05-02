<template>
  <div class="app-container py-8 max-w-2xl">
    <h1 class="heading-display text-2xl font-semibold mb-6">Profile</h1>
    <div class="card p-6 flex flex-col gap-4">
      <div>
        <p class="label">Email</p>
        <p class="text-sm">{{ auth.userEmail }}</p>
      </div>
      <div class="pt-4 border-t border-shadow">
        <button class="btn-danger" @click="auth.signOut">Sign out</button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useAuthStore } from '@/auth/store'
const auth = useAuthStore()
</script>
