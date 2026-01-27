import { createClient } from '@supabase/supabase-js'
import { env } from '../../config/env'
import type { Database } from './types'

// Safe environment variable access
function getSupabaseConfig() {
  const url = env.SUPABASE_URL
  const key = env.SUPABASE_ANON_KEY
  
  console.log('[Supabase Client] URL:', url ? `${url.substring(0, 30)}...` : '❌ MISSING')
  console.log('[Supabase Client] Anon Key:', key ? 'Set' : '❌ MISSING')
  
  console.log('🔍 [Supabase Client] Loading config...');
  console.log('  - URL:', url || 'NOT SET');
  console.log('  - Key:', key ? `${key.substring(0, 20)}...` : 'NOT SET');
  
  return {
    url: url || 'https://placeholder.supabase.co',
    key: key || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBsYWNlaG9sZGVyIiwicm9sZSI6ImFub24iLCJpYXQiOjE2NDUxOTI4MDAsImV4cCI6MTk2MDc2ODgwMH0.placeholder',
    isValid: !!(url && key)
  }
}

const config = getSupabaseConfig()

// Log configuration status
if (!config.isValid) {
  console.warn('⚠️ Supabase credentials not found in environment variables');
  console.warn('   Set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY');
}

// Always create a client (with placeholder values if needed)
export const supabase = createClient<Database>(config.url, config.key, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
  },
})

// Export a flag to check if Supabase is properly configured
export const isSupabaseConfigured = config.isValid