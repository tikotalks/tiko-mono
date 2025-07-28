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
  private readonly API_URL = 'https://kejvhvszhevfwgsztedf.supabase.co/rest/v1';
  private readonly ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtlanZodnN6aGV2Zndnc3p0ZWRmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTE4ODg2MTIsImV4cCI6MjA2NzQ2NDYxMn0.xUYXxNodJTpTwChlKbuBSojVJqX9CDW87aVISEUc2rE';

  /**
   * Get current session from localStorage
   */
  private getSession() {
    try {
      const authData = localStorage.getItem('sb-kejvhvszhevfwgsztedf-auth-token');
      if (!authData) return null;
      const parsed = JSON.parse(authData);
      return parsed?.access_token || null;
    } catch {
      return null;
    }
  }

  /**
   * Make authenticated request to Supabase
   */
  private async makeRequest(path: string, options: RequestInit = {}) {
    const token = this.getSession();
    if (!token) {
      throw new Error('No authentication token found');
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
    });

    if (!response.ok) {
      const error = await response.text();
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
   * Get approved translations for a locale (for runtime use)
   */
  async getTranslations(locale: string): Promise<Array<{ key: string; value: string; auto_translated?: boolean }>> {
    try {
      // This uses the 'translations' view which only shows approved translations
      const data = await this.makeRequest(
        `/translations?locale=eq.${locale}&order=key`
      );
      return data || [];
    } catch (error) {
      console.error('Error fetching translations:', error);
      // Return empty array if no auth, this allows the UI to still load
      if (error.message?.includes('No authentication token')) {
        return [];
      }
      throw error;
    }
  }

  /**
   * Get pending translations for review
   */
  async getPendingTranslations(locale?: string): Promise<TranslationVersion[]> {
    try {
      let url = '/pending_translations?order=created_at.desc';
      if (locale) {
        url += `&locale=eq.${locale}`;
      }
      
      const data = await this.makeRequest(url);
      return data || [];
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
        `/translation_history?key=eq.${key}&locale=eq.${locale}&order=version_number.desc`
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
      const data = await this.makeRequest('/translation_contributors');
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
      let url = '/translation_notifications?order=created_at.desc';
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
        `/translation_notifications?id=eq.${notificationId}`,
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
      const localeDetails = await this.makeRequest('/locale_details');
      
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
      // Return empty stats if no auth
      if (error.message?.includes('No authentication token')) {
        return {
          totalKeys: 0,
          locales: [],
          completeness: {},
          pending: {},
          autoTranslated: {},
        };
      }
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
   * Get all unique translation keys from the database
   */
  async getAllKeys(): Promise<string[]> {
    try {
      // Get distinct keys from translation_versions table
      const data = await this.makeRequest(
        '/translation_versions?select=key&order=key'
      );
      
      // Extract unique keys
      const uniqueKeys = [...new Set(data.map((item: any) => item.key))];
      return uniqueKeys.sort();
    } catch (error) {
      console.error('Error fetching all keys:', error);
      // Return empty array if no auth
      if (error.message?.includes('No authentication token')) {
        return [];
      }
      throw error;
    }
  }

  /**
   * Delete a translation key across all locales
   */
  async deleteTranslationKey(key: string): Promise<void> {
    try {
      await this.makeRequest(
        `/translation_versions?key=eq.${encodeURIComponent(key)}`,
        {
          method: 'DELETE',
        }
      );
    } catch (error) {
      console.error('Error deleting translation key:', error);
      throw error;
    }
  }
}

export const translationService = new TranslationVersionedService();