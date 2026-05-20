import type {
  Env,
  UploadResponse,
  AssetRecord,
  GetAssetResponse,
  ListAssetsResponse,
  UpdateAssetRequest,
  ErrorResponse,
} from './types'

async function getImageDimensions(file: File): Promise<{ width?: number; height?: number }> {
  if (!file.type.startsWith('image/')) {
    return {}
  }

  try {
    const arrayBuffer = await file.arrayBuffer()
    const uint8Array = new Uint8Array(arrayBuffer)

    if (file.type === 'image/jpeg') {
      return getJPEGDimensions(uint8Array)
    } else if (file.type === 'image/png') {
      return getPNGDimensions(uint8Array)
    } else if (file.type === 'image/webp') {
      return getWebPDimensions(uint8Array)
    }
  } catch (error) {
    console.warn('Failed to get image dimensions:', error)
  }

  return {}
}

function getJPEGDimensions(data: Uint8Array): { width?: number; height?: number } {
  let i = 0
  if (data[i] === 0xff && data[i + 1] === 0xd8) {
    i += 2
    while (i < data.length) {
      if (data[i] === 0xff) {
        const marker = data[i + 1]
        if (marker >= 0xc0 && marker <= 0xc3) {
          const height = (data[i + 5] << 8) | data[i + 6]
          const width = (data[i + 7] << 8) | data[i + 8]
          return { width, height }
        }
        i += 2 + ((data[i + 2] << 8) | data[i + 3])
      } else {
        i++
      }
    }
  }
  return {}
}

function getPNGDimensions(data: Uint8Array): { width?: number; height?: number } {
  if (
    data.length >= 24 &&
    data[0] === 0x89 &&
    data[1] === 0x50 &&
    data[2] === 0x4e &&
    data[3] === 0x47
  ) {
    const width = (data[16] << 24) | (data[17] << 16) | (data[18] << 8) | data[19]
    const height = (data[20] << 24) | (data[21] << 16) | (data[22] << 8) | data[23]
    return { width, height }
  }
  return {}
}

function getWebPDimensions(data: Uint8Array): { width?: number; height?: number } {
  if (
    data.length >= 30 &&
    data[0] === 0x52 &&
    data[1] === 0x49 &&
    data[2] === 0x46 &&
    data[3] === 0x46 &&
    data[8] === 0x57 &&
    data[9] === 0x45 &&
    data[10] === 0x42 &&
    data[11] === 0x50
  ) {
    if (data[12] === 0x56 && data[13] === 0x50 && data[14] === 0x38) {
      const width = ((data[26] | (data[27] << 8) | (data[28] << 16)) & 0x3fff) + 1
      const height = (((data[28] >> 6) | (data[29] << 2) | ((data[30] & 0x3f) << 10)) & 0x3fff) + 1
      return { width, height }
    }
  }
  return {}
}

function generateSafeFilename(originalName: string): { safeName: string; extension: string } {
  const extension = originalName.match(/\.[^.]+$/)?.[0] || ''
  const nameWithoutExt = originalName.replace(/\.[^.]+$/, '')
  const safeName =
    nameWithoutExt
      .toLowerCase()
      .replace(/[^a-z0-9]/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '') || 'asset'

  const timestamp = Date.now()
  return {
    safeName: `${timestamp}-${safeName}${extension}`,
    extension: extension.toLowerCase(),
  }
}

function rowToAsset(row: Record<string, unknown>): AssetRecord {
  return {
    id: String(row.id),
    title: String(row.title),
    description: nullableString(row.description),
    filename: String(row.filename),
    original_filename: String(row.original_filename),
    file_path: String(row.file_path),
    file_size: Number(row.file_size),
    mime_type: String(row.mime_type),
    file_extension: String(row.file_extension),
    categories: parseStringArray(row.categories),
    tags: parseStringArray(row.tags),
    width: nullableNumber(row.width),
    height: nullableNumber(row.height),
    duration: nullableNumber(row.duration),
    is_public: Boolean(row.is_public),
    user_id: nullableString(row.user_id),
    created_at: String(row.created_at),
  }
}

function parseStringArray(value: unknown): string[] {
  if (typeof value !== 'string') return []
  try {
    const parsed = JSON.parse(value)
    return Array.isArray(parsed) ? parsed.filter((item): item is string => typeof item === 'string') : []
  } catch {
    return []
  }
}

function nullableString(value: unknown): string | undefined {
  return typeof value === 'string' && value.length > 0 ? value : undefined
}

function nullableNumber(value: unknown): number | undefined {
  return typeof value === 'number' ? value : undefined
}

async function insertAsset(env: Env, asset: Omit<AssetRecord, 'id' | 'created_at'>): Promise<AssetRecord> {
  const id = crypto.randomUUID()
  const now = new Date().toISOString()

  await env.ASSETS_DB.prepare(
    `INSERT INTO assets (
      id, title, description, filename, original_filename, file_path, file_size,
      mime_type, file_extension, categories, tags, width, height, duration,
      is_public, user_id, created_at, updated_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
  )
    .bind(
      id,
      asset.title,
      asset.description ?? null,
      asset.filename,
      asset.original_filename,
      asset.file_path,
      asset.file_size,
      asset.mime_type,
      asset.file_extension,
      JSON.stringify(asset.categories),
      JSON.stringify(asset.tags),
      asset.width ?? null,
      asset.height ?? null,
      asset.duration ?? null,
      asset.is_public ? 1 : 0,
      asset.user_id ?? null,
      now,
      now,
    )
    .run()

  return { ...asset, id, created_at: now }
}

async function handleUpload(request: Request, env: Env): Promise<Response> {
  try {
    const formData = await request.formData()
    const file = formData.get('file') as File | null
    const title = (formData.get('title') as string) || ''
    const description = (formData.get('description') as string) || ''
    const categories = formData.get('categories') ? JSON.parse(formData.get('categories') as string) : []
    const tags = formData.get('tags') ? JSON.parse(formData.get('tags') as string) : []
    const isPublic = formData.get('isPublic') === 'true'
    const userId = formData.get('userId') as string | null

    if (!file) {
      return Response.json({ success: false, error: 'No file provided' } as ErrorResponse, { status: 400 })
    }

    const { safeName, extension } = generateSafeFilename(file.name)
    const filePath = `assets/${safeName}`
    const { width, height } = await getImageDimensions(file)

    await env.ASSETS_R2_BUCKET.put(filePath, file.stream(), {
      httpMetadata: { contentType: file.type },
      customMetadata: {
        originalName: file.name,
        uploadedAt: new Date().toISOString(),
        userId: userId || 'anonymous',
      },
    })

    try {
      const data = await insertAsset(env, {
        title: title || file.name.replace(/\.[^.]+$/, ''),
        description: description || undefined,
        filename: safeName,
        original_filename: file.name,
        file_path: filePath,
        file_size: file.size,
        mime_type: file.type,
        file_extension: extension,
        categories,
        tags,
        width,
        height,
        duration: undefined,
        is_public: isPublic,
        user_id: userId || undefined,
      })

      const response: UploadResponse = {
        success: true,
        id: data.id,
        filename: data.filename,
        originalFilename: data.original_filename,
        url: `https://assets.tikocdn.org/${data.file_path}`,
        filePath: data.file_path,
        fileSize: data.file_size,
        mimeType: data.mime_type,
        fileExtension: data.file_extension,
        width: data.width,
        height: data.height,
        duration: data.duration,
        title: data.title,
        description: data.description,
        categories: data.categories,
        tags: data.tags,
        isPublic: data.is_public,
        createdAt: data.created_at,
      }

      return Response.json(response)
    } catch (dbError) {
      console.error('D1 error:', dbError)
      try {
        await env.ASSETS_R2_BUCKET.delete(filePath)
      } catch (cleanupError) {
        console.error('Failed to cleanup uploaded file:', cleanupError)
      }
      return Response.json(
        { success: false, error: 'Failed to save asset metadata', details: (dbError as Error).message } as ErrorResponse,
        { status: 500 },
      )
    }
  } catch (error) {
    console.error('Upload error:', error)
    return Response.json(
      { success: false, error: 'Upload failed', details: (error as Error).message } as ErrorResponse,
      { status: 500 },
    )
  }
}

async function handleGetAsset(request: Request, env: Env, assetId: string): Promise<Response> {
  try {
    const data = await env.ASSETS_DB.prepare('SELECT * FROM assets WHERE id = ?').bind(assetId).first<Record<string, unknown>>()

    if (!data) {
      return Response.json({ success: false, error: 'Asset not found' } as ErrorResponse, { status: 404 })
    }

    const response: GetAssetResponse = { success: true, asset: rowToAsset(data) }
    return Response.json(response)
  } catch (error) {
    return Response.json(
      { success: false, error: 'Failed to get asset', details: (error as Error).message } as ErrorResponse,
      { status: 500 },
    )
  }
}

async function handleListAssets(request: Request, env: Env): Promise<Response> {
  try {
    const url = new URL(request.url)
    const page = Math.max(parseInt(url.searchParams.get('page') || '1'), 1)
    const limit = Math.min(Math.max(parseInt(url.searchParams.get('limit') || '20'), 1), 100)
    const isPublic = url.searchParams.get('public') === 'true'
    const userId = url.searchParams.get('userId')
    const search = url.searchParams.get('search')
    const category = url.searchParams.get('category')
    const tag = url.searchParams.get('tag')
    const mimeType = url.searchParams.get('type')

    const clauses: string[] = []
    const values: unknown[] = []

    if (isPublic) {
      clauses.push('is_public = 1')
    }
    if (userId) {
      clauses.push('user_id = ?')
      values.push(userId)
    }
    if (search) {
      clauses.push('(title LIKE ? OR description LIKE ?)')
      values.push(`%${search}%`, `%${search}%`)
    }
    if (category) {
      clauses.push('categories LIKE ?')
      values.push(`%${JSON.stringify(category).slice(1, -1)}%`)
    }
    if (tag) {
      clauses.push('tags LIKE ?')
      values.push(`%${JSON.stringify(tag).slice(1, -1)}%`)
    }
    if (mimeType) {
      clauses.push('mime_type LIKE ?')
      values.push(`${mimeType}%`)
    }

    const where = clauses.length ? `WHERE ${clauses.join(' AND ')}` : ''
    const offset = (page - 1) * limit
    const rows = await env.ASSETS_DB.prepare(`SELECT * FROM assets ${where} ORDER BY created_at DESC LIMIT ? OFFSET ?`)
      .bind(...values, limit, offset)
      .all<Record<string, unknown>>()
    const countRow = await env.ASSETS_DB.prepare(`SELECT COUNT(*) AS count FROM assets ${where}`)
      .bind(...values)
      .first<{ count: number }>()

    const response: ListAssetsResponse = {
      success: true,
      assets: rows.results.map(rowToAsset),
      total: countRow?.count ?? 0,
      page,
      limit,
    }

    return Response.json(response)
  } catch (error) {
    return Response.json(
      { success: false, error: 'Failed to list assets', details: (error as Error).message } as ErrorResponse,
      { status: 500 },
    )
  }
}

async function handleUpdateAsset(request: Request, env: Env, assetId: string): Promise<Response> {
  try {
    const updates: UpdateAssetRequest = await request.json()
    const fields: string[] = []
    const values: unknown[] = []

    if (updates.title !== undefined) {
      fields.push('title = ?')
      values.push(updates.title)
    }
    if (updates.description !== undefined) {
      fields.push('description = ?')
      values.push(updates.description)
    }
    if (updates.categories !== undefined) {
      fields.push('categories = ?')
      values.push(JSON.stringify(updates.categories))
    }
    if (updates.tags !== undefined) {
      fields.push('tags = ?')
      values.push(JSON.stringify(updates.tags))
    }
    if (updates.isPublic !== undefined) {
      fields.push('is_public = ?')
      values.push(updates.isPublic ? 1 : 0)
    }

    if (!fields.length) {
      return handleGetAsset(request, env, assetId)
    }

    fields.push('updated_at = ?')
    values.push(new Date().toISOString(), assetId)

    const result = await env.ASSETS_DB.prepare(`UPDATE assets SET ${fields.join(', ')} WHERE id = ?`)
      .bind(...values)
      .run()

    if (!result.meta || result.meta.changes === 0) {
      return Response.json({ success: false, error: 'Asset not found' } as ErrorResponse, { status: 404 })
    }

    return handleGetAsset(request, env, assetId)
  } catch (error) {
    return Response.json(
      { success: false, error: 'Failed to update asset', details: (error as Error).message } as ErrorResponse,
      { status: 500 },
    )
  }
}

async function handleDeleteAsset(request: Request, env: Env, assetId: string): Promise<Response> {
  try {
    const asset = await env.ASSETS_DB.prepare('SELECT file_path FROM assets WHERE id = ?')
      .bind(assetId)
      .first<{ file_path: string }>()

    if (!asset) {
      return Response.json({ success: false, error: 'Asset not found' } as ErrorResponse, { status: 404 })
    }

    await env.ASSETS_DB.prepare('DELETE FROM assets WHERE id = ?').bind(assetId).run()

    try {
      await env.ASSETS_R2_BUCKET.delete(asset.file_path)
    } catch (r2Error) {
      console.error('Failed to delete file from R2:', r2Error)
    }

    return Response.json({ success: true })
  } catch (error) {
    return Response.json(
      { success: false, error: 'Failed to delete asset', details: (error as Error).message } as ErrorResponse,
      { status: 500 },
    )
  }
}

function corsResponse(response: Response): Response {
  const newResponse = new Response(response.body, response)
  newResponse.headers.set('Access-Control-Allow-Origin', '*')
  newResponse.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS')
  newResponse.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization')
  return newResponse
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    if (request.method === 'OPTIONS') {
      return new Response(null, {
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type, Authorization',
          'Access-Control-Max-Age': '86400',
        },
      })
    }

    const url = new URL(request.url)
    const pathSegments = url.pathname.split('/').filter(Boolean)

    if (request.method === 'POST' && pathSegments[0] === 'upload') {
      return corsResponse(await handleUpload(request, env))
    }

    if (request.method === 'GET' && pathSegments[0] === 'assets' && !pathSegments[1]) {
      return corsResponse(await handleListAssets(request, env))
    }

    if (request.method === 'GET' && pathSegments[0] === 'assets' && pathSegments[1]) {
      return corsResponse(await handleGetAsset(request, env, pathSegments[1]))
    }

    if (request.method === 'PUT' && pathSegments[0] === 'assets' && pathSegments[1]) {
      return corsResponse(await handleUpdateAsset(request, env, pathSegments[1]))
    }

    if (request.method === 'DELETE' && pathSegments[0] === 'assets' && pathSegments[1]) {
      return corsResponse(await handleDeleteAsset(request, env, pathSegments[1]))
    }

    return corsResponse(Response.json({ success: false, error: 'Not found' } as ErrorResponse, { status: 404 }))
  },
}
