export interface DatabaseBackup {
  id: string
  name: string
  description?: string
  createdAt: Date
  size: number
  status: 'creating' | 'success' | 'failed'
  tables?: string[]
  rows?: number
  downloadUrl?: string
  metadata?: Record<string, any>
}

export interface CreateBackupRequest {
  name: string
  description?: string
  tables?: string[]
}

class BackupService {
  private readonly supabaseUrl: string
  private readonly supabaseKey: string
  private readonly backupApiUrl: string

  constructor() {
    this.supabaseUrl = import.meta.env['VITE_SUPABASE_URL'] || ''
    this.supabaseKey = import.meta.env['VITE_SUPABASE_ANON_KEY'] || ''
    this.backupApiUrl = import.meta.env['VITE_BACKUP_API_URL'] || 'https://backup-api.tikocdn.org'
  }

  /**
   * Get all available backups
   */
  async getBackups(): Promise<DatabaseBackup[]> {
    try {
      const response = await fetch(`${this.backupApiUrl}/backups`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.supabaseKey}`,
        },
      })

      if (!response.ok) {
        throw new Error(`Failed to fetch backups: ${response.status} ${response.statusText}`)
      }

      const data = await response.json()
      
      return (data.backups || []).map((backup: any) => ({
        id: backup.id,
        name: backup.name,
        description: backup.description,
        createdAt: new Date(backup.created_at),
        size: backup.size || 0,
        status: backup.status || 'success',
        tables: backup.metadata?.tables || [],
        rows: backup.metadata?.total_rows || 0,
        downloadUrl: backup.download_url,
        metadata: backup.metadata || {},
      }))
    } catch (error) {
      console.error('Error fetching backups:', error)
      
      // Return mock data for development
      if (import.meta.env.DEV) {
        return this.getMockBackups()
      }
      
      throw error
    }
  }

  /**
   * Create a new backup
   */
  async createBackup(request: CreateBackupRequest): Promise<boolean> {
    try {
      const response = await fetch(`${this.backupApiUrl}/backups`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.supabaseKey}`,
        },
        body: JSON.stringify({
          name: request.name,
          description: request.description,
          tables: request.tables,
          source: 'admin-dashboard',
        }),
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.message || `Failed to create backup: ${response.status}`)
      }

      return true
    } catch (error) {
      console.error('Error creating backup:', error)
      
      // Return success for development
      if (import.meta.env.DEV) {
        console.warn('Development mode: simulating backup creation')
        return true
      }
      
      throw error
    }
  }

  /**
   * Get download URL for a backup
   */
  async getBackupDownloadUrl(backupId: string): Promise<string | null> {
    try {
      const response = await fetch(`${this.backupApiUrl}/backups/${backupId}/download`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.supabaseKey}`,
        },
      })

      if (!response.ok) {
        throw new Error(`Failed to get download URL: ${response.status}`)
      }

      const data = await response.json()
      return data.download_url || null
    } catch (error) {
      console.error('Error getting backup download URL:', error)
      
      // Return mock URL for development
      if (import.meta.env.DEV) {
        return `${this.backupApiUrl}/downloads/mock-${backupId}.sql`
      }
      
      return null
    }
  }

  /**
   * Delete a backup
   */
  async deleteBackup(backupId: string): Promise<boolean> {
    try {
      const response = await fetch(`${this.backupApiUrl}/backups/${backupId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${this.supabaseKey}`,
        },
      })

      if (!response.ok) {
        throw new Error(`Failed to delete backup: ${response.status}`)
      }

      return true
    } catch (error) {
      console.error('Error deleting backup:', error)
      
      // Return success for development
      if (import.meta.env.DEV) {
        console.warn('Development mode: simulating backup deletion')
        return true
      }
      
      throw error
    }
  }

  /**
   * Get backup details
   */
  async getBackupDetails(backupId: string): Promise<DatabaseBackup | null> {
    try {
      const response = await fetch(`${this.backupApiUrl}/backups/${backupId}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.supabaseKey}`,
        },
      })

      if (!response.ok) {
        throw new Error(`Failed to fetch backup details: ${response.status}`)
      }

      const backup = await response.json()
      
      return {
        id: backup.id,
        name: backup.name,
        description: backup.description,
        createdAt: new Date(backup.created_at),
        size: backup.size || 0,
        status: backup.status || 'success',
        tables: backup.metadata?.tables || [],
        rows: backup.metadata?.total_rows || 0,
        downloadUrl: backup.download_url,
        metadata: backup.metadata || {},
      }
    } catch (error) {
      console.error('Error fetching backup details:', error)
      return null
    }
  }

  /**
   * Get backup status (for monitoring ongoing backups)
   */
  async getBackupStatus(backupId: string): Promise<'creating' | 'success' | 'failed' | null> {
    try {
      const response = await fetch(`${this.backupApiUrl}/backups/${backupId}/status`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${this.supabaseKey}`,
        },
      })

      if (!response.ok) {
        return null
      }

      const data = await response.json()
      return data.status || null
    } catch (error) {
      console.error('Error fetching backup status:', error)
      return null
    }
  }

  /**
   * Mock data for development
   */
  private getMockBackups(): DatabaseBackup[] {
    return [
      {
        id: 'backup-1',
        name: 'Daily Backup 2024-01-15',
        description: 'Automated daily backup',
        createdAt: new Date('2024-01-15T02:00:00Z'),
        size: 52428800, // 50MB
        status: 'success',
        tables: ['users', 'projects', 'media_files', 'translations'],
        rows: 15432,
        metadata: {
          type: 'automated',
          compression: 'gzip',
        },
      },
      {
        id: 'backup-2',
        name: 'Pre-deployment Backup',
        description: 'Backup before major deployment',
        createdAt: new Date('2024-01-14T10:30:00Z'),
        size: 48234567,
        status: 'success',
        tables: ['users', 'projects', 'media_files', 'translations'],
        rows: 14987,
        metadata: {
          type: 'manual',
          trigger: 'pre-deployment',
        },
      },
      {
        id: 'backup-3',
        name: 'Weekly Full Backup',
        description: 'Complete database backup',
        createdAt: new Date('2024-01-13T01:00:00Z'),
        size: 67890123,
        status: 'success',
        tables: ['users', 'projects', 'media_files', 'translations', 'deployment_events'],
        rows: 18765,
        metadata: {
          type: 'automated',
          schedule: 'weekly',
        },
      },
    ]
  }
}

export const backupService = new BackupService()