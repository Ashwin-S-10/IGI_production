/**
 * Gemini AI-based evaluation for Round 3 competitive programming questions
 * Scores algorithm correctness, efficiency, and code implementation
 */

import { callGeminiWithFallback, getApiKeyCount } from './api-keys';

const GEMINI_API_ENDPOINT = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent';

interface GeminiResponse {
  candidates?: {
    content: {
      parts: { text: string }[];
    };
  }[];
}

interface GeminiEvaluationResponse {
  algorithm_correctness_score: number;
  algorithm_efficiency_score: number;
  code_correctness_score: number;
  identified_algorithm: string;
  time_complexity: string;
  analysis: string;
}

export interface Round3EvaluationResult {
  score: number;
  analysis: string;
  details: {
    algorithm_correctness: number;
    algorithm_efficiency: number;
    code_correctness: number;
    identified_algorithm: string;
    time_complexity: string;
  };
}

/**
 * Evaluate Round 3 competitive programming answer
 * Supports both code submissions and plain English algorithm explanations
 */
export async function evaluateRound3Answer(
  questionTitle: string,
  questionPrompt: string,
  userAnswer: string,
  questionId: string
): Promise<Round3EvaluationResult> {
  const apiKeyCount = getApiKeyCount();
  
  if (apiKeyCount === 0) {
    return {
      score: 0,
      analysis: 'Evaluation service unavailable',
      details: {
        algorithm_correctness: 0,
        algorithm_efficiency: 0,
        code_correctness: 0,
        identified_algorithm: 'Unknown',
        time_complexity: 'Unknown'
      }
    };
  }

  // Handle empty answers
  if (!userAnswer || userAnswer.trim().length === 0) {
    return {
      score: 0,
      analysis: 'No answer provided',
      details: {
        algorithm_correctness: 0,
        algorithm_efficiency: 0,
        code_correctness: 0,
        identified_algorithm: 'None',
        time_complexity: 'N/A'
      }
    };
  }

  console.log(`[Round3 Evaluation] Evaluating ${questionId} - ${questionTitle}`);

  try {
    const prompt = constructEvaluationPrompt(questionTitle, questionPrompt, userAnswer, questionId);
    
    const requestBody = {
      contents: [
        {
          parts: [{ text: prompt }]
        }
      ]
    };
    
    const response = await callGeminiWithFallback(
      GEMINI_API_ENDPOINT,
      requestBody
    );

    // Check response status
    if (!response.ok) {
      console.error('[Round3 Evaluation] API request failed:', response.status);
      return {
        score: 0,
        analysis: 'Evaluation service error. Please retry.',
        details: {
          algorithm_correctness: 0,
          algorithm_efficiency: 0,
          code_correctness: 0,
          identified_algorithm: 'Error',
          time_complexity: 'Error'
        }
      };
    }

    // Parse response JSON
    const data = await response.json() as GeminiResponse;
    const responseText = data.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!responseText) {
      console.error('[Round3 Evaluation] Empty response from Gemini');
      return {
        score: 0,
        analysis: 'No evaluation received. Please retry.',
        details: {
          algorithm_correctness: 0,
          algorithm_efficiency: 0,
          code_correctness: 0,
          identified_algorithm: 'No response',
          time_complexity: 'Unknown'
        }
      };
    }

    // Parse Gemini response
    const geminiResult = parseGeminiResponse(responseText);
    
    // Calculate total score (sum of three components, clamped to 0-10)
    const totalScore = Math.max(
      0,
      Math.min(
        10,
        geminiResult.algorithm_correctness_score +
        geminiResult.algorithm_efficiency_score +
        geminiResult.code_correctness_score
      )
    );

    // Round to 1 decimal place
    const finalScore = Math.round(totalScore * 10) / 10;

    console.log(`[Round3 Evaluation] Score: ${finalScore}/10`, {
      correctness: geminiResult.algorithm_correctness_score,
      efficiency: geminiResult.algorithm_efficiency_score,
      code: geminiResult.code_correctness_score
    });

    return {
      score: finalScore,
      analysis: geminiResult.analysis,
      details: {
        algorithm_correctness: geminiResult.algorithm_correctness_score,
        algorithm_efficiency: geminiResult.algorithm_efficiency_score,
        code_correctness: geminiResult.code_correctness_score,
        identified_algorithm: geminiResult.identified_algorithm,
        time_complexity: geminiResult.time_complexity
      }
    };

  } catch (error) {
    console.error('[Round3 Evaluation] Error:', error);
    
    // Fallback to 0 score on evaluation failure
    return {
      score: 0,
      analysis: 'Evaluation error occurred. Please retry your submission.',
      details: {
        algorithm_correctness: 0,
        algorithm_efficiency: 0,
        code_correctness: 0,
        identified_algorithm: 'Error',
        time_complexity: 'Error'
      }
    };
  }
}

/**
 * Construct evaluation prompt with question-specific efficiency rules
 */
function constructEvaluationPrompt(
  questionTitle: string,
  questionPrompt: string,
  userAnswer: string,
  questionId: string
): string {
  const efficiencyRules = getEfficiencyRules(questionId);
  
  return `You are an automated evaluator for a competitive programming contest (Round 3).

## CONTEXT
QUESTION: ${questionTitle}

PROBLEM STATEMENT:
${questionPrompt}

USER'S SUBMITTED ANSWER:
${userAnswer}

## ANSWER TYPE DETECTION

The user may submit either:
1. **Code implementation** (Python, JavaScript, C++, etc.)
2. **Plain English algorithm explanation**

YOUR EVALUATION RULES:
- If user provides **plain English explanation only**:
  • Award algorithm correctness marks (0-1) if explanation is correct
  • Award algorithm efficiency marks (0-4) if they describe an efficient approach
  • Set code_correctness_score = 0 (automatic, since no code provided)
  • TOTAL POSSIBLE: 5.0 marks for correct and efficient plain English explanation

- If user provides **code**:
  • Award algorithm correctness marks (0-1) based on understanding shown in code
  • Award algorithm efficiency marks (0-4) based on time complexity of the approach
  • Award code correctness marks (0-5) separately for implementation quality
  • TOTAL POSSIBLE: 10.0 marks for correct, efficient, and well-implemented code

## SCORING RUBRIC (TOTAL: 10 MARKS)

### 1. ALGORITHM CORRECTNESS (0-1 mark)
- **1 mark:** Correct algorithm/approach that solves the problem
- **0.5 marks:** Partially correct understanding with logical gaps
- **0 marks:** Wrong approach or doesn't address the problem

### 2. ALGORITHM EFFICIENCY (0-4 marks)
${efficiencyRules}

**IMPORTANT:** If the user uses a brute force approach (even if logically correct), they get:
- Algorithm correctness: Can receive marks (if logic is sound)
- Algorithm efficiency: 0 marks (inefficient approach)

### 3. CODE CORRECTNESS (0-5.0 marks)
**If plain English only:** Automatic 0 (no code to evaluate)

**If code is provided:**
- **5.0 marks:** Syntactically correct, logically sound, handles edge cases
- **3.0-4.5 marks:** Minor bugs (off-by-one errors, missing edge cases)
- **1.0-2.5 marks:** Major errors (incorrect logic, syntax errors, incomplete)
- **0 marks:** Non-functional code or no code provided

## ANALYSIS RULES (PARTICIPANT FEEDBACK - CRITICAL)

The "analysis" field is shown directly to participants. Follow these STRICT rules:

✅ MUST:
- Use second-person: "you", "your"
- Keep under 50 words (1-2 sentences)
- Focus on PERFORMANCE evaluation, not the problem itself

❌ FORBIDDEN:
- Do NOT reveal solution details
- Do NOT mention specific algorithms or data structures
- Do NOT provide hints or teaching points
- Do NOT assume code execution or test case results

### Score-Aware Templates:
**Score 9-10:** "You demonstrated excellent understanding with a correct and efficient solution. Well done!"
**Score 6-8:** "Your approach shows good understanding, but there were issues with [efficiency/implementation/logic] that reduced your score."
**Score 3-5:** "Your submission had significant gaps in [algorithm design/efficiency/code quality], resulting in partial marks."
**Score 0-2:** "Your submission did not meet the evaluation criteria effectively."

## OUTPUT FORMAT (JSON ONLY - NO MARKDOWN)

You MUST return ONLY valid JSON with this exact structure:

{
  "algorithm_correctness_score": <number between 0 and 1>,
  "algorithm_efficiency_score": <number between 0 and 4>,
  "code_correctness_score": <number between 0 and 5.0>,
  "identified_algorithm": "<brief description>",
  "time_complexity": "<O(n), O(n²), etc.>",
  "analysis": "<max 50 words, second-person, performance-focused>"
}

## CRITICAL RULES

1. **Never assume code execution** - You cannot run the code or test it
2. **Evaluate statically** - Judge based on logic, syntax, and approach
3. **No solution hints** - Analysis must not reveal correct approach
4. **JSON only** - Do not wrap in markdown code blocks
5. **Fair scoring** - Give partial credit generously for reasonable attempts

Now evaluate the submission and return JSON only.`;
}

/**
 * Get question-specific efficiency rules
 */
function getEfficiencyRules(questionId: string): string {
  const rules: Record<string, string> = {
    'r3-q1': `**Question: Verify Anagrams**
- **Efficient (4 marks):** Sorting both strings O(n log n) OR using frequency map/hash table O(n)
- **Inefficient (0 marks):** Brute force comparison of all character permutations O(n!)`,

    'r3-q2': `**Question: Container With Most Water**
- **Efficient (4 marks):** Two-pointer technique starting from both ends O(n)
- **Inefficient (0 marks):** Nested loops checking all pairs O(n²)`,

    'r3-q3': `**Question: Longest Substring Without Repeating Characters**
- **Efficient (4 marks):** Sliding window with hash set/map O(n)
- **Inefficient (0 marks):** Brute force checking all substrings O(n²) or O(n³)`
  };

  return rules[questionId] || `**Efficiency Evaluation:**
- **4 marks:** Optimal time complexity for the problem
- **0 marks:** Suboptimal or brute force approach`;
}

/**
 * Parse Gemini JSON response with error handling
 */
function parseGeminiResponse(responseText: string): GeminiEvaluationResponse {
  try {
    // Remove markdown code blocks if present
    let cleanedText = responseText.trim();
    if (cleanedText.startsWith('```json')) {
      cleanedText = cleanedText.slice(7);
    }
    if (cleanedText.startsWith('```')) {
      cleanedText = cleanedText.slice(3);
    }
    if (cleanedText.endsWith('```')) {
      cleanedText = cleanedText.slice(0, -3);
    }
    cleanedText = cleanedText.trim();

    const parsed = JSON.parse(cleanedText);

    // Validate required fields
    const required = [
      'algorithm_correctness_score',
      'algorithm_efficiency_score',
      'code_correctness_score',
      'identified_algorithm',
      'time_complexity',
      'analysis'
    ];

    for (const field of required) {
      if (!(field in parsed)) {
        throw new Error(`Missing required field: ${field}`);
      }
    }

    // Clamp scores to valid ranges
    return {
      algorithm_correctness_score: Math.max(0, Math.min(1, parsed.algorithm_correctness_score)),
      algorithm_efficiency_score: Math.max(0, Math.min(4, parsed.algorithm_efficiency_score)),
      code_correctness_score: Math.max(0, Math.min(5.0, parsed.code_correctness_score)),
      identified_algorithm: parsed.identified_algorithm,
      time_complexity: parsed.time_complexity,
      analysis: parsed.analysis.substring(0, 200) // Truncate if too long
    };

  } catch (error) {
    console.error('[Round3 Evaluation] Failed to parse Gemini response:', error);
    console.error('[Round3 Evaluation] Raw response:', responseText);
    
    // Return default zero scores on parse error
    return {
      algorithm_correctness_score: 0,
      algorithm_efficiency_score: 0,
      code_correctness_score: 0,
      identified_algorithm: 'Parse Error',
      time_complexity: 'Unknown',
      analysis: 'Failed to evaluate submission. Please try again.'
    };
  }
}
