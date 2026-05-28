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

      <!-- Avatar -->
      <div class="flex items-center gap-5">
        <!-- Clickable circle -->
        <button
          type="button"
          class="relative w-20 h-20 rounded-full border-2 overflow-hidden shrink-0 flex items-center justify-center group transition-colors duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold-mid focus-visible:ring-offset-2 focus-visible:ring-offset-void"
          :class="avatarPreview ? 'border-gold-mid/50' : 'border-gold-dim/30 bg-depths'"
          :disabled="uploading"
          title="Upload profile photo"
          @click="fileInput?.click()"
        >
          <img
            v-if="avatarPreview"
            :src="avatarPreview"
            alt="Your avatar"
            class="w-full h-full object-cover"
          />
          <span v-else class="font-heading text-2xl text-gold-mid select-none">{{ initials }}</span>

          <!-- Hover overlay -->
          <div
            class="absolute inset-0 bg-abyss/60 flex items-center justify-center transition-opacity duration-150"
            :class="uploading ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'"
          >
            <span v-if="uploading" class="w-5 h-5 border-2 border-gold-mid border-t-transparent rounded-full animate-spin" />
            <CameraIcon v-else :size="18" class="text-gold-mid" />
          </div>
        </button>

        <!-- Hidden file input -->
        <input
          ref="fileInput"
          type="file"
          accept="image/jpeg,image/png,image/webp,image/gif"
          class="sr-only"
          @change="onFileSelected"
        />

        <!-- Side info -->
        <div class="flex flex-col gap-2">
          <button
            type="button"
            class="btn-secondary text-sm px-4 py-1.5 gap-2"
            :disabled="uploading"
            @click="fileInput?.click()"
          >
            <UploadIcon :size="13" />
            Upload photo
          </button>
          <button
            v-if="avatarPreview"
            type="button"
            class="btn-ghost text-xs text-mist hover:text-blood-bright px-2 py-1 self-start"
            :disabled="uploading"
            @click="removeAvatar"
          >
            Remove
          </button>
          <p class="text-xs font-body text-mist">JPG, PNG, WebP or GIF · max 1 MB</p>
          <p v-if="avatarFileError" class="text-xs font-body text-blood-bright">{{ avatarFileError }}</p>
        </div>
      </div>

      <div class="divider" />

      <!-- Nickname -->
      <div>
        <label for="nickname" class="label">Display name</label>
        <input
          id="nickname"
          v-model="nicknameInput"
          type="text"
          maxlength="20"
          placeholder="How should we call you?"
          class="input-base"
          autocomplete="nickname"
        />
        <p class="text-xs font-body text-mist mt-1.5">
          Max 20 characters. Shown in the navbar.
        </p>
      </div>

      <!-- Email (read-only) -->
      <div>
        <label class="label">Email address</label>
        <p
          class="w-full rounded border border-shadow bg-depths px-3.5 py-2 text-base font-body text-ash cursor-default select-all"
          aria-readonly="true"
        >
          {{ auth.userEmail }}
        </p>
      </div>

      <!-- Save -->
      <div class="flex items-center gap-3 pt-1">
        <button
          class="btn-primary gap-2"
          :disabled="savingProfile || !!avatarFileError"
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
      <button class="btn-danger shrink-0" @click="auth.signOut">Sign out</button>
    </section>

  </div>
</template>

<script setup lang="ts">
import { ref, computed, onUnmounted } from 'vue'
import {
  ChevronLeftIcon, SaveIcon, CheckIcon, ShieldIcon,
  EyeIcon, EyeOffIcon, CameraIcon, UploadIcon,
} from 'lucide-vue-next'
import { useAuthStore } from '@/auth/store'
import { validateAvatarFile, uploadAvatar } from '@/shared/lib/uploadAvatar'

const auth = useAuthStore()

// ── Avatar & identity ──────────────────────────────────────────────────────

const fileInput = ref<HTMLInputElement | null>(null)
const pendingFile = ref<File | null>(null)
const pendingBlobUrl = ref<string | null>(null)
const avatarRemoved = ref(false)
const avatarFileError = ref('')
const uploading = ref(false)

const avatarPreview = computed(() => {
  if (avatarRemoved.value) return ''
  if (pendingBlobUrl.value) return pendingBlobUrl.value
  return auth.avatarUrl ?? ''
})

const nicknameInput = ref(auth.nickname ?? '')

const initials = computed(() => {
  const name = nicknameInput.value.trim() || auth.userEmail?.split('@')[0] || ''
  return name.slice(0, 2).toUpperCase() || '?'
})

function onFileSelected(e: Event) {
  const file = (e.target as HTMLInputElement).files?.[0]
  if (!file) return
  avatarFileError.value = ''
  const err = validateAvatarFile(file)
  if (err) { avatarFileError.value = err; return }
  // Revoke previous blob URL to free memory
  if (pendingBlobUrl.value) URL.revokeObjectURL(pendingBlobUrl.value)
  pendingFile.value = file
  pendingBlobUrl.value = URL.createObjectURL(file)
  avatarRemoved.value = false
}

function removeAvatar() {
  if (pendingBlobUrl.value) { URL.revokeObjectURL(pendingBlobUrl.value); pendingBlobUrl.value = null }
  pendingFile.value = null
  avatarRemoved.value = true
  avatarFileError.value = ''
}

onUnmounted(() => {
  if (pendingBlobUrl.value) URL.revokeObjectURL(pendingBlobUrl.value)
})

// ── Profile save ───────────────────────────────────────────────────────────

const savingProfile = ref(false)
const profileSaved = ref(false)
const profileError = ref('')

async function saveProfile() {
  savingProfile.value = true
  profileError.value = ''
  profileSaved.value = false
  try {
    let finalAvatarUrl: string | null = auth.avatarUrl

    if (avatarRemoved.value) {
      finalAvatarUrl = null
    } else if (pendingFile.value) {
      uploading.value = true
      finalAvatarUrl = await uploadAvatar(pendingFile.value, auth.userId!)
      // Clean up blob URL — we now have the real Supabase URL
      if (pendingBlobUrl.value) { URL.revokeObjectURL(pendingBlobUrl.value); pendingBlobUrl.value = null }
      pendingFile.value = null
    }

    await auth.updateProfile({
      nickname: nicknameInput.value.trim() || null,
      avatarUrl: finalAvatarUrl,
    })
    profileSaved.value = true
    avatarRemoved.value = false
    setTimeout(() => (profileSaved.value = false), 3000)
  } catch (e) {
    profileError.value = e instanceof Error ? e.message : 'Could not save profile. Try again.'
  } finally {
    savingProfile.value = false
    uploading.value = false
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
