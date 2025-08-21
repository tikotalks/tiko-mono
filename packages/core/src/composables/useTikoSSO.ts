/**
 * useTikoSSO Composable
 * 
 * Provides TSS (Tiko Single Sign-On) functionality for other apps.
 * This allows apps to integrate with the Tiko dashboard for seamless authentication.
 */

import { ref, computed, onMounted } from 'vue';
import { authService } from '../services/auth.service';

interface SSORequest {
  returnUrl: string;
  appId: string;
  requestId: string;
  timestamp: number;
}

interface SSOResponse {
  success: boolean;
  accessToken?: string;
  refreshToken?: string;
  user?: any;
  error?: string;
}

export function useTikoSSO(appId: string) {
  const isLoading = ref(false);
  const ssoError = ref<string | null>(null);
  
  // Storage keys
  const SSO_STORAGE_KEY = 'tiko_sso_request';
  
  /**
   * Generate TSS button URL
   * This is the URL that TSS buttons should link to
   */
  const generateTSSButtonUrl = (currentUrl?: string): string => {
    const returnUrl = currentUrl || window.location.href;
    const tikoUrl = new URL('https://tiko.tikoapps.org/sso');
    
    const requestId = generateRequestId();
    
    // Store the request for validation
    const request: SSORequest = {
      returnUrl,
      appId,
      requestId,
      timestamp: Date.now()
    };
    
    localStorage.setItem(SSO_STORAGE_KEY, JSON.stringify(request));
    
    tikoUrl.searchParams.set('request_id', requestId);
    tikoUrl.searchParams.set('app_id', appId);
    tikoUrl.searchParams.set('return_url', returnUrl);
    
    return tikoUrl.toString();
  };

  /**
   * Navigate to TSS authentication
   * This redirects the user to the Tiko dashboard for authentication
   */
  const redirectToTSS = (currentUrl?: string): void => {
    const tssUrl = generateTSSButtonUrl(currentUrl);
    window.location.href = tssUrl;
  };

  /**
   * Handle SSO callback from Tiko dashboard
   * This processes the auth tokens returned after authentication
   */
  const handleSSOCallback = async (): Promise<SSOResponse> => {
    isLoading.value = true;
    ssoError.value = null;

    try {
      const urlParams = new URLSearchParams(window.location.search);
      const ssoToken = urlParams.get('sso_token');
      const ssoRefreshToken = urlParams.get('sso_refresh_token');
      const ssoRequestId = urlParams.get('sso_request_id');
      const ssoSuccess = urlParams.get('sso_success');

      if (ssoSuccess !== 'true' || !ssoToken) {
        const error = 'SSO authentication failed';
        ssoError.value = error;
        return { success: false, error };
      }

      // Validate the stored request
      const storedRequest = localStorage.getItem(SSO_STORAGE_KEY);
      if (!storedRequest) {
        const error = 'No SSO request found';
        ssoError.value = error;
        return { success: false, error };
      }

      const request: SSORequest = JSON.parse(storedRequest);
      
      // Validate request ID matches
      if (request.requestId !== ssoRequestId) {
        const error = 'SSO request ID mismatch';
        ssoError.value = error;
        return { success: false, error };
      }

      // Check request age (should be within 10 minutes)
      const requestAge = Date.now() - request.timestamp;
      if (requestAge > 10 * 60 * 1000) {
        localStorage.removeItem(SSO_STORAGE_KEY);
        const error = 'SSO request expired';
        ssoError.value = error;
        return { success: false, error };
      }

      // Clean up stored request
      localStorage.removeItem(SSO_STORAGE_KEY);

      // Create a session object that matches the expected format
      const session = {
        access_token: ssoToken,
        refresh_token: ssoRefreshToken,
        expires_at: new Date(Date.now() + 60 * 60 * 1000).toISOString(), // 1 hour from now
        token_type: 'bearer',
        user: null // Will be populated by auth service
      };

      // Store the session using the auth service
      // Note: This assumes the auth service can accept external tokens
      // You might need to adapt this based on your auth service implementation
      try {
        // For now, we'll store in localStorage directly
        // In a real implementation, you'd integrate with your auth service
        localStorage.setItem('tiko_auth_session', JSON.stringify(session));
        
        // Trigger auth store update if available
        // This would typically be handled by your auth service
        if (typeof window !== 'undefined' && (window as any).dispatchEvent) {
          window.dispatchEvent(new CustomEvent('tiko-sso-login', { detail: { session } }));
        }
      } catch (authError) {
        console.error('Failed to store SSO session:', authError);
      }

      return {
        success: true,
        accessToken: ssoToken,
        refreshToken: ssoRefreshToken
      };
    } catch (error) {
      console.error('SSO callback handling failed:', error);
      const errorMessage = 'SSO callback processing failed';
      ssoError.value = errorMessage;
      return { success: false, error: errorMessage };
    } finally {
      isLoading.value = false;
    }
  };

  /**
   * Check if current URL has SSO callback parameters
   */
  const hasSSOCallback = computed(() => {
    if (typeof window === 'undefined') return false;
    
    const urlParams = new URLSearchParams(window.location.search);
    return urlParams.has('sso_token') && urlParams.has('sso_success');
  });

  /**
   * Clear SSO-related URL parameters
   */
  const clearSSOParams = (): void => {
    if (typeof window === 'undefined') return;
    
    const url = new URL(window.location.href);
    const paramsToRemove = ['sso_token', 'sso_refresh_token', 'sso_request_id', 'sso_success'];
    
    paramsToRemove.forEach(param => {
      url.searchParams.delete(param);
    });
    
    // Update URL without reload
    window.history.replaceState({}, document.title, url.toString());
  };

  /**
   * Generate unique request ID
   */
  const generateRequestId = (): string => {
    return `sso_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  };

  /**
   * Clean up SSO data
   */
  const cleanupSSO = (): void => {
    localStorage.removeItem(SSO_STORAGE_KEY);
    clearSSOParams();
  };

  // Auto-handle SSO callback on mount if parameters are present
  onMounted(async () => {
    if (hasSSOCallback.value) {
      const result = await handleSSOCallback();
      if (result.success) {
        // Clear SSO parameters from URL
        clearSSOParams();
        console.log('SSO authentication successful');
      } else {
        console.error('SSO authentication failed:', result.error);
      }
    }
  });

  return {
    // State
    isLoading: computed(() => isLoading.value),
    ssoError: computed(() => ssoError.value),
    hasSSOCallback,
    
    // Methods
    generateTSSButtonUrl,
    redirectToTSS,
    handleSSOCallback,
    clearSSOParams,
    cleanupSSO
  };
}

export type TikoSSO = ReturnType<typeof useTikoSSO>;