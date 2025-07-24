export interface UserStats {
  totalUsers: number
  activeToday: number
  newUsersToday: number
  activeTrend: number
}

export interface VisitorStats {
  totalVisits: number
  visitsToday: number
  uniqueVisitors: number
  averageSessionDuration: number
}

export interface RecentActivity {
  id: string
  type: 'user_login' | 'user_register' | 'media_upload' | 'media_delete' | 'settings_change'
  description: string
  timestamp: Date
  userId?: string
  metadata?: Record<string, any>
}

export interface DashboardStats {
  users: UserStats
  visitors: VisitorStats
  media: {
    totalImages: number
    storageUsed: number
    recentUploads: number
  }
  system: {
    uptime: number
    version: string
    lastBackup: Date | null
  }
}