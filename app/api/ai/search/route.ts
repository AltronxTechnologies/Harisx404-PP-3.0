import { NextResponse } from 'next/server';
import { generateEmbedding } from '@/app/lib/gemini';
import { getPublicSupabase } from '@/app/lib/supabase/safe';
import { checkRateLimit } from '@/app/lib/rate-limit';

interface SearchResult {
  title: string;
  type: 'blog' | 'project';
  link: string;
  summary?: string;
}

/**
 * Plain ILIKE search across published blog posts and projects.
 * Used as the primary fallback when pgvector / embeddings aren't available.
 */
async function keywordSearch(query: string, limit: number): Promise<SearchResult[]> {
  const supabase = getPublicSupabase();
  if (!supabase) return [];

  const pattern = `%${query.replace(/[%_]/g, '')}%`;
  const results: SearchResult[] = [];

  try {
    const { data: posts } = await supabase
      .from('blog_posts')
      .select('title, slug, summary')
      .eq('status', 'published')
      .or(`title.ilike.${pattern},summary.ilike.${pattern}`)
      .limit(limit);

    for (const p of posts ?? []) {
      if (p?.slug) {
        results.push({
          title: p.title ?? 'Untitled post',
          type: 'blog',
          link: `/blog/${p.slug}`,
          summary: p.summary ?? undefined,
        });
      }
    }
  } catch {
    // null-safe: ignore table/column errors
  }

  try {
    const { data: projects } = await supabase
      .from('projects')
      .select('title, slug, description')
      .eq('status', 'published')
      .or(`title.ilike.${pattern},description.ilike.${pattern}`)
      .limit(limit);

    for (const p of projects ?? []) {
      if (p?.slug) {
        results.push({
          title: p.title ?? 'Untitled project',
          type: 'project',
          link: `/projects/${p.slug}`,
          summary: p.description ?? undefined,
        });
      }
    }
  } catch {
    // ignore
  }

  return results.slice(0, limit * 2);
}

export async function POST(request: Request) {
  try {
    const forwarded = request.headers.get('x-forwarded-for') || 'client';
    const ip = forwarded.split(',')[0].trim();
    const rateLimit = checkRateLimit(`ai-search-${ip}`, { maxRequests: 30, windowMs: 60 * 1000 });

    if (!rateLimit.success) {
      return NextResponse.json(
        { error: 'Too many search requests. Please wait a moment.' },
        { status: 429, headers: { 'Retry-After': '60' } }
      );
    }

    const { query, match_count = 5, similarity_threshold = 0.5, exclude_slug = null } = await request.json();

    if (!query || typeof query !== 'string' || !query.trim()) {
      return NextResponse.json({ error: 'Missing query' }, { status: 400 });
    }

    const trimmed = query.trim().slice(0, 200);

    // Try semantic search first (requires pgvector + search_blog_posts RPC +
    // embedded posts). If anything is missing, fall back to keyword search.
    try {
      const supabase = getPublicSupabase();
      if (!supabase) throw new Error('Supabase not configured');

      const queryEmbedding = await generateEmbedding(trimmed);
      const vectorString = `[${queryEmbedding.join(',')}]`;

      const { data, error } = await supabase.rpc('search_blog_posts', {
        query_embedding: vectorString,
        similarity_threshold,
        match_count,
        exclude_slug,
      });

      if (error) throw new Error(error.message);

      if (Array.isArray(data) && data.length > 0) {
        const results: SearchResult[] = data
          .filter((row: any) => row?.slug)
          .map((row: any) => ({
            title: row.title ?? 'Untitled post',
            type: 'blog' as const,
            link: `/blog/${row.slug}`,
            summary: row.summary ?? undefined,
          }));
        if (results.length > 0) {
          return NextResponse.json({ results, mode: 'semantic' });
        }
      }
      // Semantic returned nothing useful — fall through to keyword search.
    } catch (semanticError: any) {
      console.warn('Semantic search unavailable, falling back to keyword search:', semanticError?.message);
    }

    const results = await keywordSearch(trimmed, match_count);
    return NextResponse.json({ results, mode: 'keyword' });
  } catch (error: any) {
    console.error('Error in AI search route:', error?.message || error);
    return NextResponse.json({ error: 'Failed to process search' }, { status: 500 });
  }
}
