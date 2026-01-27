import { createClient } from '@supabase/supabase-js'

// Safe environment variable access
function getSupabaseConfig() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  
  return {
    url: url || 'https://placeholder.supabase.co',
    key: key || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBsYWNlaG9sZGVyIiwicm9sZSI6ImFub24iLCJpYXQiOjE2NDUxOTI4MDAsImV4cCI6MTk2MDc2ODgwMH0.placeholder',
    isValid: !!(url && key && url.startsWith('http'))
  }
}

const config = getSupabaseConfig()

// Always create a client (with placeholder values if needed)
// Wrap in try-catch to prevent initialization errors
let supabase: ReturnType<typeof createClient>

try {
  // Only create client if config is valid, otherwise use a dummy placeholder
  if (config.isValid) {
    supabase = createClient(config.url, config.key, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
      },
    })
  } else {
    // Create a dummy client with valid URL format
    console.warn('⚠️ Supabase not configured. Using placeholder client. Set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY in .env.local')
    supabase = createClient('https://placeholder.supabase.co', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBsYWNlaG9sZGVyIiwicm9sZSI6ImFub24iLCJpYXQiOjE2NDUxOTI4MDAsImV4cCI6MTk2MDc2ODgwMH0.placeholder', {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
    })
  }
} catch (error) {
  console.error('⚠️ Failed to initialize Supabase client:', error)
  // Create a minimal fallback client with valid URL
  supabase = createClient('https://placeholder.supabase.co', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBsYWNlaG9sZGVyIiwicm9sZSI6ImFub24iLCJpYXQiOjE2NDUxOTI4MDAsImV4cCI6MTk2MDc2ODgwMH0.placeholder')
}

export { supabase }

// Export a flag to check if Supabase is properly configured
export const isSupabaseConfigured = config.isValid

// Supabase connection test is disabled - using backend API instead
if (typeof window !== 'undefined' && !config.isValid) {
  console.log('ℹ️ Supabase not configured. Using backend API at http://localhost:4000')
}