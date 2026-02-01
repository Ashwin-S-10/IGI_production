import { Router, Request, Response } from 'express';
import { db } from '../lib/supabase/database';
import { supabaseAdmin } from '../lib/supabase/server';
import { ROUND1_QUESTIONS } from '../data/round1-questions';
import { ROUND2_QUESTIONS } from '../data/round2-questions';
import { scoreDebuggingAnswerWithGemini } from '../lib/gemini/round2-scoring';
import { evaluateAnswerController } from '../lib/gemini/evaluationController';
import { getRankings } from '../lib/supabase/teams-service';
import { evaluateRound3Answer } from '../lib/gemini/round3-evaluation';
import { getQuestionDetails, getRoundQuestions, type RoundQuestion } from '../../../shared/src/index';

const router = Router();

// ===================================
// HELPER FUNCTIONS
// ===================================

/**
 * Map Round 3 question_id to database columns and shared question IDs
 */
interface QuestionMapping {
  sharedQuestionId: 'r3-q1' | 'r3-q2' | 'r3-q3';
  scoreColumn: 'round3_1_score' | 'round3_2_score' | 'round3_3_score';
  timestampColumn: 'round3_1_timestamp' | 'round3_2_timestamp' | 'round3_3_timestamp';
}

function getQuestionMapping(question_id: string): QuestionMapping {
  const mappings: Record<string, QuestionMapping> = {
    'round3_1': {
      sharedQuestionId: 'r3-q1',
      scoreColumn: 'round3_1_score',
      timestampColumn: 'round3_1_timestamp'
    },
    'round3_2': {
      sharedQuestionId: 'r3-q2',
      scoreColumn: 'round3_2_score',
      timestampColumn: 'round3_2_timestamp'
    },
    'round3_3': {
      sharedQuestionId: 'r3-q3',
      scoreColumn: 'round3_3_score',
      timestampColumn: 'round3_3_timestamp'
    }
  };

  const mapping = mappings[question_id];
  if (!mapping) {
    throw new Error(`Invalid question_id: ${question_id}. Must be round3_1, round3_2, or round3_3`);
  }

  return mapping;
}

// ===================================
// ROUTES
// ===================================

// Story acknowledgment routes
router.get('/story-ack', async (req: Request, res: Response) => {
  try {
    const sessionId = req.headers['x-session-id'] as string;
    // For now, return a simple response
    // You can implement actual story tracking logic here
    res.json({ acknowledged: false });
  } catch (error) {
    console.error('[story-ack] Error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.post('/story-ack', async (req: Request, res: Response) => {
  try {
    const sessionId = req.headers['x-session-id'] as string;
    // Implement story acknowledgment logic
    res.json({ success: true });
  } catch (error) {
    console.error('[story-ack] Error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Contest state route
router.get('/state', async (req: Request, res: Response) => {
  try {
    // Return contest state
    res.json({ 
      currentRound: 'round1',
      status: 'active'
    });
  } catch (error) {
    console.error('[state] Error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get all rounds state
router.get('/rounds/state', async (req: Request, res: Response) => {
  try {
    console.log('📡 Fetching rounds state...');
    const rounds = await db.getRounds();
    console.log('✅ Rounds fetched:', rounds.length);
    res.json(rounds);
  } catch (error) {
    console.error('❌ [rounds/state] Error:', error);
    res.status(500).json({ 
      error: 'Failed to fetch rounds state',
      details: error instanceof Error ? error.message : 'Unknown error',
      hint: 'Check if rounds table exists and has Flag column'
    });
  }
});

// Update round (Flag, status, timers)
router.patch('/rounds/:roundId', async (req: Request, res: Response) => {
  try {
    const { roundId } = req.params;
    const updates = req.body;
    console.log('📝 Updating round:', roundId, 'with:', updates);
    
    const round = await db.updateRound(roundId, updates);
    console.log('✅ Round updated:', round);
    res.json(round);
  } catch (error) {
    console.error('❌ [rounds/:roundId] Error:', error);
    res.status(500).json({ 
      error: 'Failed to update round',
      details: error instanceof Error ? error.message : 'Unknown error',
      hint: 'Check if rounds table exists and has Flag column'
    });
  }
});

// Telecast routes
router.get('/telecast/status', async (req: Request, res: Response) => {
  try {
    const telecast = await db.getTelecastStatus();
    
    res.json({
      active: telecast?.active || false,
      triggeredAt: telecast?.triggered_at || null,
      timestamp: telecast?.timestamp || null,
      videoPath: telecast?.video_path || '/infovid.mp4',
    });
  } catch (error) {
    console.error("Error getting telecast status:", error);
    res.json({
      active: false,
      triggeredAt: null,
      timestamp: null,
      videoPath: '/infovid.mp4',
    });
  }
});

router.post('/telecast/trigger', async (req: Request, res: Response) => {
  try {
    const videoPath = req.body.videoPath || '/infovid.mp4';
    const telecast = await db.triggerTelecast(videoPath);
    res.json({ success: true, videoPath: telecast.video_path });
  } catch (error) {
    console.error("Error triggering telecast:", error);
    res.status(500).json({ error: "Failed to trigger telecast" });
  }
});

router.post('/telecast/clear', async (req: Request, res: Response) => {
  try {
    await db.clearTelecast();
    res.json({ success: true });
  } catch (error) {
    console.error("Error clearing telecast:", error);
    res.status(500).json({ error: "Failed to clear telecast" });
  }
});

router.post('/telecast/mark-viewed', async (req: Request, res: Response) => {
  try {
    const { teamId } = req.body;
    
    if (!teamId) {
      return res.status(400).json({ error: 'Team ID is required' });
    }
    
    await db.markTelecastViewed(teamId);
    res.json({ success: true });
  } catch (error) {
    console.error("Error marking telecast as viewed:", error);
    res.status(500).json({ error: "Failed to mark telecast as viewed" });
  }
});

// Round 1 routes - Get questions (WITHOUT answers)
router.get('/round1/questions', async (req: Request, res: Response) => {
  try {
    // Return questions WITHOUT expected answers
    const questions = ROUND1_QUESTIONS.map(q => ({
      question_id: q.question_id,
      title: q.title,
      question_text: q.question_text
      // NEVER send expected_answer to frontend
    }));
    
    res.json({ questions });
  } catch (error) {
    console.error('[round1/questions] Error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Round 1 - Submit answer to evaluation queue (manual admin scoring)
router.post('/round1/evaluate', async (req: Request, res: Response) => {
  try {
    const { team_id, question_id, user_answer } = req.body;
    
    console.log('[Round1/evaluate] Request body:', JSON.stringify(req.body));
    
    if (!team_id || !question_id || user_answer === undefined) {
      console.error('[Round1/evaluate] Missing fields:', { team_id, question_id, user_answer: user_answer !== undefined });
      return res.status(400).json({ error: 'Missing required fields: team_id, question_id, user_answer' });
    }
    
    // Reject unknown team_id
    if (team_id === 'unknown' || !team_id.trim()) {
      console.error('[Round1/evaluate] Invalid team_id:', team_id);
      return res.status(401).json({ error: 'Authentication required. Please log in.' });
    }
    
    // CHECK: Prevent submission if round already completed
    const { data: teamData, error: teamError } = await supabaseAdmin
      .from('teams')
      .select('r1_submission_time')
      .eq('team_id', team_id)
      .single();
    
    if (teamError) {
      console.error('[Round1/evaluate] Failed to check team status:', teamError);
      return res.status(500).json({ error: 'Failed to verify team status' });
    }
    
    if (teamData?.r1_submission_time) {
      console.warn(`[Round1/evaluate] BLOCKED: Team ${team_id} already completed Round 1 at ${teamData.r1_submission_time}`);
      return res.status(403).json({ 
        error: 'Round 1 has already been submitted and is locked',
        completed_at: teamData.r1_submission_time
      });
    }
    
    console.log(`[Round1/evaluate] Team ${team_id} submitting answer for question ${question_id}`);
    
    // Store submission in evaluation table for manual admin review
    const { data, error } = await supabaseAdmin
      .from('evaluation')
      .upsert({
        team_id,
        round: 'round1',
        question_id: question_id.toString(),
        raw_answer: typeof user_answer === 'string' ? user_answer : JSON.stringify(user_answer),
        status: 'pending',
        submission_time: new Date().toISOString()
      }, {
        onConflict: 'team_id,round,question_id',
        ignoreDuplicates: false
      })
      .select();
    
    if (error) {
      console.error('[Round1/evaluate] Database error:', error);
      return res.status(500).json({ error: 'Failed to save submission', details: error.message });
    }
    
    if (!data || data.length === 0) {
      console.error('[Round1/evaluate] No data returned from upsert');
      return res.status(500).json({ error: 'Failed to save submission - no data returned' });
    }
    
    console.log(`[Round1/evaluate] Submission saved successfully. Queue ID: ${data[0]?.queue_id}`);
    
    // Return pending status - admin will score later
    res.json({
      success: true,
      status: 'pending',
      message: 'Answer submitted for evaluation',
      queue_id: data[0]?.queue_id
    });
  } catch (error) {
    console.error('[round1/evaluate] Error:', error);
    res.status(500).json({ error: 'Internal server error', details: error instanceof Error ? error.message : 'Unknown error' });
  }
});

// Round 1 - Final submission (only records timestamp, admin will calculate score later)
router.post('/round1/submit', async (req: Request, res: Response) => {
  try {
    const { team_id, submitted_at } = req.body;
    
    console.log('[Round1/submit] Request body:', JSON.stringify(req.body));
    console.log('[Round1/submit] team_id:', team_id, 'type:', typeof team_id);
    
    if (!team_id) {
      return res.status(400).json({ error: 'Missing required field: team_id' });
    }
    
    // CHECK: Prevent duplicate final submission
    const { data: existingTeam, error: checkError } = await supabaseAdmin
      .from('teams')
      .select('r1_submission_time')
      .eq('team_id', team_id)
      .single();
    
    if (checkError) {
      console.error('[Round1/submit] Failed to check team:', checkError);
      return res.status(500).json({ error: 'Failed to verify team status' });
    }
    
    if (existingTeam?.r1_submission_time) {
      console.warn(`[Round1/submit] BLOCKED: Team ${team_id} already submitted Round 1 at ${existingTeam.r1_submission_time}`);
      return res.status(403).json({ 
        error: 'Round 1 has already been submitted and is locked',
        completed_at: existingTeam.r1_submission_time,
        message: 'This round cannot be resubmitted'
      });
    }
    
    const timestamp = submitted_at || new Date().toISOString();
    
    console.log(`[Round1] Team ${team_id} final submission at ${timestamp}`);
    
    // Update teams table with r1_submission_time only (score calculated by admin later)
    const { data, error } = await supabaseAdmin
      .from('teams')
      .update({
        r1_submission_time: timestamp
      })
      .eq('team_id', team_id)
      .select();
    
    if (error) {
      console.error('[Round1 Submit] Database error:', error);
      return res.status(500).json({ 
        error: 'Failed to save submission',
        details: error.message 
      });
    }
    
    if (!data || data.length === 0) {
      console.error(`[Round1] Team ${team_id} not found in database`);
      return res.status(404).json({ error: 'Team not found' });
    }
    
    console.log(`[Round1] Team ${team_id} submission timestamp saved successfully`);
    
    res.json({ 
      success: true, 
      message: 'Round 1 submission recorded. Awaiting admin evaluation.',
      team: data[0]
    });
  } catch (error) {
    console.error('[round1/submit] Error:', error);
    res.status(500).json({ 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

router.post('/round1/analyze', async (req: Request, res: Response) => {
  try {
    // Implement round 1 analysis logic
    res.json({ success: true });
  } catch (error) {
    console.error('[round1/analyze] Error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Round 2 routes - Debugging and Error Identification

// Get Round 2 questions (WITHOUT bug explanations)
router.get('/round2/questions', async (req: Request, res: Response) => {
  try {
    // Return questions WITHOUT bug explanations (security critical)
    const questions = ROUND2_QUESTIONS.map(q => ({
      question_id: q.question_id,
      title: q.title,
      description: q.description,
      code_snippet: q.code_snippet,
      code_snippets: q.code_snippets // Include multi-language support
      // NEVER send bug_explanation or bug_explanations to frontend
    }));
    
    res.json({ questions });
  } catch (error) {
    console.error('[round2/questions] Error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Round 2 - Submit single answer to evaluation queue (manual admin scoring)
router.post('/round2/submit-answer', async (req: Request, res: Response) => {
  try {
    const { team_id, question_id, user_answer, language } = req.body;
    
    if (!team_id || !question_id || user_answer === undefined) {
      return res.status(400).json({ error: 'Missing required fields: team_id, question_id, user_answer' });
    }
    
    // Reject unknown team_id
    if (team_id === 'unknown' || !team_id.trim()) {
      console.error('[Round2/submit-answer] Invalid team_id:', team_id);
      return res.status(401).json({ error: 'Authentication required. Please log in.' });
    }
    
    // CHECK: Prevent submission if round already completed
    const { data: teamData, error: teamError } = await supabaseAdmin
      .from('teams')
      .select('r2_submission_time')
      .eq('team_id', team_id)
      .single();
    
    if (teamError) {
      console.error('[Round2/submit-answer] Failed to check team status:', teamError);
      return res.status(500).json({ error: 'Failed to verify team status' });
    }
    
    if (teamData?.r2_submission_time) {
      console.warn(`[Round2/submit-answer] BLOCKED: Team ${team_id} already completed Round 2 at ${teamData.r2_submission_time}`);
      return res.status(403).json({ 
        error: 'Round 2 has already been submitted and is locked',
        completed_at: teamData.r2_submission_time
      });
    }
    
    console.log(`[Round2/submit-answer] Team ${team_id} submitting answer for question ${question_id}`);
    
    // Find the question to validate it exists
    const question = ROUND2_QUESTIONS.find(q => q.question_id === question_id);
    
    if (!question) {
      return res.status(404).json({ error: 'Question not found' });
    }
    
    // Store submission in evaluation table for manual admin review
    const { data, error } = await supabaseAdmin
      .from('evaluation')
      .upsert({
        team_id,
        round: 'round2',
        question_id: question_id.toString(),
        raw_answer: typeof user_answer === 'string' ? user_answer : JSON.stringify(user_answer),
        status: 'pending',
        submission_time: new Date().toISOString()
      }, {
        onConflict: 'team_id,round,question_id',
        ignoreDuplicates: false
      })
      .select();
    
    if (error) {
      console.error('[Round2/submit-answer] Database error:', error);
      return res.status(500).json({ error: 'Failed to save submission', details: error.message });
    }
    
    console.log(`[Round2/submit-answer] Submission saved successfully. Queue ID: ${data[0]?.queue_id}`);
    
    // Return pending status - admin will score later
    res.json({
      success: true,
      status: 'pending',
      message: 'Answer submitted for evaluation',
      queue_id: data[0]?.queue_id
    });
    
  } catch (error) {
    console.error('[round2/submit-answer] Error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Round 2 - Final submission (only records timestamp, admin will calculate score later)
router.post('/round2/submit', async (req: Request, res: Response) => {
  try {
    const { teamId, submitted_at } = req.body;
    
    console.log('[Round2/submit] Request body:', JSON.stringify(req.body));
    console.log('[Round2/submit] teamId:', teamId, 'type:', typeof teamId);
    
    // Accept either teamId or team_id
    const team_id = teamId || req.body.team_id;
    
    if (!team_id) {
      return res.status(400).json({ error: 'Missing required field: teamId or team_id' });
    }
    
    // CHECK: Prevent duplicate final submission
    const { data: existingTeam, error: checkError } = await supabaseAdmin
      .from('teams')
      .select('r2_submission_time')
      .eq('team_id', team_id)
      .single();
    
    if (checkError) {
      console.error('[Round2/submit] Failed to check team:', checkError);
      return res.status(500).json({ error: 'Failed to verify team status' });
    }
    
    if (existingTeam?.r2_submission_time) {
      console.warn(`[Round2/submit] BLOCKED: Team ${team_id} already submitted Round 2 at ${existingTeam.r2_submission_time}`);
      return res.status(403).json({ 
        error: 'Round 2 has already been submitted and is locked',
        completed_at: existingTeam.r2_submission_time,
        message: 'This round cannot be resubmitted'
      });
    }
    
    const timestamp = submitted_at || new Date().toISOString();
    
    console.log(`[Round2/Submit] Team ${team_id} final submission at ${timestamp}`);
    
    // Update teams table with r2_submission_time only (score calculated by admin later)
    const { data, error } = await supabaseAdmin
      .from('teams')
      .update({
        r2_submission_time: timestamp
      })
      .eq('team_id', team_id)
      .select();
    
    if (error) {
      console.error('[Round2/Submit] Database error:', error);
      return res.status(500).json({ 
        error: 'Failed to save submission',
        details: error.message 
      });
    }
    
    if (!data || data.length === 0) {
      console.error(`[Round2/Submit] Team ${team_id} not found in database`);
      return res.status(404).json({ error: 'Team not found' });
    }
    
    console.log(`[Round2/Submit] Team ${team_id} submission timestamp saved successfully`);
    
    res.json({ 
      success: true,
      message: 'Round 2 submission recorded. Awaiting admin evaluation.',
      team: data[0]
    });
    
  } catch (error) {
    console.error('[round2/submit] Error:', error);
    res.status(500).json({ 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});
    

// ===================================
// EVALUATION APIs
// ===================================

// Get evaluations for a specific team and round (for contestants to see their submissions)
router.get('/evaluations/team/:team_id/round/:round', async (req: Request, res: Response) => {
  try {
    const { team_id, round } = req.params;
    
    const { data, error } = await supabaseAdmin
      .from('evaluation')
      .select('*')
      .eq('team_id', team_id)
      .eq('round', round)
      .order('question_id', { ascending: true });
    
    if (error) {
      console.error('[evaluations/team/:team_id/round/:round] Database error:', error);
      return res.status(500).json({ error: 'Failed to fetch evaluations' });
    }
    
    res.json({ evaluations: data || [] });
  } catch (error) {
    console.error('[evaluations/team/:team_id/round/:round] Error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// ===================================
// ADMIN EVALUATION APIs
// ===================================

// Get evaluations for admin review (with team names)
router.get('/admin/evaluations', async (req: Request, res: Response) => {
  try {
    const { round, team_id, status } = req.query;
    
    // Build query
    let query = supabaseAdmin
      .from('evaluation')
      .select(`
        *,
        teams!inner (
          team_name,
          player1_name,
          player2_name
        )
      `)
      .order('submission_time', { ascending: false });
    
    // Apply filters
    if (round) {
      query = query.eq('round', round);
    }
    if (team_id) {
      query = query.eq('team_id', team_id);
    }
    if (status) {
      query = query.eq('status', status);
    }
    
    const { data, error } = await query;
    
    if (error) {
      console.error('[admin/evaluations] Database error:', error);
      return res.status(500).json({ error: 'Failed to fetch evaluations', details: error.message });
    }
    
    console.log(`[admin/evaluations] Fetched ${data?.length || 0} evaluations`);
    
    res.json({ evaluations: data || [] });
  } catch (error) {
    console.error('[admin/evaluations] Error:', error);
    res.status(500).json({ error: 'Internal server error', details: error instanceof Error ? error.message : 'Unknown error' });
  }
});

// Update individual submission score
router.put('/admin/evaluations/:queue_id', async (req: Request, res: Response) => {
  try {
    const { queue_id } = req.params;
    const { score, feedback } = req.body;
    
    if (score === undefined || score === null) {
      return res.status(400).json({ error: 'Missing required field: score' });
    }
    
    // Validate score is 0-10
    const numericScore = Number(score);
    if (isNaN(numericScore) || numericScore < 0 || numericScore > 10) {
      return res.status(400).json({ error: 'Score must be between 0 and 10' });
    }
    
    console.log(`[admin/evaluations/${queue_id}] Updating score to ${numericScore}`);
    
    // Update the evaluation record
    const { data, error } = await supabaseAdmin
      .from('evaluation')
      .update({
        score: numericScore,
        feedback: feedback || null,
        status: 'completed'
      })
      .eq('queue_id', queue_id)
      .select();
    
    if (error) {
      console.error('[admin/evaluations] Update error:', error);
      return res.status(500).json({ error: 'Failed to update score', details: error.message });
    }
    
    if (!data || data.length === 0) {
      return res.status(404).json({ error: 'Evaluation not found' });
    }
    
    console.log(`[admin/evaluations/${queue_id}] Score updated successfully`);
    
    res.json({ success: true, evaluation: data[0] });
  } catch (error) {
    console.error('[admin/evaluations/:queue_id] Error:', error);
    res.status(500).json({ error: 'Internal server error', details: error instanceof Error ? error.message : 'Unknown error' });
  }
});

// Finalize team score (sum all completed evaluations and update teams table)
router.post('/admin/teams/:team_id/round/:round/finalize', async (req: Request, res: Response) => {
  try {
    const { team_id, round } = req.params;
    
    console.log(`[admin/finalize] Finalizing ${round} score for team ${team_id}`);
    
    // Validate round
    if (round !== 'round1' && round !== 'round2') {
      return res.status(400).json({ error: 'Invalid round. Must be round1 or round2' });
    }
    
    // Get all evaluations for this team/round
    const { data: evaluations, error: fetchError } = await supabaseAdmin
      .from('evaluation')
      .select('*')
      .eq('team_id', team_id)
      .eq('round', round);
    
    if (fetchError) {
      console.error('[admin/finalize] Fetch error:', fetchError);
      return res.status(500).json({ error: 'Failed to fetch evaluations', details: fetchError.message });
    }
    
    if (!evaluations || evaluations.length === 0) {
      return res.status(404).json({ error: 'No evaluations found for this team/round' });
    }
    
    // Get completed evaluations (no longer require all 10 to be completed)
    const completedEvaluations = evaluations.filter(e => e.status === 'completed');
    
    // Sum all scores
    const totalScore = completedEvaluations.reduce((sum, e) => sum + (e.score || 0), 0);
    
    console.log(`[admin/finalize] Total score: ${totalScore} (from ${completedEvaluations.length} questions)`);
    
    // Update teams table - use RPC to bypass trigger locks for admin manual scoring
    const scoreColumn = round === 'round1' ? 'r1_score' : 'r2_score';
    
    // Try direct update with service role key (should bypass RLS)
    console.log('[admin/finalize] Attempting direct update with service role...');
    const { data: directData, error: directError } = await supabaseAdmin
      .from('teams')
      .update({
        [scoreColumn]: totalScore
      })
      .eq('team_id', team_id)
      .select();
    
    if (directError) {
      console.error('[admin/finalize] Direct update error:', directError);
      
      // If it's a trigger/constraint error, provide instructions
      if (directError.code === 'P0001' || directError.message?.includes('locked')) {
        return res.status(500).json({ 
          error: 'Database trigger is blocking the update. Admin score updates should bypass round locks.',
          details: directError.message,
          instruction: 'The database trigger needs to be modified to allow admin updates. Contact the database administrator.'
        });
      }
      
      return res.status(500).json({ 
        error: 'Failed to update team score', 
        details: directError.message 
      });
    }
    
    if (!directData || directData.length === 0) {
      return res.status(404).json({ error: 'Team not found' });
    }
    
    // Invalidate leaderboard cache
    const { leaderboardCache } = await import('../lib/cache/leaderboard-cache');
    leaderboardCache.invalidateAll();
    
    console.log(`[admin/finalize] Score finalized successfully. Team ${team_id} ${round} score: ${totalScore}`);
    
    res.json({ 
      success: true, 
      message: `${round} score finalized`,
      total_score: totalScore,
      team: directData[0]
    });
  } catch (error) {
    console.error('[admin/finalize] Error:', error);
    res.status(500).json({ error: 'Internal server error', details: error instanceof Error ? error.message : 'Unknown error' });
  }
});

// Get evaluations for a specific team (for contestants to view their scores)
router.get('/contest/evaluations/team/:team_id/round/:round', async (req: Request, res: Response) => {
  try {
    const { team_id, round } = req.params;
    
    // Fetch evaluations for this team/round
    const { data, error } = await supabaseAdmin
      .from('evaluation')
      .select('queue_id, question_id, status, score, submission_time')
      .eq('team_id', team_id)
      .eq('round', round)
      .order('question_id', { ascending: true });
    
    if (error) {
      console.error('[contest/evaluations] Database error:', error);
      return res.status(500).json({ error: 'Failed to fetch evaluations', details: error.message });
    }
    
    console.log(`[contest/evaluations] Fetched ${data?.length || 0} evaluations for team ${team_id} ${round}`);
    
    res.json({ evaluations: data || [] });
  } catch (error) {
    console.error('[contest/evaluations] Error:', error);
    res.status(500).json({ error: 'Internal server error', details: error instanceof Error ? error.message : 'Unknown error' });
  }
});

// ===================================
// Round 3 routes
// ===================================

// Get Round 3 questions (without solutions)
router.get('/round3/questions', async (req: Request, res: Response) => {
  try {
    const questions = await getRoundQuestions('round3');
    
    // Return questions without solutions
    const publicQuestions = questions.map((q: RoundQuestion) => ({
      id: q.id,
      title: q.title,
      prompt: q.prompt,
      difficulty: q.difficulty,
      points: q.points,
      timeLimit: q.timeLimit,
      tags: q.tags,
      referenceNotes: q.referenceNotes
    }));
    
    res.json({ questions: publicQuestions });
  } catch (error) {
    console.error('[round3/questions] Error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get Round 3 score for a specific team and question
router.get('/round3/score', async (req: Request, res: Response) => {
  try {
    const { team_id, question_id } = req.query;

    if (!team_id || !question_id) {
      return res.status(400).json({ error: 'Missing team_id or question_id' });
    }

    // Map question_id to column name (e.g., round3_1 -> round3_q1_score)
    const questionNumber = question_id.toString().split('_')[1];
    const scoreColumn = `round3_q${questionNumber}_score`;

    const { data: teamData, error: teamError } = await supabaseAdmin
      .from('teams')
      .select(scoreColumn)
      .eq('team_id', team_id)
      .single();

    if (teamError || !teamData) {
      return res.status(404).json({ error: 'Team not found' });
    }

    const score = (teamData as any)[scoreColumn];
    res.json({ score: score || null });
  } catch (error) {
    console.error('[round3/score] Error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Submit and evaluate Round 3 competitive programming answer
router.post('/round3/submit', async (req: Request, res: Response) => {
  try {
    const { team_id, question_id, answer } = req.body;
    
    console.log('[Round3 Submit] Request received:', {
      team_id,
      question_id,
      answer: answer ? `${answer.substring(0, 50)}...` : answer,
      hasTeamId: !!team_id,
      hasQuestionId: !!question_id,
      hasAnswer: answer !== undefined
    });
    
    // Validate required fields
    if (!team_id || !question_id || answer === undefined) {
      console.error('[Round3 Submit] Validation failed:', { team_id, question_id, answer: answer !== undefined });
      return res.status(400).json({ 
        error: 'Missing required fields: team_id, question_id, and answer',
        received: { team_id: !!team_id, question_id: !!question_id, answer: answer !== undefined }
      });
    }

    console.log(`[Round3 Submit] Team: ${team_id}, Question: ${question_id}`);

    // Map question_id to database columns and shared question ID
    let mapping: QuestionMapping;
    try {
      mapping = getQuestionMapping(question_id);
      console.log('[Round3 Submit] Question mapping:', mapping);
    } catch (error) {
      console.error('[Round3 Submit] Invalid question_id:', question_id, error);
      return res.status(400).json({ 
        error: error instanceof Error ? error.message : 'Invalid question_id',
        received_question_id: question_id,
        valid_question_ids: ['round3_1', 'round3_2', 'round3_3']
      });
    }

    const { sharedQuestionId, scoreColumn, timestampColumn } = mapping;

    // Verify team exists and get existing score
    const { data: teamData, error: teamError } = await supabaseAdmin
      .from('teams')
      .select('team_id, team_name, round3_1_score, round3_2_score, round3_3_score')
      .eq('team_id', team_id)
      .single();

    if (teamError || !teamData) {
      console.error('[Round3 Submit] Team not found:', teamError);
      return res.status(404).json({ error: 'Team not found' });
    }

    const existingScore = teamData[scoreColumn] as number | null;
    console.log(`[Round3 Submit] Existing score for ${question_id}:`, existingScore);

    // Fetch question details from shared package
    const question = await getQuestionDetails('round3', sharedQuestionId);
    
    if (!question) {
      console.error('[Round3 Submit] Question not found:', sharedQuestionId);
      return res.status(500).json({ error: 'Question configuration error' });
    }

    console.log(`[Round3 Submit] Evaluating question: ${question.title}`);

    // Evaluate answer using Gemini
    const evaluationResult = await evaluateRound3Answer(
      question.title,
      question.prompt,
      answer,
      sharedQuestionId
    );

    const newScore = evaluationResult.score;

    console.log(`[Round3 Submit] Evaluation complete:`, {
      newScore,
      existingScore,
      improvement: newScore > (existingScore || 0)
    });

    // Check score improvement rule
    if (existingScore !== null && newScore <= existingScore) {
      console.log(`[Round3 Submit] Score did not improve. Rejecting submission.`);
      return res.status(400).json({
        error: 'Score must improve',
        message: 'Your new score must be higher than your previous score to be saved.',
        score: existingScore,
        newScore: newScore,
        improved: false,
        previousScore: existingScore,
        analysis: evaluationResult.analysis
      });
    }

    // Update team with new score and timestamp
    const updateData: Record<string, any> = {
      [scoreColumn]: newScore,
      [timestampColumn]: new Date().toISOString()
    };

    const { data: updateResult, error: updateError } = await supabaseAdmin
      .from('teams')
      .update(updateData)
      .eq('team_id', team_id)
      .select();

    if (updateError) {
      console.error('[Round3 Submit] Database update error:', updateError);
      return res.status(500).json({ 
        error: 'Failed to save score',
        details: updateError.message 
      });
    }
    
    // Invalidate leaderboard cache (trigger will auto-update ranks)
    const { leaderboardCache } = await import('../lib/cache/leaderboard-cache');
    leaderboardCache.invalidateAll();

    console.log(`[Round3 Submit] ✅ Score saved successfully:`, {
      team_id,
      question_id,
      score: newScore,
      previousScore: existingScore
    });

    // Log detailed evaluation for audit
    console.log(`[Round3 Evaluation Details]`, {
      team_id,
      team_name: teamData.team_name,
      question_id,
      question_title: question.title,
      score: newScore,
      previousScore: existingScore,
      improved: true,
      details: evaluationResult.details,
      timestamp: new Date().toISOString()
    });

    // Return success response
    res.json({
      success: true,
      score: newScore,
      analysis: evaluationResult.analysis,
      improved: true,
      previousScore: existingScore,
      details: evaluationResult.details
    });

  } catch (error) {
    console.error('[round3/submit] Error:', error);
    res.status(500).json({ 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Submit duel answer (legacy endpoint - keeping for backward compatibility)
router.post('/round3/submit-duel', async (req: Request, res: Response) => {
  try {
    const { duel_id, team_id, answer, question_id } = req.body;
    
    if (!duel_id || !team_id || !answer || !question_id) {
      return res.status(400).json({ error: 'Missing required fields' });
    }
    
    console.log(`[Round3 Submit] Duel ${duel_id}, Team ${team_id}`);
    
    // Store the submission
    // In a real implementation, this would save to a round3_submissions table
    // For now, return success with the submission data
    const submission = {
      id: `sub-${Date.now()}`,
      duel_id,
      team_id,
      answer,
      question_id,
      submitted_at: new Date().toISOString()
    };
    
    res.json({ 
      success: true,
      submission,
      message: 'Round 3 submission recorded'
    });
  } catch (error) {
    console.error('[round3/submit] Error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Judge a duel between two teams
router.post('/round3/judge', async (req: Request, res: Response) => {
  try {
    const { duel_id, question, solution_a, solution_b, team_a_id, team_b_id } = req.body;
    
    if (!duel_id || !question || !solution_a || !solution_b) {
      return res.status(400).json({ error: 'Missing required fields' });
    }
    
    console.log(`[Round3 Judge] Duel ${duel_id}`);
    console.log(`  Team A (${team_a_id}): ${solution_a.substring(0, 100)}...`);
    console.log(`  Team B (${team_b_id}): ${solution_b.substring(0, 100)}...`);
    
    // Evaluate both solutions
    // This is a simplified version - in production, use Gemini/Grok API
    const judgment = {
      winner: determineWinner(solution_a, solution_b),
      confidence: 'high',
      reason: 'Solution comparison completed',
      scores: {
        A: { correct: true, clarity: 4, steps: 4 },
        B: { correct: true, clarity: 3, steps: 3 }
      }
    };
    
    console.log(`[Round3 Judge] Winner: ${judgment.winner}`);
    
    res.json({ 
      success: true,
      duel_id,
      judgment,
      winner_team_id: judgment.winner === 'A' ? team_a_id : team_b_id
    });
  } catch (error) {
    console.error('[round3/judge] Error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Helper function for simple winner determination
function determineWinner(solutionA: string, solutionB: string): 'A' | 'B' | 'rematch' {
  // Simplified logic - in production, use AI evaluation
  const lengthA = solutionA.trim().length;
  const lengthB = solutionB.trim().length;
  
  if (Math.abs(lengthA - lengthB) < 10) {
    return 'rematch'; // Too close
  }
  
  return lengthA > lengthB ? 'A' : 'B';
}

// Get Round 3 bracket status and progression
router.get('/round3/bracket', async (req: Request, res: Response) => {
  try {
    // Get top 8 teams for bracket seeding
    const round3Rankings = await getRankings(3);
    const topEight = round3Rankings.filter(team => (team as any).qualified).slice(0, 8);
    
    if (topEight.length < 8) {
      return res.status(400).json({ 
        error: 'Not enough qualified teams',
        message: 'Need at least 8 teams to start Round 3 bracket',
        currentCount: topEight.length
      });
    }
    
    // Generate bracket structure
    const bracket = {
      quarterFinals: [
        { id: 'qf1', seed1: 1, seed2: 8, team1: topEight[0], team2: topEight[7], winner: null },
        { id: 'qf2', seed1: 4, seed2: 5, team1: topEight[3], team2: topEight[4], winner: null },
        { id: 'qf3', seed1: 2, seed2: 7, team1: topEight[1], team2: topEight[6], winner: null },
        { id: 'qf4', seed1: 3, seed2: 6, team1: topEight[2], team2: topEight[5], winner: null },
      ],
      semiFinals: [
        { id: 'sf1', team1: null, team2: null, winner: null }, // Winner of qf1 vs qf2
        { id: 'sf2', team1: null, team2: null, winner: null }, // Winner of qf3 vs qf4
      ],
      final: { id: 'final', team1: null, team2: null, winner: null },
    };
    
    res.json({ success: true, bracket, topEight });
  } catch (error) {
    console.error('[round3/bracket] Error:', error);
    res.status(500).json({ error: 'Failed to generate bracket' });
  }
});

// Update bracket with duel result
router.post('/round3/bracket/update', async (req: Request, res: Response) => {
  try {
    const { duel_id, winner_team_id, stage } = req.body;
    
    if (!duel_id || !winner_team_id || !stage) {
      return res.status(400).json({ error: 'Missing required fields' });
    }
    
    console.log(`[Round3 Bracket] ${stage} - Duel ${duel_id}: Winner ${winner_team_id}`);
    
    // In a real implementation, this would:
    // 1. Store the result in database
    // 2. Progress winner to next round
    // 3. Update bracket state
    
    res.json({ 
      success: true,
      message: 'Bracket updated',
      next_stage: stage === 'quarterFinal' ? 'semiFinal' : stage === 'semiFinal' ? 'final' : 'complete'
    });
  } catch (error) {
    console.error('[round3/bracket/update] Error:', error);
    res.status(500).json({ error: 'Failed to update bracket' });
  }
});

// Admin route to clear Round 2 data
router.post('/admin/clear-round2', async (req: Request, res: Response) => {
  try {
    console.log('[admin/clear-round2] Clearing all Round 2 submissions...');
    const result = await db.clearAllRound2Submissions();
    console.log(`[admin/clear-round2] Cleared ${result.count} submissions`);
    res.json({ 
      success: true, 
      message: `Cleared ${result.count} Round 2 submissions`,
      count: result.count 
    });
  } catch (error) {
    console.error('[admin/clear-round2] Error:', error);
    res.status(500).json({ 
      error: 'Failed to clear Round 2 data',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Get team data including round completion status
router.get('/teams/:team_id', async (req: Request, res: Response) => {
  try {
    const { team_id } = req.params;
    
    const { data, error } = await supabaseAdmin
      .from('teams')
      .select('team_id, team_name, r1_submission_time, r2_submission_time, r1_score, r2_score')
      .eq('team_id', team_id)
      .single();
    
    if (error) {
      console.error('[teams/:team_id] Database error:', error);
      return res.status(500).json({ error: 'Failed to fetch team data' });
    }
    
    if (!data) {
      return res.status(404).json({ error: 'Team not found' });
    }
    
    res.json({ team: data });
  } catch (error) {
    console.error('[teams/:team_id] Error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
