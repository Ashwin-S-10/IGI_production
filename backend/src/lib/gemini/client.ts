/**
 * Gemini API Client - Singleton
 * Official SDK initialization with fallback support
 */

import { GoogleGenerativeAI } from '@google/generative-ai';
import { getCurrentApiKey } from './api-keys';

let genAI: GoogleGenerativeAI | null = null;

export function getGeminiClient(): GoogleGenerativeAI {
  if (!genAI) {
    try {
      const apiKey = getCurrentApiKey();
      genAI = new GoogleGenerativeAI(apiKey);
      console.log('✅ Gemini SDK client initialized with fallback support');
    } catch (error) {
      throw new Error('GEMINI_API_KEY not configured');
    }
  }
  
  return genAI;
}
