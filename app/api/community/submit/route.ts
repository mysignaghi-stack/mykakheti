import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { createClient } from '@supabase/supabase-js';
import type { Database } from '../../../../types/supabase';

const ALLOWED_TABLES = new Set(['lost_found', 'masters']);

const isMissingMastersEmailColumnsError = (error: unknown) => {
  const message = typeof (error as { message?: unknown })?.message === 'string'
    ? (error as { message: string }).message
    : '';
  return message.includes('"email" column of "masters"') ||
    message.includes('"notify_by_email" column of "masters"') ||
    message.includes("column masters.email does not exist") ||
    message.includes("column masters.notify_by_email does not exist");
};

const stripPendingMastersEmailFields = (payload: Record<string, unknown>) => {
  const nextPayload = { ...payload };
  delete nextPayload.email;
  delete nextPayload.notify_by_email;
  return nextPayload;
};

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
  const table = typeof body?.table === 'string' ? body.table : null;
  const values = typeof body?.values === 'object' && body.values ? body.values : null;

  if (!table || !ALLOWED_TABLES.has(table)) {
    return NextResponse.json({ error: 'Invalid table' }, { status: 400 });
  }

  if (!values) {
    return NextResponse.json({ error: 'Missing values' }, { status: 400 });
  }

  let serviceClient;
  try {
    serviceClient = createClient<Database>(supabaseUrl, serviceRoleKey, {
      auth: { persistSession: false },
    });
  } catch (err) {
    return NextResponse.json({ error: 'Failed to create Supabase client' }, { status: 500 });
  }

  const payload = { ...values, user_id: user.id };

  const { error } = await (serviceClient as any).from(table).insert(payload);

  if (error) {
    if (table === 'masters' && isMissingMastersEmailColumnsError(error)) {
      console.warn('[community/submit] masters email notification columns are not migrated yet; retrying without email fields.');
      const { error: retryError } = await (serviceClient as any)
        .from(table)
        .insert(stripPendingMastersEmailFields(payload));

      if (!retryError) {
        return NextResponse.json({
          success: true,
          warning: 'masters email notification columns are not migrated yet',
        });
      }

      return NextResponse.json({ error: retryError.message }, { status: 500 });
    }

    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
