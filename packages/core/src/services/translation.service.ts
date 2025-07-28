/**
 * Translation Service for managing i18n translations in the database
 */

export interface Translation {
  key: string;
  locale: string;
  value: string;
  auto_translated: boolean;
  created_at?: string;
  updated_at?: string;
  created_by?: string;
  updated_by?: string;
}

export interface TranslationFilter {
  locale?: string;
  key?: string;
  autoTranslated?: boolean;
}

class TranslationService {
  private readonly API_URL = 'https://kejvhvszhevfwgsztedf.supabase.co/rest/v1'
  private readonly ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtlanZodnN6aGV2Zndnc3p0ZWRmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTE4ODg2MTIsImV4cCI6MjA2NzQ2NDYxMn0.xUYXxNodJTpTwChlKbuBSojVJqX9CDW87aVISEUc2rE'
  private tableName = 'translations';

  /**
   * Get current session from localStorage
   */
  private getSession() {
    try {
      const authData = localStorage.getItem('sb-kejvhvszhevfwgsztedf-auth-token')
      if (!authData) return null
      const parsed = JSON.parse(authData)
      return parsed?.access_token || null
    } catch {
      return null
    }
  }

  /**
   * Make authenticated request to Supabase
   */
  private async makeRequest(path: string, options: RequestInit = {}) {
    const token = this.getSession()
    if (!token) {
      throw new Error('No authentication token found')
    }

    const response = await fetch(`${this.API_URL}${path}`, {
      ...options,
      headers: {
        'apikey': this.ANON_KEY,
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
        'Prefer': 'return=representation',
        ...options.headers,
      },
    })

    if (!response.ok) {
      const error = await response.text()
      throw new Error(`Request failed: ${error}`)
    }

    return response.json()
  }

  /**
   * Get all unique translation keys
   */
  async getAllKeys(): Promise<string[]> {
    try {
      const data = await this.makeRequest(`/${this.tableName}?select=key&order=key`)
      
      // Get unique keys
      const uniqueKeys = [...new Set(data?.map((item: any) => item.key) || [])];
      return uniqueKeys;
    } catch (error) {
      console.error('Error fetching translation keys:', error);
      throw error;
    }
  }

  /**
   * Get all translations for a specific locale
   */
  async getTranslations(locale: string): Promise<Translation[]> {
    try {
      const data = await this.makeRequest(
        `/${this.tableName}?locale=eq.${locale}&order=key`
      )
      return data || [];
    } catch (error) {
      console.error('Error fetching translations:', error);
      throw error;
    }
  }

  /**
   * Get translations for multiple locales (for comparison view)
   */
  async getTranslationsForLocales(locales: string[]): Promise<Translation[]> {
    try {
      const localeFilter = locales.map(l => `"${l}"`).join(',')
      const data = await this.makeRequest(
        `/${this.tableName}?locale=in.(${localeFilter})&order=key`
      )
      return data || [];
    } catch (error) {
      console.error('Error fetching translations for locales:', error);
      throw error;
    }
  }

  /**
   * Save or update a translation
   */
  async saveTranslation(
    key: string, 
    locale: string, 
    value: string, 
    autoTranslated: boolean = false
  ): Promise<Translation> {
    try {
      const data = await this.makeRequest(
        `/${this.tableName}?on_conflict=key,locale`,
        {
          method: 'POST',
          headers: {
            'Prefer': 'return=representation,resolution=merge-duplicates'
          },
          body: JSON.stringify({
            key,
            locale,
            value,
            auto_translated: autoTranslated,
          })
        }
      )

      return data[0];
    } catch (error) {
      console.error('Error saving translation:', error);
      throw error;
    }
  }

  /**
   * Delete a translation
   */
  async deleteTranslation(key: string, locale: string): Promise<void> {
    try {
      await this.makeRequest(
        `/${this.tableName}?key=eq.${key}&locale=eq.${locale}`,
        {
          method: 'DELETE'
        }
      )
    } catch (error) {
      console.error('Error deleting translation:', error);
      throw error;
    }
  }

  /**
   * Delete all translations for a key (across all locales)
   */
  async deleteTranslationKey(key: string): Promise<void> {
    try {
      await this.makeRequest(
        `/${this.tableName}?key=eq.${key}`,
        {
          method: 'DELETE'
        }
      )
    } catch (error) {
      console.error('Error deleting translation key:', error);
      throw error;
    }
  }

  /**
   * Get effective value for a key and locale (with fallback logic)
   */
  async getEffectiveValue(key: string, locale: string): Promise<string | null> {
    try {
      // Try exact locale match
      const exactData = await this.makeRequest(
        `/${this.tableName}?key=eq.${key}&locale=eq.${locale}&select=value`
      )
      if (exactData?.[0]?.value) return exactData[0].value;

      // Try parent locale (e.g., 'en' for 'en-GB')
      if (locale.includes('-')) {
        const parentLocale = locale.split('-')[0];
        const parentData = await this.makeRequest(
          `/${this.tableName}?key=eq.${key}&locale=eq.${parentLocale}&select=value`
        )
        if (parentData?.[0]?.value) return parentData[0].value;
      }

      // Fall back to English
      if (locale !== 'en') {
        const englishData = await this.makeRequest(
          `/${this.tableName}?key=eq.${key}&locale=eq.en&select=value`
        )
        if (englishData?.[0]?.value) return englishData[0].value;
      }

      return null;
    } catch (error) {
      console.error('Error getting effective value:', error);
      return null;
    }
  }

  /**
   * Generate JSON object for a locale with fallback values
   */
  async generateJson(locale: string): Promise<Record<string, string>> {
    try {
      // Get all keys
      const allKeys = await this.getAllKeys();
      
      const result: Record<string, string> = {};

      // Get effective value for each key
      for (const key of allKeys) {
        const value = await this.getEffectiveValue(key, locale);
        if (value !== null) {
          result[key] = value;
        }
      }

      return result;
    } catch (error) {
      console.error('Error generating JSON:', error);
      throw error;
    }
  }

  /**
   * Get statistics for translations
   */
  async getStatistics(): Promise<{
    totalKeys: number;
    locales: string[];
    completeness: Record<string, { translated: number; missing: number; percentage: number }>;
    autoTranslated: Record<string, number>;
  }> {
    try {
      const allKeys = await this.getAllKeys();
      const totalKeys = allKeys.length;

      // Get all unique locales
      const localeData = await this.makeRequest(
        `/${this.tableName}?select=locale&order=locale`
      )

      const locales = [...new Set(localeData?.map((item: any) => item.locale) || [])];

      const completeness: Record<string, { translated: number; missing: number; percentage: number }> = {};
      const autoTranslated: Record<string, number> = {};

      for (const locale of locales) {
        const translations = await this.getTranslations(locale);
        const translated = translations.length;
        const missing = totalKeys - translated;
        const percentage = totalKeys > 0 ? Math.round((translated / totalKeys) * 100) : 0;

        completeness[locale] = { translated, missing, percentage };
        autoTranslated[locale] = translations.filter(t => t.auto_translated).length;
      }

      return {
        totalKeys,
        locales,
        completeness,
        autoTranslated
      };
    } catch (error) {
      console.error('Error getting statistics:', error);
      throw error;
    }
  }

  /**
   * Batch import translations from JSON
   */
  async importTranslations(locale: string, translations: Record<string, string>): Promise<void> {
    try {
      const batch = Object.entries(translations).map(([key, value]) => ({
        key,
        locale,
        value,
        auto_translated: false
      }));

      // Batch upsert
      await this.makeRequest(
        `/${this.tableName}?on_conflict=key,locale`,
        {
          method: 'POST',
          headers: {
            'Prefer': 'resolution=merge-duplicates'
          },
          body: JSON.stringify(batch)
        }
      )
    } catch (error) {
      console.error('Error importing translations:', error);
      throw error;
    }
  }

  /**
   * Search translations
   */
  async searchTranslations(query: string, locale?: string): Promise<Translation[]> {
    try {
      let url = `/${this.tableName}?or=(key.ilike.%${query}%,value.ilike.%${query}%)&order=key`;
      
      if (locale) {
        url += `&locale=eq.${locale}`;
      }

      const data = await this.makeRequest(url);
      return data || [];
    } catch (error) {
      console.error('Error searching translations:', error);
      throw error;
    }
  }
}

export const translationService = new TranslationService();