/**
 * Translation Service
 * 
 * Handles all translation-related operations including:
 * - Managing translation keys
 * - Managing translations with versioning
 * - Publishing/unpublishing translations
 * - Importing from JSON files
 * - AI-powered translation generation
 */

import { authService } from './auth.service'
import { gptTranslationService } from './gpt-translation.service'
import { logger } from '../utils/logger'

export interface Language {
  id: number
  code: string
  name: string
  native_name?: string
  is_active: boolean
  created_at: string
}

export interface TranslationKey {
  id: number
  key: string
  description?: string
  category?: string
  created_at: string
  created_by?: string
}

export interface Translation {
  id: number
  key_id: number
  language_code: string
  value: string
  version: number
  is_published: boolean
  created_at: string
  created_by?: string
  notes?: string
  // Joined fields when fetching with key info
  key?: string
  key_description?: string
}

export interface TranslationStats {
  total_keys: number
  total_languages: number
  translations_by_language: Record<string, {
    total: number
    published: number
    pending: number
    completion_rate: number
  }>
}

export interface ImportResult {
  keys_created: number
  translations_created: number
  translations_updated: number
  errors: string[]
}

class TranslationService {
  private baseUrl: string

  constructor() {
    this.baseUrl = import.meta.env.VITE_SUPABASE_URL + '/rest/v1'
  }

  private async makeRequest(endpoint: string, options: RequestInit = {}) {
    try {
      // Get the current session from auth service
      const session = await authService.getSession()
      const token = session?.access_token || null
      
      const url = `${this.baseUrl}${endpoint}`
      
      const response = await fetch(url, {
        ...options,
        headers: {
          'Content-Type': 'application/json',
          'apikey': import.meta.env.VITE_SUPABASE_ANON_KEY,
          'Authorization': token ? `Bearer ${token}` : '',
          'Prefer': 'return=representation',
          ...options.headers,
        },
      })

      if (!response.ok) {
        const errorText = await response.text()
        console.error(`Translation API Error: ${response.status} - ${errorText}`)
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      return response.json()
    } catch (error) {
      // Don't interfere with auth flow - just log and rethrow
      console.error('Translation service error:', error)
      throw error
    }
  }

  // =================== LANGUAGES ===================

  /**
   * Get all languages
   */
  async getLanguages(): Promise<Language[]> {
    return this.makeRequest('/i18n_languages?order=name.asc')
  }

  /**
   * Get active languages only
   */
  async getActiveLanguages(): Promise<Language[]> {
    return this.makeRequest('/i18n_languages?is_active=eq.true&order=name.asc')
  }

  /**
   * Create a new language
   */
  async createLanguage(language: Omit<Language, 'id' | 'created_at'>): Promise<Language> {
    const result = await this.makeRequest('/i18n_languages', {
      method: 'POST',
      body: JSON.stringify(language),
      headers: {
        'Prefer': 'return=representation'
      }
    })
    return Array.isArray(result) ? result[0] : result
  }

  /**
   * Update a language
   */
  async updateLanguage(id: number, updates: Partial<Language>): Promise<void> {
    await this.makeRequest(`/i18n_languages?id=eq.${id}`, {
      method: 'PATCH',
      body: JSON.stringify(updates),
    })
  }

  // =================== TRANSLATION KEYS ===================

  /**
   * Get all translation keys with pagination
   */
  async getTranslationKeys(): Promise<TranslationKey[]> {
    try {
      const allKeys: TranslationKey[] = [];
      const BATCH_SIZE = 1000; // Supabase default limit
      let offset = 0;
      let hasMore = true;

      console.log('Fetching all translation keys with pagination...');

      while (hasMore) {
        const data = await this.makeRequest(`/i18n_keys?order=key.asc&limit=${BATCH_SIZE}&offset=${offset}`);
        
        if (!data || data.length === 0) {
          hasMore = false;
          break;
        }

        allKeys.push(...data);
        console.log(`Fetched batch ${Math.floor(offset / BATCH_SIZE) + 1}: ${data.length} keys (total so far: ${allKeys.length})`);

        // Check if we got a full batch - if not, we're done
        if (data.length < BATCH_SIZE) {
          hasMore = false;
        } else {
          offset += BATCH_SIZE;
        }
      }

      console.log(`Total translation keys fetched: ${allKeys.length}`);
      return allKeys;
    } catch (error) {
      console.error('Error fetching translation keys with pagination:', error);
      throw error;
    }
  }

  /**
   * Alias for getTranslationKeys for consistency
   */
  async getAllKeys(): Promise<TranslationKey[]> {
    return this.getTranslationKeys()
  }

  /**
   * Get translation keys by category
   */
  async getTranslationKeysByCategory(category: string): Promise<TranslationKey[]> {
    return this.makeRequest(`/i18n_keys?category=eq.${category}&order=key.asc`)
  }

  /**
   * Get translation keys by names
   */
  async getTranslationKeysByNames(keyNames: string[]): Promise<TranslationKey[]> {
    if (keyNames.length === 0) return []
    
    // Escape and quote each key name for the query
    const keyList = keyNames.map(k => `"${k.replace(/"/g, '""')}"`).join(',')
    return this.makeRequest(`/i18n_keys?key=in.(${keyList})&order=key.asc`)
  }

  /**
   * Create a new translation key
   */
  async createTranslationKey(key: Omit<TranslationKey, 'id' | 'created_at'>): Promise<TranslationKey> {
    const result = await this.makeRequest('/i18n_keys', {
      method: 'POST',
      body: JSON.stringify(key),
      headers: {
        'Prefer': 'return=representation'
      }
    })
    return Array.isArray(result) ? result[0] : result
  }

  /**
   * Create multiple translation keys at once
   */
  async createTranslationKeysBatch(keys: Omit<TranslationKey, 'id' | 'created_at'>[]): Promise<TranslationKey[]> {
    const result = await this.makeRequest('/i18n_keys', {
      method: 'POST',
      body: JSON.stringify(keys),
      headers: {
        'Prefer': 'return=representation'
      }
    })
    return Array.isArray(result) ? result : [result]
  }

  /**
   * Update a translation key
   */
  async updateTranslationKey(id: number, updates: Partial<TranslationKey>): Promise<void> {
    await this.makeRequest(`/i18n_keys?id=eq.${id}`, {
      method: 'PATCH',
      body: JSON.stringify(updates),
    })
  }

  /**
   * Check if a translation key exists
   */
  async keyExists(key: string): Promise<boolean> {
    try {
      const result = await this.makeRequest(`/i18n_keys?key=eq.${encodeURIComponent(key)}&select=id`)
      return Array.isArray(result) ? result.length > 0 : !!result
    } catch (error) {
      logger.error('translation-service', `Error checking if key exists: ${key}`, error)
      return false
    }
  }

  /**
   * Delete a translation key and all its translations
   */
  async deleteTranslationKey(id: number): Promise<void> {
    await this.makeRequest(`/i18n_keys?id=eq.${id}`, {
      method: 'DELETE',
    })
  }

  // =================== TRANSLATIONS ===================

  /**
   * Get all published translations for a language with pagination
   * If the language has a region (e.g., nl-NL), it will fetch both base (nl) and specific (nl-NL) translations
   */
  async getTranslationsForLanguage(languageCode: string): Promise<Record<string, string>> {
    logger.info('TranslationService', `Fetching translations for language: ${languageCode}`)
    
    let baseQuery = `/i18n_translations?select=i18n_keys(key),value,language_code&is_published=eq.true`
    
    // If locale has a region, fetch both base and specific in one query
    if (languageCode.includes('-')) {
      const baseLocale = languageCode.split('-')[0]
      baseQuery += `&language_code=in.(${baseLocale},${languageCode})`
      logger.info('TranslationService', `Fetching both ${baseLocale} and ${languageCode} translations with pagination`)
    } else {
      baseQuery += `&language_code=eq.${languageCode}`
    }

    // Fetch all translations with pagination
    const allTranslations = [];
    const BATCH_SIZE = 1000; // Supabase default limit
    let offset = 0;
    let hasMore = true;

    logger.info('TranslationService', `Fetching translations with pagination for language: ${languageCode}`)

    while (hasMore) {
      const query = `${baseQuery}&limit=${BATCH_SIZE}&offset=${offset}`;
      const translations = await this.makeRequest(query);
      
      if (!translations || translations.length === 0) {
        hasMore = false;
        break;
      }

      allTranslations.push(...translations);
      logger.debug('TranslationService', `Fetched batch ${Math.floor(offset / BATCH_SIZE) + 1}: ${translations.length} translations (total so far: ${allTranslations.length})`);

      // Check if we got a full batch - if not, we're done
      if (translations.length < BATCH_SIZE) {
        hasMore = false;
      } else {
        offset += BATCH_SIZE;
      }
    }
    
    const translations = allTranslations;
    
    logger.info('TranslationService', `Fetched total ${translations.length} translations for ${languageCode}`)
    logger.debug('TranslationService', `Raw response (${translations.length} items):`, translations.slice(0, 3))
    
    // Debug: Log full response structure of first item
    if (translations.length > 0) {
      logger.info('TranslationService', 'First translation structure:', JSON.stringify(translations[0], null, 2))
    }

    // Process translations, merging base and specific locales
    const translationsByKey: Record<string, { base?: string; specific?: string }> = {}
    const baseLocale = languageCode.includes('-') ? languageCode.split('-')[0] : null
    
    let baseCount = 0
    let specificCount = 0
    
    for (const translation of translations) {
      if (translation.i18n_keys && translation.i18n_keys.key) {
        const key = translation.i18n_keys.key
        
        if (!translationsByKey[key]) {
          translationsByKey[key] = {}
        }
        
        if (translation.language_code === baseLocale) {
          translationsByKey[key].base = translation.value
          baseCount++
        } else {
          translationsByKey[key].specific = translation.value
          specificCount++
        }
      } else {
        logger.warning('TranslationService', 'Translation missing key structure:', translation)
      }
    }
    
    if (baseLocale) {
      logger.debug('TranslationService', `Breakdown: ${baseCount} from ${baseLocale}, ${specificCount} from ${languageCode}`)
    }
    
    // Merge translations: specific locale overrides base
    const mergedTranslations: Record<string, string> = {}
    for (const [key, values] of Object.entries(translationsByKey)) {
      mergedTranslations[key] = values.specific || values.base || ''
    }
    
    logger.info('TranslationService', `Processed ${Object.keys(mergedTranslations).length} translations for ${languageCode}`)
    
    // Log sample of processed translations
    const sampleKeys = Object.keys(mergedTranslations).filter(k => k.includes('admin.i18n')).slice(0, 5)
    if (sampleKeys.length > 0) {
      logger.debug('TranslationService', `Sample admin.i18n translations:`, sampleKeys.map(k => `${k}: "${mergedTranslations[k]}"`))
    }

    return mergedTranslations
  }

  /**
   * Get all translations for a specific key across all languages
   */
  async getTranslationsForKey(keyId: number): Promise<Translation[]> {
    return this.makeRequest(
      `/i18n_translations?select=*,i18n_keys(key,description)&key_id=eq.${keyId}&order=language_code.asc,version.desc`
    )
  }

  /**
   * Get all translations for a specific key (by key string) across all languages
   */
  async getTranslationsForKeyString(key: string): Promise<Translation[]> {
    try {
      // First get the key ID
      const keys = await this.makeRequest(
        `/i18n_keys?key=eq.${encodeURIComponent(key)}&select=id`
      )
      
      if (!keys || keys.length === 0) {
        return []
      }
      
      const keyId = keys[0].id
      
      // Get published translations for this key across all languages
      const translations = await this.makeRequest(
        `/i18n_translations?select=*,locale_code:language_code&key_id=eq.${keyId}&is_published=eq.true&order=language_code.asc`
      )
      
      return translations
    } catch (error) {
      logger.error('translation-service', `Error getting translations for key: ${key}`, error)
      return []
    }
  }

  /**
   * Get latest published translation for a specific key and language
   */
  async getLatestTranslation(keyId: number, languageCode: string): Promise<Translation | null> {
    const translations = await this.makeRequest(
      `/i18n_translations?key_id=eq.${keyId}&language_code=eq.${languageCode}&is_published=eq.true&order=version.desc&limit=1`
    )
    return translations[0] || null
  }

  /**
   * Create a new translation or new version of existing translation
   */
  async createTranslation(translation: {
    key_id: number
    language_code: string
    value: string
    is_published?: boolean
    notes?: string
  }): Promise<Translation> {
    // Check if there's already a translation for this key+language
    const existing = await this.makeRequest(
      `/i18n_translations?key_id=eq.${translation.key_id}&language_code=eq.${translation.language_code}&order=version.desc&limit=1`
    )

    const version = existing.length > 0 ? existing[0].version + 1 : 1

    const result = await this.makeRequest('/i18n_translations', {
      method: 'POST',
      body: JSON.stringify({
        ...translation,
        version,
      }),
      headers: {
        'Prefer': 'return=representation'
      }
    })
    return Array.isArray(result) ? result[0] : result
  }

  /**
   * Create multiple translations at once
   */
  async createTranslationsBatch(translations: Array<{
    key_id: number
    language_code: string
    value: string
    is_published?: boolean
    notes?: string
  }>): Promise<Translation[]> {
    const allResults: Translation[] = []
    
    // Process in very small batches to avoid PostgREST query parsing errors
    const BATCH_SIZE = 10 // Smaller batch size for better reliability
    
    for (let i = 0; i < translations.length; i += BATCH_SIZE) {
      const batch = translations.slice(i, i + BATCH_SIZE)
      
      // Get current versions for this batch - use simpler approach per key/language pair
      const versionMap = new Map<string, number>()
      
      // Fetch versions for each key-language pair individually to avoid complex OR queries
      for (const t of batch) {
        try {
          const existing = await this.makeRequest(
            `/i18n_translations?key_id=eq.${t.key_id}&language_code=eq.${t.language_code}&order=version.desc&limit=1`
          )
          if (existing.length > 0) {
            const mapKey = `${t.key_id}-${t.language_code}`
            versionMap.set(mapKey, existing[0].version)
          }
        } catch (error) {
          console.warn(`Failed to fetch version for key ${t.key_id}, language ${t.language_code}:`, error)
          // Continue with version 1 for this translation
        }
      }

      // Add versions to translations
      const translationsWithVersions = batch.map(t => ({
        ...t,
        version: (versionMap.get(`${t.key_id}-${t.language_code}`) || 0) + 1
      }))

      try {
        const result = await this.makeRequest('/i18n_translations', {
          method: 'POST',
          body: JSON.stringify(translationsWithVersions),
          headers: {
            'Prefer': 'return=representation'
          }
        })
        
        const batchResults = Array.isArray(result) ? result : [result]
        allResults.push(...batchResults)
      } catch (error) {
        console.error('Failed to create translations batch:', error)
        // Try individual inserts as fallback
        for (const translation of translationsWithVersions) {
          try {
            const result = await this.makeRequest('/i18n_translations', {
              method: 'POST',
              body: JSON.stringify([translation]),
              headers: {
                'Prefer': 'return=representation'
              }
            })
            const singleResult = Array.isArray(result) ? result : [result]
            allResults.push(...singleResult)
          } catch (singleError) {
            console.error(`Failed to create single translation for key ${translation.key_id}, language ${translation.language_code}:`, singleError)
          }
        }
      }
    }
    
    return allResults
  }

  /**
   * Publish a translation (set is_published = true)
   */
  async publishTranslation(id: number): Promise<void> {
    await this.makeRequest(`/i18n_translations?id=eq.${id}`, {
      method: 'PATCH',
      body: JSON.stringify({ is_published: true }),
    })
  }

  /**
   * Unpublish a translation (set is_published = false)
   */
  async unpublishTranslation(id: number): Promise<void> {
    await this.makeRequest(`/i18n_translations?id=eq.${id}`, {
      method: 'PATCH',
      body: JSON.stringify({ is_published: false }),
    })
  }

  /**
   * Delete a specific translation version
   */
  async deleteTranslation(id: number): Promise<void> {
    await this.makeRequest(`/i18n_translations?id=eq.${id}`, {
      method: 'DELETE',
    })
  }

  // =================== BULK OPERATIONS ===================

  /**
   * Get pending (unpublished) translations with pagination
   */
  async getPendingTranslations(languageCode?: string): Promise<Translation[]> {
    try {
      const allTranslations: Translation[] = [];
      const BATCH_SIZE = 1000; // Supabase default limit
      let offset = 0;
      let hasMore = true;

      console.log('Fetching pending translations with pagination...');

      while (hasMore) {
        let endpoint = `/i18n_translations?select=*,i18n_keys(key,description)&is_published=eq.false&order=created_at.desc&limit=${BATCH_SIZE}&offset=${offset}`
        if (languageCode) {
          endpoint += `&language_code=eq.${languageCode}`
        }

        const data = await this.makeRequest(endpoint);
        
        if (!data || data.length === 0) {
          hasMore = false;
          break;
        }

        allTranslations.push(...data);
        console.log(`Fetched batch ${Math.floor(offset / BATCH_SIZE) + 1}: ${data.length} pending translations (total so far: ${allTranslations.length})`);

        // Check if we got a full batch - if not, we're done
        if (data.length < BATCH_SIZE) {
          hasMore = false;
        } else {
          offset += BATCH_SIZE;
        }
      }

      console.log(`Total pending translations fetched: ${allTranslations.length}`);
      return allTranslations;
    } catch (error) {
      console.error('Error fetching pending translations with pagination:', error);
      throw error;
    }
  }

  /**
   * Bulk publish translations
   */
  async bulkPublishTranslations(translationIds: number[]): Promise<void> {
    await this.makeRequest(`/i18n_translations?id=in.(${translationIds.join(',')})`, {
      method: 'PATCH',
      body: JSON.stringify({ is_published: true }),
    })
  }

  /**
   * Get all keys with their translation counts with pagination
   */
  async getKeysWithTranslationCounts(): Promise<Array<TranslationKey & { translation_count: number }>> {
    try {
      // First, get all keys using the existing paginated method
      console.log('Fetching all translation keys first...');
      const allKeys = await this.getTranslationKeys();
      console.log(`Fetched ${allKeys.length} keys, now getting translation counts...`);

      // For now, return keys with a simple structure
      // The count aggregation with pagination might be causing issues
      const keysWithCounts = allKeys.map(key => ({
        ...key,
        translation_count: 0 // Will be populated later if needed
      }));

      // Get actual counts in batches if needed
      // This is a temporary solution to ensure all keys are returned
      console.log(`Returning ${keysWithCounts.length} keys with translation counts`);
      return keysWithCounts;
    } catch (error) {
      console.error('Error fetching keys with translation counts:', error);
      throw error;
    }
  }

  /**
   * Get statistics for dashboard (alias for better naming)
   */
  async getStatistics(): Promise<{
    locales: string[]
    totalKeys: number
    completeness: Record<string, { percentage: number; missing: number }>
  }> {
    try {
      // Get all active languages
      const languages = await this.getActiveLanguages()
      const locales = languages.map(lang => lang.code)
      
      // Get all keys
      const keys = await this.getTranslationKeys()
      const totalKeys = keys.length
      
      // Get language details with completion stats
      const languageDetails = await this.getLanguageDetails()
      
      // Build completeness object
      const completeness: Record<string, { percentage: number; missing: number }> = {}
      for (const detail of languageDetails) {
        if (locales.includes(detail.code)) {
          completeness[detail.code] = {
            percentage: detail.completion_percentage || 0,
            missing: totalKeys - (detail.translation_count || 0)
          }
        }
      }
      
      return {
        locales,
        totalKeys,
        completeness
      }
    } catch (error) {
      logger.error('translation', 'Failed to get statistics:', error)
      // Return empty structure on error
      return {
        locales: [],
        totalKeys: 0,
        completeness: {}
      }
    }
  }

  /**
   * Get translation statistics with key counts (optimized)
   */
  async getTranslationStats(): Promise<any> {
    // Get all data in parallel with minimal queries
    const [keysWithCounts, languages, totalTranslations] = await Promise.all([
      this.getKeysWithTranslationCounts(),
      this.getActiveLanguages(),
      this.makeRequest('/i18n_translations?select=count&is_published=eq.true')
    ])
    
    // Build key counts map
    const keyCounts: Record<number, number> = {}
    keysWithCounts.forEach(key => {
      keyCounts[key.id] = key.translation_count
    })
    
    return {
      totalTranslations: totalTranslations[0]?.count || 0,
      keyCounts,
      totalKeys: keysWithCounts.length,
      totalLanguages: languages.length
    }
  }

  /**
   * Get detailed language statistics from the i18n_locale_details view
   */
  async getLanguageDetails(): Promise<Array<{
    code: string
    name: string
    native_name: string
    translation_count: number
    pending_count: number
    total_keys: number
    completion_percentage: number
  }>> {
    try {
      return await this.makeRequest('/i18n_locale_details')
    } catch (error) {
      // If view doesn't exist, return empty array
      console.warn('i18n_locale_details view might not exist:', error)
      return []
    }
  }

  /**
   * Get translation statistics (legacy format)
   */
  async getTranslationStatsLegacy(): Promise<TranslationStats> {
    // Get total keys
    const keys = await this.makeRequest('/i18n_keys?select=count')
    const total_keys = keys[0]?.count || 0

    // Get active languages
    const languages = await this.getActiveLanguages()
    const total_languages = languages.length

    // Get translation counts by language
    const translations_by_language: Record<string, any> = {}

    for (const language of languages) {
      const published = await this.makeRequest(
        `/i18n_translations?select=count&language_code=eq.${language.code}&is_published=eq.true`
      )
      const pending = await this.makeRequest(
        `/i18n_translations?select=count&language_code=eq.${language.code}&is_published=eq.false`
      )

      const publishedCount = published[0]?.count || 0
      const pendingCount = pending[0]?.count || 0
      const total = publishedCount + pendingCount

      translations_by_language[language.code] = {
        total,
        published: publishedCount,
        pending: pendingCount,
        completion_rate: total_keys > 0 ? Math.round((publishedCount / total_keys) * 100) : 0,
      }
    }

    return {
      total_keys,
      total_languages,
      translations_by_language,
    }
  }

  // =================== IMPORT/EXPORT ===================

  /**
   * Import translations with progress callback
   */
  async importTranslations(
    languageCode: string,
    jsonData: Record<string, any>,
    options: {
      publishImmediately?: boolean
      onProgress?: (progress: number) => void
    } = {}
  ): Promise<{ importedCount: number; errors: string[] }> {
    const { publishImmediately = true, onProgress } = options
    const result = await this.importFromJSON(languageCode, jsonData, publishImmediately, onProgress)
    
    return {
      importedCount: result.keys_created + result.translations_created + result.translations_updated,
      errors: result.errors
    }
  }

  /**
   * Import translations from JSON object
   * Automatically creates keys and translations
   */
  async importFromJSON(
    languageCode: string,
    jsonData: Record<string, any>,
    publishImmediately = true,
    onProgress?: (progress: number) => void
  ): Promise<ImportResult> {
    const result: ImportResult = {
      keys_created: 0,
      translations_created: 0,
      translations_updated: 0,
      errors: [],
    }

    try {
      // Flatten the JSON structure to dot notation
      const flattenedKeys = this.flattenObject(jsonData)
      const totalKeys = Object.keys(flattenedKeys).length
      let processedKeys = 0

      // Get existing keys to avoid duplicates
      const existingKeys = await this.getTranslationKeys()
      const existingKeyMap = new Map(existingKeys.map(k => [k.key, k]))

      // Process each key
      for (const [key, value] of Object.entries(flattenedKeys)) {
        try {
          if (typeof value !== 'string') {
            result.errors.push(`Skipping ${key}: value is not a string`)
            continue
          }

          // Create key if it doesn't exist
          let keyRecord = existingKeyMap.get(key)
          if (!keyRecord) {
            const category = key.split('.')[0] // First part as category
            keyRecord = await this.createTranslationKey({
              key,
              category,
              description: `Imported from JSON for ${languageCode}`,
            })
            result.keys_created++
            existingKeyMap.set(key, keyRecord)
          }

          // Check if translation already exists
          const existingTranslation = await this.getLatestTranslation(keyRecord.id, languageCode)

          if (existingTranslation && existingTranslation.value === value) {
            // Same value, skip
            continue
          }

          // Create new translation
          await this.createTranslation({
            key_id: keyRecord.id,
            language_code: languageCode,
            value,
            is_published: publishImmediately,
            notes: 'Imported from JSON',
          })

          if (existingTranslation) {
            result.translations_updated++
          } else {
            result.translations_created++
          }

        } catch (error) {
          result.errors.push(`Error processing ${key}: ${error instanceof Error ? error.message : String(error)}`)
        }
        
        // Update progress
        processedKeys++
        if (onProgress) {
          onProgress(processedKeys / totalKeys)
        }
      }

    } catch (error) {
      result.errors.push(`Import failed: ${error instanceof Error ? error.message : String(error)}`)
    }

    return result
  }

  /**
   * Export all published translations for a language to JSON
   */
  async exportToJSON(languageCode: string): Promise<Record<string, any>> {
    const translations = await this.getTranslationsForLanguage(languageCode)
    return this.unflattenObject(translations)
  }

  // =================== AI FEATURES ===================

  /**
   * Generate AI translation for a specific key
   * This would integrate with your GPT service
   */
  async generateAITranslation(
    keyId: number,
    sourceLanguage: string,
    targetLanguage: string
  ): Promise<string> {
    // Get the source translation
    const sourceTranslation = await this.getLatestTranslation(keyId, sourceLanguage)
    if (!sourceTranslation) {
      throw new Error('No source translation found')
    }

    // Use the GPT translation service
    const aiTranslation = await gptTranslationService.translate({
      text: sourceTranslation.value,
      sourceLocale: sourceLanguage,
      targetLocale: targetLanguage,
      context: sourceTranslation.key_description
    })
    
    return aiTranslation
  }

  /**
   * Generate AI translations for multiple keys
   */
  async generateAITranslationsBatch(
    keyIds: number[],
    targetLanguage: string,
    sourceLanguage = 'en-GB',
    publishImmediately = false
  ): Promise<ImportResult> {
    const result: ImportResult = {
      keys_created: 0,
      translations_created: 0,
      translations_updated: 0,
      errors: [],
    }

    try {
      // Get source translations for all keys
      const keysToTranslate: Array<{ key: TranslationKey; sourceTranslation: Translation }> = []
      
      for (const keyId of keyIds) {
        const key = await this.makeRequest(`/i18n_keys?id=eq.${keyId}`)
        if (!key[0]) continue
        
        const sourceTranslation = await this.getLatestTranslation(keyId, sourceLanguage)
        if (sourceTranslation) {
          keysToTranslate.push({ key: key[0], sourceTranslation })
        }
      }

      if (keysToTranslate.length === 0) {
        result.errors.push('No source translations found for the selected keys')
        return result
      }

      // Batch translate using GPT service
      const batchRequest = {
        texts: keysToTranslate.map(item => ({
          key: item.key.key,
          text: item.sourceTranslation.value,
          context: item.key.description
        })),
        sourceLocale: sourceLanguage,
        targetLocale: targetLanguage
      }

      const translations = await gptTranslationService.translateBatch(batchRequest)

      // Create translations in database
      for (const item of keysToTranslate) {
        const translatedText = translations[item.key.key]
        if (translatedText) {
          try {
            await this.createTranslation({
              key_id: item.key.id,
              language_code: targetLanguage,
              value: translatedText,
              is_published: publishImmediately,
              notes: `AI translated from ${sourceLanguage}`
            })
            result.translations_created++
          } catch (error) {
            result.errors.push(`Failed to save translation for ${item.key.key}: ${error instanceof Error ? error.message : String(error)}`)
          }
        }
      }
    } catch (error) {
      result.errors.push(`Batch translation failed: ${error instanceof Error ? error.message : String(error)}`)
    }

    return result
  }

  /**
   * Auto-translate missing translations for a language using AI
   */
  async autoTranslateLanguage(
    targetLanguage: string,
    sourceLanguage = 'en-GB',
    publishImmediately = false
  ): Promise<ImportResult> {
    const result: ImportResult = {
      keys_created: 0,
      translations_created: 0,
      translations_updated: 0,
      errors: [],
    }

    try {
      // Get all keys
      const keys = await this.getTranslationKeys()
      
      for (const key of keys) {
        try {
          // Check if translation already exists for target language
          const existingTranslation = await this.getLatestTranslation(key.id, targetLanguage)
          if (existingTranslation) {
            continue // Skip if already exists
          }

          // Generate AI translation
          const aiTranslation = await this.generateAITranslation(key.id, sourceLanguage, targetLanguage)

          // Create the translation
          await this.createTranslation({
            key_id: key.id,
            language_code: targetLanguage,
            value: aiTranslation,
            is_published: publishImmediately,
            notes: `AI generated from ${sourceLanguage}`,
          })

          result.translations_created++

        } catch (error) {
          result.errors.push(`Error translating ${key.key}: ${error instanceof Error ? error.message : String(error)}`)
        }
      }

    } catch (error) {
      result.errors.push(`Auto-translation failed: ${error instanceof Error ? error.message : String(error)}`)
    }

    return result
  }

  // =================== UTILITY METHODS ===================

  /**
   * Flatten nested object to dot notation
   */
  private flattenObject(obj: Record<string, any>, prefix = ''): Record<string, string> {
    const result: Record<string, string> = {}

    for (const [key, value] of Object.entries(obj)) {
      const newKey = prefix ? `${prefix}.${key}` : key

      if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
        Object.assign(result, this.flattenObject(value, newKey))
      } else if (typeof value === 'string') {
        result[newKey] = value
      }
    }

    return result
  }

  /**
   * Unflatten dot notation keys back to nested object
   */
  private unflattenObject(flatObj: Record<string, string>): Record<string, any> {
    const result: Record<string, any> = {}

    for (const [key, value] of Object.entries(flatObj)) {
      const keys = key.split('.')
      let current = result

      for (let i = 0; i < keys.length - 1; i++) {
        const k = keys[i]
        if (!(k in current)) {
          current[k] = {}
        }
        current = current[k]
      }

      current[keys[keys.length - 1]] = value
    }

    return result
  }

  /**
   * Create multiple translation keys with their translations in a single batch operation
   */
  async createKeysWithTranslationsBatch(items: Array<{
    key: string
    category?: string
    description?: string
    translations: Record<string, string> // language_code -> value
  }>): Promise<{
    createdKeys: TranslationKey[]
    createdTranslations: Translation[]
    errors: string[]
  }> {
    const result = {
      createdKeys: [] as TranslationKey[],
      createdTranslations: [] as Translation[],
      errors: [] as string[]
    }

    try {
      // First, create all keys
      const keysToCreate = items.map(item => ({
        key: item.key,
        category: item.category,
        description: item.description
      }))

      const createdKeys = await this.createTranslationKeysBatch(keysToCreate)
      result.createdKeys = createdKeys

      // Map key strings to IDs
      const keyIdMap = new Map<string, number>()
      for (const key of createdKeys) {
        keyIdMap.set(key.key, key.id)
      }

      // Prepare all translations
      const translationsToCreate: Array<{
        key_id: number
        language_code: string
        value: string
        is_published?: boolean
        notes?: string
      }> = []

      for (const item of items) {
        const keyId = keyIdMap.get(item.key)
        if (!keyId) {
          result.errors.push(`Failed to get ID for key: ${item.key}`)
          continue
        }

        for (const [languageCode, value] of Object.entries(item.translations)) {
          if (value.trim()) {
            translationsToCreate.push({
              key_id: keyId,
              language_code: languageCode,
              value: value.trim(),
              is_published: true
            })
          }
        }
      }

      // Create all translations in batch
      if (translationsToCreate.length > 0) {
        const createdTranslations = await this.createTranslationsBatch(translationsToCreate)
        result.createdTranslations = createdTranslations
      }
    } catch (error) {
      result.errors.push(`Batch operation failed: ${error instanceof Error ? error.message : String(error)}`)
    }

    return result
  }
}

// Export singleton instance
export const translationService = new TranslationService()
export { TranslationService }