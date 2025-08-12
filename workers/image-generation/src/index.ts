import { createClient } from '@supabase/supabase-js'
import OpenAI from 'openai'

export interface Env {
  MEDIA_BUCKET: R2Bucket
  ANALYTICS: AnalyticsEngineDataset
  OPENAI_API_KEY: string
  SUPABASE_URL: string
  SUPABASE_SERVICE_KEY: string
  ENVIRONMENT: string
}

interface GenerationRequest {
  userId: string
  scope: 'personal' | 'global'  // Whether to store in user_media or media table
  items: Array<{
    name: string
    prompt: string
    size?: '256x256' | '512x512' | '1024x1024' | '1024x1792' | '1792x1024'
    style?: 'vivid' | 'natural'
    category?: string  // For global media
    tags?: string[]    // For global media
  }>
}

interface MediaRecord {
  id: string
  user_id: string
  filename: string
  original_filename: string
  file_size: number
  mime_type: string
  url: string
  thumbnail_url?: string
  width?: number
  height?: number
  metadata: Record<string, any>
  usage_type: string
  status: 'queued' | 'generating' | 'generated' | 'published' | 'failed'
  generation_data?: any
  error_message?: string
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url)
    
    // CORS headers
    const corsHeaders = {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    }

    if (request.method === 'OPTIONS') {
      return new Response(null, { headers: corsHeaders })
    }

    try {
      // Initialize clients
      const supabase = createClient(env.SUPABASE_URL, env.SUPABASE_SERVICE_KEY)
      const openai = new OpenAI({ apiKey: env.OPENAI_API_KEY })

      // Route handling
      if (url.pathname === '/generate' && request.method === 'POST') {
        const data: GenerationRequest = await request.json()
        
        if (!data.userId || !data.items || !Array.isArray(data.items)) {
          return new Response(JSON.stringify({ error: 'Invalid request data' }), {
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          })
        }

        // Insert all items as queued
        const mediaRecords: any[] = []
        const tableName = data.scope === 'global' ? 'media' : 'user_media'
        
        for (const item of data.items) {
          const id = crypto.randomUUID()
          const filename = `${id}-${item.name.toLowerCase().replace(/[^a-z0-9]/g, '-')}.png`
          
          const insertData: any = {
            id,
            filename,
            original_filename: `${item.name}.png`,
            file_size: 0,
            mime_type: 'image/png',
            url: '',
            status: 'queued',
            generation_data: {
              prompt: item.prompt,
              size: item.size || '1024x1024',
              style: item.style || 'vivid',
              queued_at: new Date().toISOString()
            }
          }
          
          // Add table-specific fields
          if (data.scope === 'global') {
            insertData.generated_by = data.userId
            insertData.category = item.category || 'generated'
            insertData.tags = item.tags || []
            insertData.metadata = {
              ai_generated: true,
              model: 'dall-e-3'
            }
          } else {
            insertData.user_id = data.userId
            insertData.usage_type = 'generated'
          }
          
          const { data: mediaRecord, error } = await supabase
            .from(tableName)
            .insert(insertData)
            .select()
            .single()

          if (error) {
            console.error(`Failed to insert ${tableName} record:`, error)
            continue
          }

          mediaRecords.push({ ...mediaRecord, _table: tableName })
        }

        // Start processing in the background
        request.ctx.waitUntil(processGenerationQueue(mediaRecords, env, supabase, openai))

        return new Response(JSON.stringify({ 
          success: true, 
          queued: mediaRecords.length,
          records: mediaRecords 
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        })
      }

      // SSE endpoint for progress updates
      if (url.pathname.startsWith('/progress/') && request.method === 'GET') {
        const userId = url.pathname.split('/')[2]
        
        // Set up SSE headers
        const headers = new Headers({
          ...corsHeaders,
          'Content-Type': 'text/event-stream',
          'Cache-Control': 'no-cache',
          'Connection': 'keep-alive',
        })

        // Create a readable stream for SSE
        const stream = new ReadableStream({
          async start(controller) {
            // Send initial data
            const { data: items } = await supabase
              .from('user_media')
              .select('*')
              .eq('user_id', userId)
              .in('status', ['queued', 'generating', 'generated', 'failed'])
              .order('created_at', { ascending: false })

            controller.enqueue(new TextEncoder().encode(
              `data: ${JSON.stringify({ type: 'initial', items })}\n\n`
            ))

            // Keep connection alive with heartbeat
            const heartbeat = setInterval(() => {
              controller.enqueue(new TextEncoder().encode(': heartbeat\n\n'))
            }, 30000)

            // Clean up on close
            request.signal.addEventListener('abort', () => {
              clearInterval(heartbeat)
              controller.close()
            })
          },
        })

        return new Response(stream, { headers })
      }

      return new Response('Not Found', { status: 404 })
    } catch (error) {
      console.error('Worker error:', error)
      return new Response(JSON.stringify({ error: 'Internal server error' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }
  },
}

async function processGenerationQueue(
  records: any[],
  env: Env,
  supabase: any,
  openai: OpenAI
) {
  for (const record of records) {
    const tableName = record._table || 'user_media'
    
    try {
      // Update status to generating
      await supabase
        .from(tableName)
        .update({ 
          status: 'generating',
          generation_data: {
            ...record.generation_data,
            started_at: new Date().toISOString()
          }
        })
        .eq('id', record.id)

      // Generate image with OpenAI
      const response = await openai.images.generate({
        model: 'dall-e-3',
        prompt: record.generation_data.prompt,
        n: 1,
        size: record.generation_data.size || '1024x1024',
        style: record.generation_data.style || 'vivid',
        response_format: 'url'
      })

      const imageUrl = response.data[0].url
      if (!imageUrl) throw new Error('No image URL returned from OpenAI')

      // Download the image
      const imageResponse = await fetch(imageUrl)
      const imageBlob = await imageResponse.blob()
      const arrayBuffer = await imageBlob.arrayBuffer()

      // Analyze image (basic analysis for now)
      const imageAnalysis = await analyzeImage(arrayBuffer)

      // Upload to R2
      const userId = record.user_id || record.generated_by
      const r2Key = tableName === 'media' 
        ? `media/generated/${record.filename}`
        : `generated/${userId}/${record.filename}`
        
      await env.MEDIA_BUCKET.put(r2Key, arrayBuffer, {
        httpMetadata: {
          contentType: 'image/png',
        },
        customMetadata: {
          userId: userId,
          prompt: record.generation_data.prompt,
          generatedAt: new Date().toISOString(),
          scope: tableName === 'media' ? 'global' : 'personal',
          ...imageAnalysis
        }
      })

      // Generate CDN URL
      const cdnUrl = `https://media.tikocdn.org/${r2Key}`

      // Update media record with success
      const updateData: any = {
        status: 'generated',
        url: cdnUrl,
        thumbnail_url: cdnUrl, // For now, same as main URL
        file_size: arrayBuffer.byteLength,
        width: imageAnalysis.width,
        height: imageAnalysis.height,
        metadata: {
          ...record.metadata,
          ...imageAnalysis,
          revised_prompt: response.data[0].revised_prompt
        },
        generation_data: {
          ...record.generation_data,
          completed_at: new Date().toISOString(),
          revised_prompt: response.data[0].revised_prompt
        },
        generated_at: new Date().toISOString()
      }
      
      await supabase
        .from(tableName)
        .update(updateData)
        .eq('id', record.id)

      // Track analytics
      env.ANALYTICS.writeDataPoint({
        blobs: [userId, 'image_generated', tableName],
        doubles: [1],
      })

    } catch (error) {
      console.error(`Failed to generate image for ${record.id}:`, error)
      
      // Update status to failed
      await supabase
        .from(tableName)
        .update({
          status: 'failed',
          error_message: error.message,
          generation_data: {
            ...record.generation_data,
            failed_at: new Date().toISOString()
          }
        })
        .eq('id', record.id)

      // Track failure
      env.ANALYTICS.writeDataPoint({
        blobs: [userId, 'image_generation_failed', tableName],
        doubles: [1],
      })
    }
  }
}

async function analyzeImage(arrayBuffer: ArrayBuffer): Promise<any> {
  // Basic image analysis - in production, you'd use a proper image processing library
  // For now, we'll return mock data
  // In reality, you might use the Canvas API or a WASM image library
  
  return {
    width: 1024,
    height: 1024,
    format: 'png',
    colors: {
      dominant: '#4ECDC4',
      palette: ['#4ECDC4', '#FFFFFF', '#333333']
    },
    // In production, you'd extract actual metadata
    analyzed_at: new Date().toISOString()
  }
}