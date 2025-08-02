// No external dependencies needed - uses direct API calls

export interface DeploymentTarget {
  id: string
  name: string
  type: 'app' | 'tool' | 'website' | 'worker'
  trigger: string
  description: string
  url?: string
  lastDeployed?: Date
  status?: 'idle' | 'building' | 'success' | 'failed'
  buildDuration?: number
}

export interface DeploymentHistory {
  id: string
  targetId: string
  commit: string
  status: 'running' | 'success' | 'failed'
  startedAt: Date
  completedAt?: Date
  duration?: number
  logUrl?: string
  triggeredBy: string
}

export interface GitHubWorkflowRun {
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

class DeploymentService {
  private readonly GITHUB_OWNER = 'tikotalks'
  private readonly GITHUB_REPO = 'tiko-mono'
  private readonly GITHUB_API_BASE = 'https://api.github.com'
  private readonly supabaseUrl: string
  private readonly supabaseKey: string

  constructor() {
    this.supabaseUrl = import.meta.env['VITE_SUPABASE_URL'] || ''
    this.supabaseKey = import.meta.env['VITE_SUPABASE_ANON_KEY'] || ''
  }

  /**
   * All available deployment targets
   */
  getDeploymentTargets(): DeploymentTarget[] {
    return [
      // Apps
      {
        id: 'timer',
        name: 'Timer App',
        type: 'app',
        trigger: '[build:timer]',
        description: 'Pomodoro timer and time management app',
        url: 'https://timer.tikoapps.org'
      },
      {
        id: 'cards',
        name: 'Cards App',
        type: 'app',
        trigger: '[build:cards]',
        description: 'Interactive learning cards application',
        url: 'https://cards.tikoapps.org'
      },
      {
        id: 'radio',
        name: 'Radio App',
        type: 'app',
        trigger: '[build:radio]',
        description: 'Curated radio stations and audio content',
        url: 'https://radio.tikoapps.org'
      },
      {
        id: 'todo',
        name: 'Todo App',
        type: 'app',
        trigger: '[build:todo]',
        description: 'Task management and productivity app',
        url: 'https://todo.tikoapps.org'
      },
      {
        id: 'yes-no',
        name: 'Yes/No App',
        type: 'app',
        trigger: '[build:yes-no]',
        description: 'Simple decision-making communication tool',
        url: 'https://yes-no.tikoapps.org'
      },
      // Tools
      {
        id: 'admin',
        name: 'Admin Tool',
        type: 'tool',
        trigger: '[build:admin]',
        description: 'Content management and administration interface',
        url: 'https://tiko-admin.pages.dev'
      },
      {
        id: 'ui-docs',
        name: 'UI Documentation',
        type: 'tool',
        trigger: '[build:ui-docs]',
        description: 'Component library documentation and examples',
        url: 'https://tiko-ui-docs.pages.dev'
      },
      // Websites
      {
        id: 'marketing',
        name: 'Marketing Website',
        type: 'website',
        trigger: '[build:marketing]',
        description: 'Main marketing and information website',
        url: 'https://tiko-marketing.pages.dev'
      },
      // Workers
      {
        id: 'i18n-translator',
        name: 'Translation Worker',
        type: 'worker',
        trigger: '[build:i18n-translator]',
        description: 'AI-powered translation service worker',
        url: 'https://tikoapi.org/translate'
      },
      {
        id: 'media-upload',
        name: 'Media Upload Worker',
        type: 'worker',
        trigger: '[build:media-upload]',
        description: 'File upload and media processing worker',
        url: 'https://media.tikocdn.org'
      },
      {
        id: 'sentence-engine',
        name: 'Sentence Engine Worker',
        type: 'worker',
        trigger: '[build:sentence-engine]',
        description: 'AI sentence prediction and completion worker',
        url: 'https://tikoapi.org/sentence'
      }
    ]
  }

  /**
   * Get GitHub workflow runs for deployment monitoring
   */
  async getWorkflowRuns(workflowName?: string, limit = 20): Promise<GitHubWorkflowRun[]> {
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
        `${this.GITHUB_API_BASE}/repos/${this.GITHUB_OWNER}/${this.GITHUB_REPO}/actions/runs?per_page=${limit}`,
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
      let runs = data.workflow_runs as GitHubWorkflowRun[]

      // Filter by workflow name if specified
      if (workflowName) {
        runs = runs.filter(run => run.name.includes(workflowName))
      }

      return runs
    } catch (error) {
      console.error('Error fetching workflow runs:', error)
      return []
    }
  }

  /**
   * Trigger a deployment using GitHub API
   * Supports multiple methods: workflow_dispatch, repository_dispatch, or empty commit
   */
  async triggerDeployment(targetId: string, message?: string): Promise<boolean> {
    try {
      const target = this.getDeploymentTargets().find(t => t.id === targetId)
      if (!target) {
        throw new Error(`Unknown deployment target: ${targetId}`)
      }

      const deploymentMessage = message || `Deploy ${target.name} via admin dashboard`
      
      // Try method 1: Workflow dispatch (if we have a GitHub token)
      const githubToken = import.meta.env.VITE_GITHUB_TOKEN
      
      if (githubToken) {
        // First test if the token is valid
        console.log(`🔐 Testing GitHub token validity...`)
        const tokenValid = await this.testGitHubToken(githubToken)
        if (!tokenValid) {
          console.error('❌ GitHub token is invalid or lacks required permissions')
          return false
        }
        console.log(`✅ GitHub token is valid`)

        console.log(`🚀 Attempting workflow dispatch for ${target.name}...`)
        const workflowDispatchResult = await this.triggerWorkflowDispatch(target, deploymentMessage, githubToken)
        if (workflowDispatchResult) {
          console.log(`✅ Workflow dispatch successful for ${target.name}`)
          return true
        }
        console.log(`❌ Workflow dispatch failed for ${target.name}, trying repository dispatch...`)

        console.log(`🚀 Attempting repository dispatch for ${target.name}...`)
        const repositoryDispatchResult = await this.triggerRepositoryDispatch(target, deploymentMessage, githubToken)
        if (repositoryDispatchResult) {
          console.log(`✅ Repository dispatch successful for ${target.name}`)
          return true
        }
        console.log(`❌ Repository dispatch failed for ${target.name}, falling back to commit method...`)
      } else {
        console.warn('⚠️ No GitHub token found - cannot use GitHub API methods')
      }

      // Fallback method 3: Create empty commit with trigger message
      console.log(`🚀 Attempting fallback commit method for ${target.name}...`)
      return await this.triggerWithEmptyCommit(target, deploymentMessage)
    } catch (error) {
      console.error('Error triggering deployment:', error)
      return false
    }
  }

  /**
   * Test if GitHub token is valid and has required permissions
   */
  private async testGitHubToken(token: string): Promise<boolean> {
    try {
      // Test with a simple API call to check token permissions
      const response = await fetch(
        `${this.GITHUB_API_BASE}/repos/${this.GITHUB_OWNER}/${this.GITHUB_REPO}`,
        {
          headers: {
            'Accept': 'application/vnd.github+json',
            'Authorization': `Bearer ${token}`,
            'X-GitHub-Api-Version': '2022-11-28'
          }
        }
      )

      if (!response.ok) {
        const errorText = await response.text()
        console.error(`Token test failed: ${response.status} ${response.statusText}`)
        
        if (response.status === 401) {
          console.error('❌ Token is invalid or expired')
        } else if (response.status === 403) {
          // Check if it's a rate limit issue
          try {
            const errorData = JSON.parse(errorText)
            if (errorData.message && errorData.message.includes('rate limit')) {
              console.warn('⚠️ GitHub API rate limit exceeded. Token appears valid but rate limited.')
              console.warn('ℹ️ This is normal for public repositories with high API usage.')
              return true // Token is valid, just rate limited
            }
          } catch (e) {
            // Not JSON, treat as permission error
          }
          console.error('❌ Token lacks required permissions for this repository')
        } else if (response.status === 404) {
          console.error('❌ Repository not found or token lacks repo access')
        }
        return false
      }

      const repoData = await response.json()
      console.log(`✅ Token has access to repository: ${repoData.full_name}`)
      return true
    } catch (error) {
      console.error('Token test error:', error)
      return false
    }
  }

  /**
   * Method 1: Trigger workflow dispatch for specific workflow
   */
  private async triggerWorkflowDispatch(target: DeploymentTarget, message: string, token: string): Promise<boolean> {
    try {
      const workflowId = this.getWorkflowIdForTarget(target)
      if (!workflowId) {
        console.warn(`No workflow mapping found for target: ${target.id}`)
        return false
      }

      console.log(`Triggering workflow: ${workflowId} for target: ${target.id}`)
      
      const response = await fetch(
        `${this.GITHUB_API_BASE}/repos/${this.GITHUB_OWNER}/${this.GITHUB_REPO}/actions/workflows/${workflowId}/dispatches`,
        {
          method: 'POST',
          headers: {
            'Accept': 'application/vnd.github+json',
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
            'X-GitHub-Api-Version': '2022-11-28'
          },
          body: JSON.stringify({
            ref: 'master',
            inputs: {
              target: target.id,
              message: message
            }
          })
        }
      )

      if (!response.ok) {
        const errorText = await response.text()
        console.error(`Workflow dispatch failed: ${response.status} ${response.statusText}`, errorText)
        
        // Check for rate limiting
        if (response.status === 403) {
          try {
            const errorData = JSON.parse(errorText)
            if (errorData.message && errorData.message.includes('rate limit')) {
              console.warn('⚠️ GitHub API rate limit exceeded during workflow dispatch')
              console.warn('ℹ️ Please wait a few minutes before trying again')
            }
          } catch (e) {
            // Not JSON, continue with normal error handling
          }
        }
      }

      return response.ok
    } catch (error) {
      console.error('Workflow dispatch failed:', error)
      return false
    }
  }

  /**
   * Method 2: Trigger repository dispatch event
   */
  private async triggerRepositoryDispatch(target: DeploymentTarget, message: string, token: string): Promise<boolean> {
    try {
      const response = await fetch(
        `${this.GITHUB_API_BASE}/repos/${this.GITHUB_OWNER}/${this.GITHUB_REPO}/dispatches`,
        {
          method: 'POST',
          headers: {
            'Accept': 'application/vnd.github+json',
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
            'X-GitHub-Api-Version': '2022-11-28'
          },
          body: JSON.stringify({
            event_type: 'deploy',
            client_payload: {
              target: target.id,
              trigger: target.trigger,
              message: message,
              source: 'admin-dashboard'
            }
          })
        }
      )

      if (!response.ok) {
        const errorText = await response.text()
        console.error(`Repository dispatch failed: ${response.status} ${response.statusText}`, errorText)
        
        // Check for rate limiting
        if (response.status === 403) {
          try {
            const errorData = JSON.parse(errorText)
            if (errorData.message && errorData.message.includes('rate limit')) {
              console.warn('⚠️ GitHub API rate limit exceeded during repository dispatch')
              console.warn('ℹ️ Please wait a few minutes before trying again')
            }
          } catch (e) {
            // Not JSON, continue with normal error handling
          }
        }
      }

      return response.ok
    } catch (error) {
      console.error('Repository dispatch failed:', error)
      return false
    }
  }

  /**
   * Method 3: Fallback - create empty commit with build trigger
   */
  private async triggerWithEmptyCommit(target: DeploymentTarget, message: string): Promise<boolean> {
    try {
      // This would require Git API access to create commits
      // For now, log that we'd need to create a commit
      console.warn(`Fallback: Would create empty commit with message: "${message} ${target.trigger}"`)
      
      // Return false since we can't actually create commits from the browser
      // This would need to be handled server-side or via GitHub App
      return false
    } catch (error) {
      console.error('Empty commit fallback failed:', error)
      return false
    }
  }

  /**
   * Get workflow ID/filename for a deployment target
   */
  private getWorkflowIdForTarget(target: DeploymentTarget): string | null {
    // Map targets to their workflow files
    const workflowMap: Record<string, string> = {
      // Apps
      'timer': 'deploy-apps.yml',
      'cards': 'deploy-apps.yml', 
      'radio': 'deploy-apps.yml',
      'todo': 'deploy-apps.yml',
      'yes-no': 'deploy-apps.yml',
      
      // Tools
      'admin': 'deploy-tools.yml',
      'ui-docs': 'deploy-tools.yml',
      
      // Websites
      'marketing': 'deploy-websites.yml',
      
      // Workers
      'i18n-translator': 'deploy-workers.yml',
      'media-upload': 'deploy-workers.yml',
      'sentence-engine': 'deploy-workers.yml'
    }

    return workflowMap[target.id] || null
  }

  /**
   * Get deployment status for all targets
   */
  async getDeploymentStatus(): Promise<DeploymentTarget[]> {
    const targets = this.getDeploymentTargets()
    const workflowRuns = await this.getWorkflowRuns()

    // Map workflow runs to targets based on triggers found in commit messages
    for (const target of targets) {
      const relevantRuns = workflowRuns.filter(run => 
        run.head_commit.message.includes(target.trigger) ||
        this.getWorkflowNameForTarget(target.type) === run.name
      )

      if (relevantRuns.length > 0) {
        const latestRun = relevantRuns[0]
        target.status = this.mapWorkflowStatus(latestRun.status, latestRun.conclusion)
        target.lastDeployed = new Date(latestRun.updated_at)
        
        if (latestRun.conclusion) {
          const started = new Date(latestRun.created_at)
          const completed = new Date(latestRun.updated_at)
          target.buildDuration = completed.getTime() - started.getTime()
        }
      } else {
        target.status = 'idle'
      }
    }

    return targets
  }

  /**
   * Get deployment history for a specific target
   */
  async getDeploymentHistory(targetId: string, limit = 10): Promise<DeploymentHistory[]> {
    const target = this.getDeploymentTargets().find(t => t.id === targetId)
    if (!target) return []

    const workflowRuns = await this.getWorkflowRuns()
    
    return workflowRuns
      .filter(run => run.head_commit.message.includes(target.trigger))
      .slice(0, limit)
      .map(run => ({
        id: run.id.toString(),
        targetId,
        commit: run.head_commit.id.substring(0, 7),
        status: this.mapWorkflowStatus(run.status, run.conclusion) as 'running' | 'success' | 'failed',
        startedAt: new Date(run.created_at),
        completedAt: run.conclusion ? new Date(run.updated_at) : undefined,
        duration: run.conclusion ? 
          new Date(run.updated_at).getTime() - new Date(run.created_at).getTime() : 
          undefined,
        logUrl: run.html_url,
        triggeredBy: run.actor.login
      }))
  }

  /**
   * Save deployment event to database for tracking
   */
  async saveDeploymentEvent(targetId: string, status: string, metadata?: any): Promise<void> {
    if (!this.supabaseUrl || !this.supabaseKey) {
      console.warn('Supabase credentials not configured, skipping deployment event save')
      return
    }

    try {
      const response = await fetch(`${this.supabaseUrl}/rest/v1/deployment_events`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'apikey': this.supabaseKey,
          'Authorization': `Bearer ${this.supabaseKey}`,
          'Prefer': 'return=minimal'
        },
        body: JSON.stringify({
          target_id: targetId,
          status,
          metadata: metadata || {},
          created_at: new Date().toISOString()
        })
      })

      if (!response.ok) {
        console.error('Error saving deployment event:', response.statusText)
      }
    } catch (error) {
      console.error('Error saving deployment event:', error)
    }
  }

  /**
   * Get recent deployment events from database
   */
  async getDeploymentEvents(targetId?: string, limit = 50): Promise<any[]> {
    if (!this.supabaseUrl || !this.supabaseKey) {
      console.warn('Supabase credentials not configured, returning empty deployment events')
      return []
    }

    try {
      let url = `${this.supabaseUrl}/rest/v1/deployment_events?select=*&order=created_at.desc&limit=${limit}`
      
      if (targetId) {
        url += `&target_id=eq.${targetId}`
      }

      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'apikey': this.supabaseKey,
          'Authorization': `Bearer ${this.supabaseKey}`
        }
      })

      if (!response.ok) {
        console.error('Error fetching deployment events:', response.statusText)
        return []
      }

      const data = await response.json()
      return data || []
    } catch (error) {
      console.error('Error fetching deployment events:', error)
      return []
    }
  }

  private getWorkflowNameForTarget(type: string): string {
    switch (type) {
      case 'app': return 'Deploy Apps'
      case 'tool': return 'Deploy Tools'
      case 'website': return 'Deploy Websites'
      case 'worker': return 'Deploy Cloudflare Workers'
      default: return ''
    }
  }

  private mapWorkflowStatus(status: string, conclusion: string | null): 'idle' | 'building' | 'success' | 'failed' {
    if (status === 'in_progress' || status === 'queued') {
      return 'building'
    }
    
    if (conclusion === 'success') {
      return 'success'
    }
    
    if (conclusion === 'failure' || conclusion === 'cancelled') {
      return 'failed'
    }
    
    return 'idle'
  }
}

export const deploymentService = new DeploymentService()