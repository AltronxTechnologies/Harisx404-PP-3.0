import { GoogleGenerativeAI } from '@google/generative-ai';

const apiKey = process.env.GOOGLE_AI_API_KEY;

if (!apiKey) {
  console.warn("GOOGLE_AI_API_KEY is not defined in the environment variables.");
}

const genAI = new GoogleGenerativeAI(apiKey || "");

export const geminiFlash = genAI.getGenerativeModel({
  model: 'gemini-flash-latest',
});

export const geminiEmbed = genAI.getGenerativeModel({
  model: 'text-embedding-004',
});

/**
 * Generate a text response using Gemini 1.5 Flash.
 */
export async function generateText(prompt: string, systemInstruction?: string): Promise<string> {
  const model = systemInstruction
    ? genAI.getGenerativeModel({ model: 'gemini-flash-latest', systemInstruction })
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
