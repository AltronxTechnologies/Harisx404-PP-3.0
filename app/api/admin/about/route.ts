import { NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { requireAdmin } from '@/app/lib/admin-auth';
import { createSupabaseAdminClient } from '@/app/lib/supabase/server';

const imageUrl = z.string().trim().max(2048).refine((value) => {
  if (!value) return true;
  try {
    const url = new URL(value);
    return url.protocol === 'https:' && !!url.hostname && !url.username && !url.password;
  } catch {
    return false;
  }
}, 'Use a valid HTTPS image URL');
const aboutSchema = z.object({
  hero_title: z.string().trim().max(160),
  hero_subtitle: z.string().trim().max(1000),
  section1_title: z.string().trim().max(160),
  section1_content: z.string().trim().max(10000),
  section1_image_url: imageUrl,
  section2_title: z.string().trim().max(160),
  section2_content: z.string().trim().max(10000),
  section2_image_url: imageUrl,
  section3_title: z.string().trim().max(160),
  section3_content: z.string().trim().max(10000),
  section3_image_url: imageUrl,
  section4_title: z.string().trim().max(160),
  section4_content: z.string().trim().max(10000),
  section4_image_url: imageUrl,
}).partial().strict().refine((value) => Object.keys(value).length > 0, 'Provide at least one field');

export async function GET() {
  try {
    const auth = await requireAdmin();
    if (auth.response) return auth.response;
    const supabase = await createSupabaseAdminClient();
    
    // We expect exactly one row in the about_content table
    const { data, error } = await supabase
      .from('about_content')
      .select('*')
      .limit(1)
      .single();

    if (error && error.code !== 'PGRST116') { // PGRST116 is no rows returned
      throw error;
    }

    if (!data) return NextResponse.json({ error: 'About content is not configured' }, { status: 503 });
    return NextResponse.json({
      hero_title: data.hero_title ?? '',
      hero_subtitle: data.hero_subtitle ?? '',
      section1_title: data.section1_title ?? '',
      section1_content: data.section1_content ?? '',
      section1_image_url: data.section1_image_url ?? '',
      section2_title: data.section2_title ?? '',
      section2_content: data.section2_content ?? '',
      section2_image_url: data.section2_image_url ?? '',
      section3_title: data.section3_title ?? '',
      section3_content: data.section3_content ?? '',
      section3_image_url: data.section3_image_url ?? '',
      section4_title: data.section4_title ?? '',
      section4_content: data.section4_content ?? '',
      section4_image_url: data.section4_image_url ?? '',
    });
  } catch (error: any) {
    console.error('Error fetching about content:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const auth = await requireAdmin();
    if (auth.response) return auth.response;
    const supabase = await createSupabaseAdminClient();

    let body: unknown;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
    }
    const parsed = aboutSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: 'Invalid About content', fields: parsed.error.flatten().fieldErrors }, { status: 400 });
    }

    // Check if a row exists
    const { data: existingData } = await supabase
      .from('about_content')
      .select('id')
      .limit(1)
      .single();

    let result;
    if (existingData?.id) {
      // Update existing
      result = await supabase
        .from('about_content')
        .update(parsed.data)
        .eq('id', existingData.id)
        .select()
        .single();
    } else {
      // Insert new
      result = await supabase
        .from('about_content')
        .insert(parsed.data)
        .select()
        .single();
    }

    if (result.error) {
      throw result.error;
    }

    // Best-effort ISR invalidation — must never fail the mutation itself.
    try {
      revalidatePath('/');
      revalidatePath('/about');
    } catch (e) {
      console.error('Revalidation failed:', e);
    }

    return NextResponse.json(result.data);
  } catch (error: any) {
    console.error('Error updating about content:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
