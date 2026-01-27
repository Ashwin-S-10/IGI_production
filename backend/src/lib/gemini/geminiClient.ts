/**
 * Gemini Client - Production-Ready Singleton with Fallback Support
 * Uses official @google/generative-ai SDK
 */

import { GoogleGenerativeAI, GenerativeModel } from '@google/generative-ai';
import { getCurrentApiKey, switchToNextApiKey, getApiKeyCount, isRateLimitError } from './api-keys';

let genAI: GoogleGenerativeAI | null = null;
let currentClient: GoogleGenerativeAI | null = null;

function initializeGemini(): GoogleGenerativeAI {
  try {
    const apiKey = getCurrentApiKey();
    console.log(`✅ Gemini client initialized with fallback support (${getApiKeyCount()} keys available)`);
    return new GoogleGenerativeAI(apiKey);
  } catch (error) {
    throw new Error('GEMINI_API_KEY environment variable is not set');
  }
}

export function getGeminiClient(): GoogleGenerativeAI {
  if (!genAI) {
    genAI = initializeGemini();
  }
  return genAI;
}

/**
 * Reinitialize client with next API key (for rate limit handling)
 */
export function reinitializeWithNextKey(): boolean {
  if (switchToNextApiKey()) {
    genAI = initializeGemini();
    return true;
  }
  return false;
}

export function getGeminiModel(): GenerativeModel {
  const client = getGeminiClient();
  
  return client.getGenerativeModel({
    model: 'models/gemini-2.5-flash-lite',
    generationConfig: {
      temperature: 0.2,
      maxOutputTokens: 200,
      topP: 0.8,
      topK: 40,
    },
  });
}
