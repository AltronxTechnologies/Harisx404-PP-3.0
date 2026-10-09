import { NextResponse } from 'next/server';
import { generateText } from '@/app/lib/gemini';
import createSupabaseServerClient from '@/app/lib/supabase/server';
import { z } from 'zod';

const payloadSchema = z.object({
  action: z.enum(['improve', 'summary', 'title', 'tags', 'grammar']),
  content: z.string().min(1).max(50000),
  context: z.string().max(10000).optional(),
}).strict();

export async function POST(request: Request) {
  try {
    const supabase = await createSupabaseServerClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const adminEmail = process.env.ADMIN_EMAIL?.trim().toLowerCase();
    if (!adminEmail) {
      return NextResponse.json({ error: 'Admin access is not configured' }, { status: 500 });
    }
    if (user.email?.trim().toLowerCase() !== adminEmail) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const parsed = payloadSchema.safeParse(await request.json().catch(() => null));
    if (!parsed.success) return NextResponse.json({ error: 'Choose an action and text within 50,000 characters.' }, { status: 400 });
    const { action, content, context } = parsed.data;

    let prompt = '';
    let systemInstruction = 'You are an expert AI writing assistant for a technical blog.';

    switch (action) {
      case 'improve':
        prompt = `Please improve the following paragraph to be more professional, engaging, and clear. Do not completely change the meaning, just enhance the writing style.\n\nParagraph:\n${content}`;
        break;
      case 'summary':
        prompt = `Generate a concise, 1-2 sentence summary for the following blog post content.\n\nContent:\n${content}`;
        break;
      case 'title':
        prompt = `Suggest exactly 3 catchy, professional titles for the following blog post content. Return them as a simple numbered list.\n\nContent:\n${content}`;
        break;
      case 'tags':
        prompt = `Suggest 3-5 relevant technical tags for the following blog post content. Return them as a comma-separated list of lowercase words (e.g., react, web development, tutorial).\n\nContent:\n${content}`;
        break;
      case 'grammar':
        prompt = `Fix any grammatical errors, spelling mistakes, or awkward phrasing in the following text. Preserve the original meaning entirely. Only return the corrected text without any extra conversational text.\n\nText:\n${content}`;
        break;
      default:
        return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    }

    if (context) {
      prompt += `\n\nContext for reference:\n${context}`;
    }

    const resultText = await generateText(prompt, systemInstruction);

    return NextResponse.json({ result: resultText.trim() });
  } catch (error) {
    console.error('AI assist request failed:', error && typeof error === 'object' && 'code' in error ? error.code : 'unexpected');
    return NextResponse.json({ error: 'AI assistance is unavailable. Try again later.' }, { status: 503 });
  }
}
