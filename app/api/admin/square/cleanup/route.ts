import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { createClient } from '@supabase/supabase-js';
import type { Database } from '@/types/supabase';
import { isAdminUser } from '@/app/lib/adminAuth';

const MESSAGE_LIMIT = 50;
const BATCH_SIZE = 500;
const MAX_LOOPS = 10;

export async function POST() {
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
      remove(name: string, options: Record<string, unknown>) {
        cookieStore.set({ name, value: '', ...options });
      },
    },
  });

  const { data: { user }, error: userError } = await authClient.auth.getUser();
  if (userError || !user || !isAdminUser(user)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const serviceClient = createClient<Database>(supabaseUrl, serviceRoleKey, {
    auth: { persistSession: false },
  });

  let deleted = 0;
  for (let i = 0; i < MAX_LOOPS; i += 1) {
    const { data: ids, error: selectError } = await serviceClient
      .from('square_messages')
      .select('id')
      .order('created_at', { ascending: false })
      .range(MESSAGE_LIMIT, MESSAGE_LIMIT + BATCH_SIZE - 1);

    if (selectError) {
      return NextResponse.json({ error: selectError.message }, { status: 500 });
    }

    if (!ids || ids.length === 0) {
      break;
    }

    const idList = ids.map((row) => row.id);
    const { error: deleteError } = await serviceClient
      .from('square_messages')
      .delete()
      .in('id', idList);

    if (deleteError) {
      return NextResponse.json({ error: deleteError.message }, { status: 500 });
    }

    deleted += idList.length;
  }

  return NextResponse.json({ success: true, deleted });
}
