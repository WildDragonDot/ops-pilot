import { GoogleGenerativeAI } from '@google/generative-ai';
import dotenv from 'dotenv';
import { logger } from '../services/logger.service.js';

dotenv.config();

export function getGeminiModelName(): string {
  return process.env.GEMINI_MODEL || 'gemini-flash-latest';
}

export function getSystemGeminiKeys(): string[] {
  const rawGeminiKeys = [
    process.env.GEMINI_API_KEY_1,
    process.env.GEMINI_API_KEY_2,
    process.env.GEMINI_API_KEY_3,
    process.env.GEMINI_API_KEY
  ].filter((k): k is string => Boolean(k && k.trim() && !k.includes('your-gemini-api-key')));

  return Array.from(new Set(rawGeminiKeys));
}

const exhaustedGeminiKeysSet = new Set<string>();

export function markGeminiKeyExhausted(key: string) {
  exhaustedGeminiKeysSet.add(key);
  const keys = getSystemGeminiKeys();
  logger.warn(`⚠️ Gemini API Key [...${key.slice(-8)}] marked as rate-limited. Auto-recovering in 12s...`);
  
  // Auto-expire rate limit status after 12 seconds so keys don't stay locked permanently
  setTimeout(() => {
    exhaustedGeminiKeysSet.delete(key);
  }, 12000);
}

export function resetExhaustedGeminiKeys() {
  exhaustedGeminiKeysSet.clear();
}

/**
 * Returns a Gemini AI client instance & key.
 * Priority order:
 * 1. Client-provided custom user Gemini key (x-gemini-api-key header)
 * 2. System Gemini Key 1 -> Key 2 (skipping exhausted keys)
 * 3. Fallback to Key 1 if all keys temporarily rate-limited
 */
export function getGeminiClient(userCustomKey?: string): { ai: GoogleGenerativeAI; apiKey: string } | null {
  // If user provided custom key in request
  if (userCustomKey && userCustomKey.trim() && !userCustomKey.includes('your-gemini-api-key')) {
    return {
      ai: new GoogleGenerativeAI(userCustomKey.trim()),
      apiKey: userCustomKey.trim()
    };
  }

  const keys = getSystemGeminiKeys();
  if (keys.length === 0) return null;

  // Iterate active non-exhausted system keys
  for (const key of keys) {
    if (!exhaustedGeminiKeysSet.has(key)) {
      return {
        ai: new GoogleGenerativeAI(key),
        apiKey: key
      };
    }
  }

  // If all keys are temporarily rate-limited, return the first key anyway (rate-limit resets rapidly)
  return {
    ai: new GoogleGenerativeAI(keys[0]),
    apiKey: keys[0]
  };
}

export function hasGeminiKey(userCustomKey?: string): boolean {
  if (userCustomKey && userCustomKey.trim()) return true;
  const keys = getSystemGeminiKeys();
  return keys.length > 0;
}
