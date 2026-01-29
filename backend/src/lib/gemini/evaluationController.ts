/**
 * Evaluation Controller
 * Handles Gemini-based answer evaluation
 */

import { Request, Response } from 'express';
import { evaluateAnswer } from './evaluateService';

export async function evaluateAnswerController(req: Request, res: Response): Promise<void> {
  try {
    // Validate request body
    const { user_id, question, user_answer } = req.body;

    if (!question || typeof question !== 'string') {
      res.status(400).json({
        error: 'Invalid request',
        message: 'question is required and must be a string'
      });
      return;
    }

    if (!user_answer || typeof user_answer !== 'string') {
      res.status(400).json({
        error: 'Invalid request',
        message: 'user_answer is required and must be a string'
      });
      return;
    }

    console.log('[Evaluation] Processing request for user:', user_id || 'unknown');
    console.log('[Evaluation] Question length:', question.length);
    console.log('[Evaluation] Answer length:', user_answer.length);

    // Call evaluation service
    const result = await evaluateAnswer(question, user_answer);

    // Return result
    res.json({
      score: result.score,
      analysis: result.analysis
    });

  } catch (error: any) {
    console.error('[Evaluation] Controller error:', error);

    // Handle specific error types
    if (error.message?.includes('GOOGLE_API_KEY')) {
      res.status(500).json({
        error: 'Configuration error',
        message: 'Gemini API key not configured. Please contact administrator.'
      });
      return;
    }

    if (error.status === 404) {
      res.status(502).json({
        error: 'Service error',
        message: 'Gemini model not available. Please try again later.'
      });
      return;
    }

    if (error.status === 429) {
      res.status(502).json({
        error: 'Service error',
        message: 'Evaluation service temporarily unavailable due to rate limits. Please try again in a few moments.'
      });
      return;
    }

    if (error.status === 403 || error.message?.includes('403') || error.message?.includes('leaked')) {
      res.status(502).json({
        error: 'Service error',
        message: 'Evaluation service temporarily unavailable. Please try again.'
      });
      return;
    }

    // Generic error
    res.status(502).json({
      error: 'Service error',
      message: 'Failed to evaluate answer. Please try again.'
    });
  }
}
