async function handleAnalyze(request, env) {
  try {
    const { imageUrl } = await request.json()
    
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

    let metadata = {
      title: '',
      description: '',
      tags: [],
      categories: []
    }
    
    let debugInfo = {
      hasOpenAIKey: !!env.OPENAI_API_KEY,
      visionAttempted: false,
      visionError: null,
      visionResponseOk: false,
      model: 'gpt-4o'
    }
    
    // Analyze with OpenAI if we have the key
    if (env.OPENAI_API_KEY) {
      debugInfo.visionAttempted = true
      
      try {
        const visionResponse = await fetch('https://api.openai.com/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${env.OPENAI_API_KEY}`,
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
                    text: `Analyze this image and provide comprehensive metadata in JSON format:
                    {
                      "title": "A descriptive title for the image (3-8 words)",
                      "description": "A detailed description of what's in the image (2-3 sentences)",
                      "tags": ["at least 10-15 relevant keywords that would help someone find this image"],
                      "categories": ["at least 5-8 general categories this image belongs to, like 'nature', 'technology', 'people', 'food', 'architecture', 'abstract', 'animals', 'sports', etc."]
                    }
                    
                    Make the title suitable for display in a UI. Tags should be single words or short phrases. Categories should be broad classifications.`
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
          const visionData = await visionResponse.json()
          const content = visionData.choices[0].message.content
          
          try {
            // Extract JSON from the response
            const jsonMatch = content.match(/\{[\s\S]*\}/)
            if (jsonMatch) {
              const analysis = JSON.parse(jsonMatch[0])
              metadata = {
                title: analysis.title || '',
                description: analysis.description || '',
                tags: Array.isArray(analysis.tags) ? analysis.tags : [],
                categories: Array.isArray(analysis.categories) ? analysis.categories : []
              }
            } else {
              debugInfo.visionError = 'No JSON found in response'
            }
          } catch (parseError) {
            debugInfo.visionError = `Parse error: ${parseError.message}`
          }
        } else {
          const errorText = await visionResponse.text()
          let errorDetails = errorText
          try {
            const errorJson = JSON.parse(errorText)
            errorDetails = errorJson.error?.message || errorText
            
            // Check for specific error types
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
      } catch (visionError) {
        debugInfo.visionError = `Request error: ${visionError.message}`
      }
    }
    
    const response = {
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
          responseOk: debugInfo.visionResponseOk
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
      details: error.message,
      _metadata: {
        timestamp: new Date().toISOString(),
        hasOpenAIKey: !!env.OPENAI_API_KEY,
        errorType: error.name,
        errorStack: error.stack
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
  async fetch(request, env) {
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

    // Handle different endpoints
    const url = new URL(request.url)
    
    if (request.method === 'POST' && url.pathname.endsWith('/analyze')) {
      return handleAnalyze(request, env)
    }
    
    // Only handle POST requests to /upload
    if (request.method !== 'POST' || !url.pathname.endsWith('/upload')) {
      return new Response('Not found', { status: 404 })
    }

    try {
      // Get the file from form data
      const formData = await request.formData()
      const file = formData.get('file')
      
      if (!file) {
        return new Response(JSON.stringify({ error: 'No file provided' }), {
          status: 400,
          headers: { 'Content-Type': 'application/json' }
        })
      }

      // Generate safe name (alphanumeric, hyphens, underscores only)
      const timestamp = Date.now()
      const originalName = file.name
      const nameWithoutExt = originalName.replace(/\.[^.]+$/, '')
      const extension = originalName.match(/\.[^.]+$/)?.[0] || ''
      const safeName = nameWithoutExt.toLowerCase()
        .replace(/[^a-z0-9]/g, '-')
        .replace(/-+/g, '-')
        .replace(/^-|-$/g, '')
      
      const baseKey = `uploads/${timestamp}-${safeName}${extension}`
      
      // Upload original
      await env.R2_BUCKET.put(baseKey, file.stream(), {
        httpMetadata: {
          contentType: file.type
        }
      })

      const baseUrl = `https://media.tikocdn.org/${baseKey}`
      const isImage = file.type.startsWith('image/')
      
      let metadata = {
        name: safeName,
        title: '',
        description: '',
        tags: [],
        categories: []
      }
      
      let debugInfo = {
        hasOpenAIKey: !!env.OPENAI_API_KEY,
        isImage,
        visionAttempted: false,
        visionError: null,
        visionResponseOk: false,
        visionContent: null,
        model: 'gpt-4o'
      }
      
      // If it's an image and we have OpenAI API key, analyze it
      if (isImage && env.OPENAI_API_KEY) {
        debugInfo.visionAttempted = true
        
        try {
          // Analyze image with OpenAI Vision using the new gpt-4o model
          const visionResponse = await fetch('https://api.openai.com/v1/chat/completions', {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${env.OPENAI_API_KEY}`,
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({
              model: 'gpt-4o',  // Updated to the current model
              messages: [
                {
                  role: 'user',
                  content: [
                    {
                      type: 'text',
                      text: `Analyze this image and provide comprehensive metadata in JSON format:
                      {
                        "title": "A descriptive title for the image (3-8 words)",
                        "description": "A detailed description of what's in the image (2-3 sentences)",
                        "tags": ["at least 10-15 relevant keywords that would help someone find this image"],
                        "categories": ["at least 5-8 general categories this image belongs to, like 'nature', 'technology', 'people', 'food', 'architecture', 'abstract', 'animals', 'sports', etc."]
                      }
                      
                      Make the title suitable for display in a UI. Tags should be single words or short phrases. Categories should be broad classifications.`
                    },
                    {
                      type: 'image_url',
                      image_url: {
                        url: baseUrl
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
            const visionData = await visionResponse.json()
            const content = visionData.choices[0].message.content
            debugInfo.visionContent = content
            
            try {
              // Extract JSON from the response
              const jsonMatch = content.match(/\{[\s\S]*\}/)
              if (jsonMatch) {
                const analysis = JSON.parse(jsonMatch[0])
                metadata = {
                  name: safeName,
                  title: analysis.title || nameWithoutExt,
                  description: analysis.description || '',
                  tags: Array.isArray(analysis.tags) ? analysis.tags : [],
                  categories: Array.isArray(analysis.categories) ? analysis.categories : []
                }
              } else {
                debugInfo.visionError = 'No JSON found in response'
              }
            } catch (parseError) {
              debugInfo.visionError = `Parse error: ${parseError.message}`
            }
          } else {
            const errorText = await visionResponse.text()
            let errorDetails = errorText
            try {
              const errorJson = JSON.parse(errorText)
              errorDetails = errorJson.error?.message || errorText
              
              // Check for specific error types
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
        } catch (visionError) {
          debugInfo.visionError = `Request error: ${visionError.message}`
        }
      }
      
      // If no title was generated, create one from filename
      if (!metadata.title) {
        metadata.title = nameWithoutExt
          .replace(/[-_]/g, ' ')
          .replace(/\b\w/g, l => l.toUpperCase())
      }
      
      const response = {
        success: true,
        filename: baseKey,
        url: baseUrl,
        thumbnail: isImage ? `${baseUrl}?width=200` : baseUrl,
        medium: isImage ? `${baseUrl}?width=800` : baseUrl,
        size: file.size,
        type: file.type,
        ...metadata,
        // Always include session metadata
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
        details: error.message,
        _metadata: {
          timestamp: new Date().toISOString(),
          hasOpenAIKey: !!env.OPENAI_API_KEY,
          errorType: error.name,
          errorStack: error.stack
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
}