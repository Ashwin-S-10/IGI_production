import { Router, Request, Response } from 'express';
import { scryptSync, timingSafeEqual } from 'crypto';
import { Buffer } from 'node:buffer';
import { USERS, type LocalUserRecord } from '../data/users';
import { loginTeam } from '../lib/supabase/teams-service';

const router = Router();

type AuthUser = {
  email: string;
  role: string;
  teamId?: string;
  displayName: string;
};

// In-memory session storage (replace with Redis/database in production)
const sessions = new Map<string, AuthUser>();

function generateSessionId(): string {
  return Math.random().toString(36).substring(2) + Date.now().toString(36);
}

function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

function verifyPassword(password: string, userRecord: LocalUserRecord): boolean {
  try {
    const derived = scryptSync(password, userRecord.passwordSalt, 64);
    const stored = Buffer.from(userRecord.passwordHash, 'hex');
    if (stored.byteLength !== derived.byteLength) {
      return false;
    }
    return timingSafeEqual(stored, derived);
  } catch {
    return false;
  }
}

// POST /api/auth/commander-login
router.post('/commander-login', async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Missing credentials' });
    }

    // Hardcoded commander credentials
    const COMMANDER_EMAIL = 'agentalpha@foss.ops';
    const COMMANDER_PASSWORD = '192837';

    if (normalizeEmail(email) !== normalizeEmail(COMMANDER_EMAIL) || password !== COMMANDER_PASSWORD) {
      return res.status(401).json({ error: 'Invalid commander credentials' });
    }

    const sessionUser: AuthUser = {
      email: COMMANDER_EMAIL,
      role: 'admin',
      displayName: 'Commander Alpha',
    };

    const sessionId = generateSessionId();
    sessions.set(sessionId, sessionUser);

    res.json({
      success: true,
      user: sessionUser,
      sessionId,
    });
  } catch (error) {
    console.error('[auth/commander-login] error', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// POST /api/auth/login (Soldier/Team login only)
router.post('/login', async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Missing credentials' });
    }

    // Check if it's a team login (ends with @igifosscit)
    if (email.toLowerCase().endsWith('@igifosscit')) {
      try {
        const team = await loginTeam(email, password);
        
        const sessionUser: AuthUser = {
          email: team.team_name,
          role: 'team',
          teamId: team.team_id,
          displayName: team.team_name,
        };

        const sessionId = generateSessionId();
        sessions.set(sessionId, sessionUser);

        return res.json({
          success: true,
          user: sessionUser,
          sessionId,
        });
      } catch (error: any) {
        console.error('[auth/login] Team login error:', error);
        return res.status(401).json({ error: error.message || 'Invalid team credentials' });
      }
    }

    // Soldier login (existing logic, excluding commander)
    const userRecord = USERS.find(
      (candidate) => normalizeEmail(candidate.email) === normalizeEmail(email) && candidate.role !== 'admin'
    );
    
    if (!userRecord || !verifyPassword(password, userRecord)) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    const sessionUser: AuthUser = {
      email: userRecord.email,
      role: userRecord.role,
      teamId: userRecord.teamId,
      displayName: userRecord.displayName || userRecord.email,
    };

    const sessionId = generateSessionId();
    sessions.set(sessionId, sessionUser);

    res.json({
      success: true,
      user: sessionUser,
      sessionId,
    });
  } catch (error) {
    console.error('[auth/login] error', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// GET /api/auth/session
router.get('/session', (req: Request, res: Response) => {
  try {
    const sessionId = req.headers['x-session-id'] as string | undefined;
    
    if (!sessionId) {
      return res.json({ user: null });
    }

    const user = sessions.get(sessionId);
    
    if (!user) {
      return res.json({ user: null });
    }

    res.json({ user });
  } catch (error) {
    console.error('[Auth Session] Error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /api/auth/logout
router.post('/logout', (req: Request, res: Response) => {
  try {
    const sessionId = req.headers['x-session-id'] as string | undefined;
    
    if (sessionId) {
      sessions.delete(sessionId);
    }
    
    res.json({ success: true });
  } catch (error) {
    console.error('[Auth Logout] Error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
