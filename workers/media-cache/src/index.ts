export interface Env {
  MEDIA_CACHE: KVNamespace;
  MEDIA_DB: D1Database;
  DEPLOYMENT_VERSION?: string;
}

interface MediaItem {
  id: string;
  file_name: string;
  file_size: number;
  mime_type: string;
  width?: number;
  height?: number;
  alt_text?: string;
  title?: string;
  description?: string;
  folder?: string;
  tags?: string[];
  is_private: boolean;
  original_url: string;
  created_at: string;
  updated_at: string;
}

interface CachedMediaResponse {
  media: MediaItem[];
  cachedAt: string;
  deploymentVersion: string;
}

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
  'Content-Type': 'application/json',
};

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);

    if (request.method === 'OPTIONS') {
      return new Response(null, { headers: corsHeaders });
    }

    if (request.method !== 'GET') {
      return new Response(JSON.stringify({ error: 'Method not allowed' }), {
        status: 405,
        headers: corsHeaders,
      });
    }

    try {
      const deploymentVersion = env.DEPLOYMENT_VERSION || new Date().toISOString().split('T')[0];
      const forceRefresh = url.searchParams.get('refresh') === 'true';
      const cacheKey = `public-media-${deploymentVersion}`;

      if (!forceRefresh) {
        const cached = await env.MEDIA_CACHE.get(cacheKey);
        if (cached) {
          console.log('Returning cached media data');
          return new Response(cached, {
            headers: {
              ...corsHeaders,
              'X-Cache-Status': 'HIT',
              'X-Deployment-Version': deploymentVersion,
            },
          });
        }
      }

      console.log('Cache miss, fetching from D1');
      const media = await fetchPublicMedia(env.MEDIA_DB);
      const response: CachedMediaResponse = {
        media,
        cachedAt: new Date().toISOString(),
        deploymentVersion,
      };

      const responseJson = JSON.stringify(response);

      await env.MEDIA_CACHE.put(cacheKey, responseJson, {
        expirationTtl: 86400,
      });

      await cleanupOldCacheEntries(env.MEDIA_CACHE, deploymentVersion);

      return new Response(responseJson, {
        headers: {
          ...corsHeaders,
          'X-Cache-Status': 'MISS',
          'X-Deployment-Version': deploymentVersion,
        },
      });
    } catch (error) {
      console.error('Worker error:', error);
      return new Response(JSON.stringify({ error: 'Internal server error' }), {
        status: 500,
        headers: corsHeaders,
      });
    }
  },
};

async function fetchPublicMedia(db: D1Database): Promise<MediaItem[]> {
  const rows = await db
    .prepare(
      `SELECT id, file_name, file_size, mime_type, width, height, alt_text, title,
              description, folder, tags, is_private, original_url, created_at, updated_at
       FROM media
       WHERE is_private = 0
       ORDER BY created_at DESC`,
    )
    .all<Record<string, unknown>>();

  return rows.results.map(rowToMediaItem);
}

function rowToMediaItem(row: Record<string, unknown>): MediaItem {
  return {
    id: String(row.id),
    file_name: String(row.file_name),
    file_size: Number(row.file_size),
    mime_type: String(row.mime_type),
    width: nullableNumber(row.width),
    height: nullableNumber(row.height),
    alt_text: nullableString(row.alt_text),
    title: nullableString(row.title),
    description: nullableString(row.description),
    folder: nullableString(row.folder),
    tags: parseStringArray(row.tags),
    is_private: Boolean(row.is_private),
    original_url: String(row.original_url),
    created_at: String(row.created_at),
    updated_at: String(row.updated_at),
  };
}

function nullableString(value: unknown): string | undefined {
  return typeof value === 'string' && value.length > 0 ? value : undefined;
}

function nullableNumber(value: unknown): number | undefined {
  return typeof value === 'number' ? value : undefined;
}

function parseStringArray(value: unknown): string[] {
  if (typeof value !== 'string') return [];
  try {
    const parsed = JSON.parse(value);
    return Array.isArray(parsed) ? parsed.filter((item): item is string => typeof item === 'string') : [];
  } catch {
    return [];
  }
}

async function cleanupOldCacheEntries(kv: KVNamespace, currentVersion: string) {
  try {
    const list = await kv.list({ prefix: 'public-media-' });
    const deletePromises = list.keys
      .filter((key) => key.name !== `public-media-${currentVersion}`)
      .map((key) => kv.delete(key.name));

    await Promise.all(deletePromises);
    console.log(`Cleaned up ${deletePromises.length} old cache entries`);
  } catch (error) {
    console.error('Error cleaning up cache:', error);
  }
}
