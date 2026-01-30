import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';
import { createServerClient } from '@supabase/ssr';
import { createClient } from '@supabase/supabase-js';
import type { Database } from '../../../../types/supabase';
import { isAdminUser } from '../../../lib/adminAuth';

export async function POST(request: Request) {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseAnonKey || !serviceRoleKey) {
    return NextResponse.json({ error: 'Server misconfiguration: missing Supabase env vars.' }, { status: 500 });
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
  if (!user || !isAdminUser(user)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = await request.json().catch(() => ({}));
  const action = body?.action || 'upsert';

  let serviceClient;
  try {
    serviceClient = createClient(supabaseUrl, serviceRoleKey, { auth: { persistSession: false } });
  } catch (err) {
    return NextResponse.json({ error: 'Failed to create Supabase client' }, { status: 500 });
  }

  try {
    if (action === 'delete') {
      const id = body?.id;
      if (!id) return NextResponse.json({ error: 'Missing id for delete' }, { status: 400 });
      const { error } = await serviceClient.from('agro_prices').delete().eq('id', id);
      if (error) return NextResponse.json({ error: error.message }, { status: 500 });
      revalidatePath('/');
      revalidatePath('/admin/agro');
      return NextResponse.json({ data: { id } });
    }

    // upsert / insert / update
    const payload = body?.payload;
    if (!payload) return NextResponse.json({ error: 'Missing payload' }, { status: 400 });

    if (String(payload.id || '').startsWith('new-')) {
      const { data, error } = await serviceClient.from('agro_prices').insert({ ...payload }).select('*');
      if (error) return NextResponse.json({ error: error.message }, { status: 500 });
      revalidatePath('/');
      revalidatePath('/admin/agro');
      return NextResponse.json({ data });
    } else {
      const id = payload.id;
      const { data, error } = await serviceClient.from('agro_prices').update({ ...payload }).eq('id', id).select('*');
      if (error) return NextResponse.json({ error: error.message }, { status: 500 });
      revalidatePath('/');
      revalidatePath('/admin/agro');
      return NextResponse.json({ data });
    }
  } catch (err: any) {
    return NextResponse.json({ error: err?.message || String(err) }, { status: 500 });
  }
}
