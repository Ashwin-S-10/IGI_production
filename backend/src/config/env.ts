// This file MUST be imported first in any module that needs environment variables
// It ensures dotenv is loaded before anything else tries to read process.env

import dotenv from 'dotenv';

// Load environment variables immediately
dotenv.config();

// Validate critical configuration
export const validateEnv = () => {
  const required = [
    'NEXT_PUBLIC_SUPABASE_URL',
    'NEXT_PUBLIC_SUPABASE_ANON_KEY',
    'SUPABASE_SERVICE_ROLE_KEY',
  ];

  const missing = required.filter(key => !process.env[key]);

  if (missing.length > 0) {
    console.error('❌ Missing required environment variables:', missing);
    return false;
  }

  console.log('✅ All required environment variables are set');
  return true;
};

// Export environment variables with fallbacks
export const env = {
  SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '',
  SUPABASE_SERVICE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY || '',
  GEMINI_API_KEY: process.env.GEMINI_API_KEY || '',
  PORT: process.env.PORT || '4000',
  FRONTEND_URL: process.env.FRONTEND_URL || 'http://localhost:3000',
  NODE_ENV: process.env.NODE_ENV || 'development',
};

export default env;
// Load environment variables FIRST, before any other imports
import dotenv from 'dotenv';

const result = dotenv.config();
if (result.error) {
  console.error('❌ Error loading .env file:', result.error);
} else {
  console.log('✅ .env file loaded');
}

// Export environment check
export function checkEnvironment() {
  console.log('🔍 Environment Check:');
  console.log('  - GEMINI_API_KEY:', process.env.GEMINI_API_KEY ? 'Set' : '❌ NOT SET');
  console.log('  - SUPABASE_URL:', process.env.NEXT_PUBLIC_SUPABASE_URL || '❌ NOT SET');
  console.log('  - SUPABASE_ANON_KEY:', process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? 'Set' : '❌ NOT SET');
  console.log('  - PORT:', process.env.PORT || '4000 (default)');
  console.log('  - FRONTEND_URL:', process.env.FRONTEND_URL || 'http://localhost:3000 (default)');
}
