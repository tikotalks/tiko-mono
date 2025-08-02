import type { 
  Env, 
  AnalyzeRequest, 
  AnalyzeResponse, 
  UploadResponse,
  ImageMetadata,
  DebugInfo,
  OpenAIVisionResponse
} from './types'
import { buildVisionPrompt, parseVisionResponse } from './vision'

async function analyzeWithOpenAI(
  imageUrl: string, 
  title: string | undefined,
  apiKey: string
): Promise<{ metadata: ImageMetadata; debugInfo: Partial<DebugInfo> }> {
  const debugInfo: Partial<DebugInfo> = {
    visionAttempted: true,
    model: 'gpt-4o'
  }

  try {
    const visionResponse = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: 'gpt-4o',
        messages: [
          {
            role: 'user',
            content: [
              {
                type: 'text',
                text: buildVisionPrompt({ title })
              }, 
              {
                type: 'image_url',
                image_url: {
                  url: imageUrl
                }
              }
            ]
          }
        ],
        max_tokens: 500
      })
    })

    debugInfo.visionResponseOk = visionResponse.ok

    if (visionResponse.ok) {
      const visionData: OpenAIVisionResponse = await visionResponse.json()
      const content = visionData.choices[0].message.content
      
      const parsed = parseVisionResponse(content)
      if (parsed) {
        return { metadata: parsed, debugInfo }
      } else {
        debugInfo.visionError = 'No JSON found in response'
      }
    } else {
      const errorText = await visionResponse.text()
      try {
        const errorJson = JSON.parse(errorText)
        const errorDetails = errorJson.error?.message || errorText
        
        if (visionResponse.status === 429) {
          debugInfo.visionError = `Rate limit exceeded: ${errorDetails}`
        } else if (visionResponse.status === 401) {
          debugInfo.visionError = `Invalid API key: ${errorDetails}`
        } else if (visionResponse.status === 400) {
          debugInfo.visionError = `Bad request: ${errorDetails}`
        } else {
          debugInfo.visionError = `API error ${visionResponse.status}: ${errorDetails}`
        }
      } catch (e) {
        debugInfo.visionError = `API error ${visionResponse.status}: ${errorText}`
      }
    }
  } catch (error) {
    debugInfo.visionError = `Request error: ${(error as Error).message}`
  }

  return {
    metadata: { title: '', description: '', tags: [], categories: [] },
    debugInfo
  }
}

async function handleAnalyze(request: Request, env: Env): Promise<Response> {
  try {
    const { imageUrl, title }: AnalyzeRequest = await request.json()

    if (!imageUrl) {
      return new Response(JSON.stringify({
        error: 'Image URL is required'
      }), {
        status: 400,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        }
      })
    }

    let metadata: ImageMetadata = {
      title: '',
      description: '',
      tags: [],
      categories: []
    }

    const debugInfo: DebugInfo = {
      hasOpenAIKey: !!env.OPENAI_API_KEY,
      visionAttempted: false,
      visionError: null,
      visionResponseOk: false,
      model: 'gpt-4o',
      hadTitle: !!title
    }

    if (env.OPENAI_API_KEY) {
      const result = await analyzeWithOpenAI(imageUrl, title, env.OPENAI_API_KEY)
      metadata = result.metadata
      Object.assign(debugInfo, result.debugInfo)
    }

    const response: AnalyzeResponse = {
      success: debugInfo.visionAttempted && !debugInfo.visionError,
      ...metadata,
      _metadata: {
        timestamp: new Date().toISOString(),
        hasOpenAIKey: !!env.OPENAI_API_KEY,
        aiAnalysis: {
          attempted: debugInfo.visionAttempted,
          success: debugInfo.visionAttempted && !debugInfo.visionError,
          error: debugInfo.visionError,
          model: debugInfo.model,
          responseOk: debugInfo.visionResponseOk,
          hadTitleContext: debugInfo.hadTitle
        },
        generatedContent: {
          hasTitle: !!metadata.title,
          hasDescription: !!metadata.description,
          tagCount: metadata.tags.length,
          categoryCount: metadata.categories.length
        }
      }
    }

    return new Response(JSON.stringify(response), {
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      }
    })
  } catch (error) {
    return new Response(JSON.stringify({
      error: 'Analysis failed',
      details: (error as Error).message,
      _metadata: {
        timestamp: new Date().toISOString(),
        hasOpenAIKey: !!env.OPENAI_API_KEY,
        errorType: (error as Error).name,
        errorStack: (error as Error).stack
      }
    }), {
      status: 500,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      }
    })
  }
}

async function handleUpload(request: Request, env: Env): Promise<Response> {
  try {
    const formData = await request.formData()
    const file = formData.get('file') as File | null
    
    if (!file) {
      return new Response(JSON.stringify({ error: 'No file provided' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      })
    }

    // Generate safe name
    const timestamp = Date.now()
    const originalName = file.name
    const nameWithoutExt = originalName.replace(/\.[^.]+$/, '')
    const extension = originalName.match(/\.[^.]+$/)?.[0] || ''
    const safeName = nameWithoutExt.toLowerCase()
      .replace(/[^a-z0-9]/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '')
    
    const baseKey = `uploads/${timestamp}-${safeName}${extension}`
    
    // Upload to R2
    await env.R2_BUCKET.put(baseKey, file.stream(), {
      httpMetadata: {
        contentType: file.type
      }
    })

    const baseUrl = `https://media.tikocdn.org/${baseKey}`
    const isImage = file.type.startsWith('image/')
    
    let metadata: ImageMetadata = {
      title: '',
      description: '',
      tags: [],
      categories: []
    }
    
    const debugInfo = {
      hasOpenAIKey: !!env.OPENAI_API_KEY,
      isImage,
      visionAttempted: false,
      visionError: null as string | null,
      visionResponseOk: false,
      model: 'gpt-4o'
    }
    
    // Analyze image if applicable
    if (isImage && env.OPENAI_API_KEY) {
      const result = await analyzeWithOpenAI(baseUrl, nameWithoutExt, env.OPENAI_API_KEY)
      metadata = { ...metadata, ...result.metadata }
      Object.assign(debugInfo, result.debugInfo)
    }
    
    // Fallback title
    if (!metadata.title) {
      metadata.title = nameWithoutExt
        .replace(/[-_]/g, ' ')
        .replace(/\b\w/g, l => l.toUpperCase())
    }
    
    const response: UploadResponse = {
      success: true,
      filename: baseKey,
      url: baseUrl,
      thumbnail: isImage ? `${baseUrl}?width=200` : baseUrl,
      medium: isImage ? `${baseUrl}?width=800` : baseUrl,
      size: file.size,
      type: file.type,
      ...metadata,
      _metadata: {
        timestamp: new Date().toISOString(),
        hasOpenAIKey: !!env.OPENAI_API_KEY,
        isImage,
        aiAnalysis: {
          attempted: debugInfo.visionAttempted,
          success: debugInfo.visionAttempted && !debugInfo.visionError,
          error: debugInfo.visionError,
          model: debugInfo.model,
          responseOk: debugInfo.visionResponseOk
        },
        generatedContent: {
          hasTitle: !!metadata.title && metadata.title !== safeName,
          hasDescription: !!metadata.description,
          tagCount: metadata.tags.length,
          categoryCount: metadata.categories.length
        }
      }
    }

    return new Response(JSON.stringify(response), {
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      }
    })
  } catch (error) {
    return new Response(JSON.stringify({ 
      error: 'Upload failed', 
      details: (error as Error).message,
      _metadata: {
        timestamp: new Date().toISOString(),
        hasOpenAIKey: !!env.OPENAI_API_KEY,
        errorType: (error as Error).name,
        errorStack: (error as Error).stack
      }
    }), {
      status: 500,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      }
    })
  }
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    // Handle CORS preflight
    if (request.method === 'OPTIONS') {
      return new Response(null, {
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'POST, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type',
          'Access-Control-Max-Age': '86400',
        }
      })
    }

    const url = new URL(request.url)
    
    if (request.method === 'POST' && url.pathname.endsWith('/analyze')) {
      return handleAnalyze(request, env)
    }
    
    if (request.method === 'POST' && url.pathname.endsWith('/upload')) {
      return handleUpload(request, env)
    }
    
    return new Response('Not found', { status: 404 })
  }
}