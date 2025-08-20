export interface Env {
  VITE_RESEND_KEY: string
  VITE_SUPABASE_URL: string
  VITE_SUPABASE_SERVICE_KEY: string
}

interface IssueReport {
  appName: string
  issueType: 'bug' | 'feature' | 'improvement' | 'other'
  description: string
  userEmail?: string
  buildInfo?: any
  userAgent: string
  timestamp: string
  url?: string
  referrer?: string
  screenResolution?: string
  timezone?: string
}

export default {
  async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
    // Handle CORS
    const corsHeaders = {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    }

    if (request.method === 'OPTIONS') {
      return new Response(null, { headers: corsHeaders })
    }

    if (request.method !== 'POST') {
      return new Response('Method not allowed', { 
        status: 405,
        headers: corsHeaders
      })
    }

    try {
      const report: IssueReport = await request.json()
      
      console.log('[ReportIssue] Received report:', {
        appName: report.appName,
        issueType: report.issueType,
        timestamp: report.timestamp
      })

      // Validate required fields
      if (!report.appName || !report.issueType || !report.description) {
        return new Response(JSON.stringify({
          success: false,
          message: 'Missing required fields: appName, issueType, description'
        }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        })
      }

      // Store in Supabase
      const reportId = await storeReport(report, env)

      // Send email notification
      await sendEmailNotification(report, reportId, env)

      return new Response(JSON.stringify({
        success: true,
        message: 'Issue report submitted successfully',
        id: reportId
      }), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })

    } catch (error) {
      console.error('[ReportIssue] Error:', error)
      
      return new Response(JSON.stringify({
        success: false,
        message: 'Internal server error'
      }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }
  },
}

async function storeReport(report: IssueReport, env: Env): Promise<string> {
  const response = await fetch(`${env.VITE_SUPABASE_URL}/rest/v1/issue_reports`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'apikey': env.VITE_SUPABASE_SERVICE_KEY,
      'Authorization': `Bearer ${env.VITE_SUPABASE_SERVICE_KEY}`,
      'Prefer': 'return=representation'
    },
    body: JSON.stringify({
      app_name: report.appName,
      issue_type: report.issueType,
      description: report.description,
      user_email: report.userEmail,
      build_info: report.buildInfo,
      user_agent: report.userAgent,
      metadata: {
        url: report.url,
        referrer: report.referrer,
        screenResolution: report.screenResolution,
        timezone: report.timezone
      },
      created_at: report.timestamp
    })
  })

  if (!response.ok) {
    throw new Error(`Supabase error: ${response.status}`)
  }

  const data = await response.json()
  return data[0]?.id || 'unknown'
}

async function sendEmailNotification(report: IssueReport, reportId: string, env: Env): Promise<void> {
  const emailContent = `
    <h2>New Issue Report - ${report.appName}</h2>
    
    <p><strong>Report ID:</strong> ${reportId}</p>
    <p><strong>Issue Type:</strong> ${report.issueType}</p>
    <p><strong>App:</strong> ${report.appName}</p>
    <p><strong>Submitted:</strong> ${new Date(report.timestamp).toLocaleString()}</p>
    ${report.userEmail ? `<p><strong>Contact Email:</strong> ${report.userEmail}</p>` : ''}
    
    <h3>Description:</h3>
    <p>${report.description.replace(/\n/g, '<br>')}</p>
    
    <h3>Technical Information:</h3>
    <ul>
      <li><strong>Version:</strong> ${report.buildInfo?.version || 'Unknown'}</li>
      <li><strong>Build:</strong> ${report.buildInfo?.buildNumber || 'Unknown'}</li>
      <li><strong>Environment:</strong> ${report.buildInfo?.environment || 'Unknown'}</li>
      <li><strong>User Agent:</strong> ${report.userAgent}</li>
      ${report.url ? `<li><strong>URL:</strong> ${report.url}</li>` : ''}
      ${report.timezone ? `<li><strong>Timezone:</strong> ${report.timezone}</li>` : ''}
      ${report.screenResolution ? `<li><strong>Screen:</strong> ${report.screenResolution}</li>` : ''}
    </ul>
  `

  // Using Resend API for email
  const emailResponse = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${env.VITE_RESEND_KEY}`
    },
    body: JSON.stringify({
      from: 'noreply@tikoapps.com',
      to: ['support@tikoapps.com'],
      subject: `[${report.appName}] ${report.issueType}: Issue Report #${reportId}`,
      html: emailContent
    })
  })

  if (!emailResponse.ok) {
    console.error('[ReportIssue] Email send failed:', await emailResponse.text())
    // Don't throw error - report was still saved
  }
}