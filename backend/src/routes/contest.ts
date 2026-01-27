import { Router, Request, Response } from 'express';
import { db } from '../lib/supabase/database';
import { supabaseAdmin } from '../lib/supabase/server';
import { ROUND1_QUESTIONS } from '../data/round1-questions';
import { ROUND2_QUESTIONS } from '../data/round2-questions';
import { scoreDebuggingAnswerWithGemini } from '../lib/gemini/round2-scoring';
import { evaluateAnswerController } from '../lib/gemini/evaluationController';
import { getRankings } from '../lib/supabase/teams-service';
import { evaluateRound3Answer } from '../lib/gemini/round3-evaluation';

// Round 3 question bank - imported dynamically to avoid build issues
type RoundQuestion = {
  id: string;
  roundId: "round1" | "round2" | "round3";
  title: string;
  prompt: string;
  difficulty: "intro" | "standard" | "advanced";
  points: number;
  timeLimit: string;
  tags: string[];
  starterCode?: string;
  referenceNotes?: string;
};

async function getQuestionDetails(roundId: string, questionId: string): Promise<RoundQuestion | null> {
  const { getQuestionDetails: getDetails } = await import('@project/shared');
  return getDetails(roundId, questionId);
}

async function getRoundQuestions(roundId: string): Promise<RoundQuestion[]> {
  const { getRoundQuestions: getQuestions } = await import('@project/shared');
  return getQuestions(roundId);
}

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

// Round 1 - Evaluate answer with Gemini (returns score + analysis)
router.post('/round1/evaluate', evaluateAnswerController);

// Round 1 - Final submission with total score
router.post('/round1/submit', async (req: Request, res: Response) => {
  try {
    const { team_id, round_id, total_score, submitted_at } = req.body;
    
    console.log('[Round1/submit] Request body:', JSON.stringify(req.body));
    console.log('[Round1/submit] team_id:', team_id, 'type:', typeof team_id);
    
    if (!team_id || total_score === undefined || total_score === null) {
      return res.status(400).json({ error: 'Missing required fields: team_id and total_score' });
    }
    
    console.log(`[Round1] Team ${team_id} submitted with score: ${total_score} at ${submitted_at}`);
    
    // Validate score is within 0-100 range (do NOT transform the score)
    const finalScore = Math.round(total_score);
    if (finalScore < 0 || finalScore > 100) {
      console.error(`[Round1] Invalid score ${finalScore} - must be between 0-100`);
      return res.status(400).json({ error: 'Invalid score - must be between 0 and 100' });
    }
    
    const timestamp = submitted_at || new Date().toISOString();
    
    // Update teams table with r1_score and r1_submission_time
    const { data, error } = await supabaseAdmin
      .from('teams')
      .update({
        r1_score: finalScore,
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
    
    // Invalidate leaderboard cache (trigger will auto-update ranks)
    const { leaderboardCache } = await import('../lib/cache/leaderboard-cache');
    leaderboardCache.invalidateAll();
    
    console.log(`[Round1] Team ${team_id} submission saved successfully. Score: ${finalScore}, Data:`, data[0]);
    
    res.json({ 
      success: true, 
      message: 'Round 1 submission recorded',
      score: finalScore,
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

// Round 2 - Submit single answer for scoring
router.post('/round2/submit-answer', async (req: Request, res: Response) => {
  try {
    const { question_id, user_answer, language } = req.body;
    
    if (!question_id || user_answer === undefined) {
      return res.status(400).json({ error: 'Missing question_id or user_answer' });
    }
    
    // Find the question (no bug explanation needed - Gemini will find bugs)
    const question = ROUND2_QUESTIONS.find(q => q.question_id === question_id);
    
    if (!question) {
      return res.status(404).json({ error: 'Question not found' });
    }
    
    // Get the code snippet for the selected language
    const selectedLanguage = language || 'python';
    let codeSnippet = question.code_snippet;
    
    // If multi-language support exists, use the appropriate version
    if (question.code_snippets && (question.code_snippets as any)[selectedLanguage]) {
      codeSnippet = (question.code_snippets as any)[selectedLanguage];
    }
    
    // Score using Gemini AI (Gemini analyzes code and finds bugs independently)
    const evaluationResult = await scoreDebuggingAnswerWithGemini(
      question.title,
      question.description,
      codeSnippet,
      user_answer,
      selectedLanguage
    );
    
    // Return detailed evaluation result (but NOT the bug explanation)
    res.json({
      score: evaluationResult.score,
      identifiedErrors: evaluationResult.identifiedErrors,
      analysis: evaluationResult.analysis,
      reason: evaluationResult.reason
    });
    
  } catch (error) {
    console.error('[round2/submit-answer] Error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Round 2 - Final submission with total score
router.post('/round2/submit', async (req: Request, res: Response) => {
  try {
    const { teamId, total_score, submitted_at } = req.body;
    
    console.log('[Round2/submit] Request body:', JSON.stringify(req.body));
    console.log('[Round2/submit] teamId:', teamId, 'type:', typeof teamId);
    console.log('[Round2/submit] total_score:', total_score, 'type:', typeof total_score);
    
    // Accept either teamId or team_id
    const team_id = teamId || req.body.team_id;
    
    if (!team_id) {
      return res.status(400).json({ error: 'Missing required field: teamId or team_id' });
    }
    
    if (total_score === undefined || total_score === null) {
      return res.status(400).json({ error: 'Missing required field: total_score' });
    }
    
    // Validate score is within 0-100 range (do NOT transform the score)
    const finalScore = Math.round(total_score);
    if (finalScore < 0 || finalScore > 100) {
      console.error(`[Round2] Invalid score ${finalScore} - must be between 0-100`);
      return res.status(400).json({ error: 'Invalid score - must be between 0 and 100' });
    }
    
    const timestamp = submitted_at || new Date().toISOString();
    
    console.log(`[Round2/Submit] Team ${team_id} submitting Round 2 with score: ${finalScore}`);
    
    // Update teams table with r2_score and r2_submission_time
    const { data, error } = await supabaseAdmin
      .from('teams')
      .update({
        r2_score: finalScore,
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
    
    // Invalidate leaderboard cache (trigger will auto-update ranks)
    const { leaderboardCache } = await import('../lib/cache/leaderboard-cache');
    leaderboardCache.invalidateAll();
    
    console.log(`[Round2/Submit] Team ${team_id} submission saved. Score: ${finalScore}. Updated team:`, data[0]);
    
    // Get team rankings
    const rankings = await getRankings(2);
    const teamRanking = rankings.find(t => t.team_id === team_id);
    const placement = teamRanking?.rank || null;
    
    // Determine qualification (top 50% advances to Round 3)
    const totalTeams = rankings.length;
    const qualified = placement ? placement <= Math.ceil(totalTeams / 2) : false;
    
    res.json({ 
      success: true,
      totalScore: finalScore,
      placement,
      qualified,
      evaluations: [],
      message: 'Round 2 submission recorded'
    });
    
  } catch (error) {
    console.error('[round2/submit] Error:', error);
    res.status(500).json({ 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});
    

// Round 3 routes
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

export default router;
