import { NextResponse } from 'next/server';
import { GoogleGenAI } from '@google/genai';

const apiKey = process.env.GEMINI_API_KEY || process.env.NEXT_PUBLIC_GEMINI_API_KEY;

// List of fallback models in priority order
const MODEL_PRIORITY = [
  'gemini-flash-lite-latest',
  'gemini-3.5-flash-lite',
  'gemini-3.1-flash-lite',
  'gemini-flash-latest',
  'gemini-3.8-flash',
];

export async function POST(request) {
  try {
    if (!apiKey) {
      return NextResponse.json(
        { error: 'Gemini API key is not configured. Please set GEMINI_API_KEY in .env.local.' },
        { status: 500 }
      );
    }

    const { prompt, type = 'text', jsonStructure } = await request.json();

    if (!prompt) {
      return NextResponse.json({ error: 'Prompt is required' }, { status: 400 });
    }

    const ai = new GoogleGenAI({ apiKey });

    let lastError = null;
    let generatedText = null;
    let usedModel = null;

    for (const modelName of MODEL_PRIORITY) {
      try {
        console.log(`[Gemini] Attempting generation with model: ${modelName}`);

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
          generatedText = response.text;
          usedModel = modelName;
          console.log(`[Gemini] Successfully generated content using ${modelName}`);
          break;
        }
      } catch (err) {
        console.warn(`[Gemini] Model ${modelName} failed:`, err.message);
        lastError = err;
      }
    }

    if (!generatedText) {
      throw lastError || new Error('All Gemini models failed to generate a response.');
    }

    return NextResponse.json({
      success: true,
      text: generatedText,
      model: usedModel,
    });
  } catch (error) {
    console.error('[Gemini API Route Error]:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to generate AI content' },
      { status: 500 }
    );
  }
}
