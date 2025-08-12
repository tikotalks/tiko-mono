import type { Env, UploadRequest, UploadResponse, TransformRequest, UserMediaRecord } from './types'

const ALLOWED_MIME_TYPES = [
  'image/jpeg',
  'image/png',
  'image/gif',
  'image/webp',
  'image/svg+xml'
]

const MAX_FILE_SIZE = 10 * 1024 * 1024 // 10MB

function generateSafeFilename(originalName: string, userId: string): string {
  const timestamp = Date.now()
  const randomStr = Math.random().toString(36).substring(2, 8)
  const extension = originalName.match(/\.[^.]+$/)?.[0] || ''
  const nameWithoutExt = originalName.replace(/\.[^.]+$/, '')
  const safeName = nameWithoutExt.toLowerCase()
    .replace(/[^a-z0-9]/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
    .substring(0, 50) // Limit filename length
  
  return `${userId}/${timestamp}-${randomStr}-${safeName}${extension}`
}

async function getImageDimensions(file: File): Promise<{ width?: number; height?: number }> {
  // For now, return empty dimensions
  // In a real implementation, we'd parse the image headers
  return { width: undefined, height: undefined }
}

async function saveToSupabase(env: Env, record: Omit<UserMediaRecord, 'id' | 'created_at' | 'updated_at'>): Promise<string> {
  const response = await fetch(`${env.SUPABASE_URL}/rest/v1/user_media`, {
    method: 'POST',
    headers: {
      'apikey': env.SUPABASE_SERVICE_KEY,
      'Authorization': `Bearer ${env.SUPABASE_SERVICE_KEY}`,
      'Content-Type': 'application/json',
      'Prefer': 'return=representation'
    },
    body: JSON.stringify(record)
  })

  if (!response.ok) {
    const error = await response.text()
    throw new Error(`Failed to save to Supabase: ${error}`)
  }

  const [data] = await response.json()
  return data.id
}

async function handleUpload(request: Request, env: Env): Promise<Response> {
  try {
    // Parse multipart form data
    const formData = await request.formData()
    const file = formData.get('file') as File | null
    const uploadDataStr = formData.get('data') as string | null

    if (!file) {
      return new Response(JSON.stringify({ 
        success: false, 
        error: 'No file provided' 
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      })
    }

    if (!uploadDataStr) {
      return new Response(JSON.stringify({ 
        success: false, 
        error: 'No upload data provided' 
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      })
    }

    const uploadData: UploadRequest = JSON.parse(uploadDataStr)

    // Validate file type
    if (!ALLOWED_MIME_TYPES.includes(file.type)) {
      return new Response(JSON.stringify({ 
        success: false, 
        error: 'Invalid file type. Only images are allowed.' 
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      })
    }

    // Validate file size
    if (file.size > MAX_FILE_SIZE) {
      return new Response(JSON.stringify({ 
        success: false, 
        error: 'File too large. Maximum size is 10MB.' 
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      })
    }

    // Generate safe filename
    const filename = generateSafeFilename(file.name, uploadData.userId)
    
    // Upload to R2
    await env.USER_MEDIA_BUCKET.put(filename, file.stream(), {
      httpMetadata: {
        contentType: file.type,
        cacheControl: 'public, max-age=31536000' // 1 year cache
      }
    })

    // Generate URLs
    const baseUrl = `https://user-media.tikocdn.org/${filename}`
    const urls = {
      url: baseUrl,
      thumbnailUrl: `${baseUrl}?width=200&height=200&fit=cover`,
      mediumUrl: `${baseUrl}?width=800&height=800&fit=inside`,
      largeUrl: `${baseUrl}?width=1600&height=1600&fit=inside`
    }

    // Get image dimensions if possible
    const dimensions = await getImageDimensions(file)

    // Save to Supabase
    const recordId = await saveToSupabase(env, {
      user_id: uploadData.userId,
      filename,
      original_filename: file.name,
      file_size: file.size,
      mime_type: file.type,
      url: urls.url,
      thumbnail_url: urls.thumbnailUrl,
      medium_url: urls.mediumUrl,
      large_url: urls.largeUrl,
      ...dimensions,
      metadata: uploadData.metadata || {},
      usage_type: uploadData.usageType
    })

    const response: UploadResponse = {
      success: true,
      id: recordId,
      ...urls
    }

    return new Response(JSON.stringify(response), {
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      }
    })
  } catch (error) {
    console.error('Upload error:', error)
    return new Response(JSON.stringify({ 
      success: false, 
      error: error instanceof Error ? error.message : 'Upload failed'
    }), {
      status: 500,
      headers: { 
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      }
    })
  }
}

async function handleTransform(request: Request, env: Env): Promise<Response> {
  const url = new URL(request.url)
  const path = url.pathname.substring(1) // Remove leading slash

  // Parse transform parameters
  const transform: TransformRequest = {
    width: url.searchParams.has('width') ? parseInt(url.searchParams.get('width')!) : undefined,
    height: url.searchParams.has('height') ? parseInt(url.searchParams.get('height')!) : undefined,
    quality: url.searchParams.has('quality') ? parseInt(url.searchParams.get('quality')!) : 85,
    format: (url.searchParams.get('format') as any) || 'auto',
    fit: (url.searchParams.get('fit') as any) || 'inside'
  }

  // Get the original file from R2
  const object = await env.USER_MEDIA_BUCKET.get(path)
  
  if (!object) {
    return new Response('Not found', { status: 404 })
  }

  // For now, return the original image
  // In production, you'd use Cloudflare Image Resizing or a similar service
  const headers = new Headers()
  object.writeHttpMetadata(headers)
  headers.set('cache-control', 'public, max-age=31536000')
  
  // If transformation is requested, add headers for Cloudflare Polish/Image Resizing
  if (transform.width || transform.height) {
    headers.set('cf-resizing-width', transform.width?.toString() || '')
    headers.set('cf-resizing-height', transform.height?.toString() || '')
    headers.set('cf-resizing-fit', transform.fit || 'inside')
    headers.set('cf-resizing-quality', transform.quality?.toString() || '85')
  }

  return new Response(object.body, { headers })
}

export default {
  async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
    // Handle CORS preflight
    if (request.method === 'OPTIONS') {
      return new Response(null, {
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type, Authorization',
          'Access-Control-Max-Age': '86400',
        }
      })
    }

    const url = new URL(request.url)
    
    // Handle upload endpoint
    if (request.method === 'POST' && url.pathname === '/upload') {
      return handleUpload(request, env)
    }
    
    // Handle image serving and transformation
    if (request.method === 'GET' && url.pathname !== '/') {
      return handleTransform(request, env)
    }
    
    // Default response
    return new Response('User Media Upload Service', {
      headers: { 'Content-Type': 'text/plain' }
    })
  }
}