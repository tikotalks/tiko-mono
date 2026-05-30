import { OpenAI } from 'openai';
import { getOpenAILanguage } from './language-mapping';
import {
  requireAuthWithRateLimit,
  AuthError,
  type AuthEnv,
  type RateLimitConfig,
} from '@tiko/auth-middleware';

export interface Env extends AuthEnv {
  AUDIO_BUCKET: R2Bucket;
  OPENAI_API_KEY: string;
  TTS_DB: D1Database;
  ENVIRONMENT: string;
}

interface TTSRequest {
  text: string;
  voice: string;
  model: 'tts-1' | 'tts-1-hd';
  language: string;
}

interface AudioMetadata {
  audio_url: string;
  provider: 'openai';
  language: string;
  voice: string;
  model: string;
  generated_at: string;
  duration?: number;
  file_size_bytes: number;
}

const ALLOWED_ORIGIN_PATTERNS = [
  /^https:\/\/(dev\.)?[a-z0-9-]+\.tikoapps\.org$/,
  /^https:\/\/tiko\.mt$/,
  /^https:\/\/dev\.tiko\.mt$/,
  /^http:\/\/localhost(?::\d+)?$/,
  /^http:\/\/127\.0\.0\.1(?::\d+)?$/,
];

function isAllowedOrigin(origin: string): boolean {
  return ALLOWED_ORIGIN_PATTERNS.some((pattern) => pattern.test(origin));
}

function getCORSHeaders(request: Request): Record<string, string> {
  const origin = request.headers.get('Origin');

  if (origin && isAllowedOrigin(origin)) {
    return {
      'Access-Control-Allow-Origin': origin,
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization, Prefer',
      'Access-Control-Allow-Credentials': 'true',
      'Access-Control-Max-Age': '86400',
      'Vary': 'Origin',
    };
  }

  return {
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization, Prefer',
    'Access-Control-Max-Age': '86400',
    'Vary': 'Origin',
  };
}

const TTS_RATE_LIMIT: RateLimitConfig = {
  free: { rpm: 10, rpd: 50 },
  pro: { rpm: 60, rpd: 10000 },
  proUnlimited: true,
};

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    // Handle CORS preflight
    if (request.method === 'OPTIONS') {
      return new Response(null, { status: 204, headers: getCORSHeaders(request) });
    }

    const url = new URL(request.url);
    
    try {
      switch (url.pathname) {
        case '/generate':
          if (request.method !== 'POST') {
            return new Response('Method not allowed', { 
              status: 405,
              headers: getCORSHeaders(request)
            });
          }
          return await handleGenerateTTS(request, env);
          
        case '/audio':
          if (request.method !== 'GET') {
            return new Response('Method not allowed', { 
              status: 405,
              headers: getCORSHeaders(request)
            });
          }
          return await handleGetAudio(request, env);
        
        case '/metadata':
          if (request.method !== 'GET') {
            return new Response('Method not allowed', { 
              status: 405,
              headers: getCORSHeaders(request)
            });
          }
          return await handleGetMetadata(request, env);

        default:
          return new Response('Not found', { 
            status: 404,
            headers: getCORSHeaders(request)
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
            ...getCORSHeaders(request),
            'Content-Type': 'application/json'
          }
        }
      );
    }
  },
};

async function handleGetMetadata(request: Request, env: Env): Promise<Response> {
  const url = new URL(request.url);
  const textHash = url.searchParams.get('text_hash');

  if (!textHash) {
    return new Response(JSON.stringify({ error: 'Missing text_hash parameter' }), {
      status: 400,
      headers: { ...getCORSHeaders(request), 'Content-Type': 'application/json' },
    });
  }

  const existing = await checkExistingAudio(textHash, env);
  if (!existing) {
    return new Response(JSON.stringify([]), {
      headers: { ...getCORSHeaders(request), 'Content-Type': 'application/json' },
    });
  }

  return new Response(JSON.stringify([existing]), {
    headers: { ...getCORSHeaders(request), 'Content-Type': 'application/json' },
  });
}

async function handleGenerateTTS(request: Request, env: Env): Promise<Response> {
  // Require authentication and rate limiting
  try {
    await requireAuthWithRateLimit(request, env as AuthEnv, TTS_RATE_LIMIT, {
      scopes: ['tts'],
    });
  } catch (error) {
    if (error instanceof AuthError) {
      return new Response(
        JSON.stringify({ success: false, error: error.message }),
        {
          status: error.status,
          headers: {
            ...getCORSHeaders(request),
            'Content-Type': 'application/json',
          },
        },
      );
    }
    throw error;
  }

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
          ...getCORSHeaders(request),
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
          ...getCORSHeaders(request),
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
    // Add language hint to text for better pronunciation of ambiguous words
    // OpenAI TTS infers language from text content
    let textWithHint = body.text;
    if (body.language && body.language !== 'en') {
      const languageName = getOpenAILanguage(body.language);
      textWithHint = `[${languageName}] ${body.text}`;
    }
    
    // Generate audio with OpenAI
    const mp3Response = await openai.audio.speech.create({
      model: body.model,
      voice: body.voice as any,
      input: textWithHint,
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
          ...getCORSHeaders(request),
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
            ...getCORSHeaders(request),
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
          ...getCORSHeaders(request),
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
      headers: getCORSHeaders(request) 
    });
  }

  const object = await env.AUDIO_BUCKET.get(key);
  
  if (!object) {
    return new Response('Audio not found', { 
      status: 404,
      headers: getCORSHeaders(request) 
    });
  }

  const headers = new Headers();
  headers.set('Content-Type', object.httpMetadata?.contentType || 'audio/mpeg');
  headers.set('Cache-Control', 'public, max-age=31536000'); // Cache for 1 year
  Object.entries(getCORSHeaders(request)).forEach(([key, value]) => {
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

async function checkExistingAudio(textHash: string, env: Env): Promise<AudioMetadata | null> {
  try {
    return await env.TTS_DB.prepare(
      `SELECT audio_url, provider, language, voice, model, generated_at, duration, file_size_bytes
       FROM tts_audio
       WHERE text_hash = ?
       LIMIT 1`,
    )
      .bind(textHash)
      .first<AudioMetadata>()
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
    const now = new Date().toISOString();
    await env.TTS_DB.prepare(
      `INSERT INTO tts_audio (
        id, text_hash, text, language, voice, model, provider,
        audio_url, file_size_bytes, generated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
    )
      .bind(
        crypto.randomUUID(),
        audioData.textHash,
        audioData.text,
        audioData.language,
        audioData.voice,
        audioData.model,
        audioData.provider,
        audioData.audioUrl,
        audioData.fileSize,
        now,
      )
      .run();
  } catch (error) {
    console.error('Error storing audio in database:', error);
  }
}
