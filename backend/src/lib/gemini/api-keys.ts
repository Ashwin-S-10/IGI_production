/**
 * Gemini API Key Management with Fallback
 * Handles multiple API keys and automatic failover on rate limiting
 */

// API Keys priority order - ALL FROM ENVIRONMENT VARIABLES
const API_KEYS = [
  process.env.GEMINI_API_KEY || '',           // Key 1: Primary
  process.env.GEMINI_API_KEY_2 || '',         // Key 2: Fallback 1
  process.env.GEMINI_API_KEY_3 || '',         // Key 3: Fallback 2
  process.env.GOOGLE_API_KEY || '',           // Key 4: Google API fallback
].filter(key => key.length > 0); // Remove empty keys

let currentKeyIndex = 0;

/**
 * Get the current active API key
 */
export function getCurrentApiKey(): string {
  if (API_KEYS.length === 0) {
    throw new Error('No Gemini API keys configured');
  }
  return API_KEYS[currentKeyIndex];
}

/**
 * Switch to the next available API key
 * Returns true if switched, false if no more keys available
 */
export function switchToNextApiKey(): boolean {
  if (currentKeyIndex < API_KEYS.length - 1) {
    currentKeyIndex++;
    console.log(`[Gemini API] Switched to fallback key #${currentKeyIndex + 1}`);
    return true;
  }
  console.log('[Gemini API] No more fallback keys available');
  return false;
}

/**
 * Reset to the first API key (for new requests)
 */
export function resetApiKeyIndex(): void {
  currentKeyIndex = 0;
}

/**
 * Get total number of configured API keys
 */
export function getApiKeyCount(): number {
  return API_KEYS.length;
}

/**
 * Check if the error is a rate limit or forbidden error
 */
export function isRateLimitError(error: any): boolean {
  if (typeof error === 'object' && error !== null) {
    // Check HTTP status code
    if (error.status === 429 || error.status === 403) return true;
    
    // Check error message
    const message = error.message || error.error?.message || '';
    if (typeof message === 'string') {
      return message.toLowerCase().includes('rate limit') ||
             message.toLowerCase().includes('quota') ||
             message.toLowerCase().includes('429') ||
             message.toLowerCase().includes('403') ||
             message.toLowerCase().includes('forbidden');
    }
  }
  return false;
}

/**
 * Make API call with automatic fallback on rate limiting
 */
export async function callGeminiWithFallback(
  endpoint: string,
  requestBody: any,
  maxRetries: number = API_KEYS.length
): Promise<Response> {
  resetApiKeyIndex(); // Start with first key
  
  let lastError: any = null;
  
  for (let attempt = 0; attempt < maxRetries && attempt < API_KEYS.length; attempt++) {
    const apiKey = getCurrentApiKey();
    console.log(`[Gemini API] Attempt ${attempt + 1}/${maxRetries} using key #${currentKeyIndex + 1}`);
    
    try {
      const response = await fetch(`${endpoint}?key=${apiKey}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
      });

      // If successful, return response
      if (response.ok) {
        console.log(`[Gemini API] Success with key #${currentKeyIndex + 1}`);
        return response;
      }

      // Check if it's a rate limit or 403 forbidden error
      if (response.status === 429 || response.status === 403) {
        console.log(`[Gemini API] ${response.status === 403 ? '403 Forbidden' : 'Rate limit'} hit on key #${currentKeyIndex + 1}`);
        const errorText = await response.text();
        console.log(`[Gemini API] Error details:`, errorText);
        lastError = { status: response.status, message: errorText };
        
        // Try next key
        if (!switchToNextApiKey()) {
          throw new Error(`All API keys exhausted (last error: ${response.status})`);
        }
        continue;
      }

      // For other errors, log and return the response (let caller handle it)
      console.log(`[Gemini API] HTTP ${response.status} error on key #${currentKeyIndex + 1}`);
      const errorText = await response.text();
      console.log(`[Gemini API] Error response:`, errorText);
      return response;
      
    } catch (error) {
      console.error(`[Gemini API] Error with key #${currentKeyIndex + 1}:`, error);
      lastError = error;
      
      // If it's a rate limit error, try next key
      if (isRateLimitError(error)) {
        if (!switchToNextApiKey()) {
          throw new Error('All API keys rate limited');
        }
        continue;
      }
      
      // For other errors, throw immediately
      throw error;
    }
  }
  
  // If we exhausted all retries
  throw lastError || new Error('Failed to call Gemini API after all retries');
}
