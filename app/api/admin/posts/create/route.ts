import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { getSupabaseAdmin } from '@/app/lib/supabaseAdmin';
import type { Database } from '@/types/supabase';

export async function POST(request: Request) {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    if (!supabaseUrl || !supabaseAnonKey) {
      return NextResponse.json({ error: 'Server misconfigured' }, { status: 500 });
    }

    const cookieStore = await cookies();
    const authClient = createServerClient<Database>(supabaseUrl, supabaseAnonKey, {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value;
        },
        set(name: string, value: string, options: Record<string, unknown>) {
          cookieStore.set({ name, value, ...options });
        },
        remove(name: string, options: Record<string, unknown>) {
          cookieStore.set({ name, value: '', ...options });
        },
      },
    });

    const { data: { user }, error: userError } = await authClient.auth.getUser();
    if (userError || !user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    // Verify admin role
    const { data: profile, error: profileError } = await authClient
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    if (profileError || !profile || (profile as any).role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await request.json();

    // Basic validation
    if (!body || !body.title || !body.content) {
      return NextResponse.json({ error: 'Missing title or content' }, { status: 400 });
    }

    const admin = getSupabaseAdmin();

    const insertPayload = {
      title: body.title,
      content: body.content,
      category: body.category ?? null,
      priority: body.priority ?? 0,
      link: body.link ?? null,
      media_urls: body.media_urls && body.media_urls.length > 0 ? body.media_urls : null,
      media_type: body.media_type ?? null,
      video_background: !!body.video_background,
      position: body.position ?? null,
      badge_text: body.badge_text ?? null,
      is_published: typeof body.is_published === 'boolean' ? body.is_published : true,
      publish_at: body.publish_at ?? null,
      is_archived: typeof body.is_archived === 'boolean' ? body.is_archived : false,
    };

    const { data, error } = await admin.from('admin_posts').insert([insertPayload]).select().single();
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ data });
  } catch (err) {
    return NextResponse.json({ error: (err as Error)?.message ?? 'Unknown error' }, { status: 500 });
  }
}
