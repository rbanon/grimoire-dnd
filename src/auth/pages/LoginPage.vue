<template>
  <div class="min-h-[calc(100vh-60px)] flex items-center justify-center px-4 py-16 relative overflow-hidden">
    <!-- Background radial -->
    <div
      class="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full pointer-events-none opacity-[0.04]"
      style="background: radial-gradient(circle, #d4a843 0%, transparent 70%)"
    />
    <!-- Dot grid -->
    <div
      class="absolute inset-0 opacity-[0.02] pointer-events-none"
      style="background-image: radial-gradient(circle, #c8ccd8 1px, transparent 1px); background-size: 28px 28px"
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
          {{ mode === 'signin' ? 'Welcome back' : 'Join the Order' }}
        </h1>
        <p class="font-body text-ash mt-2">
          {{ mode === 'signin'
            ? 'Sign in to access your cloud characters and campaigns'
            : 'Create an account to sync your characters across devices' }}
        </p>
      </div>

      <!-- Card -->
      <div class="card p-8 corner-ornament">
        <!-- Mode toggle -->
        <div class="flex gap-1 mb-7 p-1 rounded bg-depths border border-shadow">
          <button
            class="flex-1 py-2 text-sm font-heading tracking-wide rounded transition-all duration-200"
            :class="mode === 'signin'
              ? 'bg-gold-dim/30 text-gold-mid border border-gold-dim/30'
              : 'text-stone hover:text-vellum'"
            @click="mode = 'signin'"
          >
            Sign in
          </button>
          <button
            class="flex-1 py-2 text-sm font-heading tracking-wide rounded transition-all duration-200"
            :class="mode === 'signup'
              ? 'bg-gold-dim/30 text-gold-mid border border-gold-dim/30'
              : 'text-stone hover:text-vellum'"
            @click="mode = 'signup'"
          >
            Create account
          </button>
        </div>

        <!-- Form -->
        <form class="flex flex-col gap-4" @submit.prevent="submit">
          <div>
            <label class="label" for="email">Email address</label>
            <input
              id="email"
              v-model="email"
              type="email"
              autocomplete="email"
              placeholder="your@email.com"
              class="input-base"
              required
            />
          </div>
          <div>
            <label class="label" for="password">Password</label>
            <input
              id="password"
              v-model="password"
              type="password"
              autocomplete="current-password"
              placeholder="••••••••"
              class="input-base"
              required
              minlength="8"
            />
          </div>

          <!-- Feedback -->
          <Transition name="fade">
            <div v-if="error" class="flex items-start gap-2 text-sm text-blood-bright bg-blood-deep/30 border border-blood-base/25 rounded px-3 py-2.5">
              <XCircleIcon :size="15" class="shrink-0 mt-px" />
              {{ error }}
            </div>
          </Transition>
          <Transition name="fade">
            <div v-if="success" class="flex items-start gap-2 text-sm text-verdant-bright bg-verdant-deep/30 border border-verdant-base/25 rounded px-3 py-2.5">
              <CheckIcon :size="15" class="shrink-0 mt-px" />
              {{ success }}
            </div>
          </Transition>

          <button type="submit" class="btn-primary w-full mt-1 py-2.5" :disabled="loading">
            <span v-if="loading" class="w-4 h-4 border-2 border-void border-t-transparent rounded-full animate-spin" />
            {{ mode === 'signin' ? 'Sign in' : 'Create account' }}
          </button>
        </form>

        <!-- Divider -->
        <div class="rule-gold my-5">or</div>

        <!-- Magic link -->
        <button
          class="btn-secondary w-full gap-2 text-sm"
          :disabled="loading"
          @click="sendMagic"
        >
          <MailIcon :size="14" />
          Send a magic link
        </button>

        <!-- Guest note -->
        <p class="text-center text-xs font-body text-mist mt-6">
          You don't need an account to use the character builder.
          <RouterLink to="/" class="text-ash hover:text-gold-mid transition-colors underline underline-offset-2 ml-0.5">
            Continue as guest →
          </RouterLink>
        </p>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { XCircleIcon, CheckIcon, MailIcon } from 'lucide-vue-next'
import { useAuthStore } from '@/auth/store'

const auth = useAuthStore()
const router = useRouter()

const mode = ref<'signin' | 'signup'>('signin')
const email = ref('')
const password = ref('')
const loading = ref(false)
const error = ref('')
const success = ref('')

async function submit() {
  error.value = ''
  success.value = ''
  loading.value = true
  try {
    if (mode.value === 'signin') {
      await auth.signInWithEmail(email.value, password.value)
      const redirect = (router.currentRoute.value.query.redirect as string) ?? '/'
      router.push(redirect)
    } else {
      await auth.signUpWithEmail(email.value, password.value)
      success.value = 'Account created! Check your email to confirm, then sign in.'
    }
  } catch (e: unknown) {
    error.value = e instanceof Error ? e.message : 'Authentication failed. Please try again.'
  } finally {
    loading.value = false
  }
}

async function sendMagic() {
  if (!email.value) { error.value = 'Enter your email address first.'; return }
  error.value = ''
  loading.value = true
  try {
    await auth.sendMagicLink(email.value)
    success.value = 'Magic link sent to ' + email.value + '. Check your inbox.'
  } catch (e: unknown) {
    error.value = e instanceof Error ? e.message : 'Failed to send magic link.'
  } finally {
    loading.value = false
  }
}
</script>

<style scoped>
.fade-enter-active, .fade-leave-active { transition: all 0.2s ease; }
.fade-enter-from, .fade-leave-to { opacity: 0; transform: translateY(-4px); }
</style>
