import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import type { Database } from '../../../../../types/supabase';
import { isAdminUser } from '../../../../lib/adminAuth';

export async function GET() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
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
      remove(name: string, value: string, options: Record<string, unknown>) {
        cookieStore.set({ name, value: '', ...options });
      },
    },
  });

  // Check if user is admin
  const { data: { session }, error: sessionError } = await supabase.auth.getSession();
  if (sessionError || !session?.user || !isAdminUser(session.user)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Fetch pending lost_found
  const { data, error } = await supabase
    .from('lost_found')
    .select('*')
    .or('is_approved.is.null,is_approved.eq.false')
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Pending lost_found fetch error:', error);
    return NextResponse.json({ error: 'Failed to fetch pending lost_found' }, { status: 500 });
  }

  return NextResponse.json({ data }, { headers: { 'Cache-Control': 'no-store' } });
}