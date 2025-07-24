import { mediaService } from '@tiko/core'
import type { MediaItem } from '@tiko/core'

export class AnalyzeService {
  private workerUrl = 'https://upload-worker.tikocdn.org/analyze'

  async analyzeImage(mediaId: string, imageUrl: string): Promise<{
    title?: string
    description?: string
    tags?: string[]
    categories?: string[]
    error?: string
  }> {
    try {
      // Call the worker endpoint for analysis
      const response = await fetch(this.workerUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          imageUrl: imageUrl
        })
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.details || error.error || 'Analysis failed')
      }

      const data = await response.json()
      
      // Update the media item with the analysis results
      if (data.title || data.description || data.tags?.length || data.categories?.length) {
        const updates: Partial<MediaItem> = {
          ai_analyzed: true
        }
        
        if (data.title) updates.title = data.title
        if (data.description) updates.description = data.description
        if (data.tags?.length) updates.tags = data.tags
        if (data.categories?.length) updates.categories = data.categories
        
        await mediaService.updateMedia(mediaId, updates)
      }

      return data
    } catch (error) {
      console.error('Failed to analyze image:', error)
      return {
        error: error instanceof Error ? error.message : 'Analysis failed'
      }
    }
  }
}

export const analyzeService = new AnalyzeService()