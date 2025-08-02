import { supabase } from './supabase.service'

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
        url: 'https://tiko-timer.pages.dev'
      },
      {
        id: 'cards',
        name: 'Cards App',
        type: 'app',
        trigger: '[build:cards]',
        description: 'Interactive learning cards application',
        url: 'https://tiko-cards.pages.dev'
      },
      {
        id: 'radio',
        name: 'Radio App',
        type: 'app',
        trigger: '[build:radio]',
        description: 'Curated radio stations and audio content',
        url: 'https://tiko-radio.pages.dev'
      },
      {
        id: 'todo',
        name: 'Todo App',
        type: 'app',
        trigger: '[build:todo]',
        description: 'Task management and productivity app',
        url: 'https://tiko-todo.pages.dev'
      },
      {
        id: 'yes-no',
        name: 'Yes/No App',
        type: 'app',
        trigger: '[build:yes-no]',
        description: 'Simple decision-making communication tool',
        url: 'https://tiko-yes-no.pages.dev'
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
        url: 'https://tikoapi.org/media'
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
      const response = await fetch(
        `${this.GITHUB_API_BASE}/repos/${this.GITHUB_OWNER}/${this.GITHUB_REPO}/actions/runs?per_page=${limit}`,
        {
          headers: {
            'Accept': 'application/vnd.github.v3+json'
          }
        }
      )

      if (!response.ok) {
        throw new Error(`GitHub API error: ${response.statusText}`)
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
   * Trigger a deployment by creating a commit with the build trigger
   */
  async triggerDeployment(targetId: string, message?: string): Promise<boolean> {
    try {
      const target = this.getDeploymentTargets().find(t => t.id === targetId)
      if (!target) {
        throw new Error(`Unknown deployment target: ${targetId}`)
      }

      const commitMessage = message || `deploy: trigger ${target.name} deployment`
      const fullMessage = `${commitMessage} ${target.trigger}`

      // Use GitHub API to create an empty commit
      const response = await fetch(
        `${this.GITHUB_API_BASE}/repos/${this.GITHUB_OWNER}/${this.GITHUB_REPO}/dispatches`,
        {
          method: 'POST',
          headers: {
            'Accept': 'application/vnd.github.v3+json',
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            event_type: 'deploy',
            client_payload: {
              target: targetId,
              trigger: target.trigger,
              message: fullMessage
            }
          })
        }
      )

      return response.ok
    } catch (error) {
      console.error('Error triggering deployment:', error)
      return false
    }
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
    try {
      const { error } = await supabase
        .from('deployment_events')
        .insert({
          target_id: targetId,
          status,
          metadata: metadata || {},
          created_at: new Date().toISOString()
        })

      if (error) {
        console.error('Error saving deployment event:', error)
      }
    } catch (error) {
      console.error('Error saving deployment event:', error)
    }
  }

  /**
   * Get recent deployment events from database
   */
  async getDeploymentEvents(targetId?: string, limit = 50): Promise<any[]> {
    try {
      let query = supabase
        .from('deployment_events')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(limit)

      if (targetId) {
        query = query.eq('target_id', targetId)
      }

      const { data, error } = await query

      if (error) {
        console.error('Error fetching deployment events:', error)
        return []
      }

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