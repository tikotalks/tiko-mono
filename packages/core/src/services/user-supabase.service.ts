/**
 * Supabase Implementation of User Service using direct API calls
 */

import type { UserService, UserProfile, UserStats } from './user.service'

export class SupabaseUserService implements UserService {
  private readonly API_URL = 'https://kejvhvszhevfwgsztedf.supabase.co/rest/v1'
  private readonly ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtlanZodnN6aGV2Zndnc3p0ZWRmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTE4ODg2MTIsImV4cCI6MjA2NzQ2NDYxMn0.xUYXxNodJTpTwChlKbuBSojVJqX9CDW87aVISEUc2rE'

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

      // Check if current user is admin using RPC
      console.log('[UserService] Checking user role...')
      const roleResponse = await fetch(`${this.API_URL}/rpc/get_my_role`, {
        method: 'POST',
        headers: {
          'apikey': this.ANON_KEY,
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json'
        },
        body: '{}'
      })

      if (!roleResponse.ok) {
        const errorText = await roleResponse.text()
        console.error('[UserService] Role check failed:', errorText)
        throw new Error('Failed to check user role')
      }

      const role = await roleResponse.json()
      console.log('[UserService] User role:', role)
      
      if (role !== 'admin') {
        throw new Error('Unauthorized: Admin access required')
      }

      // Get all user profiles
      console.log('[UserService] Fetching all user profiles...')
      const response = await fetch(`${this.API_URL}/user_profiles?select=*&order=created_at.desc`, {
        headers: {
          'apikey': this.ANON_KEY,
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json'
        }
      })

      console.log('[UserService] Response status:', response.status)
      
      if (!response.ok) {
        const errorText = await response.text()
        console.error('[UserService] Error response:', errorText)
        throw new Error(`Failed to fetch users: ${response.statusText}`)
      }

      const profiles = await response.json()
      
      // For now, return profiles as-is (auth metadata would require admin API access)
      return profiles.map(profile => ({
        ...profile,
        is_active: profile.is_active ?? true
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

      const response = await fetch(`${this.API_URL}/user_profiles?select=*&id=eq.${userId}`, {
        headers: {
          'apikey': this.ANON_KEY,
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json'
        }
      })

      if (!response.ok) {
        console.error('Failed to get user:', response.statusText)
        return null
      }

      const data = await response.json()
      return data[0] || null
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
      const roleResponse = await fetch(`${this.API_URL}/rpc/get_my_role`, {
        method: 'POST',
        headers: {
          'apikey': this.ANON_KEY,
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json'
        },
        body: '{}'
      })

      if (!roleResponse.ok) {
        throw new Error('Failed to check user role')
      }

      const role = await roleResponse.json()
      if (role !== 'admin') {
        throw new Error('Unauthorized: Admin access required')
      }

      // Update user profile
      const response = await fetch(`${this.API_URL}/user_profiles?id=eq.${userId}`, {
        method: 'PATCH',
        headers: {
          'apikey': this.ANON_KEY,
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
      return data[0]
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

      const response = await fetch(`${this.API_URL}/user_profiles?select=id,created_at`, {
        headers: {
          'apikey': this.ANON_KEY,
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json'
        }
      })

      if (!response.ok) {
        throw new Error(`Failed to fetch user stats: ${response.statusText}`)
      }

      const profiles = await response.json()
      const now = new Date()
      const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate())
      const monthStart = new Date(now.getFullYear(), now.getMonth(), 1)

      const stats: UserStats = {
        totalUsers: profiles?.length || 0,
        activeUsers: profiles?.filter(p => p.is_active !== false).length || 0,
        adminUsers: profiles?.filter(p => p.role === 'admin').length || 0,
        newUsersToday: profiles?.filter(p => new Date(p.created_at) >= todayStart).length || 0,
        newUsersThisMonth: profiles?.filter(p => new Date(p.created_at) >= monthStart).length || 0
      }

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
          'apikey': this.ANON_KEY,
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json'
        }
      })

      if (!response.ok) {
        console.error('Failed to search users:', response.statusText)
        return []
      }

      return await response.json()
    } catch (error) {
      console.error('Failed to search users:', error)
      return []
    }
  }

  /**
   * Check if current user is admin
   */
  async isCurrentUserAdmin(): Promise<boolean> {
    try {
      const session = this.getSession()
      if (!session) return false

      const response = await fetch(`${this.API_URL}/rpc/get_my_role`, {
        method: 'POST',
        headers: {
          'apikey': this.ANON_KEY,
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json'
        },
        body: '{}'
      })

      if (!response.ok) {
        console.error('Failed to check admin status:', response.statusText)
        return false
      }

      const role = await response.json()
      return role === 'admin'
    } catch (error) {
      console.error('Failed to check admin status:', error)
      return false
    }
  }
}