import { mediaService } from '@tiko/core'

// Upload service that uses Cloudflare Worker and saves via core media service
export class UploadService {
  private workerUrl = 'https://upload-worker.tikocdn.org/upload'

  async uploadFile(file: File): Promise<{ url: string; id: string; aiAnalysisMessage?: string }> {
    // First upload to R2 via Worker
    const formData = new FormData()
    formData.append('file', file)

    const response = await fetch(this.workerUrl, {
      method: 'POST',
      body: formData
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.details || error.error || 'Upload failed')
    }

    const data = await response.json()
    
    console.log('Worker response:', data) // Debug log
    
    // Check for AI analysis issues and prepare user message
    let aiAnalysisMessage: string | undefined
    
    if (data._metadata) {
      console.log('Upload metadata:', data._metadata)
      
      if (!data._metadata.hasOpenAIKey) {
        console.error('⚠️ OpenAI API key not configured in worker')
        aiAnalysisMessage = 'Image uploaded successfully, but AI analysis is unavailable (no API key configured)'
      } else if (data._metadata.aiAnalysis?.error) {
        console.error('⚠️ AI Analysis failed:', data._metadata.aiAnalysis.error)
        
        // Parse specific error types for user-friendly messages
        if (data._metadata.aiAnalysis.error.includes('exceeded your current quota')) {
          aiAnalysisMessage = 'Image uploaded successfully, but AI analysis failed due to OpenAI quota limit. You can analyze it later using the Analyze button in image details.'
        } else if (data._metadata.aiAnalysis.error.includes('Rate limit')) {
          aiAnalysisMessage = 'Image uploaded successfully, but AI analysis hit rate limit. Try analyzing it again in a few minutes.'
        } else {
          aiAnalysisMessage = 'Image uploaded successfully, but AI analysis failed. You can try again later.'
        }
      }
    }
    
    // Save to database via core service
    try {
      const mediaData = {
        filename: data.filename || file.name,
        original_filename: file.name,
        file_size: file.size,
        mime_type: file.type,
        original_url: data.original || data.url,
        width: data.width || null,
        height: data.height || null,
        name: data.name || file.name.replace(/\.[^.]+$/, ''),
        title: data.title || file.name.replace(/\.[^.]+$/, ''),
        description: data.description || '',
        tags: data.tags || [],
        categories: data.categories || [],
        ai_analyzed: !!(data.description || (data.tags && data.tags.length > 0))
      }
      
      console.log('Saving to database:', mediaData) // Debug log
      
      const media = await mediaService.saveMedia(mediaData)

      return { 
        url: data.original || data.url,
        id: media.id,
        aiAnalysisMessage
      }
    } catch (dbError) {
      console.error('Failed to save to database:', dbError)
      // Don't fail the upload if DB save fails
      return { 
        url: data.url,
        id: '',
        aiAnalysisMessage
      }
    }
  }

  async getMediaList() {
    try {
      return await mediaService.getMediaList()
    } catch (error) {
      console.error('Failed to fetch media:', error)
      return []
    }
  }

  async deleteMedia(id: string) {
    return await mediaService.deleteMedia(id)
  }
}

export const uploadService = new UploadService()