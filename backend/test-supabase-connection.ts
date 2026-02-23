/**
 * Test Supabase Connection
 * Run with: tsx test-supabase-connection.ts
 */

import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

console.log('🔍 Testing Supabase Connection...\n');
console.log('Configuration:');
console.log('  URL set:', !!supabaseUrl);
console.log('  Service Key set:', !!supabaseServiceKey);
console.log('');

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function testConnection() {
  try {
    console.log('1️⃣ Testing basic connection...');
    
    // Test 1: Simple query to check connection
    const { data, error } = await supabase
      .from('teams')
      .select('count')
      .limit(1);

    if (error) {
      console.error('❌ Connection failed:', error.message);
      console.error('   Details:', error.details);
      console.error('   Hint:', error.hint);
      return false;
    }

    console.log('✅ Connection successful!\n');

    // Test 2: Count teams
    console.log('2️⃣ Counting teams in database...');
    const { count, error: countError } = await supabase
      .from('teams')
      .select('*', { count: 'exact', head: true });

    if (countError) {
      console.error('❌ Count query failed:', countError.message);
      return false;
    }

    console.log(`✅ Found ${count} teams in database\n`);

    // Test 3: Fetch all teams
    console.log('3️⃣ Fetching all teams...');
    const { data: teams, error: fetchError } = await supabase
      .from('teams')
      .select('*')
      .order('created_at', { ascending: false });

    if (fetchError) {
      console.error('❌ Fetch failed:', fetchError.message);
      return false;
    }

    console.log(`✅ Successfully fetched ${teams?.length || 0} teams`);
    
    if (teams && teams.length > 0) {
      console.log('\n📋 Sample team:');
      const sample = teams[0];
      console.log('   Team ID:', sample.team_id);
      console.log('   Team Name:', sample.team_name);
      console.log('   Player 1:', sample.player1_name);
      console.log('   Player 2:', sample.player2_name);
    } else {
      console.log('   No teams in database yet');
    }

    console.log('\n🎉 All tests passed! Supabase connection is working.\n');
    return true;

  } catch (err: any) {
    console.error('❌ Unexpected error:', err.message);
    console.error('   Stack:', err.stack);
    return false;
  }
}

testConnection()
  .then((success) => {
    process.exit(success ? 0 : 1);
  })
  .catch((err) => {
    console.error('Fatal error:', err);
    process.exit(1);
  });
