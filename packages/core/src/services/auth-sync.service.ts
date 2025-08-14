/**
 * Auth Sync Service
 * 
 * Synchronizes the custom auth session with Supabase to enable RLS
 */

import { getSupabase } from '../lib/supabase-lazy'
import type { AuthSession } from './auth.service'

class AuthSyncService {
  /**
   * Sync the custom auth session with Supabase
   * This sets the Supabase session so that auth.uid() works in RLS policies
   */
  async syncWithSupabase(session: AuthSession): Promise<void> {
    try {
      const supabase = getSupabase()
      
      console.log('[Auth Sync] Attempting to sync session for user:', session.user.id)
      console.log('[Auth Sync] Access token valid until:', new Date(session.expires_at * 1000).toISOString())
      
      // Store the session in Supabase's expected format and location
      const supabaseSession = {
        access_token: session.access_token,
        refresh_token: session.refresh_token,
        expires_in: session.expires_in,
        expires_at: session.expires_at,
        token_type: session.token_type,
        user: session.user
      }
      
      // Store in the format Supabase expects
      // Extract project ref from the Supabase client's internal structure
      const supabaseAny = supabase as any
      const url = supabaseAny.supabaseUrl || supabaseAny.restUrl || ''
      const projectRef = url ? url.split('//')[1]?.split('.')[0] : 'ref'
      const storageKey = `sb-${projectRef}-auth-token`
      localStorage.setItem(storageKey, JSON.stringify({
        currentSession: supabaseSession,
        expiresAt: session.expires_at
      }))
      
      console.log('[Auth Sync] Stored session in:', storageKey)
      
      // Force Supabase to reload from storage
      const { data: { session: currentSession } } = await supabase.auth.getSession()
      console.log('[Auth Sync] Supabase session after sync:', currentSession?.user?.id)
      
      // If still no session, try setting it directly
      if (!currentSession) {
        console.log('[Auth Sync] No session found, trying setSession...')
        const { data, error } = await supabase.auth.setSession({
          access_token: session.access_token,
          refresh_token: session.refresh_token
        })
        
        if (error) {
          console.error('[Auth Sync] setSession error:', error)
        } else {
          console.log('[Auth Sync] setSession successful')
        }
      }
    } catch (error) {
      console.error('[Auth Sync] Failed to sync session:', error)
      // Don't throw - let the app continue even if sync fails
    }
  }

  /**
   * Clear the Supabase session on logout
   */
  async clearSupabaseSession(): Promise<void> {
    try {
      const supabase = getSupabase()
      await supabase.auth.signOut()
      console.log('[Auth Sync] Supabase session cleared')
    } catch (error) {
      console.error('[Auth Sync] Failed to clear session:', error)
    }
  }

  /**
   * Check if Supabase session is valid
   */
  async checkSupabaseSession(): Promise<boolean> {
    try {
      const supabase = getSupabase()
      const { data: { session } } = await supabase.auth.getSession()
      return !!session
    } catch (error) {
      console.error('[Auth Sync] Failed to check session:', error)
      return false
    }
  }
}

export const authSyncService = new AuthSyncService()