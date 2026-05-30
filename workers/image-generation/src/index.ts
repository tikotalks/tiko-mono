import OpenAI from 'openai'
import {
  requireAuth,
  requireAuthWithRateLimit,
  AuthError,
  type AuthEnv,
  type RateLimitConfig,
} from '@tiko/auth-middleware'

export interface Env extends AuthEnv {
  MEDIA_BUCKET: R2Bucket
  USER_MEDIA_BUCKET: R2Bucket
  IMAGE_DB: D1Database
  ANALYTICS?: AnalyticsEngineDataset
  OPENAI_API_KEY: string
  ENVIRONMENT: string
}

interface GenerationRequest {
  userId: string
  scope: 'personal' | 'global'
  items: Array<{
    name: string
    prompt: string
    size?: '256x256' | '512x512' | '1024x1024' | '1024x1792' | '1792x1024'
    style?: 'vivid' | 'natural'
    category?: string
    tags?: string[]
  }>
}

interface MediaRecord {
  id: string
  user_id?: string
  generated_by?: string
  filename: string
  original_filename: string
  file_size: number
  mime_type: string
  url: string
  thumbnail_url?: string
  width?: number
  height?: number
  metadata: Record<string, unknown>
  usage_type?: string
  category?: string
  tags?: string[]
  status: 'queued' | 'generating' | 'generated' | 'published' | 'failed'
  generation_data: Record<string, unknown>
  error_message?: string
  _table: 'media' | 'user_media'
}

const ALLOWED_ORIGIN_PATTERNS = [
  /^https:\/\/(dev\.)?[a-z0-9-]+\.tikoapps\.org$/,
  /^https:\/\/tiko\.mt$/,
  /^https:\/\/dev\.tiko\.mt$/,
  /^http:\/\/localhost(?::\d+)?$/,
  /^http:\/\/127\.0\.0\.1(?::\d+)?$/,
]

function isAllowedOrigin(origin: string): boolean {
  return ALLOWED_ORIGIN_PATTERNS.some((pattern) => pattern.test(origin))
}

function getCORSHeaders(request: Request): Record<string, string> {
  const origin = request.headers.get('Origin')

  if (origin && isAllowedOrigin(origin)) {
    return {
      'Access-Control-Allow-Origin': origin,
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      'Access-Control-Allow-Credentials': 'true',
      'Access-Control-Max-Age': '86400',
      'Vary': 'Origin',
    }
  }

  return {
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Max-Age': '86400',
    'Vary': 'Origin',
  }
}

const IMAGE_RATE_LIMIT: RateLimitConfig = {
  free: { rpm: 10, rpd: 5 },
  pro: { rpm: 60, rpd: 50 },
}

export default {
  async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
    const url = new URL(request.url)

    if (request.method === 'OPTIONS') {
      return new Response(null, { status: 204, headers: getCORSHeaders(request) })
    }

    try {
      const openai = new OpenAI({ apiKey: env.OPENAI_API_KEY })

      if (url.pathname === '/generate' && request.method === 'POST') {
        // Require authentication and rate limiting
        try {
          await requireAuthWithRateLimit(request, env as AuthEnv, IMAGE_RATE_LIMIT, {
            scopes: ['image'],
          })
        } catch (error) {
          if (error instanceof AuthError) {
            return json({ error: error.message }, error.status, request)
          }
          throw error
        }

        const data: GenerationRequest = await request.json()

        if (!data.userId || !data.items || !Array.isArray(data.items)) {
          return json({ error: 'Invalid request data' }, 400, request)
        }

        const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
        if (!uuidRegex.test(data.userId)) {
          return json({ error: 'Invalid user ID format', details: 'User ID must be a valid UUID' }, 400, request)
        }

        const tableName: 'media' | 'user_media' = data.scope === 'global' ? 'media' : 'user_media'
        const mediaRecords: MediaRecord[] = []

        for (const item of data.items) {
          const record = await insertQueuedRecord(env, tableName, data.userId, item)
          mediaRecords.push(record)
        }

        if (mediaRecords.length > 0) {
          ctx.waitUntil(processGenerationQueue(mediaRecords, env, openai))
        }

        return json({ success: mediaRecords.length > 0, queued: mediaRecords.length, records: mediaRecords }, 200, request)
      }

      if (url.pathname.startsWith('/progress/') && request.method === 'GET') {
        // Require authentication for progress endpoint
        try {
          await requireAuth(request, env as AuthEnv, {
            scopes: ['image'],
          })
        } catch (error) {
          if (error instanceof AuthError) {
            return json({ error: error.message }, error.status, request)
          }
          throw error
        }

        const userId = url.pathname.split('/')[2]
        const headers = new Headers({
          ...getCORSHeaders(request),
          'Content-Type': 'text/event-stream',
          'Cache-Control': 'no-cache',
          Connection: 'keep-alive',
        })

        const stream = new ReadableStream({
          async start(controller) {
            const items = await listUserGenerationItems(env, userId)
            controller.enqueue(new TextEncoder().encode(`data: ${JSON.stringify({ type: 'initial', items })}\n\n`))

            const heartbeat = setInterval(() => {
              controller.enqueue(new TextEncoder().encode(': heartbeat\n\n'))
            }, 30000)

            request.signal.addEventListener('abort', () => {
              clearInterval(heartbeat)
              controller.close()
            })
          },
        })

        return new Response(stream, { headers })
      }

      return new Response('Not Found', { status: 404, headers: getCORSHeaders(request) })
    } catch (error) {
      console.error('Worker error:', error)
      const errorMessage = error instanceof Error ? error.message : 'Unknown error'
      return json({ error: 'Internal server error', message: errorMessage }, 500, request)
    }
  },
}

function json(body: unknown, status = 200, request?: Request): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      ...(request ? getCORSHeaders(request) : {}),
      'Content-Type': 'application/json',
    },
  })
}

async function insertQueuedRecord(
  env: Env,
  tableName: 'media' | 'user_media',
  userId: string,
  item: GenerationRequest['items'][number],
): Promise<MediaRecord> {
  const id = crypto.randomUUID()
  const filename = `${id}-${item.name.toLowerCase().replace(/[^a-z0-9]/g, '-')}.png`
  const now = new Date().toISOString()
  const generationData = {
    prompt: item.prompt,
    size: item.size || '1024x1024',
    style: item.style || 'vivid',
    queued_at: now,
  }

  const record: MediaRecord = {
    id,
    filename,
    original_filename: `${item.name}.png`,
    file_size: 0,
    mime_type: 'image/png',
    url: '',
    status: 'queued',
    generation_data: generationData,
    metadata: tableName === 'media' ? { ai_generated: true, model: 'dall-e-3' } : {},
    _table: tableName,
    ...(tableName === 'media'
      ? { generated_by: userId, category: item.category || 'generated', tags: item.tags || [] }
      : { user_id: userId, usage_type: 'generated' }),
  }

  if (tableName === 'media') {
    await env.IMAGE_DB.prepare(
      `INSERT INTO media (
        id, generated_by, filename, original_filename, file_size, mime_type, url,
        thumbnail_url, width, height, metadata, category, tags, status,
        generation_data, error_message, generated_at, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    )
      .bind(
        id,
        userId,
        record.filename,
        record.original_filename,
        record.file_size,
        record.mime_type,
        record.url,
        null,
        null,
        null,
        JSON.stringify(record.metadata),
        record.category,
        JSON.stringify(record.tags || []),
        record.status,
        JSON.stringify(record.generation_data),
        null,
        null,
        now,
        now,
      )
      .run()
  } else {
    await env.IMAGE_DB.prepare(
      `INSERT INTO user_media (
        id, user_id, filename, original_filename, file_size, mime_type, url,
        thumbnail_url, width, height, metadata, usage_type, status,
        generation_data, error_message, generated_at, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    )
      .bind(
        id,
        userId,
        record.filename,
        record.original_filename,
        record.file_size,
        record.mime_type,
        record.url,
        null,
        null,
        null,
        JSON.stringify(record.metadata),
        record.usage_type,
        record.status,
        JSON.stringify(record.generation_data),
        null,
        null,
        now,
        now,
      )
      .run()
  }

  return record
}

async function listUserGenerationItems(env: Env, userId: string): Promise<MediaRecord[]> {
  const rows = await env.IMAGE_DB.prepare(
    `SELECT * FROM user_media
     WHERE user_id = ? AND status IN ('queued', 'generating', 'generated', 'failed')
     ORDER BY created_at DESC`,
  )
    .bind(userId)
    .all<Record<string, unknown>>()

  return rows.results.map((row) => rowToMediaRecord(row, 'user_media'))
}

async function processGenerationQueue(records: MediaRecord[], env: Env, openai: OpenAI) {
  for (const record of records) {
    const tableName = record._table

    try {
      const startedGenerationData = {
        ...record.generation_data,
        started_at: new Date().toISOString(),
      }
      await updateRecord(env, tableName, record.id, {
        status: 'generating',
        generation_data: startedGenerationData,
      })
      record.generation_data = startedGenerationData

      const response = await openai.images.generate({
        model: 'dall-e-3',
        prompt: String(record.generation_data.prompt),
        n: 1,
        size: (record.generation_data.size as '256x256' | '512x512' | '1024x1024' | '1024x1792' | '1792x1024') || '1024x1024',
        style: (record.generation_data.style as 'vivid' | 'natural') || 'vivid',
        response_format: 'url',
      })

      const generatedImage = response.data?.[0]
      const imageUrl = generatedImage?.url
      if (!imageUrl) throw new Error('No image URL returned from OpenAI')

      const imageResponse = await fetch(imageUrl)
      const imageBlob = await imageResponse.blob()
      const arrayBuffer = await imageBlob.arrayBuffer()
      const imageAnalysis = await analyzeImage(arrayBuffer)

      const userId = record.user_id || record.generated_by || 'unknown'
      const isGlobal = tableName === 'media'
      const bucket = isGlobal ? env.MEDIA_BUCKET : env.USER_MEDIA_BUCKET
      const r2Key = isGlobal ? `generated/${record.filename}` : `${userId}/generated/${record.filename}`

      await bucket.put(r2Key, arrayBuffer, {
        httpMetadata: { contentType: 'image/png' },
        customMetadata: {
          userId,
          prompt: String(record.generation_data.prompt),
          generatedAt: new Date().toISOString(),
          scope: isGlobal ? 'global' : 'personal',
          width: String(imageAnalysis.width),
          height: String(imageAnalysis.height),
          format: imageAnalysis.format,
        },
      })

      const cdnUrl = isGlobal ? `https://media.tikocdn.org/${r2Key}` : `https://user-media.tikocdn.org/${r2Key}`
      const completedGenerationData = {
        ...record.generation_data,
        completed_at: new Date().toISOString(),
        revised_prompt: generatedImage.revised_prompt,
      }
      const metadata = {
        ...record.metadata,
        ...imageAnalysis,
        revised_prompt: generatedImage.revised_prompt,
      }

      await updateRecord(env, tableName, record.id, {
        status: 'generated',
        url: cdnUrl,
        thumbnail_url: cdnUrl,
        file_size: arrayBuffer.byteLength,
        width: imageAnalysis.width,
        height: imageAnalysis.height,
        metadata,
        generation_data: completedGenerationData,
        generated_at: new Date().toISOString(),
      })

      if (env.ANALYTICS) {
        env.ANALYTICS.writeDataPoint({ blobs: [userId, 'image_generated', tableName], doubles: [1] })
      }
    } catch (error) {
      console.error(`Failed to generate image for ${record.id}:`, error)
      const failedGenerationData = {
        ...record.generation_data,
        failed_at: new Date().toISOString(),
      }
      await updateRecord(env, tableName, record.id, {
        status: 'failed',
        error_message: error instanceof Error ? error.message : 'Unknown error',
        generation_data: failedGenerationData,
      })

      const userId = record.user_id || record.generated_by || 'unknown'
      if (env.ANALYTICS) {
        env.ANALYTICS.writeDataPoint({ blobs: [userId, 'image_generation_failed', tableName], doubles: [1] })
      }
    }
  }
}

async function updateRecord(env: Env, tableName: 'media' | 'user_media', id: string, updates: Record<string, unknown>) {
  const fields: string[] = []
  const values: unknown[] = []

  for (const [key, value] of Object.entries(updates)) {
    fields.push(`${key} = ?`)
    values.push(typeof value === 'object' && value !== null ? JSON.stringify(value) : value)
  }

  fields.push('updated_at = ?')
  values.push(new Date().toISOString(), id)

  await env.IMAGE_DB.prepare(`UPDATE ${tableName} SET ${fields.join(', ')} WHERE id = ?`)
    .bind(...values)
    .run()
}

function rowToMediaRecord(row: Record<string, unknown>, tableName: 'media' | 'user_media'): MediaRecord {
  return {
    id: String(row.id),
    user_id: typeof row.user_id === 'string' ? row.user_id : undefined,
    generated_by: typeof row.generated_by === 'string' ? row.generated_by : undefined,
    filename: String(row.filename),
    original_filename: String(row.original_filename),
    file_size: Number(row.file_size),
    mime_type: String(row.mime_type),
    url: String(row.url),
    thumbnail_url: typeof row.thumbnail_url === 'string' ? row.thumbnail_url : undefined,
    width: typeof row.width === 'number' ? row.width : undefined,
    height: typeof row.height === 'number' ? row.height : undefined,
    metadata: parseJsonObject(row.metadata),
    usage_type: typeof row.usage_type === 'string' ? row.usage_type : undefined,
    category: typeof row.category === 'string' ? row.category : undefined,
    tags: parseJsonArray(row.tags),
    status: String(row.status) as MediaRecord['status'],
    generation_data: parseJsonObject(row.generation_data),
    error_message: typeof row.error_message === 'string' ? row.error_message : undefined,
    _table: tableName,
  }
}

function parseJsonObject(value: unknown): Record<string, unknown> {
  if (typeof value !== 'string') return {}
  try {
    const parsed = JSON.parse(value)
    return parsed && typeof parsed === 'object' && !Array.isArray(parsed) ? parsed : {}
  } catch {
    return {}
  }
}

function parseJsonArray(value: unknown): string[] {
  if (typeof value !== 'string') return []
  try {
    const parsed = JSON.parse(value)
    return Array.isArray(parsed) ? parsed.filter((item): item is string => typeof item === 'string') : []
  } catch {
    return []
  }
}

async function analyzeImage(arrayBuffer: ArrayBuffer): Promise<{ width: number; height: number; format: string; analyzed_at: string }> {
  return {
    width: 1024,
    height: 1024,
    format: 'png',
    analyzed_at: new Date().toISOString(),
  }
}
