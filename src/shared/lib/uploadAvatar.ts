import { supabase } from '@/shared/api/supabase.client'

const BUCKET = 'portraits'
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif']
const MAX_SIZE = 1_048_576 // 1 MB — matches the portraits bucket limit

export function validateAvatarFile(file: File): string | null {
  if (!ALLOWED_TYPES.includes(file.type)) return 'Only JPG, PNG, WebP, or GIF images are allowed.'
  if (file.size > MAX_SIZE) return 'Image must be under 1 MB.'
  return null
}

export async function uploadAvatar(file: File, userId: string): Promise<string> {
  const ext = file.type.split('/')[1]?.split('+')[0] ?? 'jpg'
  const path = `${userId}/avatar.${ext}`
  const { error } = await supabase.storage
    .from(BUCKET)
    .upload(path, file, { upsert: true, contentType: file.type })
  if (error) throw error
  const { data } = supabase.storage.from(BUCKET).getPublicUrl(path)
  return data.publicUrl
}
