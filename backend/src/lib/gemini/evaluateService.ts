/**
 * Evaluation Service for Round 1
 * Uses official @google/generative-ai SDK with gemini-2.0-flash-exp
 * Includes automatic API key fallback on rate limiting
 */

import { getGeminiModel, reinitializeWithNextKey } from './geminiClient';
import { getApiKeyCount, isRateLimitError } from './api-keys';

interface EvaluationResult {
  score: number;
  analysis: string;
}

function validateScore(score: any): number {
  const numScore = typeof score === 'string' ? parseInt(score, 10) : Number(score);
  
  if (isNaN(numScore)) {
    return 0;
  }
  
  return Math.max(0, Math.min(10, numScore));
}

function validateAnalysis(analysis: any): string {
  if (typeof analysis !== 'string') {
    return 'Unable to generate analysis.';
  }
  
  let text = analysis.trim();
  
  // Reject third-person language (convert to fallback message)
  const thirdPersonTerms = ['the user', 'the solution', 'the answer', 'the submission'];
  const lowerText = text.toLowerCase();
  
  for (const term of thirdPersonTerms) {
    if (lowerText.includes(term)) {
      console.warn(`[EvaluationService] Analysis contains third-person term: "${term}"`);
      text = 'Please provide your algorithm and approach, not just the answer.';
      break;
    }
  }
  
  const words = text.split(/\s+/);
  
  if (words.length > 50) {
    return words.slice(0, 50).join(' ') + '...';
  }
  
  return text;
}

export async function evaluateAnswer(
  question: string,
  userAnswer: string
): Promise<EvaluationResult> {
  const maxRetries = getApiKeyCount();
  console.log(`[EvaluationService] Starting evaluation with ${maxRetries} API keys available...`);

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      console.log(`[EvaluationService] Attempt ${attempt}/${maxRetries}`);
      const model = getGeminiModel();

      const prompt = `CRITICAL: This is an ALGORITHM TESTING round. You are acting as a programming contest judge.

---

STEP 0 — MANDATORY CONTEXT IDENTIFICATION (INTERNAL ONLY)

Before evaluating the player's response, you MUST:

1. Identify what algorithm or algorithmic concept the question is testing, based solely on the question text.
   Examples: arithmetic progression, prime filtering, string reversal, duplicate detection, permutations, 
   average calculation, frequency counting, binary-to-decimal conversion, Fibonacci sequence, 
   palindrome verification, etc.

2. Keep this identification INTERNAL.

3. DO NOT mention the algorithm name or your internal reasoning in the output.

If the question clearly expects an algorithm and the player does not provide one, score accordingly.

---

STRICT INPUTS

Question:
${question}

Player's Algorithm / Pseudocode / Explanation:
${userAnswer}

---

ACCEPTABLE SUBMISSIONS

The player MAY use:
- Plain English algorithmic steps
- Pseudocode
- Logical explanation of steps

The player MUST explain HOW the solution works.

---

DO NOT ACCEPT

- Final answers only
- Numbers, outputs, or results without explanation
- Pattern guesses without describing the method
- Merely restating the input or output

If only final answers or outputs are provided, assign 0-2 points maximum.

---

SCORING RUBRIC (STRICT — TOTAL 10 MARKS)

Evaluate the player's submission ONLY against the correct algorithm for the question.

1. Algorithm Correctness (0-4 marks)
   - Does the described algorithm logically solve the intended problem?
   - Would it work correctly for valid inputs?

2. Edge Case Handling (0-3 marks)
   - Does the algorithm mention or handle edge cases where applicable?
   - Examples: empty input, single element, duplicates, invalid values, boundary conditions.

3. Algorithm Efficiency (0-3 marks)
   - Is the time and space complexity reasonable for this problem?
   - Is the approach optimal or at least acceptable?

---

FEEDBACK WRITING RULES (CRITICAL)

- Write feedback DIRECTLY to the player using second person
- Always use: "you", "your", "you've"
- NEVER use: "the user", "the answer", "the solution", "the submission"
- Sound like a contest judge giving direct feedback
- Be clear, constructive, and precise

Example CORRECT feedback:
✅ "You only provided numbers without explaining your algorithm or approach."
✅ "Your algorithm correctly identifies the pattern but doesn't handle edge cases."
✅ "You've described a valid approach, but it's inefficient for large inputs."

Example WRONG feedback:
❌ "The user provided only numbers"
❌ "The solution does not handle edge cases"
❌ "The answer is incomplete"

---

LENGTH CONSTRAINT

Feedback must be under 50 words.

---

IMPORTANT FINAL RULE

If the player's approach does NOT match the algorithm the question is testing, reduce Algorithm Correctness 
accordingly, even if the final numeric answer is correct.

Judge the METHOD, not the result.

---

OUTPUT FORMAT (STRICT — JSON ONLY)

Return ONLY valid JSON. No markdown. No extra text.

{
  "score": <integer 0-10>,
  "analysis": "<direct second-person feedback under 50 words>"
}`;

    console.log('[EvaluationService] Calling Gemini API...');
    
    const result = await model.generateContent(prompt);
    const response = result.response;
    const text = response.text();

    console.log('[EvaluationService] Raw response:', text);

    // Clean and parse response
    let cleanedText = text
      .replace(/```json\n?/g, '')
      .replace(/```\n?/g, '')
      .trim();

    let parsedResponse: { score: any; analysis: any };

    try {
      parsedResponse = JSON.parse(cleanedText);
    } catch (parseError) {
      console.warn('[EvaluationService] JSON parse failed, attempting extraction...');
      
      // Fallback: extract from text
      const scoreMatch = cleanedText.match(/"?score"?\s*:\s*(\d+)/i);
      const analysisMatch = cleanedText.match(/"?analysis"?\s*:\s*"([^"]+)"/i);

      if (!scoreMatch || !analysisMatch) {
        console.error('[EvaluationService] Failed to extract data from:', cleanedText);
        throw new Error('Unable to parse Gemini response');
      }

      parsedResponse = {
        score: scoreMatch[1],
        analysis: analysisMatch[1]
      };
    }

    // Validate and sanitize
    const score = validateScore(parsedResponse.score);
    const analysis = validateAnalysis(parsedResponse.analysis);

      console.log('[EvaluationService] Success - Score:', score, 'Analysis:', analysis);

      return { score, analysis };

    } catch (error: any) {
      const errorMessage = error.message || String(error);
      console.error(`[EvaluationService] Error on attempt ${attempt}:`, errorMessage);
      
      // Check if it's a rate limit error
      const isRateLimit = isRateLimitError(error) || 
                          errorMessage.includes('429') ||
                          errorMessage.includes('rate limit') ||
                          errorMessage.includes('quota');
      
      if (isRateLimit && attempt < maxRetries) {
        console.log(`[EvaluationService] Rate limit detected, switching to next API key...`);
        if (reinitializeWithNextKey()) {
          console.log(`[EvaluationService] Retrying with fallback key...`);
          continue; // Retry with next key
        }
      }
      
      // If not rate limit or no more keys, throw error
      console.error('[EvaluationService] Full error:', error);
      throw error;
    }
  }
  
  // Should never reach here
  throw new Error('Evaluation failed after all retry attempts');
}
