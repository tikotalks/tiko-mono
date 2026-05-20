/**
 * User Management Service Interface
 *
 * Handles user operations for admin users including:
 * - Listing all users
 * - Updating user roles and status
 * - Managing user profiles
 */

import { authAPI } from '../lib/auth-api'
import type { AuthSession } from '../lib/auth-api'

export interface UserProfile {
  id: string
  email: string
  name?: string
  username?: string
  avatar_url?: string
  role: 'admin' | 'user' | 'moderator' | 'editor'
  is_active: boolean
  created_at: string
  updated_at: string
  last_sign_in_at?: string
  metadata?: Record<string, any>
}

export interface UserStats {
  totalUsers: number
  activeUsers: number
  adminUsers: number
  newUsersToday: number
  newUsersThisMonth: number
}

export interface UserService {
  /**
   * Get all users (admin only)
   */
  getAllUsers(): Promise<UserProfile[]>

  /**
   * Get a single user by ID
   */
  getUserById(userId: string): Promise<UserProfile | null>

  /**
   * Update user profile (admin only)
   */
  updateUser(userId: string, updates: Partial<UserProfile>): Promise<UserProfile>

  /**
   * Toggle user active status
   */
  toggleUserStatus(userId: string): Promise<UserProfile>

  /**
   * Update user role
   */
  updateUserRole(userId: string, role: UserProfile['role']): Promise<UserProfile>

  /**
   * Delete user (soft delete by deactivating)
   */
  deleteUser(userId: string): Promise<void>

  /**
   * Get user statistics
   */
  getUserStats(): Promise<UserStats>

  /**
   * Search users by query
   */
  searchUsers(query: string): Promise<UserProfile[]>

  /**
   * Get users by their IDs
   */
  getUsersByIds(userIds: string[]): Promise<UserProfile[]>

  /**
   * Check if current user is admin
   */
  isCurrentUserAdmin(): Promise<boolean>
}

const emptyStats = (): UserStats => ({
  totalUsers: 0,
  activeUsers: 0,
  adminUsers: 0,
  newUsersToday: 0,
  newUsersThisMonth: 0
})

const adminEmailDomains = ['@admin.tiko.app', '@tiko.com', '@admin.com']

function isAdminEmail(email?: string | null): boolean {
  return !!email && adminEmailDomains.some(domain => email.endsWith(domain))
}

function sessionToProfile(session: AuthSession): UserProfile {
  const name = typeof session.user.user_metadata?.name === 'string'
    ? session.user.user_metadata.name
    : undefined

  const username = typeof session.user.user_metadata?.username === 'string'
    ? session.user.user_metadata.username
    : undefined

  const avatarUrl = typeof session.user.user_metadata?.avatar_url === 'string'
    ? session.user.user_metadata.avatar_url
    : undefined

  const role = isAdminEmail(session.user.email) ? 'admin' : 'user'

  return {
    id: session.user.id,
    email: session.user.email || '',
    name,
    username,
    avatar_url: avatarUrl,
    role,
    is_active: true,
    created_at: session.user.created_at,
    updated_at: session.user.updated_at,
    metadata: {
      ...session.user.user_metadata,
      app_metadata: session.user.app_metadata
    }
  }
}

class IdentityUserService implements UserService {
  private getSession(): AuthSession | null {
    try {
      return authAPI.getStoredSession()
    } catch {
      return null
    }
  }

  async getAllUsers(): Promise<UserProfile[]> {
    const session = this.getSession()
    if (!session) return []
    return [sessionToProfile(session)]
  }

  async getUserById(userId: string): Promise<UserProfile | null> {
    const session = this.getSession()
    if (!session || session.user.id !== userId) return null
    return sessionToProfile(session)
  }

  async updateUser(userId: string, updates: Partial<UserProfile>): Promise<UserProfile> {
    const currentUser = await this.getUserById(userId)
    if (!currentUser) {
      throw new Error('User not found')
    }

    return {
      ...currentUser,
      ...updates,
      id: currentUser.id,
      email: updates.email ?? currentUser.email,
      updated_at: new Date().toISOString()
    }
  }

  async toggleUserStatus(userId: string): Promise<UserProfile> {
    const currentUser = await this.getUserById(userId)
    if (!currentUser) {
      throw new Error('User not found')
    }

    return this.updateUser(userId, { is_active: !currentUser.is_active })
  }

  async updateUserRole(userId: string, role: UserProfile['role']): Promise<UserProfile> {
    return this.updateUser(userId, { role })
  }

  async deleteUser(userId: string): Promise<void> {
    await this.updateUser(userId, {
      is_active: false,
      metadata: { deleted_at: new Date().toISOString() }
    })
  }

  async getUserStats(): Promise<UserStats> {
    const session = this.getSession()
    if (!session) return emptyStats()

    const user = sessionToProfile(session)
    return {
      totalUsers: 1,
      activeUsers: user.is_active ? 1 : 0,
      adminUsers: user.role === 'admin' ? 1 : 0,
      newUsersToday: 0,
      newUsersThisMonth: 0
    }
  }

  async searchUsers(query: string): Promise<UserProfile[]> {
    const users = await this.getAllUsers()
    const normalizedQuery = query.trim().toLowerCase()
    if (!normalizedQuery) return users

    return users.filter(user =>
      user.email.toLowerCase().includes(normalizedQuery) ||
      user.name?.toLowerCase().includes(normalizedQuery) ||
      user.username?.toLowerCase().includes(normalizedQuery)
    )
  }

  async getUsersByIds(userIds: string[]): Promise<UserProfile[]> {
    const users = await this.getAllUsers()
    const requestedIds = new Set(userIds)
    return users.filter(user => requestedIds.has(user.id))
  }

  async isCurrentUserAdmin(): Promise<boolean> {
    const session = this.getSession()
    return isAdminEmail(session?.user.email)
  }
}

// Export singleton instance
export const userService: UserService = new IdentityUserService()
