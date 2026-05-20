/**
 * Auth sync service
 *
 * The browser no longer mirrors sessions into a third-party auth SDK. The
 * Cloudflare auth worker owns the session cookie and auth.service keeps the
 * lightweight local tiko_auth_session cache for application boot.
 */

import type { AuthSession } from './auth.service'

export class AuthSyncService {
  async syncSession(_session: AuthSession): Promise<boolean> {
    return true
  }

  async clearSession(): Promise<void> {
    localStorage.removeItem('tiko_auth_session')
  }

  async hasValidSession(): Promise<boolean> {
    try {
      const stored = localStorage.getItem('tiko_auth_session')
      if (!stored) return false
      const session = JSON.parse(stored) as AuthSession
      return Boolean(session.access_token && session.expires_at > Math.floor(Date.now() / 1000))
    } catch {
      return false
    }
  }
}

export const authSyncService = new AuthSyncService()
