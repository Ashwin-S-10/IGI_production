/**
 * Gemini AI-based evaluation for Round 2 debugging questions
 * Scores user's bug identification and explanation
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

interface IdentifiedError {
  error_description: string;
  fix_description: string;
  identification_score: number;
  fix_score: number;
}

export interface EvaluationResult {
  identifiedErrors: IdentifiedError[];
  score: number;
  analysis: string;
  reason: string;
}

/**
 * Evaluate debugging answer and return detailed score breakdown
 * Compares user's identified errors against actual bugs
 */
export async function scoreDebuggingAnswerWithGemini(
  questionTitle: string,
  questionDescription: string,
  codeSnippet: string,
  userAnswer: string,
  language: string
): Promise<EvaluationResult> {
  const apiKeyCount = getApiKeyCount();
  
  if (apiKeyCount === 0) {
    return {
      identifiedErrors: [],
      score: 0,
      analysis: 'Gemini API key not configured',
      reason: 'Missing API key'
    };
  }

  console.log(`[Round2 Evaluation] Starting with ${apiKeyCount} API keys available`);

  try {
    const prompt = `You are an automated evaluator for a programming debugging contest (Round 2).

## CONTEXT
QUESTION TITLE: ${questionTitle}
LANGUAGE: ${language}
QUESTION DESCRIPTION: ${questionDescription}

CODE SNIPPET WITH BUGS:
\`\`\`${language}
${codeSnippet}
\`\`\`

USER'S SUBMITTED ANSWER (Error Identification):
${userAnswer}

## YOUR TASK
1. **Analyze the code** and identify ALL bugs present (there are typically 1-2 bugs per question)
2. **Compare** the user's identified errors with the actual bugs you found
3. **Evaluate** how accurately the user described:
   - What the error is (error identification)
   - How to fix it (fix description)

## SCORING CRITERIA - LIBERAL APPROACH
Each bug can earn a maximum of 10 marks:
- 7 marks for correctly identifying the error (primary focus)
- 3 marks for describing how to fix it (secondary)

If a question has 2 bugs:
- Total possible marks = 20
- Final score normalized to 0-10 scale
- User gets partial credit for identifying only 1 bug correctly

If a question has 1 bug:
- Total possible marks = 10

## EVALUATION GUIDELINES - BE LIBERAL
- Award FULL marks (7/7) for error identification if user identifies the bug correctly, even if wording is imprecise
- Accept variations in how the error is described as long as the core issue is identified
- Award marks (2-3/3) for fix description if the general fix approach is correct
- Give partial credit generously - if user shows understanding of the problem, award marks
- Only award 0 marks if the user completely missed the bug or described something entirely unrelated
- Focus on CORRECTNESS of identification, not formatting, precision, or extra details

## GEMINI ANALYSIS RULES - PARTICIPANT FEEDBACK (CRITICAL)

The \"analysis\" field is shown directly to the participant. Follow these rules STRICTLY:

### STRICT OUTPUT CONSTRAINTS
✅ MUST:
- Use second-person only: "you", "your"
- Produce exactly 1-2 short sentences (no more)
- Keep under 50 words total
- Focus ONLY on evaluation quality, not implementation details

❌ FORBIDDEN - DO NOT:
- Restate or paraphrase the error the user mentioned
- Restate the actual bug in the code
- Mention code, variables, operators, line numbers, or fixes
- Hint at the correct solution
- Teach or explain how to debug
- Reveal or confirm how many errors exist
- Compare answers to an ideal solution

### CONTENT FOCUS
Answer at high level only:
- Did you fully meet the evaluation criteria?
- If not, why were marks reduced? (in general terms only)

### SCORE-AWARE TEMPLATES

**Score = 10:**
Congratulate and confirm full criteria satisfaction.
Example: "You correctly identified all issues and provided accurate fixes. Excellent work!"

**Score 5-9.5:**
Partial success with minor gaps leading to reduced marks.
Example: "You identified some issues correctly, but certain aspects of your explanation were incomplete or inaccurate, resulting in partial marks."

**Score < 5:**
Insufficient alignment with evaluation criteria resulted in low score.
Example: "Your response did not sufficiently align with the evaluation criteria, leading to significant mark deduction."

🚨 FINAL SAFETY RULE:
The analysis must help the participant understand their PERFORMANCE, not the PROBLEM itself.
If any rule is violated, the analysis is INVALID.

## ANALYSIS GENERATION PROMPT

You are generating participant-facing feedback for a debugging assessment.

STRICT RULES (NON-NEGOTIABLE):
- Output MUST start with the heading: "Analysis"
- Use SECOND PERSON only ("you", "your")
- Maximum 50 words total
- Do NOT mention code, bugs, errors, fixes, variables, operators, logic, or lines
- Do NOT restate or paraphrase the user's answer
- Do NOT hint at the solution
- Do NOT explain what the actual issue was
- Do NOT use technical terms

INSTRUCTIONS:
- If score == 10:
  - Congratulate the participant
  - State that all evaluation criteria were met
- If score is between 0 and 9.5:
  - State that marks were reduced
  - Give a HIGH-LEVEL reason (e.g., incomplete identification, partial alignment, missing details)
  - Do NOT reveal what was missed

Return ONLY the analysis text in the "analysis" field.

CRITICAL REMINDERS:
- Return ONLY the JSON object (no markdown, no code blocks)
- Final score: normalized to 0-10 scale
- "analysis" = PARTICIPANT-FACING (follow ALL analysis rules above - no bug details!)
- "reason" = INTERNAL ONLY (can be technical and detailed)
- If user identified 0 bugs correctly: identifiedErrors = [], score = 0`;

    const requestBody: GeminiRequest = {
      contents: [
        {
          parts: [{ text: prompt }]
        }
      ]
    };

    const response = await callGeminiWithFallback(GEMINI_API_ENDPOINT, requestBody);

    if (!response.ok) {
      return {
        identifiedErrors: [],
        score: 0,
        analysis: 'API request failed',
        reason: `HTTP ${response.status}`
      };
    }

    const data = await response.json() as GeminiResponse;
    const text = data.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!text) {
      return {
        identifiedErrors: [],
        score: 0,
        analysis: 'No response from Gemini',
        reason: 'Empty response'
      };
    }

    console.log('[Round2 Evaluation] Raw Gemini response:', text);

    // Clean up response - remove markdown code blocks and extract JSON
    let cleanedText = text.trim();
    
    // Remove markdown code blocks
    if (cleanedText.startsWith('```json')) {
      cleanedText = cleanedText.replace(/^```json\s*/, '').replace(/\s*```$/, '');
    } else if (cleanedText.startsWith('```')) {
      cleanedText = cleanedText.replace(/^```\s*/, '').replace(/\s*```$/, '');
    }
    
    // Extract JSON object - find first { and last }
    const firstBrace = cleanedText.indexOf('{');
    const lastBrace = cleanedText.lastIndexOf('}');
    
    if (firstBrace === -1 || lastBrace === -1) {
      console.error('[Round2 Evaluation] No JSON object found in response');
      return {
        identifiedErrors: [],
        score: 0,
        analysis: 'Invalid response format',
        reason: 'Could not extract JSON from response'
      };
    }
    
    cleanedText = cleanedText.substring(firstBrace, lastBrace + 1);
    
    console.log('[Round2 Evaluation] Cleaned JSON:', cleanedText);

    // Parse JSON response
    const result = JSON.parse(cleanedText) as EvaluationResult;
    
    // Validate and normalize score
    result.score = Math.max(0, Math.min(10, result.score));
    
    return result;
    
  } catch (error) {
    console.error('[Gemini Evaluation Error]', error);
    return {
      identifiedErrors: [],
      score: 0,
      analysis: 'Evaluation failed',
      reason: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}
