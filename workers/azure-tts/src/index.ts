import { 
  AZURE_LANGUAGES, 
  getAllAzureLanguages, 
  getAllAzureVoices, 
  getAzureLanguageByIsoCode,
  isIsoCodeSupported 
} from './azure-languages';

export interface Env {
  AUDIO_BUCKET: R2Bucket;
  AUDIO_CACHE: KVNamespace;
  AZURE_SPEECH_KEY: string;
  AZURE_SPEECH_REGION: string;
  SUPABASE_URL: string;
  SUPABASE_SERVICE_KEY: string;
  ENVIRONMENT: string;
}

interface TTSRequest {
  text: string;
  voice: string;
  language: string;
  speed?: number; // Speech rate (0.5-2.0)
  pitch?: number; // Pitch adjustment (-50 to +50 Hz)
}

interface AudioMetadata {
  url: string;
  provider: 'azure';
  language: string;
  voice: string;
  generatedAt: string;
  duration?: number;
  size: number;
  speed?: number;
  pitch?: number;
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
        case '/languages':
          return handleGetLanguages();
          
        case '/voices':
          return handleGetVoices(request);
          
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

function handleGetLanguages(): Response {
  const languages = getAllAzureLanguages().map(lang => ({
    locale: lang.locale,
    displayName: lang.displayName,
    localName: lang.localName,
    voiceCount: lang.voices.length
  }));

  return new Response(
    JSON.stringify({
      success: true,
      languages,
      totalLanguages: languages.length
    }),
    {
      headers: {
        ...CORS_HEADERS,
        'Content-Type': 'application/json'
      }
    }
  );
}

function handleGetVoices(request: Request): Response {
  const url = new URL(request.url);
  const language = url.searchParams.get('language');
  
  if (language) {
    // Return voices for a specific language
    const lang = getAzureLanguageByIsoCode(language);
    if (!lang) {
      return new Response(
        JSON.stringify({
          success: false,
          error: `Language '${language}' not supported`
        }),
        {
          status: 404,
          headers: {
            ...CORS_HEADERS,
            'Content-Type': 'application/json'
          }
        }
      );
    }
    
    return new Response(
      JSON.stringify({
        success: true,
        language: lang.locale,
        voices: lang.voices
      }),
      {
        headers: {
          ...CORS_HEADERS,
          'Content-Type': 'application/json'
        }
      }
    );
  }
  
  // Return all voices
  const voices = getAllAzureVoices();
  return new Response(
    JSON.stringify({
      success: true,
      voices,
      totalVoices: voices.length
    }),
    {
      headers: {
        ...CORS_HEADERS,
        'Content-Type': 'application/json'
      }
    }
  );
}

async function handleGenerateTTS(request: Request, env: Env): Promise<Response> {
  const body: TTSRequest = await request.json();
  
  // Validate request
  if (!body.text || !body.voice || !body.language) {
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

  // Validate language support
  if (!isIsoCodeSupported(body.language)) {
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: `Language '${body.language}' not supported by Azure TTS` 
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
  const textHash = generateTextHash(
    body.text, 
    body.language, 
    body.voice, 
    body.speed || 1.0,
    body.pitch || 0
  );
  
  // Check KV cache first
  const cachedMetadata = await env.AUDIO_CACHE.get(textHash, { type: 'json' }) as AudioMetadata | null;
  if (cachedMetadata) {
    console.log('Audio found in KV cache');
    return new Response(
      JSON.stringify({
        success: true,
        audioUrl: cachedMetadata.url,
        cached: true,
        metadata: cachedMetadata
      }),
      {
        headers: {
          ...CORS_HEADERS,
          'Content-Type': 'application/json'
        }
      }
    );
  }
  
  // Check if audio already exists in database
  const existingAudio = await checkExistingAudio(textHash, env);
  if (existingAudio) {
    // Store in KV cache for faster future access
    await env.AUDIO_CACHE.put(textHash, JSON.stringify({
      url: existingAudio.audio_url,
      provider: 'azure',
      language: existingAudio.language,
      voice: existingAudio.voice,
      generatedAt: existingAudio.created_at,
      size: existingAudio.file_size_bytes,
      duration: existingAudio.duration_seconds,
      speed: existingAudio.speed || 1.0,
      pitch: existingAudio.pitch || 0
    }), {
      expirationTtl: 86400 // 24 hours
    });
    
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

  try {
    // Generate SSML for Azure TTS
    const ssml = generateSSML(body.text, body.voice, body.speed || 1.0, body.pitch || 0);
    
    // Generate audio with Azure
    const audioData = await generateAzureAudio(
      ssml,
      env.AZURE_SPEECH_KEY,
      env.AZURE_SPEECH_REGION
    );

    // Generate unique key for R2 storage
    const audioKey = `audio/${textHash}.mp3`;
    
    // Upload to R2
    await env.AUDIO_BUCKET.put(audioKey, audioData, {
      httpMetadata: {
        contentType: 'audio/mpeg',
      }
    });

    // Create metadata
    const audioUrl = `/audio?key=${encodeURIComponent(audioKey)}`;
    const metadata: AudioMetadata = {
      url: audioUrl,
      provider: 'azure',
      language: body.language,
      voice: body.voice,
      generatedAt: new Date().toISOString(),
      size: audioData.length,
      speed: body.speed || 1.0,
      pitch: body.pitch || 0
    };

    // Store in KV cache
    await env.AUDIO_CACHE.put(textHash, JSON.stringify(metadata), {
      expirationTtl: 86400 // 24 hours
    });

    // Store in database
    await storeAudioInDatabase({
      textHash,
      text: body.text,
      language: body.language,
      voice: body.voice,
      provider: 'azure',
      audioUrl,
      fileSize: audioData.length,
      speed: body.speed || 1.0,
      pitch: body.pitch || 0
    }, env);

    return new Response(
      JSON.stringify({
        success: true,
        audioUrl,
        cached: false,
        metadata
      }),
      {
        headers: {
          ...CORS_HEADERS,
          'Content-Type': 'application/json'
        }
      }
    );
  } catch (error) {
    console.error('Azure TTS error:', error);
    
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

function generateTextHash(text: string, language: string, voice: string, speed: number, pitch: number): string {
  const elements = [text, language, voice, speed.toString(), pitch.toString()];
  const str = elements.join('|');
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  return Math.abs(hash).toString(36);
}

function generateSSML(text: string, voice: string, speed: number, pitch: number): string {
  // Convert speed to prosody rate format (0.5-2.0 to percentage)
  const rate = `${Math.round(speed * 100)}%`;
  
  // Convert pitch to Hz adjustment
  const pitchHz = pitch !== 0 ? `${pitch > 0 ? '+' : ''}${pitch}Hz` : '0Hz';
  
  return `<speak version="1.0" xmlns="http://www.w3.org/2001/10/synthesis" xml:lang="en-US">
    <voice name="${voice}">
      <prosody rate="${rate}" pitch="${pitchHz}">
        ${escapeXml(text)}
      </prosody>
    </voice>
  </speak>`;
}

function escapeXml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

async function generateAzureAudio(ssml: string, apiKey: string, region: string): Promise<ArrayBuffer> {
  const endpoint = `https://${region}.tts.speech.microsoft.com/cognitiveservices/v1`;
  
  const response = await fetch(endpoint, {
    method: 'POST',
    headers: {
      'Ocp-Apim-Subscription-Key': apiKey,
      'Content-Type': 'application/ssml+xml',
      'X-Microsoft-OutputFormat': 'audio-16khz-128kbitrate-mono-mp3',
      'User-Agent': 'TikoTTS/1.0'
    },
    body: ssml
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Azure TTS API error: ${response.status} ${errorText}`);
  }

  return response.arrayBuffer();
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
  provider: string;
  audioUrl: string;
  fileSize: number;
  speed: number;
  pitch: number;
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
        provider: audioData.provider,
        audio_url: audioData.audioUrl,
        file_size_bytes: audioData.fileSize,
        speed: audioData.speed,
        pitch: audioData.pitch
      })
    });

    if (!response.ok) {
      console.error('Failed to store audio in database:', await response.text());
    }
  } catch (error) {
    console.error('Error storing audio in database:', error);
  }
}