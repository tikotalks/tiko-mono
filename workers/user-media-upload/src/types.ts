export interface Env {
  USER_MEDIA_BUCKET: R2Bucket
  SUPABASE_URL: string
  SUPABASE_SERVICE_KEY: string
}

export interface UploadRequest {
  userId: string
  usageType: 'profile_picture' | 'card_media' | 'general'
  metadata?: Record<string, any>
}

export interface UploadResponse {
  success: boolean
  id?: string
  url?: string
  thumbnailUrl?: string
  mediumUrl?: string
  largeUrl?: string
  error?: string
}

export interface TransformRequest {
  width?: number
  height?: number
  quality?: number
  format?: 'auto' | 'webp' | 'jpeg' | 'png'
  fit?: 'contain' | 'cover' | 'fill' | 'inside' | 'outside'
}

export interface UserMediaRecord {
  id: string
  user_id: string
  filename: string
  original_filename: string
  file_size: number
  mime_type: string
  url: string
  thumbnail_url?: string
  medium_url?: string
  large_url?: string
  width?: number
  height?: number
  metadata: Record<string, any>
  usage_type: string
  created_at: string
  updated_at: string
}