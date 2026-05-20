import { supabase } from '@/shared/api/supabase.client'

const BUCKET = 'portraits'

export async function uploadPortrait(
  file: File,
  userId: string,
  characterId: string,
): Promise<string> {
  const ext = file.type.split('/')[1]?.split('+')[0] ?? 'jpg'
  const path = `${userId}/${characterId}.${ext}`
  const { error } = await supabase.storage
    .from(BUCKET)
    .upload(path, file, { upsert: true, contentType: file.type })
  if (error) throw error
  const { data } = supabase.storage.from(BUCKET).getPublicUrl(path)
  return data.publicUrl
}
