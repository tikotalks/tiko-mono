/**
 * Translation Service with Versioning and Approval Support
 */

export interface TranslationVersion {
  id: string;
  key: string;
  locale: string;
  value: string;
  version_number: number;
  status: 'pending' | 'approved' | 'rejected';
  auto_translated: boolean;
  created_at: string;
  created_by: string;
  reviewed_at?: string;
  reviewed_by?: string;
  review_notes?: string;
  previous_version_id?: string;
}

export interface TranslationContributor {
  user_id: string;
  email: string;
  full_name?: string;
  total_translations: number;
  approved_translations: number;
  pending_translations: number;
  rejected_translations: number;
  locales_contributed: number;
  last_contribution: string;
}

class TranslationVersionedService {
  private readonly API_URL: string;
  private readonly apiKey: string;

  constructor() {
    const supabaseUrl = import.meta.env?.VITE_SUPABASE_URL;
    if (!supabaseUrl) {
      throw new Error('VITE_SUPABASE_URL environment variable is required');
    }
    this.API_URL = `${supabaseUrl}/rest/v1`;

    // Use public key for browser compatibility
    this.apiKey = import.meta.env?.VITE_SUPABASE_PUBLISHABLE_KEY;
    if (!this.apiKey) {
      throw new Error('VITE_SUPABASE_PUBLISHABLE_KEY environment variable is required');
    }
  }

  /**
   * Get current session from localStorage
   */
  private getSession() {
    try {
      // Try the new auth session format first
      const authData = localStorage.getItem('tiko_auth_session');
      if (authData) {
        const parsed = JSON.parse(authData);
        return parsed?.access_token || null;
      }

      // Fallback to Supabase format
      const supabaseData = localStorage.getItem('supabase.auth.token');
      if (supabaseData) {
        const parsed = JSON.parse(supabaseData);
        return parsed?.access_token || null;
      }

      return null;
    } catch {
      return null;
    }
  }

  /**
   * Make authenticated request to Supabase
   */
  private async makeRequest(path: string, options: RequestInit = {}) {
    const token = this.getSession();

    const response = await fetch(`${this.API_URL}${path}`, {
      ...options,
      headers: {
        'apikey': this.apiKey,
        'Authorization': token ? `Bearer ${token}` : `Bearer ${this.apiKey}`,
        'Content-Type': 'application/json',
        'Prefer': 'return=representation',
        ...options.headers,
      },
    });

    if (!response.ok) {
      const error = await response.text();
      console.error('Translation API error:', error);
      throw new Error(`Request failed: ${error}`);
    }

    return response.json();
  }

  /**
   * Call Supabase RPC functions
   */
  private async callRpc(functionName: string, params: any = {}) {
    return this.makeRequest('/rpc/' + functionName, {
      method: 'POST',
      body: JSON.stringify(params),
    });
  }

  /**
   * Get approved translations for a locale (for runtime use) with pagination
   */
  async getTranslations(locale: string): Promise<Array<{ key: string; value: string; auto_translated?: boolean }>> {
    try {
      const allTranslations: Array<{ key: string; value: string; auto_translated?: boolean }> = [];
      const BATCH_SIZE = 1000; // Supabase default limit
      let offset = 0;
      let hasMore = true;

      console.log(`Fetching translations for locale ${locale} with pagination...`);

      while (hasMore) {
        // This uses the 'i18n_translations' view which only shows approved translations
        const data = await this.makeRequest(
          `/i18n_translations?locale=eq.${locale}&order=key&limit=${BATCH_SIZE}&offset=${offset}`
        );

        if (!data || data.length === 0) {
          hasMore = false;
          break;
        }

        allTranslations.push(...data);
        console.log(`Fetched batch ${Math.floor(offset / BATCH_SIZE) + 1}: ${data.length} translations for ${locale} (total so far: ${allTranslations.length})`);

        // Check if we got a full batch - if not, we're done
        if (data.length < BATCH_SIZE) {
          hasMore = false;
        } else {
          offset += BATCH_SIZE;
        }
      }

      console.log(`Total translations fetched for ${locale}: ${allTranslations.length}`);
      return allTranslations;
    } catch (error) {
      console.error('Error fetching translations:', error);
      throw error;
    }
  }

  /**
   * Get translations with language inheritance
   * For example: en-US falls back to en for missing keys
   */
  async getTranslationsWithFallback(locale: string): Promise<Array<{ key: string; value: string; auto_translated?: boolean; source_locale?: string }>> {
    try {
      // Get direct translations for the locale
      const localeTranslations = await this.getTranslations(locale);
      const translationMap = new Map(localeTranslations.map(t => [t.key, { ...t, source_locale: locale }]));

      // If it's a locale variant (e.g., en-US), get parent language translations
      if (locale.includes('-')) {
        const parentLanguage = locale.split('-')[0];
        const parentTranslations = await this.getTranslations(parentLanguage);

        // Add parent translations for missing keys
        for (const translation of parentTranslations) {
          if (!translationMap.has(translation.key)) {
            translationMap.set(translation.key, { ...translation, source_locale: parentLanguage });
          }
        }
      }

      // Final fallback to English if not already English
      if (!locale.startsWith('en')) {
        const englishTranslations = await this.getTranslations('en');

        for (const translation of englishTranslations) {
          if (!translationMap.has(translation.key)) {
            translationMap.set(translation.key, { ...translation, source_locale: 'en' });
          }
        }
      }

      return Array.from(translationMap.values());
    } catch (error) {
      console.error('Error fetching translations with fallback:', error);
      throw error;
    }
  }

  /**
   * Get pending translations for review with pagination
   */
  async getPendingTranslations(locale?: string): Promise<TranslationVersion[]> {
    try {
      const allPending: TranslationVersion[] = [];
      const BATCH_SIZE = 1000; // Supabase default limit
      let offset = 0;
      let hasMore = true;

      console.log(`Fetching pending translations${locale ? ` for locale ${locale}` : ''} with pagination...`);

      while (hasMore) {
        let url = `/i18n_pending_translations?order=created_at.desc&limit=${BATCH_SIZE}&offset=${offset}`;
        if (locale) {
          url += `&locale=eq.${locale}`;
        }

        const data = await this.makeRequest(url);

        if (!data || data.length === 0) {
          hasMore = false;
          break;
        }

        allPending.push(...data);
        console.log(`Fetched batch ${Math.floor(offset / BATCH_SIZE) + 1}: ${data.length} pending translations (total so far: ${allPending.length})`);

        // Check if we got a full batch - if not, we're done
        if (data.length < BATCH_SIZE) {
          hasMore = false;
        } else {
          offset += BATCH_SIZE;
        }
      }

      console.log(`Total pending translations fetched: ${allPending.length}`);
      return allPending;
    } catch (error) {
      console.error('Error fetching pending translations:', error);
      throw error;
    }
  }

  /**
   * Get translation history for a specific key/locale
   */
  async getTranslationHistory(key: string, locale: string): Promise<TranslationVersion[]> {
    try {
      const data = await this.makeRequest(
        `/i18n_translation_history?key=eq.${key}&locale=eq.${locale}&order=version_number.desc`
      );
      return data || [];
    } catch (error) {
      console.error('Error fetching translation history:', error);
      throw error;
    }
  }

  /**
   * Create or update a translation (creates new version)
   */
  async saveTranslation(
    key: string,
    locale: string,
    value: string,
    autoTranslated: boolean = false
  ): Promise<string> {
    try {
      const result = await this.callRpc('create_translation_version', {
        p_key: key,
        p_locale: locale,
        p_value: value,
        p_auto_translated: autoTranslated,
      });

      return result;
    } catch (error) {
      console.error('Error saving translation:', error);
      throw error;
    }
  }

  /**
   * Approve a pending translation
   */
  async approveTranslation(versionId: string, notes?: string): Promise<boolean> {
    try {
      const result = await this.callRpc('approve_translation', {
        p_version_id: versionId,
        p_notes: notes,
      });

      return result;
    } catch (error) {
      console.error('Error approving translation:', error);
      throw error;
    }
  }

  /**
   * Reject a pending translation
   */
  async rejectTranslation(versionId: string, notes: string): Promise<boolean> {
    try {
      const result = await this.callRpc('reject_translation', {
        p_version_id: versionId,
        p_notes: notes,
      });

      return result;
    } catch (error) {
      console.error('Error rejecting translation:', error);
      throw error;
    }
  }

  /**
   * Rollback to a previous version
   */
  async rollbackTranslation(
    key: string,
    locale: string,
    targetVersion: number
  ): Promise<string> {
    try {
      const result = await this.callRpc('rollback_translation', {
        p_key: key,
        p_locale: locale,
        p_target_version: targetVersion,
      });

      return result;
    } catch (error) {
      console.error('Error rolling back translation:', error);
      throw error;
    }
  }

  /**
   * Get contributor statistics
   */
  async getContributors(): Promise<TranslationContributor[]> {
    try {
      const data = await this.makeRequest('/i18n_contributors');
      return data || [];
    } catch (error) {
      console.error('Error fetching contributors:', error);
      throw error;
    }
  }

  /**
   * Get notifications for current user
   */
  async getNotifications(unreadOnly: boolean = true): Promise<any[]> {
    try {
      let url = '/i18n_notifications?order=created_at.desc';
      if (unreadOnly) {
        url += '&read=eq.false';
      }

      const data = await this.makeRequest(url);
      return data || [];
    } catch (error) {
      console.error('Error fetching notifications:', error);
      throw error;
    }
  }

  /**
   * Mark notification as read
   */
  async markNotificationRead(notificationId: string): Promise<void> {
    try {
      await this.makeRequest(
        `/i18n_notifications?id=eq.${notificationId}`,
        {
          method: 'PATCH',
          body: JSON.stringify({ read: true }),
        }
      );
    } catch (error) {
      console.error('Error marking notification as read:', error);
      throw error;
    }
  }

  /**
   * Generate JSON for a locale (only approved translations)
   */
  async generateJson(locale: string): Promise<Record<string, string>> {
    try {
      const translations = await this.getTranslations(locale);
      const result: Record<string, string> = {};

      for (const { key, value } of translations) {
        result[key] = value;
      }

      // Apply fallback logic if needed
      if (locale.includes('-')) {
        const parentLocale = locale.split('-')[0];
        const parentTranslations = await this.getTranslations(parentLocale);

        // Add parent translations that don't exist in specific locale
        for (const { key, value } of parentTranslations) {
          if (!result[key]) {
            result[key] = value;
          }
        }
      }

      // Final fallback to English
      if (locale !== 'en') {
        const englishTranslations = await this.getTranslations('en');

        for (const { key, value } of englishTranslations) {
          if (!result[key]) {
            result[key] = value;
          }
        }
      }

      return result;
    } catch (error) {
      console.error('Error generating JSON:', error);
      throw error;
    }
  }

  /**
   * Get statistics with pending counts
   */
  async getStatistics(): Promise<any> {
    try {
      const localeDetails = await this.makeRequest('/i18n_locale_details');

      const stats = {
        totalKeys: localeDetails[0]?.total_keys || 0,
        locales: localeDetails.map((l: any) => l.code),
        completeness: {} as Record<string, any>,
        pending: {} as Record<string, number>,
        autoTranslated: {} as Record<string, number>,
      };

      for (const locale of localeDetails) {
        stats.completeness[locale.code] = {
          translated: locale.translation_count,
          missing: stats.totalKeys - locale.translation_count,
          percentage: locale.completion_percentage,
        };
        stats.pending[locale.code] = locale.pending_count;
      }

      return stats;
    } catch (error) {
      console.error('Error getting statistics:', error);
      throw error;
    }
  }

  /**
   * Batch approve multiple translations
   */
  async batchApprove(versionIds: string[], notes?: string): Promise<number> {
    try {
      let approved = 0;

      for (const id of versionIds) {
        const result = await this.approveTranslation(id, notes);
        if (result) approved++;
      }

      return approved;
    } catch (error) {
      console.error('Error batch approving:', error);
      throw error;
    }
  }

  /**
   * Get all unique translation keys from the database with pagination
   */
  async getAllKeys(): Promise<string[]> {
    try {
      const allKeys: string[] = [];
      const BATCH_SIZE = 1000; // Supabase default limit
      let offset = 0;
      let hasMore = true;

      console.log('Fetching all translation keys with pagination...');

      while (hasMore) {
        // Get distinct keys from i18n_translation_versions table with pagination
        const data = await this.makeRequest(
          `/i18n_translation_versions?select=key&order=key&limit=${BATCH_SIZE}&offset=${offset}`
        );

        if (data.length === 0) {
          hasMore = false;
          break;
        }

        // Extract keys from this batch
        const batchKeys = data.map((item: any) => item.key);
        allKeys.push(...batchKeys);

        console.log(`Fetched batch ${Math.floor(offset / BATCH_SIZE) + 1}: ${data.length} keys (total so far: ${allKeys.length})`);

        // Check if we got a full batch - if not, we're done
        if (data.length < BATCH_SIZE) {
          hasMore = false;
        } else {
          offset += BATCH_SIZE;
        }
      }

      // Extract unique keys and filter out corrupted ones
      const uniqueKeys = [...new Set(allKeys)];
      const cleanKeys = uniqueKeys.filter(key => !key.includes('[object Object]'));

      console.log('Total keys fetched:', allKeys.length);
      console.log('Unique keys:', uniqueKeys.length);
      console.log('Clean keys (no corruption):', cleanKeys.length);

      return cleanKeys.sort();
    } catch (error) {
      console.error('Error fetching all keys:', error);
      throw error;
    }
  }

  /**
   * Delete a translation key across all locales
   */
  async deleteTranslationKey(key: string): Promise<void> {
    try {
      await this.makeRequest(
        `/i18n_translation_versions?key=eq.${encodeURIComponent(key)}`,
        {
          method: 'DELETE',
        }
      );
    } catch (error) {
      console.error('Error deleting translation key:', error);
      throw error;
    }
  }

  /**
   * Create a new locale in the i18n_locales table
   */
  async createLocale(code: string, name: string, nativeName: string): Promise<void> {
    try {
      await this.makeRequest('/i18n_locales', {
        method: 'POST',
        body: JSON.stringify({
          code,
          name,
          native_name: nativeName,
          enabled: true
        }),
      });
    } catch (error) {
      console.error('Error creating locale:', error);
      throw error;
    }
  }

  /**
   * Check if a locale exists
   */
  async checkLocaleExists(locale: string): Promise<boolean> {
    try {
      const data = await this.makeRequest(
        `/i18n_locales?code=eq.${locale}`
      );
      return data && data.length > 0;
    } catch (error) {
      console.error('Error checking locale existence:', error);
      return false;
    }
  }

  /**
   * Get all available locales
   */
  async getLocales(): Promise<Array<{ code: string; name: string; native_name: string }>> {
    try {
      const data = await this.makeRequest('/i18n_locales?order=name');
      return data || [];
    } catch (error) {
      console.error('Error fetching locales:', error);
      throw error;
    }
  }

  /**
   * Get all available languages (base languages, not locale variants)
   */
  async getLanguages(): Promise<Array<{ code: string; name: string; native_name: string; rtl?: boolean }>> {
    try {
      const data = await this.makeRequest('/i18n_languages?order=name');
      return data || [];
    } catch (error) {
      console.error('Error fetching languages:', error);
      throw error;
    }
  }

  /**
   * Check if a language exists
   */
  async checkLanguageExists(languageCode: string): Promise<boolean> {
    try {
      const data = await this.makeRequest(
        `/i18n_languages?code=eq.${languageCode}`
      );
      return data && data.length > 0;
    } catch (error) {
      console.error('Error checking language existence:', error);
      return false;
    }
  }

  /**
   * Create a new language
   */
  async createLanguage(code: string, name: string, nativeName: string): Promise<void> {
    try {
      await this.makeRequest('/i18n_languages', {
        method: 'POST',
        body: JSON.stringify({
          code,
          name,
          native_name: nativeName,
          rtl: false
        }),
      });
    } catch (error) {
      console.error('Error creating language:', error);
      throw error;
    }
  }

  /**
   * Clean up corrupted keys that contain [object Object]
   */
  async cleanupCorruptedKeys(): Promise<{ cleaned: number; failed: number }> {
    try {
      // Get all keys
      const allKeys = await this.getAllKeys();
      const corruptedKeys = allKeys.filter(key => key.includes('[object Object]'));

      let cleaned = 0;
      let failed = 0;

      for (const corruptedKey of corruptedKeys) {
        try {
          // Extract the real key by removing [object Object]
          const cleanKey = corruptedKey.replace('[object Object]', '');

          // Get all translations for the corrupted key
          const translations = await this.makeRequest(
            `/i18n_translation_versions?key=eq.${encodeURIComponent(corruptedKey)}`
          );

          // Update each translation to use the clean key
          for (const translation of translations) {
            try {
              await this.makeRequest(
                `/i18n_translation_versions?id=eq.${translation.id}`,
                {
                  method: 'PATCH',
                  body: JSON.stringify({ key: cleanKey }),
                }
              );
            } catch (updateError) {
              console.error(`Failed to update translation ${translation.id}:`, updateError);
              failed++;
            }
          }

          cleaned++;
        } catch (error) {
          console.error(`Failed to clean key ${corruptedKey}:`, error);
          failed++;
        }
      }

      return { cleaned, failed };
    } catch (error) {
      console.error('Error cleaning corrupted keys:', error);
      throw error;
    }
  }

  /**
   * Delete all keys containing [object Object]
   */
  async deleteCorruptedKeys(): Promise<number> {
    try {
      // Get all keys
      const allKeys = await this.getAllKeys();
      const corruptedKeys = allKeys.filter(key => key.includes('[object Object]'));

      let deleted = 0;

      for (const key of corruptedKeys) {
        try {
          await this.deleteTranslationKey(key);
          deleted++;
        } catch (error) {
          console.error(`Failed to delete key ${key}:`, error);
        }
      }

      return deleted;
    } catch (error) {
      console.error('Error deleting corrupted keys:', error);
      throw error;
    }
  }

  /**
   * Get all unique keys from all locales/languages with pagination
   */
  async getAllUniqueKeys(): Promise<string[]> {
    try {
      const allKeys: string[] = [];
      const BATCH_SIZE = 1000; // Supabase default limit
      let offset = 0;
      let hasMore = true;

      console.log('Fetching all unique translation keys with pagination...');

      while (hasMore) {
        // Query to get all unique keys across all translations with pagination
        const data = await this.makeRequest(
          `/i18n_translation_versions?select=key&order=key&limit=${BATCH_SIZE}&offset=${offset}`
        );

        if (data.length === 0) {
          hasMore = false;
          break;
        }

        // Extract keys from this batch
        const batchKeys = data.map((item: any) => item.key);
        allKeys.push(...batchKeys);

        console.log(`Fetched batch ${Math.floor(offset / BATCH_SIZE) + 1}: ${data.length} keys (total so far: ${allKeys.length})`);

        // Check if we got a full batch - if not, we're done
        if (data.length < BATCH_SIZE) {
          hasMore = false;
        } else {
          offset += BATCH_SIZE;
        }
      }

      // Extract unique keys
      const uniqueKeys = [...new Set(allKeys)];

      // Filter out corrupted keys
      const cleanKeys = uniqueKeys.filter(key => !key.includes('[object Object]'));

      console.log('Total keys fetched:', allKeys.length);
      console.log('Unique keys:', uniqueKeys.length);
      console.log('Clean keys (no corruption):', cleanKeys.length);

      return cleanKeys.sort();
    } catch (error) {
      console.error('Error fetching all unique keys:', error);
      throw error;
    }
  }
}

export const translationService = new TranslationVersionedService();
