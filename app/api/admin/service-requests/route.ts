import { cookies } from 'next/headers';
import { revalidatePath } from 'next/cache';
import { NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { createClient } from '@supabase/supabase-js';
import { isAdminUser } from '@/app/lib/adminAuth';
import { SERVICE_REQUEST_CATEGORY } from '@/app/lib/specialAnnouncements';
import type { Database } from '@/types/supabase';

export const dynamic = 'force-dynamic';

type ServiceClient = ReturnType<typeof createClient<Database>>;

async function getAdminClient(): Promise<{ client: ServiceClient } | { response: NextResponse }> {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseAnonKey || !serviceRoleKey) {
    return { response: NextResponse.json({ error: 'Server misconfiguration' }, { status: 500 }) };
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
  if (userError || !user) {
    return { response: NextResponse.json({ error: 'Unauthorized' }, { status: 401 }) };
  }

  const client = createClient<Database>(supabaseUrl, serviceRoleKey, {
    auth: { persistSession: false },
  });

  let isAdmin = isAdminUser(user);
  if (!isAdmin) {
    const { data: profile } = await (client as any)
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
      .map((entry) => entry.trim().toLowerCase())
      .filter(Boolean);
    isAdmin = Boolean(email && adminEmails.includes(email));
  }

  if (!isAdmin) {
    return { response: NextResponse.json({ error: 'Forbidden' }, { status: 403 }) };
  }

  return { client };
}

async function getNotificationSummaries(client: ServiceClient, ids: string[]) {
  if (ids.length === 0) return new Map<string, { total: number; sent: number; failed: number }>();

  const { data, error } = await client
    .from('service_request_notification_logs')
    .select('service_request_id,status')
    .in('service_request_id', ids);

  if (error) {
    console.warn('[admin/service-requests] notification log fetch failed:', error.message);
    return new Map<string, { total: number; sent: number; failed: number }>();
  }

  const summaries = new Map<string, { total: number; sent: number; failed: number }>();
  for (const log of data ?? []) {
    if (!log.service_request_id) continue;
    const current = summaries.get(log.service_request_id) ?? { total: 0, sent: 0, failed: 0 };
    current.total += 1;
    if (log.status === 'sent') current.sent += 1;
    if (log.status === 'failed') current.failed += 1;
    summaries.set(log.service_request_id, current);
  }
  return summaries;
}

export async function GET() {
  const auth = await getAdminClient();
  if ('response' in auth) return auth.response;

  const { data, error } = await auth.client
    .from('announcements')
    .select('*')
    .eq('category', SERVICE_REQUEST_CATEGORY)
    .order('created_at', { ascending: false });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const rows = data ?? [];
  const summaries = await getNotificationSummaries(auth.client, rows.map((row) => row.id));

  return NextResponse.json({
    data: rows.map((row) => ({
      ...row,
      notification_summary: summaries.get(row.id) ?? { total: 0, sent: 0, failed: 0 },
    })),
  }, { headers: { 'Cache-Control': 'no-store' } });
}

export async function PATCH(request: Request) {
  const auth = await getAdminClient();
  if ('response' in auth) return auth.response;

  const body = await request.json().catch(() => ({}));
  const id = typeof body?.id === 'string' ? body.id : '';
  const values = body?.values && typeof body.values === 'object' ? body.values : {};

  if (!id) {
    return NextResponse.json({ error: 'Missing service request id' }, { status: 400 });
  }

  const updatePayload: Database['public']['Tables']['announcements']['Update'] = {
    category: SERVICE_REQUEST_CATEGORY,
  };

  for (const key of ['title', 'description', 'location', 'phone', 'price', 'currency'] as const) {
    if (typeof values[key] === 'string') {
      updatePayload[key] = values[key].trim();
    }
  }

  if (typeof values.is_approved === 'boolean') {
    updatePayload.is_approved = values.is_approved;
  }

  if (typeof values.is_archived === 'boolean') {
    updatePayload.is_archived = values.is_archived;
  }

  if (!updatePayload.title || !updatePayload.description || !updatePayload.location || !updatePayload.phone) {
    return NextResponse.json({ error: 'შეავსეთ სათაური, აღწერა, ლოკაცია და ტელეფონი.' }, { status: 400 });
  }

  if (!updatePayload.price) updatePayload.price = 'შეთანხმებით';
  if (!updatePayload.currency) updatePayload.currency = 'GEL';

  const { data, error } = await auth.client
    .from('announcements')
    .update(updatePayload)
    .eq('id', id)
    .eq('category', SERVICE_REQUEST_CATEGORY)
    .select('*')
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  revalidatePath('/');
  revalidatePath('/admin/service-requests');
  revalidatePath('/admin/moderate');

  return NextResponse.json({ data });
}

export async function DELETE(request: Request) {
  const auth = await getAdminClient();
  if ('response' in auth) return auth.response;

  const body = await request.json().catch(() => ({}));
  const id = typeof body?.id === 'string' ? body.id : '';

  if (!id) {
    return NextResponse.json({ error: 'Missing service request id' }, { status: 400 });
  }

  const { error } = await auth.client
    .from('announcements')
    .delete()
    .eq('id', id)
    .eq('category', SERVICE_REQUEST_CATEGORY);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  revalidatePath('/');
  revalidatePath('/admin/service-requests');
  revalidatePath('/admin/moderate');

  return NextResponse.json({ success: true });
}
