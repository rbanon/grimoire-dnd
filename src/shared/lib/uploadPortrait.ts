import { supabase } from '@/shared/api/supabase.client'

const BUCKET = 'portraits'
const MAX_PX   = 512   // max width/height in pixels
const QUALITY  = 0.85  // JPEG quality (0–1)

/**
 * Compresses an image file to a JPEG with max MAX_PX × MAX_PX dimensions.
 * Returns a new File (image/jpeg). Falls back to the original file if
 * compression fails (e.g. in environments without canvas support).
 */
export async function compressPortrait(file: File): Promise<File> {
  return new Promise((resolve) => {
    const img = new Image()
    const objectUrl = URL.createObjectURL(file)

    img.onload = () => {
      URL.revokeObjectURL(objectUrl)

      let w = img.naturalWidth
      let h = img.naturalHeight

      if (w > MAX_PX || h > MAX_PX) {
        const ratio = Math.min(MAX_PX / w, MAX_PX / h)
        w = Math.round(w * ratio)
        h = Math.round(h * ratio)
      }

      const canvas = document.createElement('canvas')
      canvas.width  = w
      canvas.height = h
      const ctx = canvas.getContext('2d')
      if (!ctx) { resolve(file); return }
      ctx.drawImage(img, 0, 0, w, h)

      canvas.toBlob(
        (blob) => {
          if (!blob) { resolve(file); return }
          resolve(new File([blob], 'portrait.jpg', { type: 'image/jpeg' }))
        },
        'image/jpeg',
        QUALITY,
      )
    }

    img.onerror = () => { URL.revokeObjectURL(objectUrl); resolve(file) }
    img.src = objectUrl
  })
}

/**
 * Uploads an already-prepared (compressed) blob to Supabase Storage without
 * re-compressing. Use when the source is a portrait data: URL produced by
 * compressPortrait (e.g. the builder draft) to avoid double JPEG re-encoding.
 * Returns the public CDN URL.
 */
export async function uploadPortraitBlob(
  blob: Blob,
  userId: string,
  characterId: string,
): Promise<string> {
  const path = `${userId}/${characterId}.jpg`
  const { error } = await supabase.storage
    .from(BUCKET)
    .upload(path, blob, { upsert: true, contentType: 'image/jpeg' })
  if (error) throw error
  const { data } = supabase.storage.from(BUCKET).getPublicUrl(path)
  return data.publicUrl
}

/**
 * Compresses then uploads a raw portrait file to Supabase Storage.
 * Returns the public CDN URL.
 */
export async function uploadPortrait(
  file: File,
  userId: string,
  characterId: string,
): Promise<string> {
  const compressed = await compressPortrait(file)
  return uploadPortraitBlob(compressed, userId, characterId)
}
