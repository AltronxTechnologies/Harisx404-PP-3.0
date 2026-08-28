import { NextResponse } from 'next/server';
import createSupabaseServerClient from '@/app/lib/supabase/server';
import { revalidatePath } from 'next/cache';

export async function GET() {
  try {
    const supabase = await createSupabaseServerClient();
    
    // We expect exactly one row in the about_content table
    const { data, error } = await supabase
      .from('about_content')
      .select('*')
      .limit(1)
      .single();

    if (error && error.code !== 'PGRST116') { // PGRST116 is no rows returned
      throw error;
    }

    return NextResponse.json(data || {});
  } catch (error: any) {
    console.error('Error fetching about content:', error);
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

    const payload = await request.json();

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
        .update(payload)
        .eq('id', existingData.id)
        .select()
        .single();
    } else {
      // Insert new
      result = await supabase
        .from('about_content')
        .insert(payload)
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
