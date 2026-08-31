<template>
  <div class="min-h-[calc(100vh-60px)] flex items-center justify-center px-4 py-16 relative overflow-hidden">
    <!-- Background radial -->
    <div
      class="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full pointer-events-none opacity-[0.04]"
      style="background: radial-gradient(circle, #d4a843 0%, transparent 70%)"
    />
    <!-- Dot grid -->
    <div
      class="absolute inset-0 opacity-[0.025] pointer-events-none"
      style="background-image: radial-gradient(circle, rgb(var(--c-vellum)) 1px, transparent 1px); background-size: 28px 28px"
    />

    <div class="w-full max-w-md relative">
      <!-- Header -->
      <div class="text-center mb-8">
        <div class="inline-flex items-center justify-center w-12 h-12 relative mb-5">
          <div class="absolute inset-0 border border-gold-dim/40 rotate-45" style="border-radius: 2px" />
          <div class="absolute inset-1.5 border border-gold-dim/20" style="border-radius: 2px" />
          <span class="relative text-gold-mid text-lg">⚔</span>
        </div>
        <h1 class="font-display text-3xl text-vellum tracking-wider">
          {{ status === 'success' ? 'Email confirmed' : status === 'error' ? 'Something went wrong' : 'Confirming your email' }}
        </h1>
        <p class="font-body text-ash mt-2">
          {{ status === 'success'
            ? 'Your account is ready.'
            : status === 'error'
              ? 'We could not complete the sign in with that link.'
              : 'One moment while we verify the link from your inbox.' }}
        </p>
      </div>

      <div class="card p-8 corner-ornament">
        <!-- Verifying -->
        <div v-if="status === 'verifying'" class="flex justify-center py-6">
          <span class="w-6 h-6 border-2 border-gold-mid border-t-transparent rounded-full animate-spin" />
        </div>

        <!-- Confirmed -->
        <div v-else-if="status === 'success'" class="flex flex-col items-center gap-4 py-4 text-center">
          <CheckIcon :size="36" class="text-verdant-bright opacity-80" />
          <div>
            <p class="font-heading text-base text-vellum">You're in</p>
            <p class="text-sm font-body text-ash mt-1">
              Your account is confirmed. Taking you to your characters.
            </p>
          </div>
          <RouterLink to="/" class="btn-secondary text-sm mt-2">
            Go now →
          </RouterLink>
        </div>

        <!-- Failed -->
        <div v-else class="flex flex-col items-center gap-4 py-4 text-center">
          <XCircleIcon :size="36" class="text-blood-bright opacity-70" />
          <div>
            <p class="font-heading text-base text-vellum">{{ errorTitle }}</p>
            <p class="text-sm font-body text-ash mt-1">{{ errorDetail }}</p>
          </div>
          <RouterLink to="/login" class="btn-secondary text-sm mt-2">
            Back to sign in
          </RouterLink>
          <p class="text-xs font-body text-mist mt-1">
            You don't need an account to use the character builder.
            <RouterLink to="/" class="text-ash hover:text-gold-mid transition-colors underline underline-offset-2 ml-0.5">
              Continue as guest →
            </RouterLink>
          </p>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import { CheckIcon, XCircleIcon } from 'lucide-vue-next'
import { useAuthStore } from '@/auth/store'

// Landing page for the links Supabase mails out on sign-up and for magic links
// (`emailRedirectTo` in auth/store.ts points here). Password recovery keeps its own
// page, /reset-password, because it has to collect a new password.
//
// The session itself is established by supabase-js, not here: `detectSessionInUrl`
// (on by default) consumes the token from the URL hash while the client boots, which
// happens in main.ts before the app mounts. So by the time this page renders, either
// the store already holds a user or the link was bad. This page only reports which.

const auth = useAuthStore()
const router = useRouter()

const status = ref<'verifying' | 'success' | 'error'>('verifying')
const errorTitle = ref('Link expired or invalid')
const errorDetail = ref('Confirmation links are single-use and expire after one hour. Request a new one from the sign-in page.')

let redirectTimer: ReturnType<typeof setTimeout> | null = null
let pollTimer: ReturnType<typeof setTimeout> | null = null

// On failure supabase-js throws out of _getSessionFromURL BEFORE it strips the params,
// so the error is still readable here. On success it has already cleaned the URL.
// Supabase puts these in the hash for the implicit flow and in the query string for PKCE,
// so read both.
function urlParams(): URLSearchParams {
  const hash = window.location.hash.replace(/^#/, '')
  const merged = new URLSearchParams(window.location.search)
  for (const [k, v] of new URLSearchParams(hash)) merged.set(k, v)
  return merged
}

function describeError(params: URLSearchParams) {
  const code = params.get('error_code') ?? ''
  const description = params.get('error_description') ?? ''
  if (code === 'otp_expired') {
    errorTitle.value = 'This link has expired'
    errorDetail.value = 'Confirmation links are valid for one hour. Request a new one from the sign-in page.'
    return
  }
  if (code === 'access_denied') {
    errorTitle.value = 'Link already used'
    errorDetail.value = 'This link works only once. If you already confirmed your account, just sign in.'
    return
  }
  if (description) {
    errorTitle.value = 'Link not accepted'
    errorDetail.value = description
  }
}

onMounted(() => {
  const params = urlParams()

  if (params.get('error') || params.get('error_code') || params.get('error_description')) {
    describeError(params)
    status.value = 'error'
    return
  }

  // Normal case: the session is already there. Poll briefly anyway, because the store
  // applies onAuthStateChange in a deferred macrotask (see the lock comment in auth/store.ts),
  // so a session that arrives via the event rather than via init() lands a tick late.
  const deadline = Date.now() + 3000
  const check = () => {
    if (auth.isAuthenticated) {
      status.value = 'success'
      redirectTimer = setTimeout(() => router.replace('/'), 1500)
      return
    }
    if (Date.now() >= deadline) {
      status.value = 'error'
      return
    }
    pollTimer = setTimeout(check, 100)
  }
  check()
})

onUnmounted(() => {
  if (redirectTimer) clearTimeout(redirectTimer)
  if (pollTimer) clearTimeout(pollTimer)
})
</script>
