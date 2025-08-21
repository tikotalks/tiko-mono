export interface Env {
  // KV Namespace for caching
  CONTENT_CACHE: KVNamespace;
  
  // Environment variables
  SUPABASE_URL: string;
  SUPABASE_SERVICE_KEY: string;
  CACHE_TTL: string;
  
  // Optional: R2 bucket for large content
  CONTENT_BUCKET?: R2Bucket;
}

export interface CacheEntry {
  data: any;
  timestamp: number;
  etag: string;
  queryHash: string;
}

export interface ContentQuery {
  method: string;
  params: Record<string, any>;
  deployedVersionId?: string;
  noCache?: boolean;
}

export interface QueryResult {
  data: any;
  error?: string;
  cached?: boolean;
  cacheAge?: number;
}