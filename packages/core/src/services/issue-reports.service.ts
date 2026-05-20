import { coreApiRequest, getServiceBaseUrl } from './internal-api'

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
    const baseUrl = getServiceBaseUrl('VITE_ISSUE_REPORTS_API_URL', 'https://issues.tikoapi.org')

    return coreApiRequest<T>(baseUrl, `/rest/v1/${endpoint}`)
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
