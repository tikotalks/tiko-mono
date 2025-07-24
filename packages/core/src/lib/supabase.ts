import { createClient } from '@supabase/supabase-js'

// Use hardcoded values instead of environment variables
const supabaseUrl = 'https://kejvhvszhevfwgsztedf.supabase.co'
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtlanZodnN6aGV2Zndnc3p0ZWRmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTE4ODg2MTIsImV4cCI6MjA2NzQ2NDYxMn0.xUYXxNodJTpTwChlKbuBSojVJqX9CDW87aVISEUc2rE'

// Get the site URL for auth redirects
const siteUrl = (typeof window !== 'undefined' ? window.location.origin : 'http://localhost:3000')

export const supabase = createClient(
  supabaseUrl, 
  supabaseAnonKey,
  {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
      flowType: 'implicit'
    },
    global: {
      headers: {
        'X-Client-Info': '@supabase/supabase-js@2.50.3'
      }
    }
  }
)

// Helper function to get the correct redirect URL for auth
export const getAuthRedirectUrl = () => {
  return `${siteUrl}/auth/callback`
}

// Database types (these would normally be generated from Supabase)
export interface Database {
  public: {
    Tables: {
      users: {
        Row: {
          id: string
          email: string | null
          full_name: string | null
          avatar_url: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          email?: string | null
          full_name?: string | null
          avatar_url?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          email?: string | null
          full_name?: string | null
          avatar_url?: string | null
          updated_at?: string
        }
      }
      user_settings: {
        Row: {
          id: string
          user_id: string
          app_name: string
          settings: any // JSON field
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          app_name: string
          settings: any
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          app_name?: string
          settings?: any
          updated_at?: string
        }
      }
      media: {
        Row: {
          id: string
          user_id: string | null
          filename: string
          original_filename: string
          file_size: number
          mime_type: string
          original_url: string
          thumbnail_url: string | null
          medium_url: string | null
          large_url: string | null
          width: number | null
          height: number | null
          name: string
          title: string
          description: string | null
          tags: string[]
          categories: string[]
          ai_analyzed: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id?: string | null
          filename: string
          original_filename: string
          file_size: number
          mime_type: string
          original_url: string
          thumbnail_url?: string | null
          medium_url?: string | null
          large_url?: string | null
          width?: number | null
          height?: number | null
          name: string
          title: string
          description?: string | null
          tags?: string[]
          categories?: string[]
          ai_analyzed?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string | null
          filename?: string
          original_filename?: string
          file_size?: number
          mime_type?: string
          original_url?: string
          thumbnail_url?: string | null
          medium_url?: string | null
          large_url?: string | null
          width?: number | null
          height?: number | null
          name?: string
          title?: string
          description?: string | null
          tags?: string[]
          categories?: string[]
          ai_analyzed?: boolean
          updated_at?: string
        }
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
  }
}

export type Tables<T extends keyof Database['public']['Tables']> = Database['public']['Tables'][T]['Row']
export type TablesInsert<T extends keyof Database['public']['Tables']> = Database['public']['Tables'][T]['Insert']
export type TablesUpdate<T extends keyof Database['public']['Tables']> = Database['public']['Tables'][T]['Update']