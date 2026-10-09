import { NextResponse } from 'next/server';
import { generateText } from '@/app/lib/gemini';
import createSupabaseServerClient from '@/app/lib/supabase/server';
import { z } from 'zod';

const requestSchema = z.object({ github_url: z.string().max(2048) }).strict();
const suggestionSchema = z.object({
  summary: z.string().max(1000),
  description: z.string().max(10000),
  tags: z.array(z.string().max(100)).max(32),
});

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

    const parsed = requestSchema.safeParse(await request.json().catch(() => null));
    if (!parsed.success) return NextResponse.json({ error: 'Valid GitHub URL is required' }, { status: 400 });
    let githubUrl: URL;
    try {
      githubUrl = new URL(parsed.data.github_url);
    } catch {
      return NextResponse.json({ error: 'Valid GitHub URL is required' }, { status: 400 });
    }
    const parts = githubUrl.pathname.split('/').filter(Boolean);
    const owner = parts[0];
    const repo = parts[1]?.replace(/\.git$/, '');
    if (githubUrl.protocol !== 'https:' || githubUrl.hostname !== 'github.com' || githubUrl.port || githubUrl.username || githubUrl.password
      || parts.length !== 2 || !/^[A-Za-z0-9-]{1,39}$/.test(owner || '') || !/^[A-Za-z0-9._-]{1,100}$/.test(repo || '')
      || repo === '.' || repo === '..') {
      return NextResponse.json({ error: 'Use a GitHub repository URL such as https://github.com/owner/repo.' }, { status: 400 });
    }

    // Fetch README from GitHub API
    const readmeRes = await fetch(`https://api.github.com/repos/${encodeURIComponent(owner)}/${encodeURIComponent(repo)}/readme`, {
      headers: {
        'Accept': 'application/vnd.github.v3.raw',
        'User-Agent': 'Portfolio-AI-Generator'
      },
      redirect: 'error',
      signal: AbortSignal.timeout(10000),
    });

    if (!readmeRes.ok) {
      return NextResponse.json({ error: readmeRes.status === 404 ? 'GitHub README not found.' : 'GitHub README could not be loaded. Try again later.' }, { status: readmeRes.status === 404 ? 404 : 503 });
    }

    const reader = readmeRes.body?.getReader();
    if (!reader) return NextResponse.json({ error: 'GitHub README could not be loaded. Try again later.' }, { status: 503 });
    const decoder = new TextDecoder();
    let readmeContent = '';
    let bytes = 0;
    while (true) {
      const { value, done } = await reader.read();
      if (done) break;
      bytes += value.byteLength;
      if (bytes > 65536) {
        await reader.cancel();
        return NextResponse.json({ error: 'GitHub README is too large to generate from.' }, { status: 413 });
      }
      readmeContent += decoder.decode(value, { stream: true });
    }
    readmeContent += decoder.decode();

    if (!readmeContent || readmeContent.length < 50) {
      return NextResponse.json({ error: 'README is too short or empty' }, { status: 400 });
    }

    // Ask Gemini to generate project details
    const prompt = `Based on the following GitHub README content, generate a professional project description, a short summary, and suggest a few technology tags.

README Content:
${readmeContent.substring(0, 10000)}

Respond in the following JSON format strictly:
{
  "summary": "A 1-2 sentence compelling summary of the project.",
  "description": "A detailed 2-3 paragraph professional description of the project suitable for a portfolio, formatted in markdown.",
  "tags": ["tag1", "tag2", "tag3"]
}`;

    const systemInstruction = 'You are an expert technical writer creating portfolio content. Always return strictly valid JSON without markdown wrapping (no ```json).';
    
    const resultText = await generateText(prompt, systemInstruction);
    
    // Attempt to parse JSON safely (in case it wrapped with markdown anyway)
    let parsedData;
    try {
      const cleanText = resultText.replace(/```json\n?/, '').replace(/```\n?$/, '').trim();
      parsedData = suggestionSchema.safeParse(JSON.parse(cleanText));
      if (!parsedData.success) throw new Error('Invalid suggestion shape');
    } catch {
      return NextResponse.json({ error: 'AI returned invalid format' }, { status: 500 });
    }

    return NextResponse.json({ result: parsedData.data });
  } catch (error) {
    console.error('AI Project generation failed:', error && typeof error === 'object' && 'code' in error ? error.code : 'unexpected');
    return NextResponse.json({ error: 'Project generation is unavailable. Try again later.' }, { status: 503 });
  }
}
