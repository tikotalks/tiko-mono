import { createClient } from '@supabase/supabase-js'
import type { SupabaseClient } from '@supabase/supabase-js'

let supabaseInstance: SupabaseClient | null = null

export const getSupabase = () => {
  if (!supabaseInstance) {
    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
    const supabasePublicKey = import.meta.env.VITE_SUPABASE_PUBLIC
    
    console.log('[Supabase Lazy] Creating instance with:', {
      url: supabaseUrl,
      hasKey: !!supabasePublicKey
    })
    
    if (!supabaseUrl || !supabasePublicKey) {
      throw new Error('Supabase credentials missing')
    }
    
    supabaseInstance = createClient(supabaseUrl, supabasePublicKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
        flowType: 'pkce'
      }
    })
  }
  
  return supabaseInstance
}

export const getAuthRedirectUrl = () => {
  const siteUrl = import.meta.env.VITE_SITE_URL || window.location.origin
  return `${siteUrl}/auth/callback`
}