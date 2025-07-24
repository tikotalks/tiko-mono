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

// Import and export the Supabase implementation
import { SupabaseUserService } from './user-supabase.service'

// Export singleton instance
export const userService: UserService = new SupabaseUserService()

// Export types
export type { UserProfile, UserStats }