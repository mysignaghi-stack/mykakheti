import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { getSupabaseAdmin } from '@/app/lib/supabaseAdmin';
import { isAdminUser } from '@/app/lib/adminAuth';
import type { Database } from '@/types/supabase';

export async function DELETE(request: Request) {
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

    let isAdmin = isAdminUser(user);
    if (!isAdmin) {
      const admin = getSupabaseAdmin();
      if (!admin) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
      }
      const { data: profile } = await (admin as any)
        .from('profiles')
        .select('role,is_admin,roles')
        .eq('id', user.id)
        .single();
      const roles = Array.isArray((profile as any)?.roles) ? (profile as any).roles : [];
      isAdmin = profile?.role === 'admin' || profile?.is_admin === true || roles.includes('admin');
    }

    if (!isAdmin) {
      const email = (user.email ?? '').toLowerCase();
      const adminEmails = (process.env.NEXT_PUBLIC_ADMIN_EMAILS ?? '')
        .split(',')
        .map((e) => e.trim().toLowerCase())
        .filter(Boolean);
      if (email && adminEmails.includes(email)) {
        isAdmin = true;
      }
    }

    if (!isAdmin) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await request.json();
    const id = body?.id;
    if (!id) return NextResponse.json({ error: 'Missing id' }, { status: 400 });

    const admin = getSupabaseAdmin();
    if (!admin) {
      return NextResponse.json({ error: 'Server misconfiguration: missing Supabase admin env vars.' }, { status: 500 });
    }
    const { data, error } = await admin.from('admin_posts').delete().eq('id', id);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    return NextResponse.json({ data });
  } catch (err) {
    return NextResponse.json({ error: (err as Error)?.message ?? 'Unknown error' }, { status: 500 });
  }
}
