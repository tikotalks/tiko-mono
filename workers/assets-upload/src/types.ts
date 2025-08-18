export interface Env {
  ASSETS_R2_BUCKET: R2Bucket
  SUPABASE_URL: string
  SUPABASE_SERVICE_KEY: string
}

export interface UploadRequest {
  file: File
  title?: string
  description?: string
  categories?: string[]
  tags?: string[]
  isPublic?: boolean
}

export interface UploadResponse {
  success: boolean
  id: string
  filename: string
  originalFilename: string
  url: string
  filePath: string
  fileSize: number
  mimeType: string
  fileExtension: string
  width?: number
  height?: number
  duration?: number
  title: string
  description?: string
  categories: string[]
  tags: string[]
  isPublic: boolean
  createdAt: string
}

export interface AssetRecord {
  id: string
  title: string
  description?: string
  filename: string
  original_filename: string
  file_path: string
  file_size: number
  mime_type: string
  file_extension: string
  categories: string[]
  tags: string[]
  width?: number
  height?: number
  duration?: number
  is_public: boolean
  user_id?: string
}

export interface GetAssetResponse {
  success: boolean
  asset: AssetRecord
}

export interface ListAssetsResponse {
  success: boolean
  assets: AssetRecord[]
  total: number
  page: number
  limit: number
}

export interface UpdateAssetRequest {
  title?: string
  description?: string
  categories?: string[]
  tags?: string[]
  isPublic?: boolean
}

export interface ErrorResponse {
  success: false
  error: string
  details?: string
}