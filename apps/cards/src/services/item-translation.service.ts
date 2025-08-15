import type { ItemTranslation, TranslationRequest, TranslationResponse } from '../models/ItemTranslation.model';
import { cardsSupabaseService } from './supabase-cards.service';

export class ItemTranslationService {
  /**
   * Get translations for an item
   */
  static async getTranslations(itemId: string): Promise<ItemTranslation[]> {
    try {
      return await cardsSupabaseService.getItemTranslations(itemId);
    } catch (error) {
      console.error('Error fetching translations:', error);
      throw error;
    }
  }

  /**
   * Get translation for a specific locale
   */
  static async getTranslation(itemId: string, locale: string): Promise<ItemTranslation | null> {
    try {
      // First try exact locale match
      let translation = await cardsSupabaseService.getItemTranslation(itemId, locale);
      
      // If no exact match and locale has region (e.g., en-GB), try base language (e.g., en)
      if (!translation && locale.includes('-')) {
        const baseLanguage = locale.split('-')[0];
        translation = await cardsSupabaseService.getItemTranslation(itemId, baseLanguage);
      }
      
      return translation;
    } catch (error) {
      console.error('Error fetching translation:', error);
      throw error;
    }
  }

  /**
   * Save or update a translation
   */
  static async saveTranslation(translation: ItemTranslation): Promise<ItemTranslation> {
    try {
      return await cardsSupabaseService.saveItemTranslation(translation);
    } catch (error) {
      console.error('Error saving translation:', error);
      throw error;
    }
  }

  /**
   * Delete a translation
   */
  static async deleteTranslation(id: string): Promise<void> {
    try {
      await cardsSupabaseService.deleteItemTranslation(id);
    } catch (error) {
      console.error('Error deleting translation:', error);
      throw error;
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
    const translationWorkerUrl = import.meta.env.VITE_TRANSLATION_WORKER_URL || 'https://i18n-translator.silvandiepen.workers.dev';

    // If no target languages specified, use common languages (not locales)
    const languages = targetLanguages || ['es', 'fr', 'de', 'it', 'pt', 'nl', 'ja', 'ko', 'zh'];

    try {
      // Translate title
      const titleResponse = await fetch(`${translationWorkerUrl}/translate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          key: `card.title.${Date.now()}`,
          englishTranslation: title,
          languages,
          context: 'Short title for a communication card, max 50 characters'
        } as TranslationRequest),
      });

      if (!titleResponse.ok) {
        throw new Error(`Translation API error: ${titleResponse.statusText}`);
      }

      const titleData: TranslationResponse = await titleResponse.json();

      // Translate speech
      const speechResponse = await fetch(`${translationWorkerUrl}/translate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          key: `card.speech.${Date.now()}`,
          englishTranslation: speech,
          languages,
          context: 'Text to be spoken aloud for a communication card'
        } as TranslationRequest),
      });

      if (!speechResponse.ok) {
        throw new Error(`Translation API error: ${speechResponse.statusText}`);
      }

      const speechData: TranslationResponse = await speechResponse.json();

      if (!titleData.success || !speechData.success) {
        throw new Error('Translation failed');
      }

      return {
        title: titleData.translations,
        speech: speechData.translations,
      };
    } catch (error) {
      console.error('Error generating translations:', error);
      throw error;
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
    );

    try {
      return await cardsSupabaseService.upsertItemTranslations(translationRecords);
    } catch (error) {
      console.error('Error saving multiple translations:', error);
      throw error;
    }
  }
}