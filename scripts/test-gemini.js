import { GoogleGenAI } from '@google/genai';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const apiKey = process.env.GEMINI_API_KEY || process.env.NEXT_PUBLIC_GEMINI_API_KEY;

if (!apiKey) {
  console.error('❌ GEMINI_API_KEY is not set in .env.local');
  process.exit(1);
}

const ai = new GoogleGenAI({ apiKey });

async function runTest() {
  console.log('Testing Google Gemini connection...');
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-flash-lite-latest',
      contents: 'Respond with: "Gemini connection is working perfectly!"',
    });
    console.log('✅ Response:', response.text.trim());
  } catch (error) {
    console.error('❌ Gemini Error:', error.message);
    process.exit(1);
  }
}

runTest();
