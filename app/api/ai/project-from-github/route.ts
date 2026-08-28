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

    const { github_url } = await request.json();

    if (!github_url || !github_url.includes('github.com')) {
      return NextResponse.json({ error: 'Valid GitHub URL is required' }, { status: 400 });
    }

    // Extract owner and repo from URL
    const urlParts = new URL(github_url).pathname.split('/').filter(Boolean);
    if (urlParts.length < 2) {
      return NextResponse.json({ error: 'Invalid GitHub URL format' }, { status: 400 });
    }

    const owner = urlParts[0];
    const repo = urlParts[1];

    // Fetch README from GitHub API
    const readmeRes = await fetch(`https://api.github.com/repos/${owner}/${repo}/readme`, {
      headers: {
        'Accept': 'application/vnd.github.v3.raw',
        'User-Agent': 'Portfolio-AI-Generator'
      }
    });

    if (!readmeRes.ok) {
      return NextResponse.json({ error: `Failed to fetch README from GitHub: ${readmeRes.statusText}` }, { status: 400 });
    }

    const readmeContent = await readmeRes.text();

    if (!readmeContent || readmeContent.length < 50) {
      return NextResponse.json({ error: 'README is too short or empty' }, { status: 400 });
    }

    // Ask Gemini to generate project details
    const prompt = `Based on the following GitHub README content, generate a professional project description, a short summary, and suggest a few technology tags.

README Content:
${readmeContent.substring(0, 10000)} // truncate to avoid token limits just in case

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
      parsedData = JSON.parse(cleanText);
    } catch (e) {
      console.error("Failed to parse Gemini JSON:", resultText);
      return NextResponse.json({ error: 'AI returned invalid format' }, { status: 500 });
    }

    return NextResponse.json({ result: parsedData });
  } catch (error: any) {
    console.error('Error in AI project gen route:', error);
    return NextResponse.json({ error: error.message || 'Failed to generate project' }, { status: 500 });
  }
}
