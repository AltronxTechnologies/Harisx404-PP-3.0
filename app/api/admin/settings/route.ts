import { NextResponse } from 'next/server';
import createSupabaseServerClient from '@/app/lib/supabase/server';
import { revalidatePath } from 'next/cache';

// Keys that live in the site_settings key-value table
const SETTINGS_KEYS = [
  'site_name',
  'seo_description',
  'seo_keywords',
  'github_url',
  'twitter_url',
  'linkedin_url',
  'email_address',
  // Homepage section switches ('true' / 'false')
  'show_faq_section',
];

export async function GET() {
  try {
    const supabase = await createSupabaseServerClient();

    const { data, error } = await supabase
      .from('site_settings')
      .select('key, value')
      .in('key', SETTINGS_KEYS);

    if (error && error.code !== 'PGRST116') {
      throw error;
    }

    // Transform the key-value rows into a flat object: { site_name: 'Haris', ... }
    const result: Record<string, string> = {};
    (data || []).forEach((row: { key: string; value: string }) => {
      result[row.key] = row.value;
    });

    return NextResponse.json(result);
  } catch (error: any) {
    console.error('Error fetching site settings:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const supabase = await createSupabaseServerClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const payload: Record<string, string> = await request.json();

    // Upsert each key-value pair individually
    const upserts = Object.entries(payload)
      .filter(([key]) => SETTINGS_KEYS.includes(key))
      .map(([key, value]) => ({ key, value: value ?? '' }));

    if (upserts.length === 0) {
      return NextResponse.json({ message: 'No valid settings keys provided' });
    }

    const { error } = await supabase
      .from('site_settings')
      .upsert(upserts, { onConflict: 'key' });

    if (error) throw error;

    // Best-effort ISR invalidation (layout-level: metadata lives in the root layout).
    try {
      revalidatePath('/', 'layout');
      revalidatePath('/about');
    } catch (e) {
      console.error('Revalidation failed:', e);
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Error updating site settings:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
