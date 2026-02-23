import { createClient } from '@supabase/supabase-js'
import { env } from '../../config/env'

// Safe environment variable access for server-side
function getSupabaseServerConfig() {
  const url = env.SUPABASE_URL
  const serviceKey = env.SUPABASE_SERVICE_KEY
  
  console.log('[Supabase Server] URL:', url ? `${url.substring(0, 30)}...` : '❌ MISSING')
  console.log('[Supabase Server] Service Key:', serviceKey ? 'Set' : '❌ MISSING')
  
  return {
    url: url || '',
    serviceKey: serviceKey || '',
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
  console.error('❌ Supabase server configuration is INCOMPLETE!')
  console.error('  - NEXT_PUBLIC_SUPABASE_URL:', env.SUPABASE_URL ? '✅ Set' : '❌ NOT SET')
  console.error('  - SUPABASE_SERVICE_ROLE_KEY:', env.SUPABASE_SERVICE_KEY ? '✅ Set' : '❌ NOT SET')
} else {
  console.log('✅ Supabase server configuration is valid')
  console.log('  - URL:', serverConfig.url)
}