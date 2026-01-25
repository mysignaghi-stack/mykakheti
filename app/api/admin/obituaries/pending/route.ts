import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { createClient } from '@supabase/supabase-js';
import type { Database } from '../../../../../types/supabase';
import { isAdminUser } from '../../../../lib/adminAuth';

export async function GET() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseAnonKey || !serviceRoleKey) {
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
        cookieStore.set({ name, value, ...options });
      },
    },
  });

  // Check if user is admin
  const { data: { user }, error: userError } = await supabase.auth.getUser();
  if (userError || !user || !isAdminUser(user)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Use service role client to bypass RLS for admin queries
  const adminSupabase = createClient(supabaseUrl, serviceRoleKey, {
    auth: { persistSession: false },
  });

  // Fetch pending obituaries
  const { data, error } = await adminSupabase
    .from('obituaries')
    .select('*')
    .or('is_approved.is.null,is_approved.eq.false')
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Pending obituaries fetch error:', error);
    return NextResponse.json({ error: 'Failed to fetch pending obituaries' }, { status: 500 });
  }

  return NextResponse.json(data || [], { headers: { 'Cache-Control': 'no-store' } });
}