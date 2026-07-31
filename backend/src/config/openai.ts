import OpenAI from 'openai';
import dotenv from 'dotenv';
import { logger } from '../services/logger.service.js';

dotenv.config();

export const openaiModel = process.env.OPENAI_MODEL || 'gpt-4o';

// Read all system API keys from environment
const rawKeys = [
  process.env.OPENAI_API_KEY_1,
  process.env.OPENAI_API_KEY_2,
  process.env.OPENAI_API_KEY_3,
  process.env.OPENAI_API_KEY
].filter((k): k is string => Boolean(k && k.trim() && !k.includes('your-openai-api-key')));

// Remove duplicates
export const systemOpenAIKeys = Array.from(new Set(rawKeys));

const exhaustedKeysSet = new Set<string>();

export function markKeyExhausted(key: string) {
  exhaustedKeysSet.add(key);
  logger.warn(`⚠️ OpenAI API Key [...${key.slice(-8)}] marked as EXHAUSTED (Quota / RateLimit). Active system keys remaining: ${systemOpenAIKeys.length - exhaustedKeysSet.size}`);
}

export function resetExhaustedKeys() {
  exhaustedKeysSet.clear();
}

/**
 * Returns an OpenAI client instance.
 * Priority order:
 * 1. Client-provided custom user API key (x-openai-api-key header)
 * 2. System Key 1 -> Key 2 -> Key 3 (skipping exhausted keys)
 */
export function getOpenAIClient(userCustomKey?: string): { client: OpenAI; apiKey: string } | null {
  // If user provided custom key in request
  if (userCustomKey && userCustomKey.trim() && !userCustomKey.includes('your-openai-api-key')) {
    return {
      client: new OpenAI({ apiKey: userCustomKey.trim() }),
      apiKey: userCustomKey.trim()
    };
  }

  // Iterate system keys
  for (const key of systemOpenAIKeys) {
    if (!exhaustedKeysSet.has(key)) {
      return {
        client: new OpenAI({ apiKey: key }),
        apiKey: key
      };
    }
  }

  return null;
}

export function hasOpenAIKey(userCustomKey?: string): boolean {
  if (userCustomKey && userCustomKey.trim()) return true;
  return systemOpenAIKeys.some(k => !exhaustedKeysSet.has(k));
}
