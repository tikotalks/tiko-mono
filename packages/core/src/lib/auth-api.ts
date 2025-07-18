// Direct Supabase Auth API implementation
const SUPABASE_URL = 'https://kejvhvszhevfwgsztedf.supabase.co'
const ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtlanZodnN6aGV2Zndnc3p0ZWRmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTE4ODg2MTIsImV4cCI6MjA2NzQ2NDYxMn0.xUYXxNodJTpTwChlKbuBSojVJqX9CDW87aVISEUc2rE'

export interface AuthSession {
  access_token: string
  refresh_token: string
  expires_in: number
  expires_at: number
  token_type: string
  user: any
}

export interface AuthUser {
  id: string
  email: string
  created_at: string
  updated_at: string
  user_metadata?: any
}

class AuthAPI {
  private async apiCall(endpoint: string, options: RequestInit = {}) {
    const response = await fetch(`${SUPABASE_URL}${endpoint}`, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        'apikey': ANON_KEY,
        ...options.headers
      }
    })
    
    const data = await response.json()
    
    if (!response.ok) {
      throw new Error(data.msg || data.error || 'API call failed')
    }
    
    return data
  }

  async sendMagicLink(email: string): Promise<void> {
    console.log('[AuthAPI] Sending magic link to:', email)
    
    const response = await this.apiCall('/auth/v1/otp', {
      method: 'POST',
      body: JSON.stringify({
        email,
        create_user: true,
        options: {
          email_redirect_to: `${window.location.origin}/auth/callback`,
          should_create_user: true
        }
      })
    })
    
    console.log('[AuthAPI] Magic link sent, response:', response)
  }

  async getUser(accessToken: string): Promise<AuthUser> {
    console.log('[AuthAPI] Getting user data')
    
    const data = await this.apiCall('/auth/v1/user', {
      headers: {
        'Authorization': `Bearer ${accessToken}`
      }
    })
    
    return data
  }

  getStoredSession(): AuthSession | null {
    const stored = localStorage.getItem('tiko_auth_session')
    if (!stored) return null
    
    try {
      const session = JSON.parse(stored)
      // Check if expired
      if (session.expires_at && session.expires_at < Date.now() / 1000) {
        localStorage.removeItem('tiko_auth_session')
        return null
      }
      return session
    } catch {
      return null
    }
  }

  storeSession(session: AuthSession): void {
    localStorage.setItem('tiko_auth_session', JSON.stringify(session))
  }

  clearSession(): void {
    localStorage.removeItem('tiko_auth_session')
  }
}

export const authAPI = new AuthAPI()