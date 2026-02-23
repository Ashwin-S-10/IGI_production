import { createClient } from '@supabase/supabase-js'
import type { Database } from './types'

// Safe environment variable access
function getSupabaseConfig() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  
  return {
    url: url || '',
    key: key || '',
    isValid: !!(url && key && url.startsWith && url.startsWith('http'))
  }
}

const config = getSupabaseConfig()

// Always create a client (with placeholder values if needed)
// Wrap in try-catch to prevent initialization errors
let supabase: ReturnType<typeof createClient<Database>>

  try {
    if (config.isValid) {
      supabase = createClient<Database>(config.url, config.key, {
        auth: {
          persistSession: true,
          autoRefreshToken: true,
        },
      })
    } else {
      console.warn('⚠️ Supabase not configured. Set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY in .env.local')
      // Create a client with empty key/url to avoid embedding any secrets
      supabase = createClient<Database>(config.url || '', config.key || '', {
        auth: {
          persistSession: false,
          autoRefreshToken: false,
        },
      })
    }
  } catch (error) {
    console.error('⚠️ Failed to initialize Supabase client:', error)
    // Create a minimal fallback client with empty values
    supabase = createClient<Database>(config.url || '', config.key || '')
  }

export { supabase }

// Export a flag to check if Supabase is properly configured
export const isSupabaseConfigured = config.isValid

// Supabase connection test is disabled - using backend API instead