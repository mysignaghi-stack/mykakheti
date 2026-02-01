import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { createClient as createServiceClient } from '@supabase/supabase-js';
import { isAdminUser } from '@/app/lib/adminAuth';
import type { Database } from '@/types/supabase';

export async function GET() {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

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
    if (userError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (!isAdminUser(user)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    if (!serviceRoleKey) {
      return NextResponse.json({
        usersCount: 0,
        activeAnnouncements: 0,
        pendingAnnouncements: 0,
        email: user.email ?? null,
      });
    }

    const serviceClient = createServiceClient<Database>(supabaseUrl, serviceRoleKey, {
      auth: { persistSession: false },
    });

    const [{ count: usersCount }, { count: activeAnnouncements }, { count: pendingAnnouncements }] = await Promise.all([
      (serviceClient as any).schema('auth').from('users').select('id', { count: 'exact', head: true }),
      serviceClient
        .from('announcements')
        .select('id', { count: 'exact', head: true })
        .eq('is_approved', true)
        .or('is_archived.is.null,is_archived.eq.false'),
      serviceClient
        .from('announcements')
        .select('id', { count: 'exact', head: true })
        .eq('is_approved', false),
    ]);

    return NextResponse.json({
      usersCount: usersCount ?? 0,
      activeAnnouncements: activeAnnouncements ?? 0,
      pendingAnnouncements: pendingAnnouncements ?? 0,
      email: user.email ?? null,
    });
  } catch (error) {
    return NextResponse.json({ error: (error as Error)?.message ?? 'Unknown error' }, { status: 500 });
  }
}
