import { createClient } from '@supabase/supabase-js';

export interface Env {
  MEDIA_CACHE: KVNamespace;
  SUPABASE_URL: string;
  SUPABASE_SERVICE_KEY: string;
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

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);
    
    // CORS headers
    const corsHeaders = {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
      'Content-Type': 'application/json',
    };

    // Handle preflight requests
    if (request.method === 'OPTIONS') {
      return new Response(null, { headers: corsHeaders });
    }

    // Only allow GET requests
    if (request.method !== 'GET') {
      return new Response(JSON.stringify({ error: 'Method not allowed' }), {
        status: 405,
        headers: corsHeaders,
      });
    }

    try {
      // Get deployment version (from env var or use timestamp)
      const deploymentVersion = env.DEPLOYMENT_VERSION || new Date().toISOString().split('T')[0];
      
      // Check if we want to force refresh
      const forceRefresh = url.searchParams.get('refresh') === 'true';
      
      // Cache key based on deployment version
      const cacheKey = `public-media-${deploymentVersion}`;
      
      // Try to get from cache first
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

      console.log('Cache miss, fetching from Supabase');
      
      // Initialize Supabase client
      const supabase = createClient(env.SUPABASE_URL, env.SUPABASE_SERVICE_KEY);

      // Fetch all public media items
      const { data: media, error } = await supabase
        .from('media')
        .select('*')
        .eq('is_private', false)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Supabase error:', error);
        return new Response(JSON.stringify({ error: 'Failed to fetch media' }), {
          status: 500,
          headers: corsHeaders,
        });
      }

      // Prepare response
      const response: CachedMediaResponse = {
        media: media || [],
        cachedAt: new Date().toISOString(),
        deploymentVersion,
      };

      const responseJson = JSON.stringify(response);

      // Store in KV with 24 hour expiration
      await env.MEDIA_CACHE.put(cacheKey, responseJson, {
        expirationTtl: 86400, // 24 hours
      });

      // Also clean up old cache entries
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

// Clean up cache entries from old deployments
async function cleanupOldCacheEntries(kv: KVNamespace, currentVersion: string) {
  try {
    // List all keys with the public-media prefix
    const list = await kv.list({ prefix: 'public-media-' });
    
    // Delete all entries except the current version
    const deletePromises = list.keys
      .filter(key => key.name !== `public-media-${currentVersion}`)
      .map(key => kv.delete(key.name));
    
    await Promise.all(deletePromises);
    
    console.log(`Cleaned up ${deletePromises.length} old cache entries`);
  } catch (error) {
    console.error('Error cleaning up cache:', error);
  }
}