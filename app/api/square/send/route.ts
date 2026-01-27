import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import type { Database } from '@/types/supabase';

export async function POST(request: Request) {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !serviceRoleKey) {
    return NextResponse.json(
      { error: 'Server misconfiguration: missing Supabase env vars.' },
      { status: 500 }
    );
  }

  const body = await request.json().catch(() => ({}));
  const inserts = Array.isArray(body?.inserts) ? body.inserts : [];

  if (inserts.length === 0) {
    return NextResponse.json({ error: 'Missing inserts payload' }, { status: 400 });
  }

  const serviceClient = createClient<Database>(supabaseUrl, serviceRoleKey, {
    auth: { persistSession: false },
  });

  const sanitized = inserts.map((item: any) => ({
    sender_name: String(item?.sender_name || ''),
    message: typeof item?.message === 'string' ? item.message : '',
    parent_id: item?.parent_id ?? null,
    media_url: item?.media_url ?? null,
    media_type: item?.media_type ?? null,
    fingerprint: item?.fingerprint ?? null,
  }));

  const { data, error } = await serviceClient
    .from('square_messages')
    .insert(sanitized)
    .select('*');

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ data });
}
