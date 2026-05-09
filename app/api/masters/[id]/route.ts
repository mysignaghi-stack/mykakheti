import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { createClient } from '@supabase/supabase-js';
import type { Database } from '@/types/supabase';

type Props = {
  params: Promise<{ id: string }>;
};

const ALLOWED_FIELDS = new Set([
  'full_name',
  'profession',
  'category',
  'location',
  'phone',
  'description',
  'photo_url',
  'price_note',
  'service_area',
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

  const payload: Partial<Database['public']['Tables']['masters']['Update']> = {};
  for (const [key, value] of Object.entries(values)) {
    if (!ALLOWED_FIELDS.has(key)) continue;
    const textValue = typeof value === 'string' ? value.trim() : null;
    if (key === 'full_name') payload.full_name = textValue ?? '';
    if (key === 'profession') payload.profession = textValue ?? '';
    if (key === 'category') payload.category = textValue;
    if (key === 'location') payload.location = textValue;
    if (key === 'phone') payload.phone = textValue;
    if (key === 'description') payload.description = textValue;
    if (key === 'photo_url') payload.photo_url = textValue;
    if (key === 'price_note') payload.price_note = textValue;
    if (key === 'service_area') payload.service_area = textValue;
  }

  if (!payload.full_name || !payload.profession) {
    return NextResponse.json({ error: 'Required fields are missing' }, { status: 400 });
  }

  const serviceClient = createClient<Database>(supabaseUrl, serviceRoleKey, {
    auth: { persistSession: false },
  });

  const { data: existing, error: fetchError } = await serviceClient
    .from('masters')
    .select('id,user_id')
    .eq('id', id)
    .single();

  if (fetchError || !existing) {
    return NextResponse.json({ error: 'Service not found' }, { status: 404 });
  }

  if (existing.user_id !== user.id) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const { data, error } = await serviceClient
    .from('masters')
    .update({ ...payload, is_approved: false })
    .eq('id', id)
    .select('*')
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true, service: data });
}
