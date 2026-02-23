import { createClient } from '@supabase/supabase-js';
import { env } from '../../config/env';

// Initialize Supabase client using environment configuration (no hard-coded keys)
const supabaseUrl = env.SUPABASE_URL || '';
const supabaseServiceKey = env.SUPABASE_SERVICE_KEY || '';

console.log('[Teams Service] Supabase URL set:', !!supabaseUrl);
console.log('[Teams Service] Service Key present:', !!supabaseServiceKey);

export const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

// Anon client for regular operations (reads)
const supabaseAnonKey = env.SUPABASE_ANON_KEY || '';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

/**
 * Generate a unique team ID
 * Pattern: TEAM-{timestamp}-{random}
 */
export function generateTeamId(): string {
  const timestamp = Date.now().toString(36).toUpperCase(); // Base36 encoded timestamp
  const random = Math.random().toString(36).substring(2, 6).toUpperCase(); // Random 4 chars
  return `TEAM-${timestamp}-${random}`;
}

/**
 * Generate password based on team count
 * Pattern: IGI-025, IGI-029, IGI-033, etc. (increment by 4)
 */
export function generatePassword(teamCount: number): string {
  const passwordNumber = 25 + (teamCount * 4);
  const paddedNumber = passwordNumber.toString().padStart(3, '0');
  return `IGI-${paddedNumber}`;
}

/**
 * Admin: Get all teams
 */
export async function getAllTeams() {
  try {
    console.log('[getAllTeams] Starting query to:', supabaseUrl);
    
    const { data, error } = await supabaseAdmin
      .from('teams')
      .select('*')
      .order('created_at', { ascending: false });

    console.log('[getAllTeams] Query completed. Error:', error, 'Data count:', data?.length);

    if (error) {
      console.error('Supabase error in getAllTeams:', error);
      
      // Check if it's a network error
      if (error.message?.includes('fetch failed') || error.message?.includes('ENOTFOUND')) {
        throw new Error(`Cannot connect to Supabase. Please check:
1. Internet connection
2. Supabase URL: ${supabaseUrl}
3. Firewall settings`);
      }
      
      throw new Error(error.message);
    }

    return data || [];
  } catch (err: any) {
    console.error('getAllTeams error:', err);
    throw err;
  }
}

/**
 * Admin: Create a new team
 */
export async function createTeam(data: {
  team_name: string;
  player1_name: string;
  player2_name: string;
  phone_no: string;
}) {
  // Get current team count to generate password
  const { count, error: countError } = await supabaseAdmin
    .from('teams')
    .select('*', { count: 'exact', head: true });

  if (countError) {
    throw new Error(`Failed to get team count: ${countError.message}`);
  }

  const teamCount = count || 0;
  
  // Auto-generate team ID
  const teamId = generateTeamId();
  
  // Append @igifosscit to team name
  const fullTeamName = `${data.team_name}@igifosscit`;
  
  // Generate password based on team count
  const password = generatePassword(teamCount);

  // Insert into database
  const insertData = {
    team_id: teamId,
    team_name: fullTeamName,
    player1_name: data.player1_name,
    player2_name: data.player2_name,
    phone_no: data.phone_no,
    password: password,
    r1_score: 0,
    r2_score: 0,
  };

  const { data: team, error } = await supabaseAdmin
    .from('teams')
    .insert(insertData)
    .select()
    .single();

  if (error) {
    throw new Error(error.message);
  }

  if (!team) {
    throw new Error('Failed to create team');
  }

  return {
    team_id: team.team_id,
    team_name: team.team_name,
    password: team.password, // Return password only once during creation
  };
}

/**
 * Team Login: Verify credentials
 */
export async function loginTeam(teamName: string, password: string) {
  console.log('[loginTeam] Attempting login for team:', teamName);
  
  const { data, error } = await supabaseAdmin
    .from('teams')
    .select('team_id, team_name, player1_name, player2_name')
    .eq('team_name', teamName)
    .eq('password', password)
    .single();

  console.log('[loginTeam] Query result - Error:', error, 'Data:', data ? 'Found' : 'Not found');

  if (error || !data) {
    console.error('[loginTeam] Login failed:', error?.message || 'No matching team found');
    throw new Error('Invalid team name or password');
  }

  return {
    team_id: data.team_id,
    team_name: data.team_name,
    player1_name: data.player1_name,
    player2_name: data.player2_name,
  };
}

/**
 * Submit round score
 */
export async function submitRoundScore(
  teamId: string,
  roundNumber: 1 | 2,
  totalScore: number
) {
  // Validate score
  if (totalScore < 0 || totalScore >= 100) {
    throw new Error('Score must be between 0 and 99');
  }

  // Check if already submitted
  const { data: existingTeam, error: fetchError } = await supabase
    .from('teams')
    .select('r1_submission_time, r2_submission_time')
    .eq('team_id', teamId)
    .single();

  if (fetchError || !existingTeam) {
    throw new Error('Team not found');
  }

  if (roundNumber === 1 && existingTeam.r1_submission_time) {
    throw new Error('Round 1 score already submitted');
  }

  if (roundNumber === 2 && existingTeam.r2_submission_time) {
    throw new Error('Round 2 score already submitted');
  }

  // Update score
  const updateData: any = {};
  if (roundNumber === 1) {
    updateData.r1_score = totalScore;
    updateData.r1_submission_time = new Date().toISOString();
  } else {
    updateData.r2_score = totalScore;
    updateData.r2_submission_time = new Date().toISOString();
  }

  const { data, error } = await supabaseAdmin
    .from('teams')
    .update(updateData)
    .eq('team_id', teamId)
    .select()
    .single();

  if (error || !data) {
    throw new Error(error?.message || 'Failed to update score');
  }

  return {
    team_id: data.team_id,
    round: roundNumber,
    score: roundNumber === 1 ? data.r1_score : data.r2_score,
    submission_time: roundNumber === 1 ? data.r1_submission_time : data.r2_submission_time,
  };
}

/**
 * Get rankings for a specific round
 */
export async function getRankings(roundNumber: 1 | 2 | 3) {
  const { leaderboardCache } = await import('../cache/leaderboard-cache');
  
  // Check cache first
  const cachedData = leaderboardCache.get(roundNumber);
  if (cachedData) {
    return formatRankingsForRound(cachedData, roundNumber);
  }
  
  if (roundNumber === 3) {
    // Round 3 rankings are based on bracket progression
    // Return top 8 teams from combined R1+R2 scores
    return await getRound3Rankings();
  }
  
  const scoreColumn = roundNumber === 1 ? 'r1_score' : 'r2_score';
  const timeColumn = roundNumber === 1 ? 'r1_submission_time' : 'r2_submission_time';

  // Fetch teams using database-calculated ranks
  const { data, error } = await supabase
    .from('teams')
    .select(`team_id, team_name, player1_name, player2_name, rank, ${scoreColumn}, ${timeColumn}`)
    .order('rank', { ascending: true, nullsFirst: false });

  if (error || !data) {
    throw new Error(error?.message || 'Failed to fetch rankings');
  }

  // Cache the raw data
  leaderboardCache.set(data as any, roundNumber);

  // Format data for API response
  const rankedData = data.map((team) => ({
    rank: team.rank || 999, // Fallback for teams without rank
    team_id: team.team_id,
    team_name: team.team_name,
    player1_name: team.player1_name,
    player2_name: team.player2_name,
    score: (team as any)[scoreColumn] || 0,
    submission_time: (team as any)[timeColumn],
  }));

  return rankedData;
}

/**
 * Helper to format cached data for specific round
 */
function formatRankingsForRound(cachedData: any[], roundNumber: 1 | 2 | 3) {
  const scoreColumn = roundNumber === 1 ? 'r1_score' : 'r2_score';
  const timeColumn = roundNumber === 1 ? 'r1_submission_time' : 'r2_submission_time';

  return cachedData.map((team) => ({
    rank: team.rank || 999,
    team_id: team.team_id,
    team_name: team.team_name,
    player1_name: team.player1_name,
    player2_name: team.player2_name,
    score: team[scoreColumn] || 0,
    submission_time: team[timeColumn],
  }));
}

/**
 * Get Round 3 rankings (bracket-based)
 * Top 8 teams qualify based on combined R1+R2 scores
 */
async function getRound3Rankings() {
  const { leaderboardCache } = await import('../cache/leaderboard-cache');
  
  // Check cache first
  const cachedData = leaderboardCache.get(3);
  if (cachedData) {
    return cachedData.map((team, index) => ({
      rank: team.rank || index + 1,
      team_id: team.team_id,
      team_name: team.team_name,
      player1_name: team.player1_name,
      player2_name: team.player2_name,
      score: (team.r1_score || 0) + (team.r2_score || 0),
      r1_score: team.r1_score,
      r2_score: team.r2_score,
      qualified: (team.rank || 999) <= 8, // Top 8 qualify for bracket
    }));
  }
  
  const { data, error } = await supabase
    .from('teams')
    .select('team_id, team_name, player1_name, player2_name, rank, r1_score, r2_score, r1_submission_time, r2_submission_time')
    .order('rank', { ascending: true, nullsFirst: false });

  if (error || !data) {
    throw new Error(error?.message || 'Failed to fetch Round 3 rankings');
  }

  // Cache the raw data
  leaderboardCache.set(data as any, 3);

  // Calculate combined score and format
  const rankedData = data.map((team, index) => {
    const combinedScore = (team.r1_score || 0) + (team.r2_score || 0);
    return {
      rank: team.rank || index + 1,
      team_id: team.team_id,
      team_name: team.team_name,
      player1_name: team.player1_name,
      player2_name: team.player2_name,
      score: combinedScore,
      r1_score: team.r1_score,
      r2_score: team.r2_score,
      qualified: (team.rank || 999) <= 8, // Top 8 qualify for bracket
    };
  });

  return rankedData;
}

/**
 * Get team details including their rank in both rounds
 */
export async function getTeamWithRanks(teamId: string) {
  const { data: team, error } = await supabase
    .from('teams')
    .select('*')
    .eq('team_id', teamId)
    .single();

  if (error || !team) {
    throw new Error('Team not found');
  }

  // Get ranks for both rounds
  const [round1Rankings, round2Rankings] = await Promise.all([
    getRankings(1),
    getRankings(2),
  ]);

  const r1Rank = round1Rankings.find((t) => t.team_id === teamId)?.rank || null;
  const r2Rank = round2Rankings.find((t) => t.team_id === teamId)?.rank || null;

  return {
    team_id: team.team_id,
    team_name: team.team_name,
    player1_name: team.player1_name,
    player2_name: team.player2_name,
    phone_no: team.phone_no,
    r1_score: team.r1_score,
    r1_submission_time: team.r1_submission_time,
    r1_rank: r1Rank,
    r2_score: team.r2_score,
    r2_submission_time: team.r2_submission_time,
    r2_rank: r2Rank,
    round3_1_score: team.round3_1_score,
    round3_2_score: team.round3_2_score,
    round3_3_score: team.round3_3_score,
    round3_1_submission_time: team.round3_1_submission_time,
    round3_2_submission_time: team.round3_2_submission_time,
    round3_3_submission_time: team.round3_3_submission_time,
    rank: team.rank,
    created_at: team.created_at,
  };
}
