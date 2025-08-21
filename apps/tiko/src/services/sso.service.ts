/**
 * SSO (Single Sign-On) Service
 * 
 * Handles authentication flow between Tiko apps.
 * Allows users to click TSS (Tiko Single Sign-On) button in any app
 * to authenticate via the main tiko app and return logged in.
 */

import { authService } from '@tiko/core';

export interface SSORequest {
  returnUrl: string;
  appId: string;
  requestId: string;
  timestamp: number;
}

export interface SSOResponse {
  success: boolean;
  accessToken?: string;
  refreshToken?: string;
  user?: any;
  error?: string;
}

export class SSOService {
  private static readonly SSO_STORAGE_KEY = 'tiko_sso_request';
  private static readonly TOKEN_EXPIRY_BUFFER = 5 * 60 * 1000; // 5 minutes buffer

  /**
   * Initiate SSO flow from another app
   * This redirects to the tiko dashboard for authentication
   */
  static initiateSSOFlow(appId: string, returnUrl: string): void {
    const request: SSORequest = {
      returnUrl,
      appId,
      requestId: this.generateRequestId(),
      timestamp: Date.now()
    };

    // Store the SSO request for later validation
    localStorage.setItem(this.SSO_STORAGE_KEY, JSON.stringify(request));

    // Redirect to tiko dashboard for authentication
    const tikoUrl = new URL('https://tiko.tikoapps.org/sso');
    tikoUrl.searchParams.set('request_id', request.requestId);
    tikoUrl.searchParams.set('app_id', appId);
    tikoUrl.searchParams.set('return_url', returnUrl);

    window.location.href = tikoUrl.toString();
  }

  /**
   * Handle SSO request on the tiko dashboard side
   * This processes the incoming SSO request and authenticates the user
   */
  static async handleSSORequest(
    requestId: string, 
    appId: string, 
    returnUrl: string
  ): Promise<SSOResponse> {
    try {
      // Validate the request parameters
      if (!requestId || !appId || !returnUrl) {
        return { success: false, error: 'Invalid SSO request parameters' };
      }

      // Check if user is already authenticated
      const session = await authService.getSession();
      
      if (!session || !this.isSessionValid(session)) {
        // User is not authenticated, need to login first
        // Store the SSO request and redirect to login
        sessionStorage.setItem('pending_sso_request', JSON.stringify({
          requestId,
          appId,
          returnUrl
        }));
        
        return { 
          success: false, 
          error: 'Authentication required' 
        };
      }

      // User is authenticated, complete the SSO flow
      return {
        success: true,
        accessToken: session.access_token,
        refreshToken: session.refresh_token,
        user: session.user
      };
    } catch (error) {
      console.error('SSO request handling failed:', error);
      return { 
        success: false, 
        error: 'SSO processing failed' 
      };
    }
  }

  /**
   * Complete SSO flow after authentication
   * This redirects back to the requesting app with auth tokens
   */
  static async completeSSOFlow(): Promise<boolean> {
    try {
      // Check for pending SSO request
      const pendingRequest = sessionStorage.getItem('pending_sso_request');
      if (!pendingRequest) {
        return false;
      }

      const request = JSON.parse(pendingRequest);
      sessionStorage.removeItem('pending_sso_request');

      // Get current session
      const session = await authService.getSession();
      if (!session) {
        return false;
      }

      // Build return URL with auth tokens
      const returnUrl = new URL(request.returnUrl);
      returnUrl.searchParams.set('sso_token', session.access_token);
      returnUrl.searchParams.set('sso_refresh_token', session.refresh_token);
      returnUrl.searchParams.set('sso_request_id', request.requestId);
      returnUrl.searchParams.set('sso_success', 'true');

      // Redirect back to the requesting app
      window.location.href = returnUrl.toString();
      return true;
    } catch (error) {
      console.error('SSO completion failed:', error);
      return false;
    }
  }

  /**
   * Handle SSO callback on the requesting app side
   * This processes the auth tokens returned from the tiko dashboard
   */
  static async handleSSOCallback(
    urlParams: URLSearchParams
  ): Promise<SSOResponse> {
    try {
      const ssoToken = urlParams.get('sso_token');
      const ssoRefreshToken = urlParams.get('sso_refresh_token');
      const ssoRequestId = urlParams.get('sso_request_id');
      const ssoSuccess = urlParams.get('sso_success');

      if (ssoSuccess !== 'true' || !ssoToken) {
        return { 
          success: false, 
          error: 'SSO authentication failed' 
        };
      }

      // Validate the stored request
      const storedRequest = localStorage.getItem(this.SSO_STORAGE_KEY);
      if (!storedRequest) {
        return { 
          success: false, 
          error: 'No SSO request found' 
        };
      }

      const request: SSORequest = JSON.parse(storedRequest);
      
      // Validate request ID matches
      if (request.requestId !== ssoRequestId) {
        return { 
          success: false, 
          error: 'SSO request ID mismatch' 
        };
      }

      // Check request age (should be within 10 minutes)
      const requestAge = Date.now() - request.timestamp;
      if (requestAge > 10 * 60 * 1000) {
        localStorage.removeItem(this.SSO_STORAGE_KEY);
        return { 
          success: false, 
          error: 'SSO request expired' 
        };
      }

      // Clean up stored request
      localStorage.removeItem(this.SSO_STORAGE_KEY);

      // Set up the session in the requesting app
      // Note: This would need to be integrated with the local auth service
      return {
        success: true,
        accessToken: ssoToken,
        refreshToken: ssoRefreshToken
      };
    } catch (error) {
      console.error('SSO callback handling failed:', error);
      return { 
        success: false, 
        error: 'SSO callback processing failed' 
      };
    }
  }

  /**
   * Generate TSS button URL for other apps
   * This creates the URL that TSS buttons should link to
   */
  static generateTSSButtonUrl(appId: string, currentUrl?: string): string {
    const returnUrl = currentUrl || window.location.href;
    const tikoUrl = new URL('https://tiko.tikoapps.org/sso');
    
    const requestId = this.generateRequestId();
    
    // Store the request for validation
    const request: SSORequest = {
      returnUrl,
      appId,
      requestId,
      timestamp: Date.now()
    };
    
    localStorage.setItem(this.SSO_STORAGE_KEY, JSON.stringify(request));
    
    tikoUrl.searchParams.set('request_id', requestId);
    tikoUrl.searchParams.set('app_id', appId);
    tikoUrl.searchParams.set('return_url', returnUrl);
    
    return tikoUrl.toString();
  }

  /**
   * Check if current session is valid and not expired
   */
  private static isSessionValid(session: any): boolean {
    if (!session.access_token || !session.expires_at) {
      return false;
    }

    const expiresAt = new Date(session.expires_at).getTime();
    const now = Date.now();
    
    // Check if token expires within the buffer time
    return expiresAt > (now + this.TOKEN_EXPIRY_BUFFER);
  }

  /**
   * Generate unique request ID
   */
  private static generateRequestId(): string {
    return `sso_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Clear any stored SSO data
   */
  static clearSSOData(): void {
    localStorage.removeItem(this.SSO_STORAGE_KEY);
    sessionStorage.removeItem('pending_sso_request');
  }
}

// Export singleton instance
export const ssoService = SSOService;