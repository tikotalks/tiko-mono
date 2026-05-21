import { Env, ContentQuery, QueryResult } from './types';
import { CacheManager } from './cache';
import { ContentService } from './content-service';
import { getContentDbClient } from './d1-content-client';

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    // Handle CORS preflight
    if (request.method === 'OPTIONS') {
      return handleCORS(request);
    }

    // Parse URL
    const url = new URL(request.url);
    
    // Health check endpoint
    if (url.pathname === '/health') {
      return new Response(JSON.stringify({ status: 'ok', timestamp: Date.now() }), {
        headers: getCORSHeaders(request)
      });
    }

    if (url.hostname === 'items.tikoapi.org' || url.hostname === 'tts.tikoapi.org') {
      return handleItemsRestRequest(request, env);
    }

    // Root endpoint - show status
    if (url.pathname === '/') {
      return new Response(JSON.stringify({ 
        service: 'Tiko Content API',
        status: 'operational',
        version: '1.0.0',
        endpoints: {
          query: 'POST /query',
          health: 'GET /health',
          cache_clear: 'POST /cache/clear'
        },
        documentation: 'https://github.com/tiko/tiko-mono/tree/master/workers/content-api'
      }), {
        headers: {
          ...getCORSHeaders(request),
          'Content-Type': 'application/json'
        }
      });
    }


    // Cache control endpoints
    if (url.pathname === '/cache/clear' && request.method === 'POST') {
      return handleCacheClear(request, env);
    }

    // Main content endpoint
    if (url.pathname === '/query' && request.method === 'POST') {
      return handleContentQuery(request, env);
    }

    // Legacy URL format support: /content/[method]?params
    if (url.pathname.startsWith('/content/')) {
      return handleLegacyQuery(request, env);
    }

    return new Response('Not Found', { 
      status: 404,
      headers: getCORSHeaders(request)
    });
  }
};

async function handleContentQuery(request: Request, env: Env): Promise<Response> {
  try {
    // Parse request body
    const body = await request.json() as ContentQuery;
    
    // Get query parameters
    const url = new URL(request.url);
    const deployedVersionId = url.searchParams.get('deployedVersionId') || undefined;
    const noCache = url.searchParams.has('no-cache');

    // Add parameters to query
    const query: ContentQuery = {
      ...body,
      deployedVersionId,
      noCache
    };

    // Initialize services
    const cacheManager = new CacheManager(env);
    const dbClient = getContentDbClient(env);
    const contentService = new ContentService(dbClient);

    let result: QueryResult;
    let cached = false;
    let cacheAge = 0;

    // Check cache first
    const cachedEntry = await cacheManager.get(query);
    
    if (cachedEntry && !noCache) {
      // Return cached data
      result = { data: cachedEntry.data, cached: true };
      cached = true;
      cacheAge = Date.now() - cachedEntry.timestamp;
      
      // Add cache headers
      const response = new Response(JSON.stringify(result), {
        headers: {
          ...getCORSHeaders(request),
          'Content-Type': 'application/json',
          'X-Cache-Status': 'HIT',
          'X-Cache-Age': Math.floor(cacheAge / 1000).toString(),
          'ETag': cachedEntry.etag,
          'Cache-Control': `public, max-age=${env.CACHE_TTL}`
        }
      });

      return response;
    }

    // Execute query
    result = await contentService.executeQuery(query);
    
    // Cache successful results
    if (!result.error && result.data) {
      await cacheManager.set(query, result.data);
    }

    // Return response
    const response = new Response(JSON.stringify(result), {
      headers: {
        ...getCORSHeaders(request),
        'Content-Type': 'application/json',
        'X-Cache-Status': noCache ? 'BYPASS' : 'MISS',
        'Cache-Control': result.error ? 'no-cache' : `public, max-age=${env.CACHE_TTL}`
      }
    });

    return response;

  } catch (error) {
    console.error('Query error:', error);
    return new Response(
      JSON.stringify({ 
        error: error instanceof Error ? error.message : 'Internal server error',
        data: null 
      }),
      {
        status: 500,
        headers: {
          ...getCORSHeaders(request),
          'Content-Type': 'application/json',
          'Cache-Control': 'no-cache'
        }
      }
    );
  }
}

async function handleLegacyQuery(request: Request, env: Env): Promise<Response> {
  try {
    const url = new URL(request.url);
    const pathParts = url.pathname.split('/').filter(Boolean);
    
    if (pathParts.length < 2) {
      return new Response('Invalid path', { 
        status: 400,
        headers: getCORSHeaders(request)
      });
    }

    const method = pathParts[1];
    const params: Record<string, any> = {};
    
    // Parse query parameters into params object
    url.searchParams.forEach((value, key) => {
      if (key !== 'deployedVersionId' && key !== 'no-cache') {
        // Handle array parameters (e.g., itemIds[]=1&itemIds[]=2)
        if (key.endsWith('[]')) {
          const paramName = key.slice(0, -2);
          if (!params[paramName]) params[paramName] = [];
          params[paramName].push(value);
        } else {
          // Try to parse JSON values
          try {
            params[key] = JSON.parse(value);
          } catch {
            params[key] = value;
          }
        }
      }
    });

    // Create query object
    const query: ContentQuery = {
      method,
      params,
      deployedVersionId: url.searchParams.get('deployedVersionId') || undefined,
      noCache: url.searchParams.has('no-cache')
    };

    // Reuse the main handler logic
    const newRequest = new Request(request.url, {
      method: 'POST',
      headers: request.headers,
      body: JSON.stringify(query)
    });

    return handleContentQuery(newRequest, env);

  } catch (error) {
    console.error('Legacy query error:', error);
    return new Response(
      JSON.stringify({ 
        error: error instanceof Error ? error.message : 'Internal server error',
        data: null 
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

async function handleCacheClear(request: Request, env: Env): Promise<Response> {
  try {
    // Verify authorization (implement your auth logic)
    const authHeader = request.headers.get('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return new Response('Unauthorized', { 
        status: 401,
        headers: getCORSHeaders(request)
      });
    }

    const body = await request.json() as { pattern?: string; versionId?: string };
    const cacheManager = new CacheManager(env);

    if (body.versionId) {
      await cacheManager.clearVersion(body.versionId);
    } else if (body.pattern) {
      await cacheManager.invalidate(body.pattern);
    } else {
      // Clear all cache
      await cacheManager.invalidate('content:');
    }

    return new Response(
      JSON.stringify({ success: true, message: 'Cache cleared' }),
      {
        headers: {
          ...getCORSHeaders(request),
          'Content-Type': 'application/json'
        }
      }
    );

  } catch (error) {
    console.error('Cache clear error:', error);
    return new Response(
      JSON.stringify({ 
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
}

async function handleItemsRestRequest(request: Request, env: Env): Promise<Response> {
  const url = new URL(request.url);
  const table = url.pathname.replace(/^\/rest\/v1\//, '').split('/')[0];

  if (table === 'tts_audio') {
    return handleTtsAudioRestRequest(request);
  }

  if (table !== 'items') {
    return jsonResponse({ code: 'not_found', message: 'Unsupported table' }, request, 404);
  }

  if (request.method === 'HEAD') {
    return new Response(null, { status: 200, headers: getCORSHeaders(request) });
  }

  if (request.method !== 'GET') {
    return jsonResponse({ code: 'method_not_allowed', message: 'Only GET is currently supported' }, request, 405);
  }

  const sql = `SELECT id, template_id, title, slug, status, language_code, created_at, updated_at
    FROM content_items
    WHERE status IS NULL OR status != 'archived'
    ORDER BY created_at DESC
    LIMIT ?`;
  const limit = clampLimit(url.searchParams.get('limit'));
  const result = await env.CONTENT_DB.prepare(sql).bind(limit).all<Record<string, unknown>>();
  return jsonResponse(result.results.map(rowToLegacyItem), request);
}

function handleTtsAudioRestRequest(request: Request): Response {
  if (request.method === 'HEAD') {
    return new Response(null, { status: 200, headers: getCORSHeaders(request) });
  }

  if (request.method !== 'GET') {
    return jsonResponse({ code: 'method_not_allowed', message: 'Only GET is currently supported' }, request, 405);
  }

  return jsonResponse([], request);
}

function clampLimit(value: string | null): number {
  const parsed = Number.parseInt(value || '100', 10);
  if (!Number.isFinite(parsed)) return 100;
  return Math.max(0, Math.min(parsed, 500));
}

function rowToLegacyItem(row: Record<string, unknown>): Record<string, unknown> {
  return {
    id: row.id,
    name: row.title,
    title: row.title,
    slug: row.slug,
    type: row.template_id,
    parent_id: null,
    user_id: null,
    app_name: null,
    order_index: 0,
    is_public: true,
    created_at: row.created_at,
    updated_at: row.updated_at,
  };
}

function jsonResponse(body: unknown, request: Request, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      ...getCORSHeaders(request),
      'Content-Type': 'application/json',
    },
  });
}

function getCORSHeaders(request: Request): HeadersInit {
  const origin = request.headers.get('Origin') || '*';
  
  return {
    'Access-Control-Allow-Origin': origin,
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization, Prefer',
    'Access-Control-Allow-Credentials': 'true',
    'Access-Control-Max-Age': '86400',
  };
}

function handleCORS(request: Request): Response {
  return new Response(null, {
    status: 204,
    headers: getCORSHeaders(request)
  });
}