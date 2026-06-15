<template>
  <Teleport to="body">
    <Transition name="loh-fade">
      <div
        v-if="show"
        class="fixed inset-0 z-50 flex items-center justify-center p-4"
        @keydown.esc="emit('close')"
      >
        <div class="absolute inset-0 bg-black/60" @click="emit('close')" />

        <div
          role="dialog"
          aria-modal="true"
          v-focus-trap
          aria-labelledby="lay-on-hands-title"
          class="relative w-full max-w-md bg-void border border-shadow rounded-lg shadow-2xl flex flex-col"
        >
          <div class="h-0.5 w-full bg-gold-mid shrink-0" />

          <!-- Header -->
          <div class="px-5 pt-4 pb-3">
            <div class="flex items-center justify-between">
              <p id="lay-on-hands-title" class="font-heading text-base text-gold-mid tracking-wide">Lay on Hands</p>
              <span class="badge-gold">{{ pool }} / {{ maxPool }} HP</span>
            </div>
            <p class="font-body text-sm text-ash mt-0.5">
              Draw from your pool of healing power. Spend points to restore hit points, or 5 to cure a disease or neutralize a poison.
            </p>
          </div>

          <div class="px-5 pb-5 space-y-4">
            <!-- Amount stepper -->
            <div class="flex items-center gap-3">
              <button
                type="button"
                class="w-9 h-9 flex items-center justify-center rounded border border-shadow text-mist hover:text-ash hover:border-gold-dim/50 font-heading text-lg leading-none transition-all disabled:opacity-30"
                :disabled="amount <= 1"
                @click="amount = Math.max(1, amount - 1)"
              >−</button>
              <input
                v-model.number="amount"
                type="number"
                min="1"
                :max="pool"
                class="input-base flex-1 text-center font-heading text-lg"
              />
              <button
                type="button"
                class="w-9 h-9 flex items-center justify-center rounded border border-shadow text-mist hover:text-ash hover:border-gold-dim/50 font-heading text-lg leading-none transition-all disabled:opacity-30"
                :disabled="amount >= pool"
                @click="amount = Math.min(pool, amount + 1)"
              >+</button>
            </div>

            <button
              type="button"
              class="w-full px-3 py-2 rounded border border-verdant-base/30 bg-verdant-deep/10 text-sm font-body text-verdant-base hover:border-verdant-base/50 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
              :disabled="pool < 5"
              @click="amount = 5"
            >
              Cure disease / neutralize poison (5 HP)
            </button>

            <!-- Heal self toggle -->
            <button
              type="button"
              class="w-full flex items-center gap-3 px-3 py-2.5 rounded border text-left transition-all"
              :class="healSelf ? 'border-gold-mid/50 bg-gold-dim/10' : 'border-shadow bg-abyss hover:border-gold-dim/25'"
              @click="healSelf = !healSelf"
            >
              <div
                class="w-4 h-4 rounded border-2 flex items-center justify-center shrink-0 transition-all"
                :class="healSelf ? 'border-gold-mid bg-gold-mid/30' : 'border-mist/40'"
              >
                <CheckIcon v-if="healSelf" :size="11" class="text-gold-mid" />
              </div>
              <div class="min-w-0">
                <p class="font-heading text-sm text-ash">Apply to my hit points</p>
                <p class="text-2xs font-body text-mist">Leave off if you're healing an ally.</p>
              </div>
            </button>
          </div>

          <div class="px-5 py-4 border-t border-shadow flex gap-2">
            <button type="button" class="flex-1 btn-secondary text-sm" @click="emit('close')">Cancel</button>
            <button
              type="button"
              class="flex-1 btn-primary text-sm"
              :disabled="amount < 1 || amount > pool"
              @click="confirm"
            >Spend {{ clampedAmount }} HP</button>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { CheckIcon } from 'lucide-vue-next'
import type { Character } from '@/shared/types/character'

const props = defineProps<{ show: boolean; character: Character }>()
const emit = defineEmits<{ close: []; spend: [payload: { amount: number; healSelf: boolean }] }>()

const poolResource = computed(() => props.character.resources.find((r) => r.id === 'lay-on-hands') ?? null)
const pool = computed(() => poolResource.value?.current ?? 0)
const maxPool = computed(() => poolResource.value?.max ?? 0)

const amount = ref(1)
const healSelf = ref(false)

const clampedAmount = computed(() => Math.min(Math.max(1, amount.value || 1), pool.value))

watch(() => props.show, (open) => {
  if (open) { amount.value = Math.min(1, pool.value) || 1; healSelf.value = false }
})

function confirm() {
  const amt = clampedAmount.value
  if (amt < 1 || amt > pool.value) return
  emit('spend', { amount: amt, healSelf: healSelf.value })
}
</script>

<style scoped>
.loh-fade-enter-active, .loh-fade-leave-active { transition: opacity 0.15s ease; }
.loh-fade-enter-from, .loh-fade-leave-to { opacity: 0; }
</style>
