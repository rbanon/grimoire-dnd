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
        <h1 class="font-display text-3xl text-vellum tracking-wider">Choose new password</h1>
        <p class="font-body text-ash mt-2">Pick a strong password for your account.</p>
      </div>

      <div class="card p-8 corner-ornament">
        <!-- Waiting for token -->
        <div v-if="auth.loading" class="flex justify-center py-6">
          <span class="w-6 h-6 border-2 border-gold-mid border-t-transparent rounded-full animate-spin" />
        </div>

        <!-- Invalid / expired link -->
        <div v-else-if="!isRecovery" class="flex flex-col items-center gap-4 py-4 text-center">
          <XCircleIcon :size="36" class="text-blood-bright opacity-70" />
          <div>
            <p class="font-heading text-base text-vellum">Link expired or invalid</p>
            <p class="text-sm font-body text-ash mt-1">Password reset links are single-use and expire after one hour.</p>
          </div>
          <RouterLink to="/login" class="btn-secondary text-sm mt-2">
            Request a new link
          </RouterLink>
        </div>

        <!-- New password form -->
        <form v-else class="flex flex-col gap-4" @submit.prevent="submit">
          <div>
            <label for="new-password" class="label">New password</label>
            <div class="relative">
              <input
                id="new-password"
                v-model="newPassword"
                :type="showPassword ? 'text' : 'password'"
                autocomplete="new-password"
                placeholder="Minimum 8 characters"
                class="input-base pr-10"
                minlength="8"
                required
              />
              <button
                type="button"
                class="absolute right-3 top-1/2 -translate-y-1/2 text-mist hover:text-ash transition-colors p-0.5"
                :aria-label="showPassword ? 'Hide password' : 'Show password'"
                @click="showPassword = !showPassword"
              >
                <EyeOffIcon v-if="showPassword" :size="15" />
                <EyeIcon v-else :size="15" />
              </button>
            </div>
            <p v-if="newPassword && newPassword.length < 8" class="text-xs font-body text-blood-bright mt-1">
              Password must be at least 8 characters.
            </p>
          </div>

          <div>
            <label for="confirm-password" class="label">Confirm new password</label>
            <input
              id="confirm-password"
              v-model="confirmPassword"
              :type="showPassword ? 'text' : 'password'"
              autocomplete="new-password"
              placeholder="Repeat your new password"
              class="input-base"
              minlength="8"
              required
            />
            <p v-if="passwordMismatch" class="text-xs font-body text-blood-bright mt-1">
              Passwords do not match.
            </p>
          </div>

          <Transition name="fade">
            <div v-if="error" class="flex items-start gap-2 text-sm text-blood-bright bg-blood-deep/30 border border-blood-base/25 rounded px-3 py-2.5">
              <XCircleIcon :size="15" class="shrink-0 mt-px" />
              {{ error }}
            </div>
          </Transition>
          <Transition name="fade">
            <div v-if="saved" class="flex items-start gap-2 text-sm text-verdant-bright bg-verdant-deep/30 border border-verdant-base/25 rounded px-3 py-2.5">
              <CheckIcon :size="15" class="shrink-0 mt-px" />
              Password updated! Redirecting…
            </div>
          </Transition>

          <button
            type="submit"
            class="btn-primary w-full mt-1 py-2.5"
            :disabled="saving || !canSave || saved"
          >
            <span v-if="saving" class="w-4 h-4 border-2 border-void border-t-transparent rounded-full animate-spin" />
            Set new password
          </button>
        </form>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { useRouter } from 'vue-router'
import { CheckIcon, XCircleIcon, EyeIcon, EyeOffIcon } from 'lucide-vue-next'
import { useAuthStore } from '@/auth/store'

const auth = useAuthStore()
const router = useRouter()

// Supabase fires PASSWORD_RECOVERY via onAuthStateChange when the user lands
// with the recovery token in the URL hash.
const isRecovery = computed(
  () => auth.lastAuthEvent === 'PASSWORD_RECOVERY',
)

const newPassword = ref('')
const confirmPassword = ref('')
const showPassword = ref(false)
const saving = ref(false)
const saved = ref(false)
const error = ref('')

const passwordMismatch = computed(
  () => confirmPassword.value.length > 0 && newPassword.value !== confirmPassword.value,
)
const canSave = computed(
  () => newPassword.value.length >= 8 && !passwordMismatch.value,
)

async function submit() {
  if (!canSave.value) return
  saving.value = true
  error.value = ''
  try {
    await auth.updatePassword(newPassword.value)
    saved.value = true
    setTimeout(() => router.push('/'), 2000)
  } catch (e: unknown) {
    error.value = e instanceof Error ? e.message : 'Failed to update password. Try again.'
  } finally {
    saving.value = false
  }
}

// If user somehow ends up here already logged in (not via recovery link), redirect home.
watch(
  () => auth.loading,
  (loading) => {
    if (!loading && !isRecovery.value && auth.isAuthenticated) {
      router.replace('/')
    }
  },
  { immediate: true },
)
</script>

<style scoped>
.fade-enter-active, .fade-leave-active { transition: all 0.2s ease; }
.fade-enter-from, .fade-leave-to { opacity: 0; transform: translateY(-4px); }
</style>
