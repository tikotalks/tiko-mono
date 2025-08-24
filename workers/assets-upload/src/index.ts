import { createClient } from '@supabase/supabase-js'
import type { 
  Env, 
  UploadResponse,
  AssetRecord,
  GetAssetResponse,
  ListAssetsResponse,
  UpdateAssetRequest,
  ErrorResponse
} from './types'

// Helper function to get file dimensions for images
async function getImageDimensions(file: File): Promise<{ width?: number; height?: number }> {
  if (!file.type.startsWith('image/')) {
    return {}
  }

  try {
    const arrayBuffer = await file.arrayBuffer()
    const uint8Array = new Uint8Array(arrayBuffer)
    
    // Simple image dimension detection for common formats
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

// Basic JPEG dimension extraction
function getJPEGDimensions(data: Uint8Array): { width?: number; height?: number } {
  let i = 0
  if (data[i] === 0xFF && data[i + 1] === 0xD8) {
    i += 2
    while (i < data.length) {
      if (data[i] === 0xFF) {
        const marker = data[i + 1]
        if (marker >= 0xC0 && marker <= 0xC3) {
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

// Basic PNG dimension extraction
function getPNGDimensions(data: Uint8Array): { width?: number; height?: number } {
  if (data.length >= 24 && 
      data[0] === 0x89 && data[1] === 0x50 && data[2] === 0x4E && data[3] === 0x47) {
    const width = (data[16] << 24) | (data[17] << 16) | (data[18] << 8) | data[19]
    const height = (data[20] << 24) | (data[21] << 16) | (data[22] << 8) | data[23]
    return { width, height }
  }
  return {}
}

// Basic WebP dimension extraction
function getWebPDimensions(data: Uint8Array): { width?: number; height?: number } {
  if (data.length >= 30 &&
      data[0] === 0x52 && data[1] === 0x49 && data[2] === 0x46 && data[3] === 0x46 &&
      data[8] === 0x57 && data[9] === 0x45 && data[10] === 0x42 && data[11] === 0x50) {
    
    if (data[12] === 0x56 && data[13] === 0x50 && data[14] === 0x38) {
      const width = ((data[26] | (data[27] << 8) | (data[28] << 16)) & 0x3FFF) + 1
      const height = ((data[28] >> 6 | (data[29] << 2) | ((data[30] & 0x3F) << 10)) & 0x3FFF) + 1
      return { width, height }
    }
  }
  return {}
}

// Generate safe filename
function generateSafeFilename(originalName: string): { safeName: string; extension: string } {
  const extension = originalName.match(/\.[^.]+$/)?.[0] || ''
  const nameWithoutExt = originalName.replace(/\.[^.]+$/, '')
  const safeName = nameWithoutExt.toLowerCase()
    .replace(/[^a-z0-9]/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '') || 'asset'
  
  const timestamp = Date.now()
  return { 
    safeName: `${timestamp}-${safeName}${extension}`, 
    extension: extension.toLowerCase() 
  }
}

// Upload handler
async function handleUpload(request: Request, env: Env): Promise<Response> {
  try {
    const formData = await request.formData()
    const file = formData.get('file') as File | null
    const title = (formData.get('title') as string) || ''
    const description = (formData.get('description') as string) || ''
    const categories = formData.get('categories') ? 
      JSON.parse(formData.get('categories') as string) : []
    const tags = formData.get('tags') ? 
      JSON.parse(formData.get('tags') as string) : []
    const isPublic = formData.get('isPublic') === 'true'
    const userId = formData.get('userId') as string | null
    
    if (!file) {
      return Response.json({ 
        success: false, 
        error: 'No file provided' 
      } as ErrorResponse, { status: 400 })
    }

    // Generate safe filename and path
    const { safeName, extension } = generateSafeFilename(file.name)
    const filePath = `assets/${safeName}`
    
    // Get image dimensions if it's an image
    const { width, height } = await getImageDimensions(file)
    
    // Upload to R2
    await env.ASSETS_R2_BUCKET.put(filePath, file.stream(), {
      httpMetadata: {
        contentType: file.type
      },
      customMetadata: {
        originalName: file.name,
        uploadedAt: new Date().toISOString(),
        userId: userId || 'anonymous'
      }
    })

    // Create Supabase client
    const supabase = createClient(env.SUPABASE_URL, env.SUPABASE_SECRET)
    
    // Save metadata to Supabase
    const assetData = {
      title: title || file.name.replace(/\.[^.]+$/, ''),
      description: description || null,
      filename: safeName,
      original_filename: file.name,
      file_path: filePath,
      file_size: file.size,
      mime_type: file.type,
      file_extension: extension,
      categories: categories,
      tags: tags,
      width: width || null,
      height: height || null,
      duration: null, // TODO: Add duration detection for audio/video
      is_public: isPublic,
      user_id: userId || null
    }
    
    const { data, error } = await supabase
      .from('assets')
      .insert(assetData)
      .select()
      .single()
    
    if (error) {
      console.error('Supabase error:', error)
      // Try to cleanup uploaded file
      try {
        await env.ASSETS_R2_BUCKET.delete(filePath)
      } catch (cleanupError) {
        console.error('Failed to cleanup uploaded file:', cleanupError)
      }
      
      return Response.json({ 
        success: false, 
        error: 'Failed to save asset metadata',
        details: error.message 
      } as ErrorResponse, { status: 500 })
    }
    
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
      categories: data.categories || [],
      tags: data.tags || [],
      isPublic: data.is_public,
      createdAt: data.created_at
    }

    return Response.json(response)
  } catch (error) {
    console.error('Upload error:', error)
    return Response.json({ 
      success: false,
      error: 'Upload failed', 
      details: (error as Error).message
    } as ErrorResponse, { status: 500 })
  }
}

// Get asset by ID
async function handleGetAsset(request: Request, env: Env, assetId: string): Promise<Response> {
  try {
    const supabase = createClient(env.SUPABASE_URL, env.SUPABASE_SECRET)
    
    const { data, error } = await supabase
      .from('assets')
      .select('*')
      .eq('id', assetId)
      .single()
    
    if (error || !data) {
      return Response.json({ 
        success: false, 
        error: 'Asset not found' 
      } as ErrorResponse, { status: 404 })
    }
    
    const response: GetAssetResponse = {
      success: true,
      asset: data
    }
    
    return Response.json(response)
  } catch (error) {
    return Response.json({ 
      success: false,
      error: 'Failed to get asset', 
      details: (error as Error).message
    } as ErrorResponse, { status: 500 })
  }
}

// List assets with pagination and filtering
async function handleListAssets(request: Request, env: Env): Promise<Response> {
  try {
    const url = new URL(request.url)
    const page = parseInt(url.searchParams.get('page') || '1')
    const limit = Math.min(parseInt(url.searchParams.get('limit') || '20'), 100)
    const isPublic = url.searchParams.get('public') === 'true'
    const userId = url.searchParams.get('userId')
    const search = url.searchParams.get('search')
    const category = url.searchParams.get('category')
    const tag = url.searchParams.get('tag')
    const mimeType = url.searchParams.get('type')
    
    const supabase = createClient(env.SUPABASE_URL, env.SUPABASE_SECRET)
    
    let query = supabase.from('assets').select('*', { count: 'exact' })
    
    // Apply filters
    if (isPublic) {
      query = query.eq('is_public', true)
    }
    if (userId) {
      query = query.eq('user_id', userId)
    }
    if (search) {
      query = query.or(`title.ilike.%${search}%,description.ilike.%${search}%`)
    }
    if (category) {
      query = query.contains('categories', [category])
    }
    if (tag) {
      query = query.contains('tags', [tag])
    }
    if (mimeType) {
      query = query.like('mime_type', `${mimeType}%`)
    }
    
    // Apply pagination and ordering
    const offset = (page - 1) * limit
    query = query
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1)
    
    const { data, count, error } = await query
    
    if (error) {
      return Response.json({ 
        success: false, 
        error: 'Failed to list assets',
        details: error.message 
      } as ErrorResponse, { status: 500 })
    }
    
    const response: ListAssetsResponse = {
      success: true,
      assets: data || [],
      total: count || 0,
      page,
      limit
    }
    
    return Response.json(response)
  } catch (error) {
    return Response.json({ 
      success: false,
      error: 'Failed to list assets', 
      details: (error as Error).message
    } as ErrorResponse, { status: 500 })
  }
}

// Update asset metadata
async function handleUpdateAsset(request: Request, env: Env, assetId: string): Promise<Response> {
  try {
    const updates: UpdateAssetRequest = await request.json()
    
    const supabase = createClient(env.SUPABASE_URL, env.SUPABASE_SECRET)
    
    const updateData: any = {}
    if (updates.title !== undefined) updateData.title = updates.title
    if (updates.description !== undefined) updateData.description = updates.description
    if (updates.categories !== undefined) updateData.categories = updates.categories
    if (updates.tags !== undefined) updateData.tags = updates.tags
    if (updates.isPublic !== undefined) updateData.is_public = updates.isPublic
    
    const { data, error } = await supabase
      .from('assets')
      .update(updateData)
      .eq('id', assetId)
      .select()
      .single()
    
    if (error) {
      return Response.json({ 
        success: false, 
        error: 'Failed to update asset',
        details: error.message 
      } as ErrorResponse, { status: 500 })
    }
    
    const response: GetAssetResponse = {
      success: true,
      asset: data
    }
    
    return Response.json(response)
  } catch (error) {
    return Response.json({ 
      success: false,
      error: 'Failed to update asset', 
      details: (error as Error).message
    } as ErrorResponse, { status: 500 })
  }
}

// Delete asset
async function handleDeleteAsset(request: Request, env: Env, assetId: string): Promise<Response> {
  try {
    const supabase = createClient(env.SUPABASE_URL, env.SUPABASE_SECRET)
    
    // First get the asset to know the file path
    const { data: asset, error: getError } = await supabase
      .from('assets')
      .select('file_path')
      .eq('id', assetId)
      .single()
    
    if (getError || !asset) {
      return Response.json({ 
        success: false, 
        error: 'Asset not found' 
      } as ErrorResponse, { status: 404 })
    }
    
    // Delete from database first
    const { error: deleteError } = await supabase
      .from('assets')
      .delete()
      .eq('id', assetId)
    
    if (deleteError) {
      return Response.json({ 
        success: false, 
        error: 'Failed to delete asset from database',
        details: deleteError.message 
      } as ErrorResponse, { status: 500 })
    }
    
    // Then delete file from R2
    try {
      await env.ASSETS_R2_BUCKET.delete(asset.file_path)
    } catch (r2Error) {
      console.error('Failed to delete file from R2:', r2Error)
      // Don't fail the request if R2 deletion fails, as the database record is already deleted
    }
    
    return Response.json({ success: true })
  } catch (error) {
    return Response.json({ 
      success: false,
      error: 'Failed to delete asset', 
      details: (error as Error).message
    } as ErrorResponse, { status: 500 })
  }
}

// Helper function to add CORS headers to responses
function corsResponse(response: Response): Response {
  const newResponse = new Response(response.body, response)
  newResponse.headers.set('Access-Control-Allow-Origin', '*')
  newResponse.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS')
  newResponse.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization')
  return newResponse
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    // Handle CORS preflight
    if (request.method === 'OPTIONS') {
      return new Response(null, {
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type, Authorization',
          'Access-Control-Max-Age': '86400',
        }
      })
    }

    const url = new URL(request.url)
    const pathSegments = url.pathname.split('/').filter(Boolean)
    
    // POST /upload - Upload new asset
    if (request.method === 'POST' && pathSegments[0] === 'upload') {
      const response = await handleUpload(request, env)
      return corsResponse(response)
    }
    
    // GET /assets - List assets
    if (request.method === 'GET' && pathSegments[0] === 'assets' && !pathSegments[1]) {
      const response = await handleListAssets(request, env)
      return corsResponse(response)
    }
    
    // GET /assets/:id - Get specific asset
    if (request.method === 'GET' && pathSegments[0] === 'assets' && pathSegments[1]) {
      const response = await handleGetAsset(request, env, pathSegments[1])
      return corsResponse(response)
    }
    
    // PUT /assets/:id - Update asset metadata
    if (request.method === 'PUT' && pathSegments[0] === 'assets' && pathSegments[1]) {
      const response = await handleUpdateAsset(request, env, pathSegments[1])
      return corsResponse(response)
    }
    
    // DELETE /assets/:id - Delete asset
    if (request.method === 'DELETE' && pathSegments[0] === 'assets' && pathSegments[1]) {
      const response = await handleDeleteAsset(request, env, pathSegments[1])
      return corsResponse(response)
    }
    
    return corsResponse(Response.json({ 
      success: false, 
      error: 'Not found' 
    } as ErrorResponse, { status: 404 }))
  }
}