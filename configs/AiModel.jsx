// configs/AiModel.jsx
// Google Gemini AI Integration with fallback models

import { GoogleGenAI } from '@google/genai';

const apiKey = process.env.GEMINI_API_KEY || process.env.NEXT_PUBLIC_GEMINI_API_KEY;

const MODEL_PRIORITY = [
  'gemini-flash-lite-latest',
  'gemini-3.5-flash-lite',
  'gemini-3.1-flash-lite',
  'gemini-flash-latest',
  'gemini-3.8-flash',
];

/**
 * Generate AI content with automatic model fallback
 */
export async function generateContentWithRetry(prompt, type = 'text') {
  // If in browser, use the secure server-side API route
  if (typeof window !== 'undefined') {
    const res = await fetch('/api/ai/generate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ prompt, type }),
    });

    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.error || `Server generation failed with status ${res.status}`);
    }
    return { responseText: data.text, usedModel: data.model };
  }

  // If on server / node environment
  if (!apiKey) {
    throw new Error('Gemini API key is not set. Please set GEMINI_API_KEY in .env.local.');
  }

  const ai = new GoogleGenAI({ apiKey });
  let lastError = null;

  for (const modelName of MODEL_PRIORITY) {
    try {
      const config = {};
      if (type === 'json' || prompt.includes('JSON')) {
        config.responseMimeType = 'application/json';
      }

      const response = await ai.models.generateContent({
        model: modelName,
        contents: prompt,
        config,
      });

      if (response && response.text) {
        return { responseText: response.text, usedModel: modelName };
      }
    } catch (err) {
      console.warn(`[Gemini SDK] ${modelName} failed:`, err.message);
      lastError = err;
    }
  }

  throw lastError || new Error('All Gemini models failed or unavailable.');
}

/**
 * Helper chat wrapper for backward-compatibility with UI components
 */
const createGeminiChat = (type = 'text') => {
  return {
    sendMessage: async (prompt) => {
      const { responseText } = await generateContentWithRetry(prompt, type);
      return {
        response: {
          text: async () => responseText,
        },
      };
    },
  };
};

export const GenerateCourseLayout_AI = createGeminiChat('json');
export const GenerateChapterContent_AI = createGeminiChat('text');
