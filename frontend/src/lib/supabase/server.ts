import { createClient } from '@supabase/supabase-js'

// Safe environment variable access for server-side
function getSupabaseServerConfig() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  
  return {
    url: url || 'https://placeholder.supabase.co',
    serviceKey: serviceKey || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBsYWNlaG9sZGVyIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTY0NTE5MjgwMCwiZXhwIjoxOTYwNzY4ODAwfQ.placeholder',
    isValid: !!(url && serviceKey)
  }
}

const serverConfig = getSupabaseServerConfig()

// Server-side client with service role key for admin operations
export const supabaseAdmin = createClient(serverConfig.url, serverConfig.serviceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
})

// Export a flag to check if server-side Supabase is properly configured
export const isSupabaseServerConfigured = serverConfig.isValid

// Log warning if not configured (server-side only)
if (!serverConfig.isValid) {
  console.warn('⚠️ Supabase server configuration incomplete. Admin operations may not work.')
}