/**
 * Authentication Service
 * 
 * @module services/auth
 * @description
 * Provides a clean abstraction layer for all authentication operations.
 * This service handles user authentication, session management, and user profile updates.
 * 
 * The current implementation bypasses the Supabase SDK and uses direct API calls
 * to avoid SDK hanging issues. It can be easily replaced with any other backend
 * by implementing the AuthService interface.
 * 
 * @example
 * ```typescript
 * import { authService } from '@tiko/core'
 * 
 * // Sign in with email
 * const result = await authService.signInWithEmail('user@example.com', 'password')
 * if (result.success) {
 *   console.log('Logged in:', result.user)
 * }
 * 
 * // Send magic link
 * const magicResult = await authService.signInWithMagicLink('user@example.com')
 * 
 * // Get current session
 * const session = await authService.getSession()
 * ```
 */

/**
 * User object returned from authentication operations
 * 
 * @interface AuthUser
 * @property {string} id - Unique user identifier
 * @property {string} email - User's email address
 * @property {string} [phone] - User's phone number (optional)
 * @property {string} [full_name] - User's full name (optional)
 * @property {string} [avatar_url] - URL to user's avatar image (optional)
 * @property {boolean} email_verified - Whether email has been verified
 * @property {boolean} phone_verified - Whether phone has been verified
 * @property {Record<string, any>} app_metadata - Application-specific metadata (read-only for users)
 * @property {Record<string, any>} user_metadata - User-editable metadata
 * @property {string} created_at - ISO timestamp of account creation
 * @property {string} updated_at - ISO timestamp of last update
 */
export interface AuthUser {
  id: string
  email: string
  phone?: string
  full_name?: string
  avatar_url?: string
  email_verified: boolean
  phone_verified: boolean
  app_metadata: Record<string, any>
  user_metadata: Record<string, any>
  created_at: string
  updated_at: string
}

/**
 * Authentication session object
 * 
 * @interface AuthSession
 * @property {string} access_token - JWT access token for API requests
 * @property {string} refresh_token - Token used to refresh the session
 * @property {number} expires_at - Unix timestamp when session expires
 * @property {number} expires_in - Seconds until session expires
 * @property {string} token_type - Token type (usually 'bearer')
 * @property {AuthUser} user - The authenticated user object
 */
export interface AuthSession {
  access_token: string
  refresh_token: string
  expires_at: number
  expires_in: number
  token_type: string
  user: AuthUser
}

/**
 * Result object returned from authentication operations
 * 
 * @interface AuthResult
 * @property {boolean} success - Whether the operation succeeded
 * @property {AuthSession} [session] - Session object if authentication succeeded
 * @property {AuthUser} [user] - User object (may be present without session for signup)
 * @property {string} [error] - Error message if operation failed
 */
export interface AuthResult {
  success: boolean
  session?: AuthSession
  user?: AuthUser
  error?: string
}

/**
 * Authentication service interface
 * 
 * @interface AuthService
 * @description
 * Defines the contract for authentication operations.
 * Any authentication backend must implement this interface.
 */
export interface AuthService {
  /**
   * Sign in with email and password
   * 
   * @param {string} email - User's email address
   * @param {string} password - User's password
   * @returns {Promise<AuthResult>} Authentication result with session if successful
   * 
   * @example
   * ```typescript
   * const result = await authService.signInWithEmail('user@example.com', 'password')
   * if (result.success) {
   *   console.log('Welcome back,', result.user.email)
   * } else {
   *   console.error('Login failed:', result.error)
   * }
   * ```
   */
  signInWithEmail(email: string, password: string): Promise<AuthResult>
  
  /**
   * Create a new account with email and password
   * 
   * @param {string} email - User's email address
   * @param {string} password - User's password (min 6 characters)
   * @param {string} [fullName] - User's full name (optional)
   * @returns {Promise<AuthResult>} Result with user object (may require email confirmation)
   * 
   * @example
   * ```typescript
   * const result = await authService.signUpWithEmail('new@example.com', 'password', 'John Doe')
   * if (result.success) {
   *   console.log('Account created! Check your email for confirmation.')
   * }
   * ```
   */
  signUpWithEmail(email: string, password: string, fullName?: string): Promise<AuthResult>
  
  /**
   * Send a magic link for passwordless authentication
   * 
   * @param {string} email - User's email address
   * @param {string} [fullName] - Full name for new users (optional)
   * @returns {Promise<AuthResult>} Success result if email sent
   * 
   * @example
   * ```typescript
   * const result = await authService.signInWithMagicLink('user@example.com')
   * if (result.success) {
   *   console.log('Check your email for the magic link!')
   * }
   * ```
   */
  signInWithMagicLink(email: string, fullName?: string): Promise<AuthResult>
  
  /**
   * Verify OTP code from email
   * 
   * @param {string} email - User's email address
   * @param {string} token - 6-digit verification code
   * @returns {Promise<AuthResult>} Authentication result with session if successful
   * 
   * @example
   * ```typescript
   * const result = await authService.verifyOtp('user@example.com', '123456')
   * if (result.success) {
   *   console.log('Verified! Welcome', result.user.email)
   * }
   * ```
   */
  verifyOtp(email: string, token: string): Promise<AuthResult>
  
  /**
   * Resend OTP verification code
   * 
   * @param {string} email - User's email address
   * @returns {Promise<AuthResult>} Success result if email sent
   */
  resendOtp(email: string): Promise<AuthResult>
  
  /**
   * Sign out the current user
   * 
   * @returns {Promise<{success: boolean; error?: string}>} Result of sign out operation
   */
  signOut(): Promise<{ success: boolean; error?: string }>
  
  /**
   * Get the current session
   * 
   * @returns {Promise<AuthSession | null>} Current session or null if not authenticated
   * 
   * @example
   * ```typescript
   * const session = await authService.getSession()
   * if (session) {
   *   console.log('Logged in as:', session.user.email)
   * } else {
   *   console.log('Not logged in')
   * }
   * ```
   */
  getSession(): Promise<AuthSession | null>
  
  /**
   * Handle magic link callback from URL
   * 
   * @returns {Promise<AuthResult>} Session if tokens are valid
   */
  handleMagicLinkCallback(): Promise<AuthResult>
  
  /**
   * Refresh an expired session
   * 
   * @param {string} refreshToken - The refresh token from the expired session
   * @returns {Promise<AuthResult>} New session if refresh successful
   */
  refreshSession(refreshToken: string): Promise<AuthResult>
  
  /**
   * Update user profile information
   * 
   * @param {Partial<AuthUser>} updates - Fields to update
   * @returns {Promise<AuthResult>} Updated user object if successful
   * 
   * @example
   * ```typescript
   * const result = await authService.updateUser({
   *   full_name: 'Jane Doe',
   *   avatar_url: 'https://example.com/avatar.jpg'
   * })
   * ```
   */
  updateUser(updates: Partial<AuthUser>): Promise<AuthResult>
  
  /**
   * Update user metadata
   * 
   * @param {Record<string, any>} metadata - Metadata to merge with existing
   * @returns {Promise<AuthResult>} Updated user object if successful
   */
  updateUserMetadata(metadata: Record<string, any>): Promise<AuthResult>
  
  /**
   * Get the role of the current user
   * 
   * @returns {Promise<'user' | 'editor' | 'admin' | null>} User role or null if not authenticated
   */
  getUserRole(): Promise<'user' | 'editor' | 'admin' | null>
  
  /**
   * Check if current user has a specific role
   * 
   * @param {string} requiredRole - Role to check for ('editor' or 'admin')
   * @returns {Promise<boolean>} True if user has the role (or higher)
   */
  hasRole(requiredRole: 'editor' | 'admin'): Promise<boolean>
  
  /**
   * Get fresh user data from the API
   * 
   * @returns {Promise<AuthResult>} Current user data if authenticated
   */
  getCurrentUser(): Promise<AuthResult>
  
  /**
   * Clean up data URL avatar from user metadata
   * 
   * @returns {Promise<AuthResult>} Result with updated user data
   */
  cleanupDataUrlAvatar(): Promise<AuthResult>
}

/**
 * Current implementation using manual session management
 * This bypasses the broken Supabase SDK and manages sessions manually
 */
export class ManualAuthService implements AuthService {
  private readonly API_URL = 'https://kejvhvszhevfwgsztedf.supabase.co/auth/v1'
  private readonly ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtlanZodnN6aGV2Zndnc3p0ZWRmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTE4ODg2MTIsImV4cCI6MjA2NzQ2NDYxMn0.xUYXxNodJTpTwChlKbuBSojVJqX9CDW87aVISEUc2rE'

  async signInWithEmail(email: string, password: string): Promise<AuthResult> {
    try {
      const response = await fetch(`${this.API_URL}/token?grant_type=password`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'apikey': this.ANON_KEY
        },
        body: JSON.stringify({
          email,
          password
        })
      })

      const data = await response.json()

      if (!response.ok) {
        return { success: false, error: data.error_description || data.msg || 'Authentication failed' }
      }

      const session = this.formatSession(data)
      this.storeSession(session)

      return { success: true, session, user: session.user }
    } catch (error) {
      return { success: false, error: 'Network error occurred' }
    }
  }

  async signUpWithEmail(email: string, password: string, fullName?: string): Promise<AuthResult> {
    try {
      const response = await fetch(`${this.API_URL}/signup`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'apikey': this.ANON_KEY
        },
        body: JSON.stringify({
          email,
          password,
          data: fullName ? { full_name: fullName } : undefined
        })
      })

      const data = await response.json()

      if (!response.ok) {
        return { success: false, error: data.error_description || data.msg || 'Sign up failed' }
      }

      // Sign up usually requires email confirmation, so no session yet
      return { success: true, user: data.user }
    } catch (error) {
      return { success: false, error: 'Network error occurred' }
    }
  }

  async signInWithMagicLink(email: string, fullName?: string): Promise<AuthResult> {
    console.log('[AuthService] signInWithMagicLink called with:', { email, fullName })
    try {
      const url = `${this.API_URL}/otp`
      const body = {
        email,
        create_user: true,
        data: fullName ? { full_name: fullName } : undefined
      }
      
      console.log('[AuthService] Sending POST request to:', url)
      console.log('[AuthService] Request body:', body)
      
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'apikey': this.ANON_KEY
        },
        body: JSON.stringify(body)
      })

      console.log('[AuthService] Response status:', response.status)
      const data = await response.json()
      console.log('[AuthService] Response data:', data)

      if (!response.ok) {
        return { success: false, error: data.error_description || data.msg || 'Failed to send magic link' }
      }

      return { success: true }
    } catch (error) {
      console.error('[AuthService] Network error:', error)
      return { success: false, error: 'Network error occurred' }
    }
  }

  async verifyOtp(email: string, token: string): Promise<AuthResult> {
    console.log('[AuthService] verifyOtp called with:', { email, token })
    try {
      const url = `${this.API_URL}/verify`
      const body = {
        type: 'email',
        email,
        token
      }
      
      console.log('[AuthService] Sending POST request to:', url)
      console.log('[AuthService] Request body:', body)
      
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'apikey': this.ANON_KEY
        },
        body: JSON.stringify(body)
      })

      console.log('[AuthService] Response status:', response.status)
      console.log('[AuthService] Response headers:', response.headers)
      
      let data
      const contentType = response.headers.get('content-type')
      
      if (contentType && contentType.includes('application/json')) {
        try {
          data = await response.json()
          console.log('[AuthService] Response data:', data)
        } catch (jsonError) {
          console.error('[AuthService] Failed to parse response as JSON:', jsonError)
          return { success: false, error: 'Invalid JSON response from server' }
        }
      } else {
        // Response is not JSON, read as text
        const text = await response.text()
        console.error('[AuthService] Non-JSON response:', text)
        return { success: false, error: 'Server returned non-JSON response' }
      }

      if (!response.ok) {
        console.error('[AuthService] Verification failed:', data)
        return { success: false, error: data.error_description || data.msg || 'Verification failed' }
      }

      // Check if the response contains the required session data
      if (!data || !data.access_token) {
        console.error('[AuthService] Invalid response - missing access_token:', data)
        return { success: false, error: 'Invalid response from server - no access token provided' }
      }

      try {
        const session = this.formatSession(data)
        this.storeSession(session)
        return { success: true, session, user: session.user }
      } catch (formatError) {
        console.error('[AuthService] Error formatting session:', formatError)
        return { success: false, error: 'Failed to process authentication response' }
      }
    } catch (error) {
      console.error('[AuthService] Network error in verifyOtp:', error)
      
      // More specific error handling
      if (error instanceof TypeError) {
        if (error.message.includes('Failed to fetch')) {
          return { success: false, error: 'Cannot connect to authentication service. Please check your internet connection.' }
        }
      }
      
      // Return the actual error message for debugging
      return { success: false, error: error instanceof Error ? error.message : 'Network error occurred' }
    }
  }

  async resendOtp(email: string): Promise<AuthResult> {
    try {
      const response = await fetch(`${this.API_URL}/resend`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'apikey': this.ANON_KEY
        },
        body: JSON.stringify({
          type: 'email',
          email
        })
      })

      const data = await response.json()

      if (!response.ok) {
        return { success: false, error: data.error_description || data.msg || 'Failed to resend code' }
      }

      return { success: true }
    } catch (error) {
      return { success: false, error: 'Network error occurred' }
    }
  }

  async signOut(): Promise<{ success: boolean; error?: string }> {
    try {
      // Clear stored session
      localStorage.removeItem('tiko_auth_session')
      localStorage.removeItem('supabase.auth.token')
      localStorage.removeItem('tiko_pending_auth_email')
      
      return { success: true }
    } catch (error) {
      return { success: false, error: 'Sign out failed' }
    }
  }

  async getSession(): Promise<AuthSession | null> {
    try {
      // Check localStorage for existing session
      const sessionStr = localStorage.getItem('tiko_auth_session')
      if (!sessionStr) return null

      const session = JSON.parse(sessionStr)
      
      // Check if session is expired
      if (session.expires_at && Date.now() / 1000 > session.expires_at) {
        // Try to refresh if we have a refresh token
        if (session.refresh_token) {
          const refreshResult = await this.refreshSession(session.refresh_token)
          if (refreshResult.success && refreshResult.session) {
            return refreshResult.session
          }
        }
        
        // Session expired and couldn't refresh
        localStorage.removeItem('tiko_auth_session')
        return null
      }

      return session
    } catch (error) {
      console.error('Error getting session:', error)
      return null
    }
  }
  
  async handleMagicLinkCallback(): Promise<AuthResult> {
    try {
      const hashParams = new URLSearchParams(window.location.hash.substring(1))
      const accessToken = hashParams.get('access_token')
      const refreshToken = hashParams.get('refresh_token')
      const expiresIn = hashParams.get('expires_in')
      
      if (!accessToken || !refreshToken) {
        return { success: false, error: 'No tokens found in URL' }
      }
      
      // Decode the JWT to get user info
      const user = this.decodeJwtUser(accessToken)
      
      // Create session object
      const expiresInSeconds = expiresIn ? parseInt(expiresIn) : 3600
      const session: AuthSession = {
        access_token: accessToken,
        refresh_token: refreshToken,
        expires_at: Date.now() / 1000 + expiresInSeconds,
        expires_in: expiresInSeconds,
        token_type: 'bearer',
        user
      }
      
      // Store the session
      this.storeSession(session)
      
      // Clear the URL hash to prevent reprocessing
      window.history.replaceState(null, '', window.location.pathname + window.location.search)
      
      return { success: true, session, user }
    } catch (error) {
      console.error('[AuthService] Error processing magic link:', error)
      return { success: false, error: 'Failed to process magic link' }
    }
  }

  async refreshSession(refreshToken: string): Promise<AuthResult> {
    try {
      const response = await fetch(`${this.API_URL}/token?grant_type=refresh_token`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'apikey': this.ANON_KEY
        },
        body: JSON.stringify({
          refresh_token: refreshToken
        })
      })

      const data = await response.json()

      if (!response.ok) {
        return { success: false, error: data.error_description || data.msg || 'Token refresh failed' }
      }

      const session = this.formatSession(data)
      this.storeSession(session)

      return { success: true, session, user: session.user }
    } catch (error) {
      return { success: false, error: 'Network error occurred' }
    }
  }

  async updateUser(updates: Partial<AuthUser>): Promise<AuthResult> {
    try {
      const session = await this.getSession()
      if (!session) {
        return { success: false, error: 'Not authenticated' }
      }

      const response = await fetch(`${this.API_URL}/user`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'apikey': this.ANON_KEY,
          'Authorization': `Bearer ${session.access_token}`
        },
        body: JSON.stringify(updates)
      })

      const data = await response.json()

      if (!response.ok) {
        return { success: false, error: data.error_description || data.msg || 'Update failed' }
      }

      return { success: true, user: data.user }
    } catch (error) {
      return { success: false, error: 'Network error occurred' }
    }
  }

  async updateUserMetadata(metadata: Record<string, any>): Promise<AuthResult> {
    try {
      const session = await this.getSession()
      if (!session) {
        return { success: false, error: 'Not authenticated' }
      }

      const response = await fetch(`${this.API_URL}/user`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'apikey': this.ANON_KEY,
          'Authorization': `Bearer ${session.access_token}`
        },
        body: JSON.stringify({
          data: metadata
        })
      })

      const data = await response.json()

      if (!response.ok) {
        return { success: false, error: data.error_description || data.msg || 'Update failed' }
      }

      // Update the session with new user data
      const updatedUser = this.formatUserFromSupabase(data)
      const updatedSession = {
        ...session,
        user: updatedUser
      }
      
      // Store the updated session
      this.storeSession(updatedSession)

      return { success: true, user: updatedUser, session: updatedSession }
    } catch (error) {
      return { success: false, error: 'Network error occurred' }
    }
  }

  /**
   * Clean up data URL avatar from user metadata
   */
  async cleanupDataUrlAvatar(): Promise<AuthResult> {
    try {
      const session = await this.getSession()
      if (!session) {
        return { success: false, error: 'Not authenticated' }
      }

      // Check if avatar_url is a data URL
      if (session.user?.user_metadata?.avatar_url?.startsWith('data:')) {
        console.log('[AuthService] Cleaning up data URL avatar')
        
        // Update user metadata to remove the data URL
        const cleanMetadata = {
          ...session.user.user_metadata,
          avatar_url: '' // Clear the data URL
        }
        
        const response = await fetch(`${this.API_URL}/user`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'apikey': this.ANON_KEY,
            'Authorization': `Bearer ${session.access_token}`
          },
          body: JSON.stringify({
            data: cleanMetadata
          })
        })

        const data = await response.json()

        if (!response.ok) {
          return { success: false, error: data.error_description || data.msg || 'Failed to clean avatar' }
        }

        console.log('[AuthService] Successfully cleaned up data URL avatar')
        return { success: true, user: data.user }
      }

      return { success: true, user: session.user }
    } catch (error) {
      console.error('[AuthService] Error cleaning up avatar:', error)
      return { success: false, error: 'Failed to clean up avatar' }
    }
  }

  /**
   * Format API response into standardized session object
   */
  private formatSession(data: any): AuthSession {
    let user: AuthUser
    
    if (data.user) {
      // Convert Supabase user format to our AuthUser format
      const supabaseUser = data.user
      // Get avatar_url from user_metadata
      let avatarUrl = supabaseUser.user_metadata?.avatar_url || ''
      
      user = {
        id: supabaseUser.id,
        email: supabaseUser.email || '',
        phone: supabaseUser.phone || '',
        full_name: supabaseUser.user_metadata?.full_name || '',
        avatar_url: avatarUrl,
        email_verified: supabaseUser.email_confirmed_at ? true : false,
        phone_verified: supabaseUser.user_metadata?.phone_verified || false,
        app_metadata: supabaseUser.app_metadata || {},
        user_metadata: supabaseUser.user_metadata || {},
        created_at: supabaseUser.created_at || new Date().toISOString(),
        updated_at: supabaseUser.updated_at || new Date().toISOString()
      }
    } else {
      // Fallback to decoding from JWT if no user object provided
      user = this.decodeJwtUser(data.access_token)
    }
    
    return {
      access_token: data.access_token,
      refresh_token: data.refresh_token || '',
      expires_at: data.expires_at || (Math.floor(Date.now() / 1000) + (data.expires_in || 3600)),
      expires_in: data.expires_in || 3600,
      token_type: data.token_type || 'bearer',
      user
    }
  }

  /**
   * Decode user info from JWT token
   */
  private decodeJwtUser(token: string): AuthUser {
    try {
      const payload = JSON.parse(atob(token.split('.')[1]))
      
      return {
        id: payload.sub,
        email: payload.email || '',
        phone: payload.phone || '',
        full_name: payload.user_metadata?.full_name || '',
        avatar_url: payload.user_metadata?.avatar_url || '',
        email_verified: payload.email_verified || false,
        phone_verified: payload.phone_verified || false,
        app_metadata: payload.app_metadata || {},
        user_metadata: payload.user_metadata || {},
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }
    } catch (error) {
      throw new Error('Invalid JWT token')
    }
  }

  async getUserRole(): Promise<'user' | 'editor' | 'admin' | null> {
    try {
      const session = await this.getSession()
      if (!session) return null
      
      // Use RPC function to get current user's role
      const response = await fetch(
        'https://kejvhvszhevfwgsztedf.supabase.co/rest/v1/rpc/get_my_role',
        {
          method: 'POST',
          headers: {
            'apikey': this.ANON_KEY,
            'Authorization': `Bearer ${session.access_token}`,
            'Content-Type': 'application/json',
            'Prefer': 'return=representation'
          },
          body: '{}'
        }
      )
      
      if (!response.ok) {
        console.error('[AuthService] Failed to fetch user role:', response.status, response.statusText)
        try {
          const errorText = await response.text()
          console.error('[AuthService] Error details:', errorText)
        } catch {}
        return 'user'
      }
      
      const role = await response.json()
      console.log('[AuthService] User role:', role)
      
      return role as 'user' | 'editor' | 'admin'
    } catch (error) {
      console.error('[AuthService] Error getting user role:', error)
      return 'user'
    }
  }
  
  async hasRole(requiredRole: 'editor' | 'admin'): Promise<boolean> {
    const userRole = await this.getUserRole()
    
    if (!userRole) return false
    
    // Admin has all permissions
    if (userRole === 'admin') return true
    
    // Editor has editor permissions
    if (userRole === 'editor' && requiredRole === 'editor') return true
    
    return false
  }

  /**
   * Get fresh user data from the API
   */
  async getCurrentUser(): Promise<AuthResult> {
    try {
      const session = await this.getSession()
      if (!session) {
        return { success: false, error: 'Not authenticated' }
      }

      const response = await fetch(`${this.API_URL}/user`, {
        method: 'GET',
        headers: {
          'apikey': this.ANON_KEY,
          'Authorization': `Bearer ${session.access_token}`
        }
      })

      const userData = await response.json()

      if (!response.ok) {
        return { success: false, error: userData.error_description || userData.msg || 'Failed to get user' }
      }

      // Update the session with fresh user data
      const updatedSession = {
        ...session,
        user: this.formatUserFromSupabase(userData)
      }
      
      this.storeSession(updatedSession)

      return { success: true, user: updatedSession.user, session: updatedSession }
    } catch (error) {
      return { success: false, error: 'Network error occurred' }
    }
  }

  /**
   * Format user data from Supabase response
   */
  private formatUserFromSupabase(supabaseUser: any): AuthUser {
    let avatarUrl = supabaseUser.user_metadata?.avatar_url || 
                    supabaseUser.user_metadata?.picture || ''
    
    return {
      id: supabaseUser.id,
      email: supabaseUser.email || '',
      phone: supabaseUser.phone || '',
      full_name: supabaseUser.user_metadata?.full_name || '',
      avatar_url: avatarUrl,
      email_verified: supabaseUser.email_confirmed_at ? true : false,
      phone_verified: supabaseUser.user_metadata?.phone_verified || false,
      app_metadata: supabaseUser.app_metadata || {},
      user_metadata: supabaseUser.user_metadata || {},
      created_at: supabaseUser.created_at || new Date().toISOString(),
      updated_at: supabaseUser.updated_at || new Date().toISOString()
    }
  }

  /**
   * Store session in localStorage
   */
  private storeSession(session: AuthSession): void {
    // Clean up any large data URLs before storing to avoid localStorage limits
    const cleanSession = { ...session }
    
    // Clean avatar_url if it's a data URL
    if (cleanSession.user?.avatar_url?.startsWith('data:')) {
      cleanSession.user = {
        ...cleanSession.user,
        avatar_url: ''
      }
    }
    
    // Also clean it from user_metadata if present
    if (cleanSession.user?.user_metadata?.avatar_url?.startsWith('data:')) {
      cleanSession.user = {
        ...cleanSession.user,
        user_metadata: {
          ...cleanSession.user.user_metadata,
          avatar_url: ''
        }
      }
    }
    
    try {
      localStorage.setItem('tiko_auth_session', JSON.stringify(cleanSession))
      
      // Also store in the format Supabase expects for compatibility
      localStorage.setItem('supabase.auth.token', JSON.stringify(cleanSession))
    } catch (error) {
      console.error('[AuthService] Failed to store session in localStorage:', error)
      // If it still fails, try storing without user metadata
      const minimalSession = {
        ...cleanSession,
        user: {
          ...cleanSession.user,
          user_metadata: {},
          app_metadata: {}
        }
      }
      localStorage.setItem('tiko_auth_session', JSON.stringify(minimalSession))
      localStorage.setItem('supabase.auth.token', JSON.stringify(minimalSession))
    }
  }
}

// Export singleton instance
export const authService: AuthService = new ManualAuthService()