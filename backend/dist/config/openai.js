import OpenAI from 'openai';
import dotenv from 'dotenv';
dotenv.config();
export const openaiApiKey = process.env.OPENAI_API_KEY || '';
export const openaiModel = process.env.OPENAI_MODEL || 'gpt-4o';
export const openai = openaiApiKey && !openaiApiKey.includes('your-openai-api-key')
    ? new OpenAI({ apiKey: openaiApiKey })
    : null;
export function hasOpenAIKey() {
    return Boolean(openaiApiKey && !openaiApiKey.includes('your-openai-api-key'));
}
