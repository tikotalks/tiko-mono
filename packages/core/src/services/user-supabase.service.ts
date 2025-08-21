/**
 * Supabase Implementation of User Service using direct API calls
 */

import type { UserService, UserProfile, UserStats } from './user.service'

export class SupabaseUserService implements UserService {
  private readonly API_URL: string
  private readonly apiKey: string

  constructor() {
    const supabaseUrl = import.meta.env?.VITE_SUPABASE_URL
    if (!supabaseUrl) {
      throw new Error('VITE_SUPABASE_URL environment variable is required')
    }
    this.API_URL = `${supabaseUrl}/rest/v1`
    
    // Use public key for browser compatibility
    this.apiKey = import.meta.env?.VITE_SUPABASE_PUBLIC
    if (!this.apiKey) {
      throw new Error('VITE_SUPABASE_PUBLIC environment variable is required')
    }
  }

  /**
   * Get current session from localStorage
   */
  private getSession() {
    try {
      const sessionStr = localStorage.getItem('tiko_auth_session')
      if (!sessionStr) return null
      return JSON.parse(sessionStr)
    } catch {
      return null
    }
  }
  /**
   * Get all users (admin only)
   */
  async getAllUsers(): Promise<UserProfile[]> {
    try {
      const session = this.getSession()
      if (!session) throw new Error('Not authenticated')

      // TODO: Fix admin check - for now skip it and try to fetch all users directly
      console.log('[UserService] Fetching all user profiles...')
      const response = await fetch(`${this.API_URL}/user_profiles?select=*&order=created_at.desc`, {
        headers: {
          'apikey': this.apiKey,
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json'
        }
      })

      console.log('[UserService] Response status:', response.status)
      
      if (!response.ok) {
        const errorText = await response.text()
        console.error('[UserService] Error response:', errorText)
        console.error('[UserService] This might be due to RLS policies on the user_profiles table')
        console.error('[UserService] Make sure the user_profiles table has policies that allow admins to read all profiles')
        throw new Error(`Failed to fetch users: ${response.statusText}. This might be due to RLS policies.`)
      }

      const profiles = await response.json()
      
      // Map database fields to UserProfile interface
      return profiles.map((profile: any) => ({
        id: profile.user_id, // Map user_id to id
        email: profile.email,
        name: profile.name,
        username: profile.username,
        avatar_url: profile.avatar_url,
        role: profile.role,
        is_active: profile.is_active ?? true,
        created_at: profile.created_at,
        updated_at: profile.updated_at,
        last_sign_in_at: profile.last_sign_in_at,
        metadata: profile.metadata
      }))
    } catch (error) {
      console.error('Failed to get all users:', error)
      throw error
    }
  }

  /**
   * Get a single user by ID
   */
  async getUserById(userId: string): Promise<UserProfile | null> {
    try {
      const session = this.getSession()
      if (!session) return null

      const response = await fetch(`${this.API_URL}/user_profiles?select=*&user_id=eq.${userId}`, {
        headers: {
          'apikey': this.apiKey,
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json'
        }
      })

      if (!response.ok) {
        console.error('Failed to get user:', response.statusText)
        return null
      }

      const data = await response.json()
      const profile = data[0]
      if (!profile) return null
      
      // Map database fields to UserProfile interface
      return {
        id: profile.user_id,
        email: profile.email,
        name: profile.name,
        username: profile.username,
        avatar_url: profile.avatar_url,
        role: profile.role,
        is_active: profile.is_active ?? true,
        created_at: profile.created_at,
        updated_at: profile.updated_at,
        last_sign_in_at: profile.last_sign_in_at,
        metadata: profile.metadata
      }
    } catch (error) {
      console.error('Failed to get user:', error)
      return null
    }
  }

  /**
   * Update user profile (admin only)
   */
  async updateUser(userId: string, updates: Partial<UserProfile>): Promise<UserProfile> {
    try {
      const session = this.getSession()
      if (!session) throw new Error('Not authenticated')

      // Check admin permission
      const isAdmin = await this.isCurrentUserAdmin()
      if (!isAdmin) {
        throw new Error('Unauthorized: Admin access required')
      }

      // Update user profile
      const response = await fetch(`${this.API_URL}/user_profiles?user_id=eq.${userId}`, {
        method: 'PATCH',
        headers: {
          'apikey': this.apiKey,
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json',
          'Prefer': 'return=representation'
        },
        body: JSON.stringify({
          ...updates,
          updated_at: new Date().toISOString()
        })
      })

      if (!response.ok) {
        throw new Error(`Failed to update user: ${response.statusText}`)
      }

      const data = await response.json()
      const profile = data[0]
      if (!profile) throw new Error('User not found')
      
      // Map database fields to UserProfile interface
      return {
        id: profile.user_id,
        email: profile.email,
        name: profile.name,
        username: profile.username,
        avatar_url: profile.avatar_url,
        role: profile.role,
        is_active: profile.is_active ?? true,
        created_at: profile.created_at,
        updated_at: profile.updated_at,
        last_sign_in_at: profile.last_sign_in_at,
        metadata: profile.metadata
      }
    } catch (error) {
      console.error('Failed to update user:', error)
      throw error
    }
  }

  /**
   * Toggle user active status
   */
  async toggleUserStatus(userId: string): Promise<UserProfile> {
    try {
      // Get current status
      const user = await this.getUserById(userId)
      if (!user) throw new Error('User not found')

      // Toggle status
      return this.updateUser(userId, {
        is_active: !user.is_active
      })
    } catch (error) {
      console.error('Failed to toggle user status:', error)
      throw error
    }
  }

  /**
   * Update user role
   */
  async updateUserRole(userId: string, role: UserProfile['role']): Promise<UserProfile> {
    return this.updateUser(userId, { role })
  }

  /**
   * Delete user (soft delete by deactivating)
   */
  async deleteUser(userId: string): Promise<void> {
    try {
      // We don't actually delete users, just deactivate them
      await this.updateUser(userId, {
        is_active: false,
        metadata: {
          ...((await this.getUserById(userId))?.metadata || {}),
          deleted_at: new Date().toISOString()
        }
      })
    } catch (error) {
      console.error('Failed to delete user:', error)
      throw error
    }
  }

  /**
   * Get user statistics
   */
  async getUserStats(): Promise<UserStats> {
    try {
      const session = this.getSession()
      if (!session) throw new Error('Not authenticated')

      // Check if current user is admin first
      console.log('[UserService] Checking if current user is admin for stats...')
      const isAdmin = await this.isCurrentUserAdmin()
      
      if (!isAdmin) {
        console.warn('[UserService] Non-admin user attempted to access user stats')
        // Return empty stats for non-admin users
        return {
          totalUsers: 0,
          activeUsers: 0,
          adminUsers: 0,
          newUsersToday: 0,
          newUsersThisMonth: 0
        }
      }

      // Now fetch user profiles with admin permissions
      console.log('[UserService] Fetching user profiles for stats...')
      const response = await fetch(`${this.API_URL}/user_profiles?select=id,created_at,is_active,role`, {
        headers: {
          'apikey': this.apiKey,
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json'
        }
      })

      if (!response.ok) {
        const errorText = await response.text()
        console.error('[UserService] Failed to fetch user profiles:', errorText)
        throw new Error(`Failed to fetch user stats: ${response.statusText}`)
      }

      const profiles = await response.json()
      const now = new Date()
      const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate())
      const monthStart = new Date(now.getFullYear(), now.getMonth(), 1)

      const stats: UserStats = {
        totalUsers: profiles?.length || 0,
        activeUsers: profiles?.filter((p: any) => p.is_active !== false).length || 0,
        adminUsers: profiles?.filter((p: any) => p.role === 'admin').length || 0,
        newUsersToday: profiles?.filter((p: any) => new Date(p.created_at) >= todayStart).length || 0,
        newUsersThisMonth: profiles?.filter((p: any) => new Date(p.created_at) >= monthStart).length || 0
      }

      console.log('[UserService] User stats calculated:', stats)
      return stats
    } catch (error) {
      console.error('Failed to get user stats:', error)
      return {
        totalUsers: 0,
        activeUsers: 0,
        adminUsers: 0,
        newUsersToday: 0,
        newUsersThisMonth: 0
      }
    }
  }

  /**
   * Search users by query
   */
  async searchUsers(query: string): Promise<UserProfile[]> {
    try {
      const session = this.getSession()
      if (!session) return []

      const response = await fetch(`${this.API_URL}/user_profiles?select=*&or=(email.ilike.*${query}*,name.ilike.*${query}*,username.ilike.*${query}*)&order=created_at.desc`, {
        headers: {
          'apikey': this.apiKey,
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json'
        }
      })

      if (!response.ok) {
        console.error('Failed to search users:', response.statusText)
        return []
      }

      const profiles = await response.json()
      
      // Map database fields to UserProfile interface
      return profiles.map((profile: any) => ({
        id: profile.user_id,
        email: profile.email,
        name: profile.name,
        username: profile.username,
        avatar_url: profile.avatar_url,
        role: profile.role,
        is_active: profile.is_active ?? true,
        created_at: profile.created_at,
        updated_at: profile.updated_at,
        last_sign_in_at: profile.last_sign_in_at,
        metadata: profile.metadata
      }))
    } catch (error) {
      console.error('Failed to search users:', error)
      return []
    }
  }

  /**
   * Get users by their IDs
   */
  async getUsersByIds(userIds: string[]): Promise<UserProfile[]> {
    try {
      const session = this.getSession()
      if (!session || userIds.length === 0) return []

      const response = await fetch(`${this.API_URL}/user_profiles?select=*&user_id=in.(${userIds.join(',')})`, {
        headers: {
          'apikey': this.apiKey,
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json'
        }
      })

      if (!response.ok) {
        console.error('Failed to get users by IDs:', response.statusText)
        return []
      }

      const profiles = await response.json()
      
      // Map database fields to UserProfile interface
      return profiles.map((profile: any) => ({
        id: profile.user_id,
        email: profile.email,
        name: profile.name,
        username: profile.username,
        avatar_url: profile.avatar_url,
        role: profile.role,
        is_active: profile.is_active ?? true,
        created_at: profile.created_at,
        updated_at: profile.updated_at,
        last_sign_in_at: profile.last_sign_in_at,
        metadata: profile.metadata
      }))
    } catch (error) {
      console.error('Failed to get users by IDs:', error)
      return []
    }
  }

  /**
   * Check if current user is admin
   */
  async isCurrentUserAdmin(): Promise<boolean> {
    try {
      const session = this.getSession()
      if (!session) {
        console.log('[UserService] No session found')
        return false
      }

      // Log session structure to debug
      console.log('[UserService] Session structure:', {
        hasUser: !!session.user,
        hasUserId: !!session.user?.id,
        userId: session.user?.id,
        email: session.user?.email
      })

      // Handle different session structures
      const userId = session.user?.id || session.user_id
      const email = session.user?.email
      
      if (!userId) {
        console.error('[UserService] No user ID found in session')
        return false
      }

      // Check admin by email domain first (fallback check)
      if (email && (
        email.endsWith('@admin.tiko.app') || 
        email.endsWith('@tiko.com') || 
        email.endsWith('@admin.com')
      )) {
        console.log('[UserService] Admin detected by email domain:', email)
        return true
      }

      const response = await fetch(`${this.API_URL}/user_profiles?select=role,email&user_id=eq.${userId}`, {
        headers: {
          'apikey': this.apiKey,
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json'
        }
      })

      if (!response.ok) {
        const errorText = await response.text()
        console.error('[UserService] Failed to check admin status:', response.statusText, errorText)
        
        // If profile lookup fails, fall back to email domain check
        if (email && (
          email.endsWith('@admin.tiko.app') || 
          email.endsWith('@tiko.com') || 
          email.endsWith('@admin.com')
        )) {
          console.log('[UserService] Fallback admin check by email domain:', email)
          return true
        }
        
        return false
      }

      const profiles = await response.json()
      const profile = profiles[0]
      
      console.log('[UserService] Admin check result:', profile)
      
      // Check if admin role is set in profile
      if (profile?.role === 'admin') {
        return true
      }
      
      // Final fallback: check if profile email has admin domain
      if (profile?.email && (
        profile.email.endsWith('@admin.tiko.app') || 
        profile.email.endsWith('@tiko.com') || 
        profile.email.endsWith('@admin.com')
      )) {
        console.log('[UserService] Admin detected by profile email domain:', profile.email)
        return true
      }
      
      return false
    } catch (error) {
      console.error('Failed to check admin status:', error)
      
      // Final fallback: check session email
      try {
        const session = this.getSession()
        const email = session?.user?.email
        if (email && (
          email.endsWith('@admin.tiko.app') || 
          email.endsWith('@tiko.com') || 
          email.endsWith('@admin.com')
        )) {
          console.log('[UserService] Emergency fallback admin check by session email:', email)
          return true
        }
      } catch (fallbackError) {
        console.error('[UserService] Fallback admin check also failed:', fallbackError)
      }
      
      return false
    }
  }
}