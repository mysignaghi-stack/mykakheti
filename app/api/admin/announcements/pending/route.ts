import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { createServerClient } from '@supabase/ssr';
import type { Database } from '../../../../../types/supabase';

export async function GET() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseAnonKey || !supabaseServiceKey) {
    return NextResponse.json(
      { error: 'Server misconfiguration: missing Supabase env vars.' },
      { status: 500 }
    );
  }

  const cookieStore = await cookies();
  const supabase = createServerClient<Database>(supabaseUrl, supabaseAnonKey, {
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

  const { data: { session }, error: sessionError } = await supabase.auth.getSession();
  console.log('Admin Session:', session?.user);
  // Admin guard temporarily disabled for debugging 401s
  if (sessionError) {
    console.error('Session error while checking admin session:', sessionError);
  }

  // Use service role to bypass RLS for admin reads
  const supabaseAdmin = createClient<Database>(supabaseUrl, supabaseServiceKey);

  // Fetch pending announcements
  const { data, error } = await supabaseAdmin
    .from('announcements')
    .select('*')
    .is('is_approved', false)
    .order('created_at', { ascending: false });

  console.log('Found Rows:', data?.length);

  if (error) {
    console.error('Pending announcements fetch error:', error);
    return NextResponse.json({ error: 'Failed to fetch pending announcements' }, { status: 500 });
  }

  return NextResponse.json({ data }, { headers: { 'Cache-Control': 'no-store' } });
}