export interface IssueReport {
  id: string
  app_name: string
  issue_type: 'bug' | 'feature' | 'improvement' | 'other'
  description: string
  user_email?: string
  build_info?: {
    version?: string
    buildNumber?: string
    environment?: string
  }
  user_agent: string
  metadata?: {
    url?: string
    referrer?: string
    screenResolution?: string
    timezone?: string
  }
  created_at: string
  updated_at: string
}

export interface IssueReportsFilter {
  app?: string
  type?: IssueReport['issue_type'] | ''
  search?: string
}

class IssueReportsService {
  private async apiRequest<T>(endpoint: string): Promise<T> {
    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
    const supabaseKey =
      import.meta.env?.VITE_SUPABASE_SERVICE_KEY ||
      import.meta.env?.VITE_SUPABASE_SECRET ||
      import.meta.env?.VITE_SUPABASE_PUBLISHABLE_KEY

    if (!supabaseUrl || !supabaseKey) {
      throw new Error('Issue report credentials missing')
    }

    const response = await fetch(`${supabaseUrl}/rest/v1/${endpoint}`, {
      headers: {
        'Content-Type': 'application/json',
        apikey: supabaseKey,
        Authorization: `Bearer ${supabaseKey}`,
      },
    })

    if (!response.ok) {
      const errorText = await response.text().catch(() => '')
      throw new Error(`Issue report request failed: ${response.status} ${errorText}`)
    }

    return response.json()
  }

  async getReports(filter: IssueReportsFilter = {}): Promise<IssueReport[]> {
    const params = new URLSearchParams()
    params.append('order', 'created_at.desc')

    if (filter.app) {
      params.append('app_name', `eq.${filter.app}`)
    }

    if (filter.type) {
      params.append('issue_type', `eq.${filter.type}`)
    }

    if (filter.search) {
      params.append(
        'or',
        `(description.ilike.%${filter.search}%,user_email.ilike.%${filter.search}%)`
      )
    }

    return this.apiRequest<IssueReport[]>(`issue_reports?${params.toString()}`)
  }
}

export const issueReportsService = new IssueReportsService()
