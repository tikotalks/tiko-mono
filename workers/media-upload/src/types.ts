/// <reference types="@cloudflare/workers-types" />

export interface Env {
  R2_BUCKET: R2Bucket
  OPENAI_API_KEY?: string
}

export interface AnalyzeRequest {
  imageUrl: string
  title?: string
}

export interface ImageMetadata {
  title: string
  description: string
  tags: string[]
  categories: string[]
}

export interface DebugInfo {
  hasOpenAIKey: boolean
  visionAttempted: boolean
  visionError: string | null
  visionResponseOk: boolean
  model: string
  hadTitle: boolean
}

export interface AnalyzeResponse extends ImageMetadata {
  success: boolean
  _metadata: {
    timestamp: string
    hasOpenAIKey: boolean
    aiAnalysis: {
      attempted: boolean
      success: boolean
      error: string | null
      model: string
      responseOk: boolean
      hadTitleContext: boolean
    }
    generatedContent: {
      hasTitle: boolean
      hasDescription: boolean
      tagCount: number
      categoryCount: number
    }
  }
}

export interface UploadResponse extends ImageMetadata {
  success: boolean
  filename: string
  url: string
  thumbnail: string
  medium: string
  size: number
  type: string
  _metadata: {
    timestamp: string
    hasOpenAIKey: boolean
    isImage: boolean
    aiAnalysis: {
      attempted: boolean
      success: boolean
      error: string | null
      model: string
      responseOk: boolean
    }
    generatedContent: {
      hasTitle: boolean
      hasDescription: boolean
      tagCount: number
      categoryCount: number
    }
  }
}

export interface OpenAIVisionResponse {
  choices: Array<{
    message: {
      content: string
    }
  }>
}