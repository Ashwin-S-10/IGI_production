/**
 * Gemini AI-based answer evaluation using direct HTTP API
 * Scores user answers without external SDK dependencies
 */

import { callGeminiWithFallback, getApiKeyCount } from './api-keys';

const GEMINI_API_ENDPOINT = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent';

interface GeminiRequest {
  contents: {
    parts: { text: string }[];
  }[];
}

interface GeminiResponse {
  candidates?: {
    content: {
      parts: { text: string }[];
    };
  }[];
}

/**
 * Evaluate answer and return score (0-10)
 */
export async function scoreAnswerWithGemini(
  question: string,
  expectedAnswer: string,
  answer: string
): Promise<number> {
  const apiKeyCount = getApiKeyCount();
  
  if (apiKeyCount === 0) {
    console.error('[Gemini Scoring] No API keys configured');
    return 0;
  }

  try {
    const prompt = `You are an automated evaluator.
Evaluate the user's answer strictly.

Question:
${question}

Expected Answer:
${expectedAnswer}

User Answer:
${answer}

Scoring rules:
- Score must be an integer between 0 and 10
- 10 = completely correct with clear logic
- Partial correctness should receive proportional score
- Incorrect or irrelevant answer = low score
- Do NOT explain
- Do NOT add text
- Return ONLY the numeric score.`;

    const requestBody: GeminiRequest = {
      contents: [
        {
          parts: [{ text: prompt }]
        }
      ]
    };

    const response = await callGeminiWithFallback(GEMINI_API_ENDPOINT, requestBody);

    if (!response.ok) {
      return 0;
    }

    const data = await response.json() as GeminiResponse;
    const text = data.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!text) {
      return 0;
    }

    const scoreMatch = text.trim().match(/^(\d+)$/);
    if (!scoreMatch) {
      const anyNumberMatch = text.match(/(\d+)/);
      if (!anyNumberMatch) {
        return 0;
      }
      const score = parseInt(anyNumberMatch[1], 10);
      return Math.max(0, Math.min(10, score));
    }

    const score = parseInt(scoreMatch[1], 10);
    return Math.max(0, Math.min(10, score));
    
  } catch (error) {
    return 0;
  }
}

