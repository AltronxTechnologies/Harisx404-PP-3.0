import { NextResponse } from 'next/server';
import { generateText } from '@/app/lib/gemini';
import createSupabaseServerClient from '@/app/lib/supabase/server';

export async function POST(request: Request) {
  try {
    // Check if user is an admin
    const supabase = await createSupabaseServerClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Match middleware admin policy: if ADMIN_EMAIL is set, only that user may use AI assist.
    const adminEmail = process.env.ADMIN_EMAIL;
    if (adminEmail && user.email !== adminEmail) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { action, content, context } = await request.json();

    if (!action || !content) {
      return NextResponse.json({ error: 'Missing action or content' }, { status: 400 });
    }

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
  } catch (error: any) {
    console.error('Error in AI assist route:', error);
    return NextResponse.json({ error: error.message || 'Failed to process AI assist' }, { status: 500 });
  }
}
