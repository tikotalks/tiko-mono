export interface SentencePrediction {
  word: string
  score: number
  category?: string
  icon?: string
}

export interface SentencePredictResponse {
  success: boolean
  predictions: SentencePrediction[]
  isInitial: boolean
  generatedByAI?: boolean
  error?: string
}

export interface SentenceSelectRequest {
  lang: string
  path: string[]
  choice: string
  userId?: string
}

export interface SentenceSelectResponse {
  success: boolean
  message?: string
  error?: string
}

export class SentenceService {
  private baseUrl: string

  constructor(baseUrl: string = 'https://tikoapi.org/sentence') {
    this.baseUrl = baseUrl
  }

  /**
   * Get word predictions for the current sentence path
   * @param lang Language code (e.g., 'en', 'fr', 'es')
   * @param path Array of words already selected (empty for initial cards)
   * @returns Promise with predictions
   */
  async getPredictions(lang: string, path: string[] = []): Promise<SentencePredictResponse> {
    try {
      const params = new URLSearchParams({ lang })
      
      if (path.length > 0) {
        params.append('path', path.join(','))
      }

      const response = await fetch(`${this.baseUrl}/predict?${params}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json'
        }
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || `HTTP ${response.status}`)
      }

      return await response.json()
    } catch (error) {
      console.error('Failed to get predictions:', error)
      return {
        success: false,
        predictions: [],
        isInitial: path.length === 0,
        error: error instanceof Error ? error.message : 'Unknown error'
      }
    }
  }

  /**
   * Record that a user selected a specific word
   * @param request Selection details
   * @returns Promise with response
   */
  async recordSelection(request: SentenceSelectRequest): Promise<SentenceSelectResponse> {
    try {
      const response = await fetch(`${this.baseUrl}/select`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(request)
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || `HTTP ${response.status}`)
      }

      return await response.json()
    } catch (error) {
      console.error('Failed to record selection:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      }
    }
  }

  /**
   * Get initial cards for a language
   * @param lang Language code
   * @returns Promise with initial card predictions
   */
  async getInitialCards(lang: string): Promise<SentencePredictResponse> {
    return this.getPredictions(lang, [])
  }

  /**
   * Helper to check if the service is available
   * @returns Promise<boolean>
   */
  async isAvailable(): Promise<boolean> {
    try {
      const response = await fetch(this.baseUrl, {
        method: 'GET',
        signal: AbortSignal.timeout(5000) // 5 second timeout
      })
      return response.ok || response.status === 404 // 404 is expected for base URL
    } catch {
      return false
    }
  }
}

// Export singleton instance
export const sentenceService = new SentenceService()