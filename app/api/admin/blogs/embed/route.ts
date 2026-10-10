import { NextResponse } from 'next/server';
import { generateEmbedding } from '@/app/lib/gemini';
import createSupabaseServerClient, { createSupabaseAdminClient } from '@/app/lib/supabase/server';

const BATCH_SIZE = 5;

export async function POST(request: Request) {
  try {
    // Check if user is an admin
    const supabase = await createSupabaseServerClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const adminEmail = process.env.ADMIN_EMAIL?.trim().toLowerCase();
    if (!adminEmail || user.email?.toLowerCase() !== adminEmail) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }
    let body: unknown;
    try {
      const text = await request.text();
      body = text ? JSON.parse(text) : {};
    } catch {
      return NextResponse.json({ error: 'Invalid embedding cursor.' }, { status: 400 });
    }
    if (!body || typeof body !== 'object' || Array.isArray(body) ||
        Object.keys(body).some(key => key !== 'cursor')) {
      return NextResponse.json({ error: 'Invalid embedding cursor.' }, { status: 400 });
    }
    const { cursor } = body as { cursor?: unknown };
    if (cursor !== undefined && (typeof cursor !== 'string' ||
        !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(cursor))) {
      return NextResponse.json({ error: 'Invalid embedding cursor.' }, { status: 400 });
    }
    const admin = await createSupabaseAdminClient();

    let query = admin
      .from('blog_posts')
      .select('id, title, summary, content, updated_at', { count: 'exact' })
      .is('content_embedding', null);
    if (cursor) query = query.gt('id', cursor);
    const { data: posts, count, error: fetchError } = await query
      .order('id', { ascending: true })
      .limit(BATCH_SIZE);

    if (fetchError || !posts || typeof count !== 'number') {
      return NextResponse.json({ error: 'Unable to read posts for embedding. Please try again.' }, { status: 500 });
    }

    if (posts.length === 0) {
      return NextResponse.json({ embedded: 0, failed: 0, remainingAhead: 0, hasMore: false, nextCursor: null });
    }

    let successCount = 0;
    let failureCount = 0;

    for (const post of posts) {
      try {
        const textToEmbed = `${post.title}\n\n${post.summary || ''}\n\n${post.content || ''}`;
        const truncatedText = textToEmbed.substring(0, 8000);
        const embedding = await generateEmbedding(truncatedText);
        const vectorString = `[${embedding.join(',')}]`;

        let update = admin
          .from('blog_posts')
          .update({ content_embedding: vectorString })
          .eq('id', post.id)
          .is('content_embedding', null);
        update = post.updated_at === null
          ? update.is('updated_at', null)
          : update.eq('updated_at', post.updated_at);
        const { data: updated, error: updateError } = await update.select('id');

        if (updateError || !updated || updated.length !== 1) {
          failureCount++;
        } else {
          successCount++;
        }
      } catch {
        failureCount++;
      }
      // Pace provider requests without delaying the final response.
      if (successCount + failureCount < posts.length) await new Promise(resolve => setTimeout(resolve, 500));
    }

    const progress = {
      embedded: successCount,
      failed: failureCount,
      remainingAhead: Math.max(0, count - posts.length),
      hasMore: count > posts.length,
      nextCursor: posts[posts.length - 1].id,
    };
    if (failureCount) {
      return NextResponse.json({ error: 'Some embeddings could not be saved. Please try again.', ...progress }, { status: 500 });
    }
    return NextResponse.json(progress);
  } catch {
    return NextResponse.json({ error: 'Unable to process embeddings. Please try again.' }, { status: 500 });
  }
}
