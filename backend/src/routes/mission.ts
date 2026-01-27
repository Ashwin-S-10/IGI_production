import { Router, Request, Response } from 'express';

const router = Router();

// GET /api/mission/tasks
router.get('/tasks', async (req: Request, res: Response) => {
  try {
    // Return mission tasks
    res.json({ tasks: [] });
  } catch (error) {
    console.error('[mission/tasks] Error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
