import { GoogleGenerativeAI } from '@google/generative-ai';

const apiKey = process.env.GOOGLE_AI_API_KEY || process.env.GEMINI_API_KEY;

if (!apiKey) {
  console.warn("Neither GOOGLE_AI_API_KEY nor GEMINI_API_KEY is defined in the environment variables.");
}

const genAI = new GoogleGenerativeAI(apiKey || "");

export const geminiFlash = genAI.getGenerativeModel({
  model: process.env.GEMINI_MODEL || 'gemini-2.5-flash',
});

export const geminiEmbed = genAI.getGenerativeModel({
  model: 'text-embedding-004',
});

/**
 * Generate a text response using Gemini Flash.
 */
export async function generateText(prompt: string, systemInstruction?: string): Promise<string> {
  const modelName = process.env.GEMINI_MODEL || 'gemini-2.5-flash';
  const model = systemInstruction
    ? genAI.getGenerativeModel({ model: modelName, systemInstruction })
    : geminiFlash;

  const result = await model.generateContent(prompt);
  return result.response.text();
}

/**
 * Generate an embedding vector using text-embedding-004.
 */
export async function generateEmbedding(text: string): Promise<number[]> {
  const result = await geminiEmbed.embedContent(text);
  return result.embedding.values;
}
