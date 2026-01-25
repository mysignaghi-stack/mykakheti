import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { createClient } from '@supabase/supabase-js';
import type { Database } from '../../../../../types/supabase';
import { isAdminUser } from '../../../../lib/adminAuth';

const ALLOWED_TABLES = new Set(['congratulations', 'lost_found', 'masters', 'obituaries']);

export async function POST(request: Request) {
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
  const authClient = createServerClient<Database>(supabaseUrl, supabaseAnonKey, {
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

  const { data: { user } } = await authClient.auth.getUser();
  if (!user || !isAdminUser(user)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = await request.json().catch(() => ({}));
  const table = typeof body?.table === 'string' ? body.table : null;
  const id = typeof body?.id === 'string' ? body.id : null;

  if (!table || !ALLOWED_TABLES.has(table)) {
    return NextResponse.json({ error: 'Invalid table' }, { status: 400 });
  }

  if (!id) {
    return NextResponse.json({ error: `Missing ${table} id` }, { status: 400 });
  }

  let serviceClient;
  try {
    serviceClient = createClient<Database>(supabaseUrl, serviceRoleKey, {
      auth: { persistSession: false },
    });
  } catch (err) {
    return NextResponse.json({ error: 'Failed to create Supabase client' }, { status: 500 });
  }

  const { error } = await (serviceClient as any)
    .from(table)
    .delete()
    .eq('id', id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}