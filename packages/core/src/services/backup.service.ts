export interface DatabaseBackup {
  id: string
  name: string
  description?: string
  createdAt: Date
  size?: number
  status: 'creating' | 'success' | 'failed'
  commit?: string
  branch?: string
  runUrl?: string
  downloadUrl?: string
  metadata?: Record<string, any>
}

export interface GitHubBackupRun {
  id: number
  name: string
  status: 'queued' | 'in_progress' | 'completed'
  conclusion: 'success' | 'failure' | 'cancelled' | 'skipped' | null
  created_at: string
  updated_at: string
  html_url: string
  head_commit: {
    id: string
    message: string
  }
  actor: {
    login: string
  }
}

class BackupService {
  private readonly GITHUB_OWNER = 'tikotalks'
  private readonly GITHUB_BACKUP_REPO = 'tiko-db-backup'
  private readonly GITHUB_API_BASE = 'https://api.github.com'

  constructor() {
    // No constructor params needed for GitHub API integration
  }

  /**
   * Get backup runs from the tiko-db-backup GitHub repository
   */
  async getBackups(): Promise<DatabaseBackup[]> {
    try {
      const runs = await this.getBackupRuns()
      
      return runs.map(run => ({
        id: run.id.toString(),
        name: this.extractBackupName(run.head_commit.message) || `Backup ${run.id}`,
        description: run.head_commit.message,
        createdAt: new Date(run.created_at),
        status: this.mapWorkflowStatus(run.status, run.conclusion),
        commit: run.head_commit.id.substring(0, 7),
        branch: 'main', // Assuming main branch for now
        runUrl: run.html_url,
        metadata: {
          actor: run.actor.login,
          workflowName: run.name,
          conclusion: run.conclusion,
        },
      }))
    } catch (error) {
      console.error('Error fetching backup runs:', error)
      
      // Return mock data for development
      if (import.meta.env.DEV) {
        return this.getMockBackups()
      }
      
      throw error
    }
  }

  /**
   * Trigger a new backup by dispatching a workflow in the backup repository
   */
  async createBackup(request: { name: string; description?: string }): Promise<boolean> {
    try {
      const githubToken = import.meta.env.VITE_GITHUB_TOKEN
      
      if (!githubToken) {
        console.warn('No GitHub token available for triggering backup')
        // In development, simulate success
        if (import.meta.env.DEV) {
          console.warn('Development mode: simulating backup creation')
          return true
        }
        return false
      }

      // Try workflow dispatch to trigger backup
      const response = await fetch(
        `${this.GITHUB_API_BASE}/repos/${this.GITHUB_OWNER}/${this.GITHUB_BACKUP_REPO}/dispatches`,
        {
          method: 'POST',
          headers: {
            'Accept': 'application/vnd.github+json',
            'Authorization': `Bearer ${githubToken}`,
            'Content-Type': 'application/json',
            'X-GitHub-Api-Version': '2022-11-28'
          },
          body: JSON.stringify({
            event_type: 'manual_backup',
            client_payload: {
              name: request.name,
              description: request.description || 'Manual backup triggered from admin dashboard',
              source: 'admin-dashboard',
            }
          })
        }
      )

      if (!response.ok) {
        const errorText = await response.text()
        console.error(`Failed to trigger backup: ${response.status} ${response.statusText}`, errorText)
        return false
      }

      return true
    } catch (error) {
      console.error('Error triggering backup:', error)
      
      // Return success for development
      if (import.meta.env.DEV) {
        console.warn('Development mode: simulating backup creation')
        return true
      }
      
      return false
    }
  }

  /**
   * Get workflow runs from the backup repository
   */
  async getBackupRuns(limit = 20): Promise<GitHubBackupRun[]> {
    try {
      const githubToken = import.meta.env.VITE_GITHUB_TOKEN
      const headers: Record<string, string> = {
        'Accept': 'application/vnd.github+json',
        'X-GitHub-Api-Version': '2022-11-28'
      }
      
      // Add auth header if token is available
      if (githubToken) {
        headers['Authorization'] = `Bearer ${githubToken}`
      }

      const response = await fetch(
        `${this.GITHUB_API_BASE}/repos/${this.GITHUB_OWNER}/${this.GITHUB_BACKUP_REPO}/actions/runs?per_page=${limit}`,
        { headers }
      )

      if (!response.ok) {
        // If no token, this is expected for private repos
        if (!githubToken && response.status === 403) {
          console.warn('GitHub API access forbidden - this is expected without a GitHub token for private repos')
          return []
        }
        throw new Error(`GitHub API error: ${response.status} ${response.statusText}`)
      }

      const data = await response.json()
      return data.workflow_runs as GitHubBackupRun[]
    } catch (error) {
      console.error('Error fetching backup runs:', error)
      return []
    }
  }

  /**
   * Get download URL for a backup (GitHub artifacts)
   */
  async getBackupDownloadUrl(backupId: string): Promise<string | null> {
    try {
      const githubToken = import.meta.env.VITE_GITHUB_TOKEN
      
      if (!githubToken) {
        console.warn('No GitHub token available for downloading backup artifacts')
        return null
      }

      // Get artifacts for this workflow run
      const response = await fetch(
        `${this.GITHUB_API_BASE}/repos/${this.GITHUB_OWNER}/${this.GITHUB_BACKUP_REPO}/actions/runs/${backupId}/artifacts`,
        {
          headers: {
            'Accept': 'application/vnd.github+json',
            'Authorization': `Bearer ${githubToken}`,
            'X-GitHub-Api-Version': '2022-11-28'
          }
        }
      )

      if (!response.ok) {
        throw new Error(`Failed to get artifacts: ${response.status}`)
      }

      const data = await response.json()
      const artifacts = data.artifacts || []
      
      // Find backup artifact (usually named 'backup' or 'database-backup')
      const backupArtifact = artifacts.find((artifact: any) => 
        artifact.name.toLowerCase().includes('backup')
      )

      if (backupArtifact) {
        return backupArtifact.archive_download_url
      }

      return null
    } catch (error) {
      console.error('Error getting backup download URL:', error)
      
      // Return mock URL for development
      if (import.meta.env.DEV) {
        return `https://github.com/${this.GITHUB_OWNER}/${this.GITHUB_BACKUP_REPO}/actions/runs/${backupId}`
      }
      
      return null
    }
  }

  /**
   * Delete a backup (not directly possible via GitHub API)
   */
  async deleteBackup(backupId: string): Promise<boolean> {
    // GitHub workflow runs cannot be deleted via API
    // This could potentially cancel a running workflow, but completed runs cannot be deleted
    console.warn('GitHub workflow runs cannot be deleted via API')
    
    // For development, simulate success
    if (import.meta.env.DEV) {
      console.warn('Development mode: simulating backup deletion')
      return true
    }
    
    return false
  }

  /**
   * Get backup details from a specific workflow run
   */
  async getBackupDetails(backupId: string): Promise<DatabaseBackup | null> {
    try {
      const githubToken = import.meta.env.VITE_GITHUB_TOKEN
      const headers: Record<string, string> = {
        'Accept': 'application/vnd.github+json',
        'X-GitHub-Api-Version': '2022-11-28'
      }
      
      if (githubToken) {
        headers['Authorization'] = `Bearer ${githubToken}`
      }

      const response = await fetch(
        `${this.GITHUB_API_BASE}/repos/${this.GITHUB_OWNER}/${this.GITHUB_BACKUP_REPO}/actions/runs/${backupId}`,
        { headers }
      )

      if (!response.ok) {
        throw new Error(`Failed to fetch backup details: ${response.status}`)
      }

      const run = await response.json()
      
      return {
        id: run.id.toString(),
        name: this.extractBackupName(run.head_commit.message) || `Backup ${run.id}`,
        description: run.head_commit.message,
        createdAt: new Date(run.created_at),
        status: this.mapWorkflowStatus(run.status, run.conclusion),
        commit: run.head_commit.id.substring(0, 7),
        branch: run.head_branch || 'main',
        runUrl: run.html_url,
        metadata: {
          actor: run.actor.login,
          workflowName: run.name,
          conclusion: run.conclusion,
          event: run.event,
          triggeredBy: run.triggering_actor?.login || run.actor.login,
        },
      }
    } catch (error) {
      console.error('Error fetching backup details:', error)
      return null
    }
  }

  /**
   * Extract backup name from commit message
   */
  private extractBackupName(commitMessage: string): string | null {
    // Look for patterns like "Backup: name" or "backup: name" or just use first line
    const patterns = [
      /(?:backup|Backup):\s*(.+)/,
      /(?:backup|Backup)\s+(.+)/,
      /^(.+?)(?:\n|$)/ // First line
    ]

    for (const pattern of patterns) {
      const match = commitMessage.match(pattern)
      if (match && match[1]) {
        return match[1].trim()
      }
    }

    return null
  }

  /**
   * Map GitHub workflow status to backup status
   */
  private mapWorkflowStatus(status: string, conclusion: string | null): 'creating' | 'success' | 'failed' {
    if (status === 'in_progress' || status === 'queued') {
      return 'creating'
    }
    
    if (conclusion === 'success') {
      return 'success'
    }
    
    if (conclusion === 'failure' || conclusion === 'cancelled') {
      return 'failed'
    }
    
    return 'success' // Default for completed runs without known conclusion
  }

  /**
   * Mock data for development
   */
  private getMockBackups(): DatabaseBackup[] {
    return [
      {
        id: '12345678901',
        name: 'Daily Backup 2024-01-15',
        description: 'Automated daily backup via GitHub Actions',
        createdAt: new Date('2024-01-15T02:00:00Z'),
        status: 'success',
        commit: 'abc1234',
        branch: 'main',
        runUrl: 'https://github.com/tikotalks/tiko-db-backup/actions/runs/12345678901',
        metadata: {
          actor: 'github-actions[bot]',
          workflowName: 'Database Backup',
          conclusion: 'success',
          event: 'schedule',
        },
      },
      {
        id: '12345678902',
        name: 'Pre-deployment Backup',
        description: 'Manual backup before major deployment',
        createdAt: new Date('2024-01-14T10:30:00Z'),
        status: 'success',
        commit: 'def5678',
        branch: 'main',
        runUrl: 'https://github.com/tikotalks/tiko-db-backup/actions/runs/12345678902',
        metadata: {
          actor: 'admin-user',
          workflowName: 'Database Backup',
          conclusion: 'success',
          event: 'repository_dispatch',
          triggeredBy: 'admin-user',
        },
      },
      {
        id: '12345678903',
        name: 'Weekly Full Backup',
        description: 'Complete database backup with all tables',
        createdAt: new Date('2024-01-13T01:00:00Z'),
        status: 'success',
        commit: 'ghi9012',
        branch: 'main',
        runUrl: 'https://github.com/tikotalks/tiko-db-backup/actions/runs/12345678903',
        metadata: {
          actor: 'github-actions[bot]',
          workflowName: 'Database Backup',
          conclusion: 'success',
          event: 'schedule',
        },
      },
    ]
  }
}

export const backupService = new BackupService()