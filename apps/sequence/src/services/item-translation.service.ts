import type {
  ItemTranslation,
  TranslationRequest,
  TranslationResponse,
} from '../models/ItemTranslation.model'
import { sequenceSupabaseService } from './supabase-sequence.service'

export class ItemTranslationService {
  /**
   * Get translations for an item
   */
  static async getTranslations(itemId: string): Promise<ItemTranslation[]> {
    try {
      return await sequenceSupabaseService.getItemTranslations(itemId)
    } catch (error) {
      console.error('Error fetching translations:', error)
      throw error
    }
  }

  /**
   * Get translation for a specific locale
   */
  static async getTranslation(itemId: string, locale: string): Promise<ItemTranslation | null> {
    try {
      // First try exact locale match
      let translation = await sequenceSupabaseService.getItemTranslation(itemId, locale)

      // If no exact match and locale has region (e.g., en-GB), try base language (e.g., en)
      if (!translation && locale.includes('-')) {
        const baseLanguage = locale.split('-')[0]
        translation = await sequenceSupabaseService.getItemTranslation(itemId, baseLanguage)
      }

      return translation
    } catch (error) {
      console.error('Error fetching translation:', error)
      throw error
    }
  }

  /**
   * Save or update a translation
   */
  static async saveTranslation(translation: ItemTranslation): Promise<ItemTranslation> {
    try {
      // Use upsert to handle duplicate key errors
      const { id, ...translationData } = translation
      return await sequenceSupabaseService.upsertSingleTranslation(translationData)
    } catch (error) {
      console.error('Error saving translation:', error)
      throw error
    }
  }

  /**
   * Delete a translation
   */
  static async deleteTranslation(id: string): Promise<void> {
    try {
      await sequenceSupabaseService.deleteItemTranslation(id)
    } catch (error) {
      console.error('Error deleting translation:', error)
      throw error
    }
  }

  /**
   * Auto-generate translations using the translation worker
   */
  static async generateTranslations(
    title: string,
    speech: string,
    targetLanguages?: string[],
    baseLocale: string = 'en'
  ): Promise<{ title: Record<string, string>; speech: Record<string, string> }> {
    const translationWorkerUrl =
      import.meta.env.VITE_TRANSLATION_WORKER_URL ||
      'https://tiko-i18n-translator-production.silvandiepen.workers.dev'

    console.log('[Translation Service] Using worker URL:', translationWorkerUrl)
    console.log('[Translation Service] Target languages:', targetLanguages)

    // If no target languages specified, use common languages (not locales)
    const languages = targetLanguages || ['es', 'fr', 'de', 'it', 'pt', 'nl', 'ja', 'ko', 'zh']

    try {
      // Translate title
      console.log('[Translation Service] Translating title:', title)
      const titleResponse = await fetch(`${translationWorkerUrl}/translate-direct`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          englishTranslation: title,
          languages,
          context: 'Short title for a communication card, max 50 characters',
        }),
      })

      if (!titleResponse.ok) {
        const errorText = await titleResponse.text()
        console.error(
          '[Translation Service] Title translation failed:',
          titleResponse.status,
          errorText
        )
        throw new Error(`Translation API error: ${titleResponse.statusText} - ${errorText}`)
      }

      const titleData: TranslationResponse = await titleResponse.json()

      // Translate speech
      console.log('[Translation Service] Translating speech:', speech)
      const speechResponse = await fetch(`${translationWorkerUrl}/translate-direct`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          englishTranslation: speech,
          languages,
          context: 'Text to be spoken aloud for a communication card',
        }),
      })

      if (!speechResponse.ok) {
        const errorText = await speechResponse.text()
        console.error(
          '[Translation Service] Speech translation failed:',
          speechResponse.status,
          errorText
        )
        throw new Error(`Translation API error: ${speechResponse.statusText} - ${errorText}`)
      }

      const speechData: TranslationResponse = await speechResponse.json()

      if (!titleData.success || !speechData.success) {
        throw new Error('Translation failed')
      }

      return {
        title: titleData.translations,
        speech: speechData.translations,
      }
    } catch (error) {
      console.error('[Translation Service] Error generating translations:', error)

      // Check if it's a network error
      if (error instanceof TypeError && error.message === 'Failed to fetch') {
        console.error('[Translation Service] Network error - possible causes:')
        console.error('- Translation worker is not deployed or accessible')
        console.error('- CORS is blocking the request')
        console.error('- Worker URL:', translationWorkerUrl)

        // Provide a more helpful error message
        throw new Error(
          'Translation service is currently unavailable. Please check if the translation worker is deployed and accessible.'
        )
      }

      throw error
    }
  }

  /**
   * Save multiple translations at once
   */
  static async saveMultipleTranslations(
    itemId: string,
    translations: Record<string, { name?: string; content?: string }>
  ): Promise<ItemTranslation[]> {
    const translationRecords: Omit<ItemTranslation, 'id'>[] = Object.entries(translations).map(
      ([locale, { name, content }]) => ({
        item_id: itemId,
        locale,
        name,
        content,
      })
    )

    try {
      return await sequenceSupabaseService.upsertItemTranslations(translationRecords)
    } catch (error) {
      console.error('Error saving multiple translations:', error)
      throw error
    }
  }
}
