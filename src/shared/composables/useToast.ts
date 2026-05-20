import { ref } from 'vue'

export interface Toast {
  id: string
  message: string
  type: 'error' | 'success' | 'info'
}

const toasts = ref<Toast[]>([])

function dismiss(id: string) {
  toasts.value = toasts.value.filter(t => t.id !== id)
}

function addToast(message: string, type: Toast['type'], duration: number) {
  const id = Math.random().toString(36).slice(2)
  toasts.value.push({ id, message, type })
  setTimeout(() => dismiss(id), duration)
}

export function useToast() {
  return {
    toasts,
    dismiss,
    error:   (msg: string) => addToast(msg, 'error',   6000),
    success: (msg: string) => addToast(msg, 'success', 3000),
    info:    (msg: string) => addToast(msg, 'info',    3000),
  }
}
