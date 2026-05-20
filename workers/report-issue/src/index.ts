interface D1Database {
  prepare(query: string): D1PreparedStatement
}

interface D1PreparedStatement {
  bind(...values: unknown[]): D1PreparedStatement
  run(): Promise<unknown>
}

interface ExecutionContext {
  waitUntil(promise: Promise<unknown>): void
}

export interface Env {
  VITE_RESEND_KEY: string
  REPORTS_DB: D1Database
}

interface IssueReport {
  appName: string
  issueType: 'bug' | 'feature' | 'improvement' | 'other'
  description: string
  userEmail?: string
  buildInfo?: unknown
  userAgent: string
  timestamp: string
  url?: string
  referrer?: string
  screenResolution?: string
  timezone?: string
}

const jsonHeaders = {
  'Content-Type': 'application/json',
}

export default {
  async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
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
        headers: corsHeaders,
      })
    }

    try {
      const report: IssueReport = await request.json()

      console.log('[ReportIssue] Received report:', {
        appName: report.appName,
        issueType: report.issueType,
        timestamp: report.timestamp,
      })

      if (!report.appName || !report.issueType || !report.description) {
        return new Response(
          JSON.stringify({
            success: false,
            message: 'Missing required fields: appName, issueType, description',
          }),
          {
            status: 400,
            headers: { ...corsHeaders, ...jsonHeaders },
          },
        )
      }

      const reportId = await storeReport(report, env)
      ctx.waitUntil(sendEmailNotification(report, reportId, env))

      return new Response(
        JSON.stringify({
          success: true,
          message: 'Issue report submitted successfully',
          id: reportId,
        }),
        {
          status: 200,
          headers: { ...corsHeaders, ...jsonHeaders },
        },
      )
    } catch (error) {
      console.error('[ReportIssue] Error:', error)

      return new Response(
        JSON.stringify({
          success: false,
          message: 'Internal server error',
        }),
        {
          status: 500,
          headers: { ...corsHeaders, ...jsonHeaders },
        },
      )
    }
  },
}

async function storeReport(report: IssueReport, env: Env): Promise<string> {
  const id = crypto.randomUUID()
  const createdAt = normalizeTimestamp(report.timestamp)
  const metadata = JSON.stringify({
    url: report.url ?? null,
    referrer: report.referrer ?? null,
    screenResolution: report.screenResolution ?? null,
    timezone: report.timezone ?? null,
  })

  await env.REPORTS_DB.prepare(
    `INSERT INTO issue_reports (
      id,
      app_name,
      issue_type,
      description,
      user_email,
      build_info,
      user_agent,
      metadata,
      created_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
  )
    .bind(
      id,
      report.appName,
      report.issueType,
      report.description,
      report.userEmail ?? null,
      JSON.stringify(report.buildInfo ?? null),
      report.userAgent ?? '',
      metadata,
      createdAt,
    )
    .run()

  return id
}

function normalizeTimestamp(timestamp: string | undefined): string {
  if (!timestamp) return new Date().toISOString()
  const parsed = new Date(timestamp)
  if (Number.isNaN(parsed.getTime())) return new Date().toISOString()
  return parsed.toISOString()
}

async function sendEmailNotification(report: IssueReport, reportId: string, env: Env): Promise<void> {
  if (!env.VITE_RESEND_KEY) {
    console.warn('[ReportIssue] Skipping email notification: VITE_RESEND_KEY is not configured')
    return
  }

  const buildInfo = isRecord(report.buildInfo) ? report.buildInfo : {}
  const emailContent = `
    <h2>New Issue Report - ${escapeHtml(report.appName)}</h2>

    <p><strong>Report ID:</strong> ${escapeHtml(reportId)}</p>
    <p><strong>Issue Type:</strong> ${escapeHtml(report.issueType)}</p>
    <p><strong>App:</strong> ${escapeHtml(report.appName)}</p>
    <p><strong>Submitted:</strong> ${escapeHtml(normalizeTimestamp(report.timestamp))}</p>
    ${report.userEmail ? `<p><strong>Contact Email:</strong> ${escapeHtml(report.userEmail)}</p>` : ''}

    <h3>Description:</h3>
    <p>${escapeHtml(report.description).replace(/\n/g, '<br>')}</p>

    <h3>Technical Information:</h3>
    <ul>
      <li><strong>Version:</strong> ${escapeHtml(stringField(buildInfo.version))}</li>
      <li><strong>Build:</strong> ${escapeHtml(stringField(buildInfo.buildNumber))}</li>
      <li><strong>Environment:</strong> ${escapeHtml(stringField(buildInfo.environment))}</li>
      <li><strong>User Agent:</strong> ${escapeHtml(report.userAgent)}</li>
      ${report.url ? `<li><strong>URL:</strong> ${escapeHtml(report.url)}</li>` : ''}
      ${report.timezone ? `<li><strong>Timezone:</strong> ${escapeHtml(report.timezone)}</li>` : ''}
      ${report.screenResolution ? `<li><strong>Screen:</strong> ${escapeHtml(report.screenResolution)}</li>` : ''}
    </ul>
  `

  const emailResponse = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${env.VITE_RESEND_KEY}`,
    },
    body: JSON.stringify({
      from: 'noreply@tikoapps.com',
      to: ['support@tikoapps.com'],
      subject: `[${report.appName}] ${report.issueType}: Issue Report #${reportId}`,
      html: emailContent,
    }),
  })

  if (!emailResponse.ok) {
    console.error('[ReportIssue] Email send failed:', await emailResponse.text())
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null
}

function stringField(value: unknown): string {
  return typeof value === 'string' && value.trim() ? value : 'Unknown'
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}
