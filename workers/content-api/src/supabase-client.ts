import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { Env } from './types';

let supabaseClient: SupabaseClient | null = null;

export function getSupabaseClient(env: Env): SupabaseClient {
  const url = env.SUPABASE_URL;
  const key = env.SUPABASE_SECRET;
  
  if (!url || !key) {
    throw new Error(`Supabase credentials not configured. URL exists: ${!!url}, Key exists: ${!!key}`);
  }
  
  if (!supabaseClient) {
    supabaseClient = createClient(url, key, {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
      global: {
        fetch: fetch.bind(globalThis),
      },
    });
  }
  return supabaseClient;
}