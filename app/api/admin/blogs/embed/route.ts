import { NextResponse } from 'next/server';
import { generateEmbedding } from '@/app/lib/gemini';
import createSupabaseServerClient from '@/app/lib/supabase/server';

export async function POST(request: Request) {
  try {
    // Check if user is an admin
    const supabase = await createSupabaseServerClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get all blog posts that don't have an embedding
    const { data: posts, error: fetchError } = await supabase
      .from('blog_posts')
      .select('id, title, summary, content')
      .is('content_embedding', null);

    if (fetchError) {
      // Most common cause: pgvector extension / content_embedding column missing.
      const hint = /content_embedding|column|vector/i.test(fetchError.message)
        ? ' Hint: the pgvector migration has not been applied — enable the `vector` extension and add the `content_embedding` column (see supabase_schema.sql).'
        : '';
      throw new Error(`Failed to fetch posts: ${fetchError.message}.${hint}`);
    }

    if (!posts || posts.length === 0) {
      return NextResponse.json({ message: 'All posts already have embeddings.' });
    }

    let successCount = 0;
    const errors: string[] = [];

    // Process sequentially to avoid rate limits
    for (const post of posts) {
      try {
        // Prepare text for embedding (Title + Summary + Content)
        const textToEmbed = `${post.title}\n\n${post.summary || ''}\n\n${post.content || ''}`;
        
        // Truncate if too long (Gemini embed limit is generally large enough, but safe to bound)
        const truncatedText = textToEmbed.substring(0, 8000); 
        
        const embedding = await generateEmbedding(truncatedText);
        const vectorString = `[${embedding.join(',')}]`;

        const { error: updateError } = await supabase
          .from('blog_posts')
          .update({ content_embedding: vectorString })
          .eq('id', post.id);

        if (updateError) {
          errors.push(`Post ${post.id}: ${updateError.message}`);
        } else {
          successCount++;
        }
        
        // Wait a small amount to avoid rate limits
        await new Promise(resolve => setTimeout(resolve, 500));
      } catch (err: any) {
        errors.push(`Post ${post.id}: ${err.message}`);
      }
    }

    return NextResponse.json({
      message: `Successfully embedded ${successCount}/${posts.length} posts.`,
      errors: errors.length > 0 ? errors : undefined
    });
  } catch (error: any) {
    console.error('Error in embed route:', error);
    return NextResponse.json({ error: error.message || 'Failed to process embeddings' }, { status: 500 });
  }
}
