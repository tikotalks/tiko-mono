/**
 * Media Analysis Service
 * 
 * Handles AI-powered analysis of media files to generate metadata
 * like titles, descriptions, tags, and categories.
 */

import type { MediaItem } from './media.service'
import { mediaService } from './media-supabase.service'

export interface MediaAnalysisResult {
  success: boolean
  title?: string
  description?: string
  tags?: string[]
  categories?: string[]
  error?: string
  metadata?: {
    aiAnalysis?: {
      attempted: boolean
      success: boolean
      error?: string
      model?: string
    }
  }
}

export class MediaAnalysisService {
  private analyzeUrl = 'https://media.tikocdn.org/analyze'

  /**
   * Analyze a media item using AI to generate metadata
   */
  async analyzeMedia(mediaId: string): Promise<MediaAnalysisResult> {
    try {
      // Get the media item to get the image URL
      const media = await mediaService.getMediaById(mediaId)
      if (!media) {
        return { success: false, error: 'Media not found' }
      }

      // Only analyze images
      if (!media.mime_type.startsWith('image/')) {
        return { success: false, error: 'Only images can be analyzed' }
      }

      // Call the analyze endpoint
      const response = await fetch(this.analyzeUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          imageUrl: media.original_url,
          ...(media.title && { title: media.title }) // Include title if it exists
        })
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Analysis failed' }))
        return { 
          success: false, 
          error: errorData.error || `Analysis failed with status ${response.status}` 
        }
      }

      const analysisResult = await response.json()
      
      // Check if we have metadata to understand what happened
      if (analysisResult._metadata?.aiAnalysis?.error) {
        return {
          success: false,
          error: analysisResult._metadata.aiAnalysis.error,
          metadata: analysisResult._metadata
        }
      }

      // Update the media item with the analysis results if successful
      if (analysisResult.title || analysisResult.description || 
          analysisResult.tags?.length || analysisResult.categories?.length) {
        
        await mediaService.updateMedia(mediaId, {
          title: analysisResult.title || media.title,
          description: analysisResult.description || media.description,
          tags: analysisResult.tags || media.tags,
          categories: analysisResult.categories || media.categories,
          ai_analyzed: true
        })

        return {
          success: true,
          title: analysisResult.title,
          description: analysisResult.description,
          tags: analysisResult.tags,
          categories: analysisResult.categories,
          metadata: analysisResult._metadata
        }
      }

      return {
        success: false,
        error: 'No analysis results generated',
        metadata: analysisResult._metadata
      }

    } catch (error) {
      console.error('Failed to analyze media:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Analysis failed'
      }
    }
  }

  /**
   * Analyze an image by URL directly (without saving to database first)
   * @param imageUrl The URL of the image to analyze
   * @param title Optional title to provide context for better analysis
   */
  async analyzeImageUrl(imageUrl: string, title?: string): Promise<MediaAnalysisResult> {
    try {
      const response = await fetch(this.analyzeUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ 
          imageUrl,
          ...(title && { title }) // Include title if provided
        })
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Analysis failed' }))
        return { 
          success: false, 
          error: errorData.error || `Analysis failed with status ${response.status}` 
        }
      }

      const analysisResult = await response.json()
      
      if (analysisResult._metadata?.aiAnalysis?.error) {
        return {
          success: false,
          error: analysisResult._metadata.aiAnalysis.error,
          metadata: analysisResult._metadata
        }
      }

      return {
        success: true,
        title: analysisResult.title,
        description: analysisResult.description,
        tags: analysisResult.tags,
        categories: analysisResult.categories,
        metadata: analysisResult._metadata
      }

    } catch (error) {
      console.error('Failed to analyze image URL:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Analysis failed'
      }
    }
  }
}

// Export singleton instance
export const mediaAnalysisService = new MediaAnalysisService()