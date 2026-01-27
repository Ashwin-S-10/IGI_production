import { Router, Request, Response } from 'express';
import {
  getAllTeams,
  createTeam,
  loginTeam,
  submitRoundScore,
  getRankings,
  getTeamWithRanks,
} from '../lib/supabase/teams-service';

const router = Router();

/**
 * GET /api/teams/admin/teams
 * Admin-only: Get all teams with credentials
 */
router.get('/admin/teams', async (req: Request, res: Response) => {
  try {
    const teams = await getAllTeams();

    res.status(200).json({
      success: true,
      data: teams,
    });
  } catch (error: any) {
    console.error('Error fetching all teams:', error);
    
    // Return more helpful error message
    const isNetworkError = error.message?.includes('Cannot connect to Supabase') || 
                          error.message?.includes('fetch failed') ||
                          error.message?.includes('ENOTFOUND');
    
    res.status(isNetworkError ? 503 : 500).json({
      error: isNetworkError ? 'Database connection failed' : 'Failed to fetch teams',
      message: error.message,
      details: isNetworkError ? 'Cannot reach Supabase database. Check network connection and Supabase URL.' : undefined
    });
  }
});

/**
 * POST /api/teams/admin/create
 * Admin-only: Create a new team
 */
router.post('/admin/create', async (req: Request, res: Response) => {
  try {
    const { team_name, player1_name, player2_name, phone_no } = req.body;

    // Validate required fields
    if (!team_name || !player1_name || !player2_name || !phone_no) {
      return res.status(400).json({
        error: 'Missing required fields',
        required: ['team_name', 'player1_name', 'player2_name', 'phone_no'],
      });
    }

    const result = await createTeam({
      team_name,
      player1_name,
      player2_name,
      phone_no,
    });

    res.status(201).json({
      success: true,
      message: 'Team created successfully',
      data: result,
    });
  } catch (error: any) {
    console.error('Error creating team:', error);
    
    // Handle duplicate key errors
    if (error.message.includes('duplicate') || error.message.includes('unique')) {
      return res.status(409).json({
        error: 'Team ID or Team Name already exists',
      });
    }

    res.status(500).json({
      error: 'Failed to create team',
      message: error.message,
    });
  }
});

/**
 * POST /api/teams/login
 * Team login
 */
router.post('/login', async (req: Request, res: Response) => {
  try {
    const { team_name, password } = req.body;

    // Validate required fields
    if (!team_name || !password) {
      return res.status(400).json({
        error: 'Missing required fields',
        required: ['team_name', 'password'],
      });
    }

    const result = await loginTeam(team_name, password);

    res.status(200).json({
      success: true,
      message: 'Login successful',
      data: result,
    });
  } catch (error: any) {
    console.error('Error logging in:', error);
    res.status(401).json({
      error: error.message || 'Invalid credentials',
    });
  }
});

/**
 * POST /api/teams/round/submit
 * Submit round score
 */
router.post('/round/submit', async (req: Request, res: Response) => {
  try {
    const { team_id, round_number, total_score } = req.body;

    // Validate required fields
    if (!team_id || !round_number || total_score === undefined) {
      return res.status(400).json({
        error: 'Missing required fields',
        required: ['team_id', 'round_number', 'total_score'],
      });
    }

    // Validate round number
    if (round_number !== 1 && round_number !== 2) {
      return res.status(400).json({
        error: 'Invalid round number. Must be 1 or 2',
      });
    }

    const result = await submitRoundScore(team_id, round_number, total_score);

    res.status(200).json({
      success: true,
      message: `Round ${round_number} score submitted successfully`,
      data: result,
    });
  } catch (error: any) {
    console.error('Error submitting score:', error);
    
    if (error.message.includes('already submitted')) {
      return res.status(409).json({
        error: error.message,
      });
    }

    if (error.message.includes('Score must be')) {
      return res.status(400).json({
        error: error.message,
      });
    }

    res.status(500).json({
      error: 'Failed to submit score',
      message: error.message,
    });
  }
});

/**
 * GET /api/teams/rankings?round=1|2|3
 * Get rankings for a specific round
 */
router.get('/rankings', async (req: Request, res: Response) => {
  try {
    const round = req.query.round;

    // Validate round parameter
    if (!round || (round !== '1' && round !== '2' && round !== '3')) {
      return res.status(400).json({
        error: 'Invalid or missing round parameter. Must be 1, 2, or 3',
      });
    }

    const roundNumber = parseInt(round as string, 10) as 1 | 2 | 3;
    const rankings = await getRankings(roundNumber);

    res.status(200).json({
      success: true,
      round: roundNumber,
      data: rankings,
    });
  } catch (error: any) {
    console.error('Error fetching rankings:', error);
    res.status(500).json({
      error: 'Failed to fetch rankings',
      message: error.message,
    });
  }
});

/**
 * GET /api/teams/:team_id
 * Get team details with ranks
 */
router.get('/:team_id', async (req: Request, res: Response) => {
  try {
    const { team_id } = req.params;

    if (!team_id) {
      return res.status(400).json({
        error: 'Missing team_id parameter',
      });
    }

    const result = await getTeamWithRanks(team_id);

    res.status(200).json({
      success: true,
      data: result,
    });
  } catch (error: any) {
    console.error('Error fetching team:', error);
    
    if (error.message.includes('not found')) {
      return res.status(404).json({
        error: error.message,
      });
    }

    res.status(500).json({
      error: 'Failed to fetch team details',
      message: error.message,
    });
  }
});

/**
 * POST /api/teams/admin/recalculate-ranks
 * Admin-only: Manually trigger leaderboard rank recalculation
 */
router.post('/admin/recalculate-ranks', async (req: Request, res: Response) => {
  try {
    console.log('[Recalculate Ranks] Starting rank recalculation...');
    
    const { supabaseAdmin } = await import('../lib/supabase/server');
    const { leaderboardCache } = await import('../lib/cache/leaderboard-cache');
    
    // Execute the rank calculation function
    console.log('[Recalculate Ranks] Calling calculate_team_ranks RPC...');
    const { data, error } = await supabaseAdmin.rpc('calculate_team_ranks');
    
    if (error) {
      console.error('[Recalculate Ranks] Error calculating team ranks:', error);
      return res.status(500).json({
        success: false,
        error: 'Failed to calculate ranks',
        message: error.message,
      });
    }
    
    console.log('[Recalculate Ranks] RPC executed successfully:', data);
    
    // Invalidate all cached leaderboard data
    leaderboardCache.invalidateAll();
    console.log('[Recalculate Ranks] Cache invalidated');
    
    return res.status(200).json({
      success: true,
      message: 'Leaderboard updated successfully',
    });
  } catch (error: any) {
    console.error('[Recalculate Ranks] Unexpected error:', error);
    
    return res.status(500).json({
      success: false,
      error: 'Failed to recalculate ranks',
      message: error?.message || 'Unknown error',
    });
  }
});

export default router;
