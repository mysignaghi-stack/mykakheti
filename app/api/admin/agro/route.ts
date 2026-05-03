import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';
import { createServerClient } from '@supabase/ssr';
import { createClient } from '@supabase/supabase-js';
import type { Database } from '../../../../types/supabase';
import { isAdminUser } from '../../../lib/adminAuth';
import { DEFAULT_AGRO_DATA } from '../../../lib/constants';

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
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  let isAdmin = isAdminUser(user);
  let serviceClient;
  try {
    serviceClient = createClient(supabaseUrl, serviceRoleKey, { auth: { persistSession: false } });
  } catch (err) {
    return NextResponse.json({ error: 'Failed to create Supabase client' }, { status: 500 });
  }

  if (!isAdmin) {
    const { data: profile } = await (serviceClient as any)
      .from('profiles')
      .select('role,is_admin,roles')
      .eq('id', user.id)
      .single();
    const roles = Array.isArray((profile as any)?.roles) ? (profile as any).roles : [];
    isAdmin = profile?.role === 'admin' || profile?.is_admin === true || roles.includes('admin');
  }

  if (!isAdmin) {
    const email = (user.email ?? '').toLowerCase();
    const adminEmails = (process.env.NEXT_PUBLIC_ADMIN_EMAILS ?? '')
      .split(',')
      .map((e) => e.trim().toLowerCase())
      .filter(Boolean);
    if (email && adminEmails.includes(email)) {
      isAdmin = true;
    }
  }

  if (!isAdmin) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = await request.json().catch(() => ({}));
  const action = body?.action || 'upsert';

  // serviceClient already created above

  try {
    if (action === 'list') {
      const { data, error } = await serviceClient.from('agro_prices').select('*').order('id', { ascending: true });
      if (error) return NextResponse.json({ error: error.message }, { status: 500 });
      return NextResponse.json({ data });
    }

    const getNextId = async () => {
      const { data: maxRow } = await serviceClient
        .from('agro_prices')
        .select('id')
        .order('id', { ascending: false })
        .limit(1)
        .single();
      const rawId = (maxRow as any)?.id;
      const parsed = typeof rawId === 'number' ? rawId : Number.parseInt(String(rawId), 10);
      return Number.isFinite(parsed) ? parsed + 1 : 1;
    };

    if (action === 'reset') {
      const { error: deleteError } = await serviceClient
        .from('agro_prices')
        .delete()
        .in('category', ['grape', 'grain']);

      if (deleteError) return NextResponse.json({ error: deleteError.message }, { status: 500 });

      const startId = await getNextId();
      const defaults = DEFAULT_AGRO_DATA.map((item, index) => ({
        id: startId + index,
        name: item.name,
        unit: item.unit ?? null,
        price: item.price ?? null,
        color: item.color ?? null,
        icon: item.icon ?? null,
        category: item.category ?? null,
        details: Array.isArray(item.details) ? item.details : null,
      }));

      const { data, error } = await serviceClient.from('agro_prices').insert(defaults).select('*');
      if (error) return NextResponse.json({ error: error.message }, { status: 500 });
      revalidatePath('/');
      revalidatePath('/admin/agro');
      return NextResponse.json({ data });
    }

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
      const { id, ...insertPayload } = payload;
      let attempt = 0;
      let lastError: string | null = null;

      while (attempt < 3) {
        const nextId = await getNextId();
        const { data, error } = await serviceClient
          .from('agro_prices')
          .insert({ ...insertPayload, id: nextId })
          .select('*');
        if (!error) {
          revalidatePath('/');
          revalidatePath('/admin/agro');
          return NextResponse.json({ data });
        }
        lastError = error.message;
        attempt += 1;
      }

      return NextResponse.json({ error: lastError || 'Insert failed' }, { status: 500 });
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
