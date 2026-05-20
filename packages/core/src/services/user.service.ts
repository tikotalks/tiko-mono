/**
 * User Management Service Interface
 * 
 * Handles user operations for admin users including:
 * - Listing all users
 * - Updating user roles and status
 * - Managing user profiles
 */

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
   * Check if current user is admin
   */
  isCurrentUserAdmin(): Promise<boolean>
}

class AuthWorkerUserService implements UserService {
  private readonly authBaseUrl = stripTrailingSlash((import.meta as any).env?.VITE_AUTH_BASE_URL || 'https://auth.tikoapps.org')

  async getAllUsers(): Promise<UserProfile[]> {
    return this.request<UserProfile[]>('/users')
  }

  async getUserById(userId: string): Promise<UserProfile | null> {
    try {
      return await this.request<UserProfile>(`/users/${encodeURIComponent(userId)}`)
    } catch (error) {
      if (error instanceof Error && error.message.includes('404')) return null
      throw error
    }
  }

  async updateUser(userId: string, updates: Partial<UserProfile>): Promise<UserProfile> {
    return this.request<UserProfile>(`/users/${encodeURIComponent(userId)}`, {
      method: 'PATCH',
      body: JSON.stringify(updates)
    })
  }

  async toggleUserStatus(userId: string): Promise<UserProfile> {
    return this.request<UserProfile>(`/users/${encodeURIComponent(userId)}/toggle-status`, { method: 'POST' })
  }

  async updateUserRole(userId: string, role: UserProfile['role']): Promise<UserProfile> {
    return this.updateUser(userId, { role })
  }

  async deleteUser(userId: string): Promise<void> {
    await this.request<void>(`/users/${encodeURIComponent(userId)}`, { method: 'DELETE' })
  }

  async getUserStats(): Promise<UserStats> {
    return this.request<UserStats>('/users/stats')
  }

  async searchUsers(query: string): Promise<UserProfile[]> {
    return this.request<UserProfile[]>(`/users/search?q=${encodeURIComponent(query)}`)
  }

  async isCurrentUserAdmin(): Promise<boolean> {
    try {
      const response = await fetch(`${this.authBaseUrl}/user`, { credentials: 'include' })
      if (!response.ok) return false
      const data = await response.json() as { user?: { app_metadata?: Record<string, unknown> } }
      return data.user?.app_metadata?.role === 'admin'
    } catch {
      return false
    }
  }

  private async request<T>(path: string, init: RequestInit = {}): Promise<T> {
    const headers = new Headers(init.headers || {})
    if (!headers.has('Content-Type') && init.body) headers.set('Content-Type', 'application/json')

    const response = await fetch(`${this.authBaseUrl}${path}`, {
      ...init,
      headers,
      credentials: 'include'
    })

    if (!response.ok) {
      throw new Error(`User request failed: ${response.status}`)
    }

    if (response.status === 204) return undefined as T
    const data = await response.json()
    return (data.users || data.user || data.stats || data) as T
  }
}

function stripTrailingSlash(value: string): string {
  return value.endsWith('/') ? value.slice(0, -1) : value
}

export const userService: UserService = new AuthWorkerUserService()
