import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { createClient } from '@supabase/supabase-js';
import type { Database } from '../../../../types/supabase';

type Props = {
  params: Promise<{ id: string }>;
};

const ALLOWED_FIELDS = new Set([
  'title',
  'description',
  'category',
  'location',
  'price',
  'currency',
  'phone',
]);

export async function PATCH(request: Request, { params }: Props) {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseAnonKey || !serviceRoleKey) {
    return NextResponse.json({ error: 'Server misconfiguration' }, { status: 500 });
  }

  const { id } = await params;
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

  const { data: { user } } = await authClient.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = await request.json().catch(() => ({}));
  const values = typeof body?.values === 'object' && body.values ? body.values : null;
  if (!values) {
    return NextResponse.json({ error: 'Missing values' }, { status: 400 });
  }

  const payload: Record<string, string | null> = {};
  for (const [key, value] of Object.entries(values)) {
    if (!ALLOWED_FIELDS.has(key)) continue;
    payload[key] = typeof value === 'string' ? value.trim() : null;
  }

  if (!payload.title || !payload.category || !payload.location || !payload.price) {
    return NextResponse.json({ error: 'Required fields are missing' }, { status: 400 });
  }

  if (payload.currency && !['GEL', 'USD'].includes(payload.currency)) {
    payload.currency = 'GEL';
  }

  const serviceClient = createClient<Database>(supabaseUrl, serviceRoleKey, {
    auth: { persistSession: false },
  });

  const { data: existing, error: fetchError } = await serviceClient
    .from('announcements')
    .select('id,user_id')
    .eq('id', id)
    .single();

  if (fetchError || !existing) {
    return NextResponse.json({ error: 'Announcement not found' }, { status: 404 });
  }

  if (existing.user_id !== user.id) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const { data, error } = await serviceClient
    .from('announcements')
    .update({ ...payload, is_approved: false })
    .eq('id', id)
    .select('*')
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true, announcement: data });
}
