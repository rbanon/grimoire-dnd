<template>
  <div class="app-container py-8 max-w-2xl mx-auto flex flex-col gap-6">

    <!-- ── Header ────────────────────────────────────────────────────────── -->
    <div>
      <RouterLink
        to="/"
        class="inline-flex items-center gap-1.5 text-sm font-body text-mist hover:text-gold-mid transition-colors mb-5 group"
      >
        <ChevronLeftIcon :size="14" class="group-hover:-translate-x-0.5 transition-transform duration-150" />
        Back to characters
      </RouterLink>
      <h1 class="font-display text-3xl text-vellum tracking-wider">Your Profile</h1>
      <p class="font-body text-sm text-ash mt-1">{{ auth.userEmail }}</p>
    </div>

    <!-- ── Identity card ─────────────────────────────────────────────────── -->
    <section class="card p-6 corner-ornament flex flex-col gap-5">
      <p class="font-mono text-2xs tracking-[0.22em] uppercase text-mist">Identity</p>

      <!-- Avatar row -->
      <div class="flex items-start gap-4">
        <!-- Preview -->
        <div
          class="w-16 h-16 rounded-full border-2 overflow-hidden shrink-0 flex items-center justify-center relative"
          :class="avatarPreview ? 'border-gold-mid/50' : 'border-gold-dim/30 bg-depths'"
        >
          <img
            v-if="avatarPreview"
            :src="avatarPreview"
            alt="Avatar preview"
            class="w-full h-full object-cover"
            @error="onAvatarError"
          />
          <span v-else class="font-heading text-xl text-gold-mid select-none">{{ initials }}</span>
        </div>

        <!-- URL input -->
        <div class="flex-1 min-w-0">
          <label for="avatar-url" class="label">Avatar URL</label>
          <input
            id="avatar-url"
            v-model="avatarUrlInput"
            type="url"
            placeholder="https://i.imgur.com/example.jpg"
            class="input-base"
            autocomplete="off"
            @blur="onAvatarBlur"
          />
          <p class="text-xs font-body text-mist mt-1.5">
            Paste a direct image URL (jpg, png, webp). File upload coming soon.
          </p>
          <p v-if="avatarError" class="text-xs font-body text-blood-bright mt-1">{{ avatarError }}</p>
        </div>
      </div>

      <!-- Divider -->
      <div class="divider" />

      <!-- Nickname -->
      <div>
        <label for="nickname" class="label">Display name</label>
        <input
          id="nickname"
          v-model="nicknameInput"
          type="text"
          maxlength="40"
          placeholder="How should we call you?"
          class="input-base"
          autocomplete="nickname"
        />
        <p class="text-xs font-body text-mist mt-1.5">
          Shown in the navbar. Defaults to your email username.
        </p>
      </div>

      <!-- Email (read-only) -->
      <div>
        <label class="label">Email address</label>
        <p
          class="w-full rounded border border-shadow bg-depths px-3.5 py-2 text-base font-body text-ash cursor-default"
          aria-readonly="true"
        >
          {{ auth.userEmail }}
        </p>
        <p class="text-xs font-body text-mist mt-1.5">Email cannot be changed here.</p>
      </div>

      <!-- Save -->
      <div class="flex items-center gap-3 pt-1">
        <button
          class="btn-primary gap-2"
          :disabled="savingProfile"
          @click="saveProfile"
        >
          <span v-if="savingProfile" class="w-3.5 h-3.5 border-2 border-void border-t-transparent rounded-full animate-spin" />
          <SaveIcon v-else :size="13" />
          Save changes
        </button>

        <Transition name="fade-right">
          <span v-if="profileSaved" class="flex items-center gap-1 text-sm font-body text-verdant-bright">
            <CheckIcon :size="13" />
            Saved
          </span>
        </Transition>
      </div>

      <p v-if="profileError" class="text-sm font-body text-blood-bright -mt-1">{{ profileError }}</p>
    </section>

    <!-- ── Security card ──────────────────────────────────────────────────── -->
    <section class="card p-6 corner-ornament flex flex-col gap-5">
      <p class="font-mono text-2xs tracking-[0.22em] uppercase text-mist">Security</p>

      <!-- New password -->
      <div>
        <label for="new-password" class="label">New password</label>
        <div class="relative">
          <input
            id="new-password"
            v-model="newPassword"
            :type="showPassword ? 'text' : 'password'"
            minlength="8"
            placeholder="Minimum 8 characters"
            class="input-base pr-10"
            autocomplete="new-password"
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

      <!-- Confirm password -->
      <div>
        <label for="confirm-password" class="label">Confirm new password</label>
        <input
          id="confirm-password"
          v-model="confirmPassword"
          :type="showPassword ? 'text' : 'password'"
          minlength="8"
          placeholder="Repeat your new password"
          class="input-base"
          autocomplete="new-password"
        />
        <p v-if="passwordMismatch" class="text-xs font-body text-blood-bright mt-1">
          Passwords do not match.
        </p>
      </div>

      <!-- Save -->
      <div class="flex items-center gap-3 pt-1">
        <button
          class="btn-primary gap-2"
          :disabled="savingPassword || !canSavePassword"
          @click="savePassword"
        >
          <span v-if="savingPassword" class="w-3.5 h-3.5 border-2 border-void border-t-transparent rounded-full animate-spin" />
          <ShieldIcon v-else :size="13" />
          Update password
        </button>

        <Transition name="fade-right">
          <span v-if="passwordSaved" class="flex items-center gap-1 text-sm font-body text-verdant-bright">
            <CheckIcon :size="13" />
            Password updated
          </span>
        </Transition>
      </div>

      <p v-if="passwordError" class="text-sm font-body text-blood-bright -mt-1">{{ passwordError }}</p>
    </section>

    <!-- ── Session card ───────────────────────────────────────────────────── -->
    <section class="card p-6 flex items-center justify-between gap-4">
      <div>
        <p class="font-mono text-2xs tracking-[0.22em] uppercase text-mist mb-1">Session</p>
        <p class="text-sm font-body text-ash">Sign out from all active sessions.</p>
      </div>
      <button class="btn-danger shrink-0" @click="auth.signOut">
        Sign out
      </button>
    </section>

  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { ChevronLeftIcon, SaveIcon, CheckIcon, ShieldIcon, EyeIcon, EyeOffIcon } from 'lucide-vue-next'
import { useAuthStore } from '@/auth/store'

const auth = useAuthStore()

// ── Identity ───────────────────────────────────────────────────────────────

const nicknameInput = ref(auth.nickname ?? '')
const avatarUrlInput = ref(auth.avatarUrl ?? '')
const avatarPreview = ref(auth.avatarUrl ?? '')
const avatarError = ref('')
const savingProfile = ref(false)
const profileSaved = ref(false)
const profileError = ref('')

const initials = computed(() => {
  const name = nicknameInput.value.trim() || auth.userEmail?.split('@')[0] || ''
  return name.slice(0, 2).toUpperCase() || '?'
})

function onAvatarBlur() {
  avatarError.value = ''
  const raw = avatarUrlInput.value.trim()
  if (!raw) { avatarPreview.value = ''; return }
  try {
    const url = new URL(raw)
    if (!/^https?:$/i.test(url.protocol)) {
      avatarError.value = 'URL must start with http:// or https://'
      avatarPreview.value = ''
      return
    }
    avatarPreview.value = raw
  } catch {
    avatarError.value = 'Enter a valid URL.'
    avatarPreview.value = ''
  }
}

function onAvatarError() {
  avatarError.value = 'Could not load image from this URL.'
  avatarPreview.value = ''
}

async function saveProfile() {
  if (avatarError.value) return
  savingProfile.value = true
  profileError.value = ''
  profileSaved.value = false
  try {
    await auth.updateProfile({
      nickname: nicknameInput.value.trim() || null,
      avatarUrl: avatarPreview.value || null,
    })
    profileSaved.value = true
    setTimeout(() => (profileSaved.value = false), 3000)
  } catch (e) {
    profileError.value = e instanceof Error ? e.message : 'Could not save profile. Try again.'
  } finally {
    savingProfile.value = false
  }
}

// ── Password ───────────────────────────────────────────────────────────────

const newPassword = ref('')
const confirmPassword = ref('')
const showPassword = ref(false)
const savingPassword = ref(false)
const passwordSaved = ref(false)
const passwordError = ref('')

const passwordMismatch = computed(() =>
  confirmPassword.value.length > 0 && newPassword.value !== confirmPassword.value,
)

const canSavePassword = computed(() =>
  newPassword.value.length >= 8 && !passwordMismatch.value,
)

async function savePassword() {
  if (!canSavePassword.value) return
  savingPassword.value = true
  passwordError.value = ''
  passwordSaved.value = false
  try {
    await auth.updatePassword(newPassword.value)
    passwordSaved.value = true
    newPassword.value = ''
    confirmPassword.value = ''
    setTimeout(() => (passwordSaved.value = false), 3000)
  } catch (e) {
    passwordError.value = e instanceof Error ? e.message : 'Could not update password. Try again.'
  } finally {
    savingPassword.value = false
  }
}
</script>

<style scoped>
.fade-right-enter-active,
.fade-right-leave-active { transition: all 0.2s ease; }
.fade-right-enter-from,
.fade-right-leave-to { opacity: 0; transform: translateX(-6px); }
</style>
