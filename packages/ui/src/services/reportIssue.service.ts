export interface IssueReport {
  appName: string
  issueType: 'bug' | 'feature' | 'improvement' | 'other'
  description: string
  userEmail?: string
  buildInfo?: any
  userAgent: string
  timestamp: string
}

export interface ReportIssueResponse {
  success: boolean
  message: string
  id?: string
}

class ReportIssueService {
  private readonly apiUrl: string
  
  constructor() {
    // Use environment variable or fallback to default
    this.apiUrl = import.meta.env.VITE_REPORT_ISSUE_API_URL || 'https://report-issue.tikoapi.org'
  }

  async submitReport(report: IssueReport): Promise<ReportIssueResponse> {
    try {
      console.log('[ReportIssueService] Submitting issue report:', {
        appName: report.appName,
        issueType: report.issueType,
        hasDescription: !!report.description,
        hasUserEmail: !!report.userEmail
      })

      const response = await fetch(`${this.apiUrl}/submit`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          ...report,
          // Add additional metadata
          url: window.location.href,
          referrer: document.referrer,
          screenResolution: `${screen.width}x${screen.height}`,
          timezone: Intl.DateTimeFormat().resolvedOptions().timeZone
        })
      })

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const result = await response.json()
      console.log('[ReportIssueService] Report submitted successfully:', result)
      
      return result
    } catch (error) {
      console.error('[ReportIssueService] Failed to submit report:', error)
      
      // Fallback to mailto if API fails
      await this.fallbackToMailto(report)
      
      return {
        success: true,
        message: 'Report sent via email client (API unavailable)'
      }
    }
  }

  private async fallbackToMailto(report: IssueReport): Promise<void> {
    const subject = `[${report.appName}] ${report.issueType}: Issue Report`
    const body = `
Issue Type: ${report.issueType}
App: ${report.appName}

Description:
${report.description}

---
Technical Information:
- Version: ${report.buildInfo?.version || 'Unknown'}
- Build: ${report.buildInfo?.buildNumber || 'Unknown'}
- Environment: ${report.buildInfo?.environment || 'Unknown'}
- User Agent: ${report.userAgent}
- URL: ${window.location.href}
- Timestamp: ${report.timestamp}
${report.userEmail ? `- Contact Email: ${report.userEmail}` : ''}
    `.trim()

    const mailtoUrl = `mailto:support@tikoapps.com?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`
    window.open(mailtoUrl, '_blank')
  }
}

export const reportIssueService = new ReportIssueService()