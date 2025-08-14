import { OpenAI } from 'openai';

export interface Env {
  AUDIO_BUCKET: R2Bucket;
  OPENAI_API_KEY: string;
  SUPABASE_URL: string;
  SUPABASE_SERVICE_KEY: string;
  ENVIRONMENT: string;
}

interface TTSRequest {
  text: string;
  voice: string;
  model: 'tts-1' | 'tts-1-hd';
  language: string;
}

interface AudioMetadata {
  url: string;
  provider: 'openai';
  language: string;
  voice: string;
  model: string;
  generatedAt: string;
  duration?: number;
  size: number;
}

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
};

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    // Handle CORS preflight
    if (request.method === 'OPTIONS') {
      return new Response(null, { headers: CORS_HEADERS });
    }

    const url = new URL(request.url);
    
    try {
      switch (url.pathname) {
        case '/generate':
          if (request.method !== 'POST') {
            return new Response('Method not allowed', { 
              status: 405,
              headers: CORS_HEADERS 
            });
          }
          return await handleGenerateTTS(request, env);
          
        case '/audio':
          if (request.method !== 'GET') {
            return new Response('Method not allowed', { 
              status: 405,
              headers: CORS_HEADERS 
            });
          }
          return await handleGetAudio(request, env);
          
        default:
          return new Response('Not found', { 
            status: 404,
            headers: CORS_HEADERS 
          });
      }
    } catch (error) {
      console.error('Worker error:', error);
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: error instanceof Error ? error.message : 'Internal server error' 
        }),
        { 
          status: 500,
          headers: {
            ...CORS_HEADERS,
            'Content-Type': 'application/json'
          }
        }
      );
    }
  },
};

async function handleGenerateTTS(request: Request, env: Env): Promise<Response> {
  const body: TTSRequest = await request.json();
  
  // Validate request
  if (!body.text || !body.voice || !body.model || !body.language) {
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: 'Missing required fields' 
      }),
      { 
        status: 400,
        headers: {
          ...CORS_HEADERS,
          'Content-Type': 'application/json'
        }
      }
    );
  }

  // Generate unique hash for this audio
  const textHash = generateTextHash(body.text, body.language, body.voice, body.model);
  
  // Check if audio already exists in database
  const existingAudio = await checkExistingAudio(textHash, env);
  if (existingAudio) {
    return new Response(
      JSON.stringify({
        success: true,
        audioUrl: existingAudio.audio_url,
        cached: true
      }),
      {
        headers: {
          ...CORS_HEADERS,
          'Content-Type': 'application/json'
        }
      }
    );
  }

  // Initialize OpenAI client
  const openai = new OpenAI({
    apiKey: env.OPENAI_API_KEY,
  });

  try {
    // Generate audio with OpenAI
    const mp3Response = await openai.audio.speech.create({
      model: body.model,
      voice: body.voice as any,
      input: body.text,
      response_format: 'mp3',
    });

    // Get audio data
    const audioBuffer = await mp3Response.arrayBuffer();
    const audioData = new Uint8Array(audioBuffer);

    // Generate unique key for R2 storage
    const audioKey = `audio/${textHash}.mp3`;
    
    // Upload to R2
    await env.AUDIO_BUCKET.put(audioKey, audioData, {
      httpMetadata: {
        contentType: 'audio/mpeg',
      }
    });

    // Store in database
    const audioUrl = `/audio?key=${encodeURIComponent(audioKey)}`;
    await storeAudioInDatabase({
      textHash,
      text: body.text,
      language: body.language,
      voice: body.voice,
      model: body.model,
      provider: 'openai',
      audioUrl,
      fileSize: audioData.length
    }, env);

    return new Response(
      JSON.stringify({
        success: true,
        audioUrl,
        cached: false
      }),
      {
        headers: {
          ...CORS_HEADERS,
          'Content-Type': 'application/json'
        }
      }
    );
  } catch (error) {
    console.error('OpenAI TTS error:', error);
    
    // Check if it's a rate limit error
    if (error instanceof Error && error.message.includes('rate limit')) {
      return new Response(
        JSON.stringify({
          success: false,
          error: 'Rate limit exceeded. Please try again later.'
        }),
        {
          status: 429,
          headers: {
            ...CORS_HEADERS,
            'Content-Type': 'application/json'
          }
        }
      );
    }
    
    return new Response(
      JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : 'Failed to generate audio'
      }),
      {
        status: 500,
        headers: {
          ...CORS_HEADERS,
          'Content-Type': 'application/json'
        }
      }
    );
  }
}

async function handleGetAudio(request: Request, env: Env): Promise<Response> {
  const url = new URL(request.url);
  const key = url.searchParams.get('key');
  
  if (!key) {
    return new Response('Missing key parameter', { 
      status: 400,
      headers: CORS_HEADERS 
    });
  }

  const object = await env.AUDIO_BUCKET.get(key);
  
  if (!object) {
    return new Response('Audio not found', { 
      status: 404,
      headers: CORS_HEADERS 
    });
  }

  const headers = new Headers(object.httpMetadata || {});
  headers.set('Content-Type', 'audio/mpeg');
  headers.set('Cache-Control', 'public, max-age=31536000'); // Cache for 1 year
  Object.entries(CORS_HEADERS).forEach(([key, value]) => {
    headers.set(key, value);
  });

  return new Response(object.body, { headers });
}

function generateTextHash(text: string, language: string, voice: string, model: string): string {
  const elements = [text, language, voice, model];
  const str = elements.join('|');
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  return Math.abs(hash).toString(36);
}

async function checkExistingAudio(textHash: string, env: Env): Promise<any | null> {
  try {
    const response = await fetch(`${env.SUPABASE_URL}/rest/v1/tts_audio?text_hash=eq.${textHash}&select=*`, {
      headers: {
        'apikey': env.SUPABASE_SERVICE_KEY,
        'Authorization': `Bearer ${env.SUPABASE_SERVICE_KEY}`,
      }
    });

    if (!response.ok) {
      console.error('Failed to check existing audio:', await response.text());
      return null;
    }

    const data = await response.json();
    return data.length > 0 ? data[0] : null;
  } catch (error) {
    console.error('Error checking existing audio:', error);
    return null;
  }
}

async function storeAudioInDatabase(audioData: {
  textHash: string;
  text: string;
  language: string;
  voice: string;
  model: string;
  provider: string;
  audioUrl: string;
  fileSize: number;
}, env: Env): Promise<void> {
  try {
    const response = await fetch(`${env.SUPABASE_URL}/rest/v1/tts_audio`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': env.SUPABASE_SERVICE_KEY,
        'Authorization': `Bearer ${env.SUPABASE_SERVICE_KEY}`,
        'Prefer': 'return=minimal'
      },
      body: JSON.stringify({
        text_hash: audioData.textHash,
        text: audioData.text,
        language: audioData.language,
        voice: audioData.voice,
        model: audioData.model,
        provider: audioData.provider,
        audio_url: audioData.audioUrl,
        file_size_bytes: audioData.fileSize
      })
    });

    if (!response.ok) {
      console.error('Failed to store audio in database:', await response.text());
    }
  } catch (error) {
    console.error('Error storing audio in database:', error);
  }
}